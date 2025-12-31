const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

console.log('Starting Daily Rewards migration...');

db.serialize(() => {
    // Create daily_rewards table
    db.run(`
        CREATE TABLE IF NOT EXISTS daily_rewards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            day_number INTEGER NOT NULL,
            reward_type TEXT NOT NULL CHECK(reward_type IN ('stars', 'hearts', 'boost_15m', 'boost_5h')),
            reward_value INTEGER NOT NULL,
            is_active INTEGER DEFAULT 1,
            sort_order INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('Error creating daily_rewards table:', err);
        } else {
            console.log('✓ daily_rewards table created');
        }
    });

    // Create user_daily_claims table
    db.run(`
        CREATE TABLE IF NOT EXISTS user_daily_claims (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            reward_id INTEGER NOT NULL,
            claimed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (reward_id) REFERENCES daily_rewards(id)
        )
    `, (err) => {
        if (err) {
            console.error('Error creating user_daily_claims table:', err);
        } else {
            console.log('✓ user_daily_claims table created');
        }
    });

    // Insert default rewards (Days 1-7)
    const defaultRewards = [
        { day: 1, type: 'stars', value: 10 },
        { day: 2, type: 'hearts', value: 1 },
        { day: 3, type: 'stars', value: 20 },
        { day: 4, type: 'hearts', value: 2 },
        { day: 5, type: 'stars', value: 30 },
        { day: 6, type: 'boost_15m', value: 1 },
        { day: 7, type: 'stars', value: 50 }
    ];

    const stmt = db.prepare(`
        INSERT INTO daily_rewards (day_number, reward_type, reward_value, sort_order)
        VALUES (?, ?, ?, ?)
    `);

    defaultRewards.forEach((reward, index) => {
        stmt.run(reward.day, reward.type, reward.value, index + 1, (err) => {
            if (err) {
                console.error(`Error inserting Day ${reward.day}:`, err);
            } else {
                console.log(`✓ Day ${reward.day}: ${reward.value} ${reward.type}`);
            }
        });
    });

    stmt.finalize(() => {
        console.log('\n✅ Migration completed successfully!');
        db.close();
    });
});
