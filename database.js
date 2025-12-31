const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'database.db');
const SCHEMA_PATH = path.join(__dirname, 'database.sql');

// Create the database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database ' + DB_PATH + ': ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');
        // Initialize schema if needed (could be moved to a separate script, but keeping here for simplicity)
        initDatabase();
    }
});

function initDatabase() {
    // Only run if tables don't exist? db.exec runs multiple statements.
    // For safety, we can just run it. IF NOT EXISTS is in the SQL.
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
    db.exec(schema, (err) => {
        if (err) {
            console.error('Error initializing database schema:', err);
        } else {
            console.log('Database schema initialized.');
            // We can check/create admin here or leave it to a seed script.
            // keeping existing logic for safety but improved.
            checkAndCreateDefaultAdmin();
        }
    });
}

function checkAndCreateDefaultAdmin() {
    db.get("SELECT count(*) as count FROM admins", [], (err, row) => {
        if (err) return console.error(err);
        if (row.count === 0) {
            const bcrypt = require('bcrypt');
            const password = 'admin';
            const saltRounds = 10;
            bcrypt.hash(password, saltRounds, function (err, hash) {
                if (err) return console.error(err);
                db.run("INSERT INTO admins (username, password) VALUES (?, ?)", ["admin", hash], (err) => {
                    if (err) console.error("Error creating default admin:", err);
                    else console.log("Default admin created (admin/admin)");
                });
            });
        }
    });
}

// Promise Wrappers
const dbAsync = {
    get: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },
    all: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },
    run: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
            });
        });
    },
    // Expose raw instance if needed
    instance: db
};

module.exports = dbAsync;
