import json
import os
import re
import urllib.request
import urllib.parse
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def tg_call(method: str, payload: dict):
    token = os.environ.get('TELEGRAM_BOT_TOKEN')
    if not token:
        return None
    url = f'https://api.telegram.org/bot{token}/{method}'
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception:
        return None


LINK_RE = re.compile(r'(https?://|www\.|t\.me/|@[a-zA-Z0-9_]{5,})', re.IGNORECASE)
CAPS_RE = re.compile(r'[A-ZА-Я]{8,}')


def handler(event: dict, context) -> dict:
    '''Принимает вебхуки от Telegram, проверяет сообщения на нарушения (маты, ссылки, капс, спам),
    удаляет запрещённый контент, выдаёт предупреждения и применяет автобан/мут/кик при превышении лимита.'''
    method = event.get('httpMethod', 'POST')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    headers = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}

    try:
        body = json.loads(event.get('body') or '{}')
    except Exception:
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

    if body.get('setup_webhook') and body.get('url'):
        result = tg_call('setWebhook', {'url': body['url']})
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True, 'telegram_response': result})}

    message = body.get('message') or body.get('edited_message')
    if not message:
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

    chat = message.get('chat', {})
    from_user = message.get('from', {})
    text = message.get('text') or message.get('caption') or ''
    telegram_chat_id = chat.get('id')
    telegram_user_id = from_user.get('id')
    username = from_user.get('username') or from_user.get('first_name', 'участник')
    message_id = message.get('message_id')
    has_media = any(k in message for k in ('photo', 'video', 'animation', 'document'))

    if not telegram_chat_id or not telegram_user_id:
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

    conn = get_conn()
    cur = conn.cursor()

    cur.execute(
        "INSERT INTO chats (telegram_chat_id, title) VALUES (%s, %s) "
        "ON CONFLICT (telegram_chat_id) DO NOTHING",
        (telegram_chat_id, chat.get('title', ''))
    )
    cur.execute(
        "SELECT id, warn_limit, ban_action, filters FROM chats WHERE telegram_chat_id = %s",
        (telegram_chat_id,)
    )
    chat_row = cur.fetchone()
    chat_db_id, warn_limit, ban_action, filters = chat_row
    filters = filters or {}

    cur.execute(
        "INSERT INTO members (chat_id, telegram_user_id, username) VALUES (%s, %s, %s) "
        "ON CONFLICT (chat_id, telegram_user_id) DO UPDATE SET username = EXCLUDED.username",
        (chat_db_id, telegram_user_id, username)
    )
    cur.execute(
        "SELECT id, warns_count FROM members WHERE chat_id = %s AND telegram_user_id = %s",
        (chat_db_id, telegram_user_id)
    )
    member_id, warns_count = cur.fetchone()

    violation_type = None

    if filters.get('words', True) and text:
        cur.execute("SELECT pattern FROM stop_words WHERE is_active = true")
        patterns = [r[0] for r in cur.fetchall()]
        for p in patterns:
            try:
                if re.search(p, text, re.IGNORECASE):
                    violation_type = 'words'
                    break
            except re.error:
                continue

    if not violation_type and filters.get('links', True) and text and LINK_RE.search(text):
        violation_type = 'links'

    if not violation_type and filters.get('caps', False) and text and CAPS_RE.search(text):
        violation_type = 'caps'

    if not violation_type and filters.get('media', False) and has_media:
        cur.execute(
            "SELECT joined_at FROM members WHERE id = %s", (member_id,)
        )

    action_taken = None

    if violation_type:
        tg_call('deleteMessage', {'chat_id': telegram_chat_id, 'message_id': message_id})

        warns_count += 1
        cur.execute(
            "UPDATE members SET warns_count = %s, last_violation_at = now() WHERE id = %s",
            (warns_count, member_id)
        )

        if warns_count >= warn_limit:
            if ban_action == 'ban':
                tg_call('banChatMember', {'chat_id': telegram_chat_id, 'user_id': telegram_user_id})
                action_taken = 'ban'
            elif ban_action == 'kick':
                tg_call('banChatMember', {'chat_id': telegram_chat_id, 'user_id': telegram_user_id})
                tg_call('unbanChatMember', {'chat_id': telegram_chat_id, 'user_id': telegram_user_id})
                action_taken = 'kick'
            else:
                tg_call('restrictChatMember', {
                    'chat_id': telegram_chat_id,
                    'user_id': telegram_user_id,
                    'permissions': {'can_send_messages': False},
                    'until_date': 0
                })
                action_taken = 'mute'
            cur.execute("UPDATE members SET warns_count = 0, is_banned = %s WHERE id = %s",
                        (ban_action == 'ban', member_id))
        else:
            action_taken = 'warn'

        cur.execute(
            "INSERT INTO violations (chat_id, member_id, violation_type, message_text, action_taken) "
            "VALUES (%s, %s, %s, %s, %s)",
            (chat_db_id, member_id, violation_type, text[:500], action_taken)
        )

    conn.commit()
    cur.close()
    conn.close()

    return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True, 'violation': violation_type, 'action': action_taken})}