const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

const SALT_ROUNDS = 10;
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

bcrypt.hash(ADMIN_PASS, SALT_ROUNDS, (err, hash) => {
    if (err) throw err;

    db.serialize(() => {
        db.run("DELETE FROM admins WHERE username = ?", [ADMIN_USER]);

        const sql = "INSERT INTO admins (username, password) VALUES (?, ?)";
        db.run(sql, [ADMIN_USER, hash], function (err) {
            if (err) console.error(err.message);
            else console.log(`Admin '${ADMIN_USER}' created/reset with ID: ${this.lastID}`);
        });
    });
});
