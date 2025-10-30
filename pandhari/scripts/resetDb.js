const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, '..', 'db', 'app.db');
const SCHEMA_PATH = path.join(__dirname, '..', 'db', 'schema.sql');

fs.mkdirSync(path.join(__dirname, '..', 'db'), { recursive: true });
if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);

const db = new sqlite3.Database(DB_PATH);
const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
db.exec(schema, (err) => {
  if (err) {
    console.error('Failed to reset DB:', err);
    process.exit(1);
  }
  console.log('Database reset and seeded successfully.');
  process.exit(0);
});


