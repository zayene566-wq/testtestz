const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(DB_PATH);

console.log('🔄 Applying Database Fixes...');

db.serialize(() => {
    // 1. Add infinite_hearts_until to users if not exists
    db.run("ALTER TABLE users ADD COLUMN infinite_hearts_until DATETIME", (err) => {
        if (err && err.message.includes('duplicate column')) {
            console.log('✅ Column infinite_hearts_until already exists.');
        } else if (err) {
            console.error('❌ Error adding infinite_hearts_until:', err.message);
        } else {
            console.log('✅ Added column: infinite_hearts_until');
        }
    });

    // 2. Create user_inventory table
    db.run(`
        CREATE TABLE IF NOT EXISTS user_inventory (
            user_id INTEGER NOT NULL,
            item_type TEXT NOT NULL,
            quantity INTEGER DEFAULT 0,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, item_type),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error creating user_inventory:', err.message);
        } else {
            console.log('✅ Verified table: user_inventory');
        }
    });

    // 3. Create user_purchases table if not exists (checked earlier but good to be safe)
    db.run(`
        CREATE TABLE IF NOT EXISTS user_purchases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            item_type TEXT NOT NULL,
            cost INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error creating user_purchases:', err.message);
        } else {
            console.log('✅ Verified table: user_purchases');
        }
    });
});

db.close(() => {
    console.log('🏁 Database fix complete.');
});
