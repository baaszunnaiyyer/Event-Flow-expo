// src/db/schema.ts
import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabaseSync("app.db");

// Run this on app startup
export async function initDatabase() {
  // Enums will be stored as TEXT
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
      password TEXT,
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
      PRIMARY KEY (team_id, user_id)
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
      updated_at TEXT
    );

    -- BRANCH MEMBERS
    CREATE TABLE IF NOT EXISTS branch_members (
      branch_id TEXT,
      team_id TEXT,
      user_id TEXT,
      role TEXT,
      joined_at TEXT,
      PRIMARY KEY (branch_id, user_id, team_id)
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
      by_day TEXT, -- store array as comma-separated string
      until TEXT,
      location TEXT,
      created_by TEXT,
      team_id TEXT,
      branch_id TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    -- EVENT MEMBERS
    CREATE TABLE IF NOT EXISTS event_members (
      event_id TEXT,
      user_id TEXT,
      seen INTEGER,
      PRIMARY KEY (event_id, user_id)
    );

    -- EVENT REQUESTS
    CREATE TABLE IF NOT EXISTS event_requests (
      event_id TEXT,
      user_id TEXT,
      status TEXT,
      respond_at TEXT,
      PRIMARY KEY (event_id, user_id)
    );

    -- JOIN REQUESTS
    CREATE TABLE IF NOT EXISTS join_requests (
      request_id TEXT PRIMARY KEY,
      user_id TEXT,
      sent_by TEXT,
      request_type TEXT,
      status TEXT,
      added_at TEXT,
      branch_id TEXT
    );

    -- CONTACTS
    CREATE TABLE IF NOT EXISTS contacts (
      user_id TEXT,
      contact_user_id TEXT,
      added_at TEXT,
      PRIMARY KEY (user_id, contact_user_id)
    );
  `);
}
