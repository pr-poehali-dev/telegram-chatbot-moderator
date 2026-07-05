CREATE TABLE IF NOT EXISTS chats (
    id SERIAL PRIMARY KEY,
    telegram_chat_id BIGINT UNIQUE NOT NULL,
    title VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    warn_limit SMALLINT DEFAULT 3,
    ban_action VARCHAR(10) DEFAULT 'ban',
    filters JSONB DEFAULT '{"links": true, "spam": true, "words": true, "media": false, "caps": false}'::jsonb,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stop_words (
    id SERIAL PRIMARY KEY,
    pattern VARCHAR(200) NOT NULL,
    category VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS members (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES chats(id),
    telegram_user_id BIGINT NOT NULL,
    username VARCHAR(100),
    warns_count SMALLINT DEFAULT 0,
    is_banned BOOLEAN DEFAULT false,
    joined_at TIMESTAMP DEFAULT now(),
    last_violation_at TIMESTAMP,
    UNIQUE(chat_id, telegram_user_id)
);

CREATE TABLE IF NOT EXISTS violations (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES chats(id),
    member_id INTEGER REFERENCES members(id),
    violation_type VARCHAR(20) NOT NULL,
    message_text TEXT,
    action_taken VARCHAR(20),
    created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stop_words_active ON stop_words(is_active);
CREATE INDEX IF NOT EXISTS idx_members_chat ON members(chat_id);
CREATE INDEX IF NOT EXISTS idx_violations_chat ON violations(chat_id);
CREATE INDEX IF NOT EXISTS idx_violations_created ON violations(created_at);
