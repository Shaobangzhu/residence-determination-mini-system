// backend/src/db.ts
import Database from 'better-sqlite3';
import path from 'path';

// Path to the SQLite DB file: backend/rds.db
const dbPath = path.join(__dirname, '..', 'rds.db');

// Open or create the database
const db = new Database(dbPath);

// Optional: improve concurrent read performance
db.pragma('journal_mode = WAL');

// Initialize table (create if it does not exist)
db.exec(`
  CREATE TABLE IF NOT EXISTS student_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,

    -- Fields corresponding to StudentInput
    age INTEGER NOT NULL,
    months_in_ca INTEGER NOT NULL,
    has_ca_driver_license INTEGER NOT NULL,
    registered_to_vote_in_ca INTEGER NOT NULL,
    files_ca_taxes INTEGER NOT NULL,
    financially_independent INTEGER NOT NULL,

    -- Decision result
    decision_status TEXT NOT NULL,
    decision_reasons TEXT NOT NULL  -- store as JSON string
  );
`);

export type StudentSessionRow = {
  id?: number;
  created_at: string;

  age: number;
  months_in_ca: number;
  has_ca_driver_license: boolean;
  registered_to_vote_in_ca: boolean;
  files_ca_taxes: boolean;
  financially_independent: boolean;

  decision_status: string;   // 'resident' | 'nonresident' | 'needs_review'
  decision_reasons: string;  // JSON.stringify([...])
};

// Prepared insert statement
const insertStmt = db.prepare(`
  INSERT INTO student_sessions (
    created_at,
    age,
    months_in_ca,
    has_ca_driver_license,
    registered_to_vote_in_ca,
    files_ca_taxes,
    financially_independent,
    decision_status,
    decision_reasons
  ) VALUES (
    @created_at,
    @age,
    @months_in_ca,
    @has_ca_driver_license,
    @registered_to_vote_in_ca,
    @files_ca_taxes,
    @financially_independent,
    @decision_status,
    @decision_reasons
  )
`);

// Export a simple function for saving a record
export function saveStudentSession(
  row: Omit<StudentSessionRow, 'id'>
): void {
  insertStmt.run({
    ...row,
    // Booleans converted to 0/1 for DB storage
    has_ca_driver_license: row.has_ca_driver_license ? 1 : 0,
    registered_to_vote_in_ca: row.registered_to_vote_in_ca ? 1 : 0,
    files_ca_taxes: row.files_ca_taxes ? 1 : 0,
    financially_independent: row.financially_independent ? 1 : 0
  });
}
