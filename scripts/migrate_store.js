const db = require('./database');

db.serialize(() => {
    // 1. Add infinite_hearts_until to users
    db.run("ALTER TABLE users ADD COLUMN infinite_hearts_until DATETIME", (err) => {
        if (!err) console.log("Added infinite_hearts_until column");
        else console.log("Column infinite_hearts_until might already exist or error:", err.message);
    });

    // 2. Add hint columns to users (skip, remove, time) or use inventory table?
    // Plan said "user_inventory table". Let's stick to that for flexibility.

    // Create user_inventory
    db.run(`CREATE TABLE IF NOT EXISTS user_inventory (
        user_id INTEGER NOT NULL,
        item_type TEXT NOT NULL,
        quantity INTEGER DEFAULT 0,
        PRIMARY KEY (user_id, item_type),
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`, (err) => {
        if (!err) console.log("Created user_inventory table");
        else console.error("Error creating user_inventory:", err.message);
    });

    // Create user_purchases
    db.run(`CREATE TABLE IF NOT EXISTS user_purchases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        item_type TEXT NOT NULL,
        cost INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`, (err) => {
        if (!err) console.log("Created user_purchases table");
        else console.error("Error creating user_purchases:", err.message);
    });
});
