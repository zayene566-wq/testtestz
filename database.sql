-- Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- Hashed
    role TEXT DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT, -- URL or icon name
    color TEXT DEFAULT '#3b82f6',
    unlock_cost INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1, -- 1 = active, 0 = inactive
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Stages Table
CREATE TABLE IF NOT EXISTS stages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
);

-- Questions Table
CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stage_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    answer_1 TEXT NOT NULL,
    answer_2 TEXT NOT NULL,
    answer_3 TEXT NOT NULL,
    answer_4 TEXT NOT NULL,
    correct_answer INTEGER NOT NULL, -- 1, 2, 3, or 4
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stage_id) REFERENCES stages (id) ON DELETE CASCADE
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    stars INTEGER DEFAULT 0,
    hearts INTEGER DEFAULT 5,
    is_banned INTEGER DEFAULT 0,
    infinite_hearts_until DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);

-- User Progress - Unlocked Categories
CREATE TABLE IF NOT EXISTS user_unlocked_categories (
    user_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, category_id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
);

-- User Progress - Completed Stages
CREATE TABLE IF NOT EXISTS user_completed_stages (
    user_id INTEGER NOT NULL,
    stage_id INTEGER NOT NULL,
    stars_earned INTEGER DEFAULT 0,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, stage_id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (stage_id) REFERENCES stages (id) ON DELETE CASCADE
);

-- Default Admin (password: admin123 - needs to be hashed in real init, this is for reference or initial seed script)
-- INSERT INTO admins (username, password) VALUES ('admin', '$2b$10$YourHashedPasswordHere');

-- Admin Logs Table
CREATE TABLE IF NOT EXISTS admin_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER,
    action TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins (id)
);

-- User Inventory (Hints & Consumables)
CREATE TABLE IF NOT EXISTS user_inventory (
    user_id INTEGER NOT NULL,
    item_type TEXT NOT NULL,
    quantity INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, item_type),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Store Purchases Log
CREATE TABLE IF NOT EXISTS user_purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    item_type TEXT NOT NULL, -- 'heart', 'boost_15m', 'boost_5h', 'hint_skip', etc.
    cost INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);