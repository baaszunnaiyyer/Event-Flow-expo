// src/db/schema.ts
import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabaseSync("EventFlowDB.db");
let isInitialized = false;

// Run this on app startup
export async function initDatabase() {
  // ✅ Enable foreign keys (important: must be ON for constraints to work)
  // await db.execAsync("PRAGMA foreign_keys = ON;");


  if (isInitialized) {
    return;
  }
  try {
  await db.execAsync(`
    -- USERS
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      date_of_birth TEXT,
      gender TEXT,
      country TEXT,
      is_private INTEGER,
      availability_day_of_week TEXT,
      availability_start_time TEXT,
      availability_end_time TEXT,
      timezone TEXT,
      created_at TEXT,
      updated_at TEXT,
      status TEXT
    );

    -- TEAMS
    CREATE TABLE IF NOT EXISTS teams (
      team_id TEXT PRIMARY KEY,
      team_name TEXT NOT NULL,
      team_description TEXT,
      joined_at TEXT
    );

    -- TEAM MEMBERS
    CREATE TABLE IF NOT EXISTS team_members (
      team_id TEXT,
      user_id TEXT,
      role TEXT,
      PRIMARY KEY (team_id, user_id),
      FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );

    -- BRANCHES
    CREATE TABLE IF NOT EXISTS branches (
      branch_id TEXT PRIMARY KEY,
      team_id TEXT,
      parent_branch_id TEXT,
      branch_name TEXT,
      branch_description TEXT,
      created_by TEXT,
      created_at TEXT,
      updated_at TEXT,
      FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE,
      FOREIGN KEY (parent_branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(user_id)
    );

    -- BRANCH MEMBERS
    CREATE TABLE IF NOT EXISTS branch_members (
      branch_id TEXT,
      team_id TEXT,
      user_id TEXT,
      role TEXT,
      joined_at TEXT,
      PRIMARY KEY (branch_id, user_id, team_id),
      FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE,
      FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );

    -- EVENTS
    CREATE TABLE IF NOT EXISTS events (
      event_id TEXT PRIMARY KEY,
      title TEXT,
      description TEXT,
      start_time TEXT,
      end_time TEXT,
      category TEXT,
      state TEXT,
      is_recurring INTEGER,
      frequency TEXT,
      interval INTEGER,
      by_day TEXT,
      until TEXT,
      isAdmin BOOLEAN,
      location TEXT,
      created_by TEXT,
      team_id TEXT,
      branch_id TEXT,
      created_at TEXT,
      updated_at TEXT,
      FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE,
      FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(user_id)
    );

    -- EVENT MEMBERS
    CREATE TABLE IF NOT EXISTS event_members (
      event_id TEXT,
      user_id TEXT,
      seen BOOLEAN,
      PRIMARY KEY (event_id, user_id),
      FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );

    -- EVENT REQUESTS
    CREATE TABLE IF NOT EXISTS event_requests (
      event_id TEXT,
      user_id TEXT,
      status TEXT,
      respond_at TEXT,
      PRIMARY KEY (event_id, user_id),
      FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );

    -- JOIN REQUESTS
    CREATE TABLE IF NOT EXISTS join_requests (
      request_id TEXT PRIMARY KEY,
      user_id TEXT,
      sent_by TEXT,
      request_type TEXT,
      status TEXT,
      added_at TEXT,
      branch_id TEXT,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
      FOREIGN KEY (sent_by) REFERENCES users(user_id),
      FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE
    );

    -- CONTACTS
    CREATE TABLE IF NOT EXISTS contacts (
      user_id TEXT,
      contact_user_id TEXT,
      added_at TEXT,
      PRIMARY KEY (user_id, contact_user_id),
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
      FOREIGN KEY (contact_user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );
  `);
  isInitialized = true;
  } catch (error) {
    console.error("❌ Database initialization error:", error);
  }
}
