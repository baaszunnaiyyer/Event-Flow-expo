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