import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_FILE = process.env.DB_PATH || path.join(__dirname, "..", "rds.db");

// Ensure the directory exists
const dir = path.dirname(DB_FILE);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Establish a SQLite connection (synchronous; sufficient for a small demo)
export const db = new Database(DB_FILE);

// Simple migration: create the decision_records table
db.exec(`
  CREATE TABLE IF NOT EXISTS decision_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,

    -- student input fields
    age INTEGER NOT NULL,
    months_in_ca INTEGER NOT NULL,
    has_ca_driver_license INTEGER NOT NULL,
    registered_to_vote_in_ca INTEGER NOT NULL,
    files_ca_taxes INTEGER NOT NULL,

    -- decision result
    status TEXT NOT NULL,
    reasons_json TEXT NOT NULL,

    -- explanations
    system_explanation TEXT NOT NULL,
    ai_explanation TEXT
  );
`);
