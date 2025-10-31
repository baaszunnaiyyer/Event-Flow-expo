import Toast from "react-native-toast-message";
import { db } from "./schema";
import { EventRequest } from "@/types/model";


export async function getEventRequests(event_id: string) {
  try {
    const result = await db.getAllAsync<EventRequest>(
      "SELECT * FROM event_requests WHERE event_id = ?",
      [event_id]
    );

    if (!result || result.length === 0) {
      return { success: false, error: "Event Requests Not Found" };
    }

    return { success: true, data: result };
  } catch (error) {
    Toast.show({ type: "error", text1: "Fetch Error", text2: `${error}` });
    console.error("Error fetching Request:", error);
    return { success: false, error: String(error) };
  }
}


export async function deleteEventRequest(event_id: string, user_id: string) {
  try {
    const result = await db.runAsync(
      "DELETE FROM event_requests WHERE event_id = ? AND user_id = ?",
      [event_id, user_id]
    );

    if (result.changes === 0) {
      return { success: false, error: "Event Request Not Found" };
    }

    return { success: true, message: "Event Request Deleted Successfully" };
  } catch (error) {
    Toast.show({ type: "error", text1: "Delete Error", text2: `${error}` });
    console.error("Error Deleting Request:", error);
    return { success: false, error: String(error) };
  }
}


export async function getJoinRequest(user_id : string){
    try {
        const result = await db.getAllAsync("SELECT * FORM join_requests WHERE user_id = ?", [user_id])
        if (!result) {
            return { success: false, error: "Event Requests Not Found" };
        }
        return { success: true, data: result };
    } catch (error) {
        Toast.show({ type: "error", text1: "Fetch Error", text2: `${error}` });
        console.error("Error fetching Request:", error);
        return { success: false, error: String(error) };
    }
}

export async function deleteJoinRequest(request_id : string, user_id : string){
    try {
    const result = await db.runAsync(
      "DELETE FROM join_requests WHERE request_id = ? AND user_id = ?",
      [request_id, user_id]
    );

    if (result.changes === 0) {
      return { success: false, error: "Join Request Not Found" };
    }

    return { success: true, message: "Join Request Deleted Successfully" };
  } catch (error) {
    Toast.show({ type: "error", text1: "Delete Error", text2: `${error}` });
    console.error("Error Deleting Request:", error);
    return { success: false, error: String(error) };
  }
}


export async function GetAllTeamRequest() {

  try {
    const teamReqs = await db.getAllAsync<any>(`
      SELECT 
        jr.request_id,
        jr.user_id,
        jr.sent_by,
        jr.request_type,
        jr.status,
        jr.added_at,
        jr.branch_id,

        -- branch info
        b.branch_id as b_branch_id,
        b.team_id as b_team_id,
        b.parent_branch_id as b_parent_branch_id,
        b.branch_name as b_branch_name,
        b.branch_description as b_branch_description,
        b.created_by as b_created_by,
        b.created_at as b_created_at,
        b.updated_at as b_updated_at,

        -- sender info
        u.user_id as u_user_id,
        u.name as u_name,
        u.email as u_email,
        u.phone as u_phone,
        u.date_of_birth as u_date_of_birth,
        u.gender as u_gender,
        u.country as u_country,
        u.is_private as u_is_private,
        u.timezone as u_timezone,
        u.status as u_status,
        u.created_at as u_created_at,
        u.updated_at as u_updated_at
      FROM join_requests jr
      LEFT JOIN branches b ON jr.branch_id = b.branch_id
      LEFT JOIN users u ON jr.sent_by = u.user_id
    `);
    const formattedTeamReqs = teamReqs.map((row: any) => ({
      request_id: row.request_id,
      user_id: row.user_id,
      sent_by: row.sent_by,
      request_type: row.request_type,
      status: row.status,
      added_at: row.added_at,
      branch_id: row.branch_id,
      branch: row.b_branch_id
        ? {
            branch_id: row.b_branch_id,
            team_id: row.b_team_id,
            parent_branch_id: row.b_parent_branch_id,
            branch_name: row.b_branch_name,
            branch_description: row.b_branch_description,
            created_by: row.b_created_by,
            created_at: row.b_created_at,
            updated_at: row.b_updated_at,
          }
        : null,
      sender: row.u_user_id
        ? {
            user_id: row.u_user_id,
            name: row.u_name,
            email: row.u_email,
            phone: row.u_phone,
            date_of_birth: row.u_date_of_birth,
            gender: row.u_gender,
            country: row.u_country,
            is_private: row.u_is_private,
            timezone: row.u_timezone,
            status: row.u_status,
            created_at: row.u_created_at,
            updated_at: row.u_updated_at,
          }
        : null,
    }));
    return formattedTeamReqs;
  } catch (error) {
    console.log("error Getting All the Team Requestes!");
    return [];
  }
}