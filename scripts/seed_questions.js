const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.db');
const SQL_FILE_PATH = path.join(__dirname, 'insert_questions.sql');

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database ' + DB_PATH + ': ' + err.message);
        process.exit(1);
    }
});

const sql = fs.readFileSync(SQL_FILE_PATH, 'utf8');

console.log('Inserting questions...');

db.run(sql, function (err) {
    if (err) {
        console.error('Error executing SQL:', err.message);
    } else {
        console.log(`Successfully inserted questions. Changes: ${this.changes}`);
    }
    db.close();
});
