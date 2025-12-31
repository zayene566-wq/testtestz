const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

const TEST_USERNAME = 'debug_user_' + Date.now();

db.serialize(() => {
    // 1. Create a test user
    db.run("INSERT INTO users (username, stars, hearts) VALUES (?, 0, 5)", [TEST_USERNAME], function (err) {
        if (err) {
            console.error("Setup failed:", err);
            return;
        }
        const userId = this.lastID;
        console.log(`Created Test User: ${TEST_USERNAME} (ID: ${userId})`);

        // 2. Check initial hearts
        db.get("SELECT hearts FROM users WHERE id = ?", [userId], (err, row) => {
            console.log(`Initial Hearts: ${row.hearts}`);

            // 3. Perform Deduction (Simulation of route logic)
            db.run("UPDATE users SET hearts = hearts - 1 WHERE id = ?", [userId], (err) => {
                if (err) {
                    console.error("Update failed:", err);
                    return;
                }
                console.log("Executed UPDATE query.");

                // 4. Verify Result
                db.get("SELECT hearts FROM users WHERE id = ?", [userId], (err, row) => {
                    console.log(`New Hearts Balance: ${row.hearts}`);

                    if (row.hearts === 4) {
                        console.log("SUCCESS: Database logic is working correctly.");
                    } else {
                        console.error("FAILURE: Database did not update correctly.");
                    }

                    // Cleanup
                    db.run("DELETE FROM users WHERE id = ?", [userId]);
                });
            });
        });
    });
});
