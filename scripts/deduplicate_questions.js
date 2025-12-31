const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(DB_PATH);

const sql = `
DELETE FROM questions 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM questions 
    GROUP BY question_text
);
`;

db.serialize(() => {
    console.log("Running deduplication...");
    db.run(sql, function (err) {
        if (err) {
            console.error("Error:", err.message);
        } else {
            console.log(`Deleted ${this.changes} duplicate questions.`);
        }
    });

    db.get("SELECT count(*) as c FROM questions", (err, row) => {
        console.log("Remaining questions:", row.c);
    });
});

db.close();
