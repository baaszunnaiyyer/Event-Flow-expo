import Toast from "react-native-toast-message";
import { db } from "./schema";
import { Event, EventMembers } from "@/types/model";
import { syncTable, upsertTable } from "./SyncDB";
import { queueDB } from "./DatabaseQueue";

import * as Notifications from "expo-notifications";

// ✅ Insert Event
export async function insertEvent(event: Event) {
  try {
    await db.runAsync(
      `INSERT INTO events (
        event_id,
        title,
        description,
        start_time,
        end_time,
        category,
        state,
        is_recurring,
        frequency,
        interval,
        by_day,
        until,
        location,
        created_by,
        team_id,
        branch_id,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        event.event_id,
        event.title,
        event.description,
        event.start_time,
        event.end_time,
        event.category,
        event.state,
        event.is_recurring ? 1 : 0,
        event.frequency ?? null,
        event.interval ?? null,
        event.by_day ? event.by_day.join(",") : null,
        event.until ?? null,
        event.location,
        event.created_by,
        event.team_id,
        event.branch_id,
        event.created_at,
        event.updated_at,
      ]
    );
    return { success: true };
  } catch (error) {
    Toast.show({ type: "error", text1: "Insert Error", text2: `${error}` });
    console.error("Error inserting event:", error);
    return { success: false, error };
  }
}

// ✅ Insert or Update Events in Bulk
export async function upsertEvents(events: Event[]) {
  try {
    for (const event of events) {
      await db.runAsync(
        `INSERT OR REPLACE INTO events (
          event_id, title, description, start_time, end_time, category, state,
          is_recurring, frequency, interval, by_day, until, location, created_by,
          team_id, branch_id, created_at, updated_at, isAdmin
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          event.event_id,
          event.title,
          event.description,
          event.start_time,
          event.end_time,
          event.category,
          event.state,
          event.is_recurring ? 1 : 0,
          event.frequency ?? null,
          event.interval ?? null,
          event.by_day ? event.by_day.join(",") : null,
          event.until ?? null,
          event.location,
          event.created_by,
          event.team_id,
          event.branch_id,
          event.created_at,
          event.updated_at,
          event.isAdmin
        ]
      );
    }
    return { success: true };
  } catch (error) {
    console.error("Error upserting events:", error);
    return { success: false, error };
  }
}


// ✅ Update Event
export async function updateEvent(event: Event) {
  try {
    await db.runAsync(
      `UPDATE events SET 
        title = ?,
        description = ?,
        start_time = ?,
        end_time = ?,
        category = ?,
        state = ?,
        is_recurring = ?,
        frequency = ?,
        interval = ?,
        by_day = ?,
        until = ?,
        location = ?,
        created_by = ?,
        team_id = ?,
        branch_id = ?,
        created_at = ?,
        updated_at = ?
      WHERE event_id = ?`,
      [
        event.title,
        event.description,
        event.start_time,
        event.end_time,
        event.category,
        event.state,
        event.is_recurring ? 1 : 0,
        event.frequency ?? null,
        event.interval ?? null,
        event.by_day ? event.by_day.join(",") : null,
        event.until ?? null,
        event.location,
        event.created_by,
        event.team_id,
        event.branch_id,
        event.created_at,
        event.updated_at,
        event.event_id,
      ]
    );
    return { success: true };
  } catch (error) {
    Toast.show({ type: "error", text1: "Update Error", text2: `${error}` });
    console.error("Error updating event:", error);
    return { success: false, error };
  }
}

// ✅ Delete Event
export async function deleteEvent(event_id: string) {
  try {
    await db.runAsync("DELETE FROM events WHERE event_id = ?", [event_id]);
    return { success: true };
  } catch (error) {
    Toast.show({ type: "error", text1: "Delete Error", text2: `${error}` });
    console.error("Error deleting event:", error);
    return { success: false, error };
  }
}

