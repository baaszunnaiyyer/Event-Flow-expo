import Toast from "react-native-toast-message";
import { db } from "./schema";
import { Event, EventMembers } from "@/types/model";

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
          team_id, branch_id, created_at, updated_at
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