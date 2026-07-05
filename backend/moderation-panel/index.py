import json
import os
import psycopg2
import psycopg2.extras


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def handler(event: dict, context) -> dict:
    '''Отдаёт панели управления статистику модерации и настройки чата, принимает обновления настроек фильтров.'''
    method = event.get('httpMethod', 'GET')

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
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        period = params.get('period', 'month')

        interval_map = {'today': '1 day', 'week': '7 days', 'month': '30 days'}
        interval = interval_map.get(period, '30 days')

        cur.execute(
            f"SELECT COUNT(*) FILTER (WHERE violation_type IS NOT NULL) AS deleted, "
            f"COUNT(*) FILTER (WHERE action_taken = 'warn') AS warns, "
            f"COUNT(*) FILTER (WHERE action_taken IN ('ban','kick')) AS bans "
            f"FROM violations WHERE created_at >= now() - interval '{interval}'"
        )
        summary = cur.fetchone()

        cur.execute("SELECT COUNT(*) AS total FROM members")
        members_total = cur.fetchone()

        cur.execute("SELECT id, warn_limit, ban_action, filters FROM chats ORDER BY id LIMIT 1")
        chat = cur.fetchone()

        cur.close()
        conn.close()

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'summary': summary,
                'members_total': members_total['total'],
                'chat': chat
            }, default=str)
        }

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        chat_id = body.get('chat_id')
        filters = body.get('filters')
        warn_limit = body.get('warn_limit')
        ban_action = body.get('ban_action')

        updates = []
        values = []
        if filters is not None:
            updates.append("filters = %s")
            values.append(json.dumps(filters))
        if warn_limit is not None:
            updates.append("warn_limit = %s")
            values.append(warn_limit)
        if ban_action is not None:
            updates.append("ban_action = %s")
            values.append(ban_action)

        if updates and chat_id:
            values.append(chat_id)
            cur.execute(f"UPDATE chats SET {', '.join(updates)} WHERE id = %s", values)
            conn.commit()

        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

    cur.close()
    conn.close()
    return {'statusCode': 405, 'headers': headers, 'body': json.dumps({'error': 'Method not allowed'})}