// ✅ Get Single Event
export async function getEvent(event_id: string) {
  try {
    const result: any = await db.getFirstAsync(
      "SELECT * FROM events WHERE event_id = ?",
      [event_id]
    );
    if (!result) return { success: false, error: "Event not found" };
    // Manually transform DB row into Event type
    const event: Event = {
        ...result
    };
    return { success: true, data: event };
  } catch (error) {
    Toast.show({ type: "error", text1: "Fetch Error", text2: `${error}` });
    console.error("Error fetching event:", error);
    return { success: false, error };
  }
}

// ✅ Get All Events
export async function getAllEvents() {
  try {
    const results = await db.getAllAsync("SELECT * FROM events");

    // Convert DB rows back into Event objects
    const events: Event[] = results.map((row: any) => ({
      ...row,
      is_recurring: row.is_recurring === 1,
      by_day: row.by_day ? row.by_day.split(",") : undefined,
    }));

    return { success: true, data: events };
  } catch (error) {
    Toast.show({ type: "error", text1: "Fetch Error", text2: `${error}` });
    console.error("Error fetching events:", error);
    return { success: false, error };
  }
}


// ✅ CREATE (Insert)
export async function insertEventMember(member: EventMembers) {
  try {
    await db.runAsync(
      "INSERT INTO event_members (event_id, user_id, seen) VALUES (?, ?, ?)",
      [member.event_id, member.user_id, member.seen]
    );
    return { success: true };
  } catch (error) {
    Toast.show({ type: "error", text1: "Insert Error", text2: `${error}` });
    console.error("Error inserting event member:", error);
    return { success: false, error };
  }
}

// ✅ READ (Get)
export async function getEventMembers(event_id: string) {
  try {
    const result = await db.getAllAsync(
      "SELECT * FROM event_members WHERE event_id = ?",
      [event_id]
    );
    if (!result || result.length === 0) {
      return { success: false, error: "Event Members Not Found" };
    }
    return { success: true, data: result };
  } catch (error) {
    Toast.show({ type: "error", text1: "Fetch Error", text2: `${error}` });
    console.error("Error fetching event members:", error);
    return { success: false, error };
  }
}

// ✅ UPDATE (e.g., update seen status)
export async function updateEventMemberSeen(event_id: string, user_id: string, seen: number) {
  try {
    await db.runAsync(
      "UPDATE event_members SET seen = ? WHERE event_id = ? AND user_id = ?",
      [seen, event_id, user_id]
    );
    return { success: true };
  } catch (error) {
    Toast.show({ type: "error", text1: "Update Error", text2: `${error}` });
    console.error("Error updating event member:", error);
    return { success: false, error };
  }
}

// ✅ DELETE
export async function deleteEventMember(event_id: string, user_id: string) {
  try {
    await db.runAsync(
      "DELETE FROM event_members WHERE event_id = ? AND user_id = ?",
      [event_id, user_id]
    );
    return { success: true };
  } catch (error) {
    Toast.show({ type: "error", text1: "Delete Error", text2: `${error}` });
    console.error("Error deleting event member:", error);
    return { success: false, error };
  }
}

export async function syncEventsWithNestedData(eventsData: any[]) {

  await Notifications.cancelAllScheduledNotificationsAsync();
  // 1. Sync all events at once
  await queueDB(()=>
    syncTable(
      "events",
      ["event_id"],
      eventsData,
      [
        "event_id", "title", "start_time", "end_time", "description",
        "category", "state", "is_recurring", "frequency", "interval",
        "by_day", "until", "location", "created_by", "team_id", "branch_id",
        "created_at", "updated_at", "isAdmin"
      ]
    )
  )
  // 2. Sync nested entities per-event
  for (const event of eventsData) {
    if (event.creator) {
      await queueDB(()=>
        upsertTable("users", ["user_id", "email"], [event.creator], [
          "user_id", "name", "email", "phone", "date_of_birth",
          "gender", "country", "is_private", "timezone",
          "created_at", "updated_at", "status"
        ])
      )
    }

    if (event.team) {
      await queueDB(()=>
        upsertTable("teams", ["team_id"], [event.team], [
          "team_id", "team_name", "team_description", "joined_at"
        ])
      )

      if (event.team.team_members?.length) {
        await queueDB(()=>
          upsertTable("team_members", ["team_id", "user_id"], event.team.team_members, [
            "team_id", "user_id", "role"
          ])
        )
      }
    }

    if (event.branch) {
      await queueDB(()=>
        upsertTable("branches", ["branch_id"], [event.branch], [
          "branch_id", "team_id", "parent_branch_id", "branch_name",
          "branch_description", "created_by", "created_at", "updated_at"
        ])
      )

      if (event.branch.branch_members?.length) {
        await queueDB(()=>
          upsertTable("branch_members", ["branch_id", "user_id"], event.branch.branch_members, [
            "branch_id", "team_id", "user_id", "role", "joined_at"
          ])
        )
      }
    }

    if(event.event_members) {
      await queueDB(()=>
        upsertTable("event_members", ["event_id","user_id"], event.event_members, [
          "event_id","user_id","seen"
        ])
      )
      for(const e of event.event_members){
        await queueDB(()=>
          upsertTable("users", ["user_id"], [e.user],[
            "user_id", "name", "phone", "status", "timezone", "updated_at", "country", "date_of_birth", "email", "gender"
          ])
        )
      }
    }
  }
}

