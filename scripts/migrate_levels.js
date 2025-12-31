const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // 1. Update users table
    db.run("ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1", (err) => {
        if (err && err.message.includes("duplicate column")) {
            console.log("Column 'level' already exists in users.");
        } else if (err) {
            console.error("Error adding column 'level':", err.message);
        } else {
            console.log("Added column 'level' to users.");
        }
    });

    db.run("ALTER TABLE users ADD COLUMN current_xp INTEGER DEFAULT 0", (err) => {
        if (err && err.message.includes("duplicate column")) {
            console.log("Column 'current_xp' already exists in users.");
        } else if (err) {
            console.error("Error adding column 'current_xp':", err.message);
        } else {
            console.log("Added column 'current_xp' to users.");
        }
    });

    db.run("ALTER TABLE users ADD COLUMN total_xp INTEGER DEFAULT 0", (err) => {
        if (err && err.message.includes("duplicate column")) {
            console.log("Column 'total_xp' already exists in users.");
        } else if (err) {
            console.error("Error adding column 'total_xp':", err.message);
        } else {
            console.log("Added column 'total_xp' to users.");
        }
    });

    // 2. Create levels table
    db.run(`CREATE TABLE IF NOT EXISTS levels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level_number INTEGER UNIQUE NOT NULL,
        xp_required INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error("Error creating levels table:", err.message);
        } else {
            console.log("levels table created or already exists.");
        }
    });

    // 3. Create user_stage_xp table
    db.run(`CREATE TABLE IF NOT EXISTS user_stage_xp (
        user_id INTEGER NOT NULL,
        stage_id INTEGER NOT NULL,
        xp_earned INTEGER DEFAULT 0,
        completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, stage_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE
    )`, (err) => {
        if (err) {
            console.error("Error creating user_stage_xp table:", err.message);
        } else {
            console.log("user_stage_xp table created or already exists.");
        }
    });
});

db.close(() => {
    console.log("Migration completed.");
});
