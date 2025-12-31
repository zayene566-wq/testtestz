const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

console.log('Adding streak tracking columns to users table...');

db.serialize(() => {
    // Add daily_streak column
    db.run(`
        ALTER TABLE users ADD COLUMN daily_streak INTEGER DEFAULT 0
    `, (err) => {
        if (err) {
            if (err.message.includes('duplicate column')) {
                console.log('✓ daily_streak column already exists');
            } else {
                console.error('Error adding daily_streak:', err);
            }
        } else {
            console.log('✓ daily_streak column added');
        }
    });

    // Add last_claim_date column
    db.run(`
        ALTER TABLE users ADD COLUMN last_claim_date TEXT
    `, (err) => {
        if (err) {
            if (err.message.includes('duplicate column')) {
                console.log('✓ last_claim_date column already exists');
            } else {
                console.error('Error adding last_claim_date:', err);
            }
        } else {
            console.log('✓ last_claim_date column added');
        }

        console.log('\n✅ Streak tracking migration completed!');
        db.close();
    });
});