export async function getJoinedEvents(): Promise<any[]> {
  // 1. Get events + creator + team + branch in one JOIN
  const rows = await db.getAllAsync<any>(`
    SELECT e.*,
          u.user_id       AS creator_id,
          u.name          AS creator_name,
          u.email         AS creator_email,
          u.phone         AS creator_phone,

          t.team_id       AS team_id,
          t.team_name     AS team_name,
          t.team_description,

          b.branch_id     AS branch_id,
          b.branch_name,
          b.branch_description

    FROM events e
    LEFT JOIN users u   ON u.user_id = e.created_by
    LEFT JOIN teams t   ON t.team_id = e.team_id
    LEFT JOIN branches b ON b.branch_id = e.branch_id
    WHERE NOT EXISTS (
        SELECT 1
        FROM event_requests er
        WHERE er.event_id = e.event_id
    );
  `);

  if (rows.length === 0) return [];

  // 2. Collect team_ids & branch_ids for bulk fetch
  const teamIds = [...new Set(rows.map(r => r.team_id).filter(Boolean))];
  const branchIds = [...new Set(rows.map(r => r.branch_id).filter(Boolean))];

  let teamMembers: any[] = [];
  let branchMembers: any[] = [];

  if (teamIds.length) {
    teamMembers = await db.getAllAsync<any>(
      `SELECT * FROM team_members WHERE team_id IN (${teamIds.map(() => "?").join(",")})`,
      teamIds
    );
  }

  if (branchIds.length) {
    branchMembers = await db.getAllAsync<any>(
      `SELECT * FROM branch_members WHERE branch_id IN (${branchIds.map(() => "?").join(",")})`,
      branchIds
    );
  }

  // 3. Group members by team_id / branch_id
  const teamMemberMap: Record<string, any[]> = {};
  for (const m of teamMembers) {
    if (!teamMemberMap[m.team_id]) teamMemberMap[m.team_id] = [];
    teamMemberMap[m.team_id].push(m);
  }

  const branchMemberMap: Record<string, any[]> = {};
  for (const m of branchMembers) {
    if (!branchMemberMap[m.branch_id]) branchMemberMap[m.branch_id] = [];
    branchMemberMap[m.branch_id].push(m);
  }

  // 4. Rebuild nested objects
  return rows.map(r => ({
    ...r,

    creator: r.creator_id
      ? {
          user_id: r.creator_id,
          name: r.creator_name,
          email: r.creator_email,
          phone: r.creator_phone,
        }
      : null,

    team: r.team_id
      ? {
          team_id: r.team_id,
          team_name: r.team_name,
          team_description: r.team_description,
          team_members: teamMemberMap[r.team_id] || [],
        }
      : null,

    branch: r.branch_id
      ? {
          branch_id: r.branch_id,
          branch_name: r.branch_name,
          branch_description: r.branch_description,
          branch_members: branchMemberMap[r.branch_id] || [],
        }
      : null,
  }));
}