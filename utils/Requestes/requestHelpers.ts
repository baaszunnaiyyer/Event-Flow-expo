// utils/requestHelpers.ts
import { API_BASE_URL } from "@/utils/constants";
import * as SecureStore from "expo-secure-store";
import { Event, TeamRequest } from "@/types/model";
import { db } from "../db/schema";
import Toast from "react-native-toast-message";
import { upsertTable } from "../db/SyncDB";

export async function handleEventResponse(
  response: "accepted" | "rejected",
  event: Event
) {
  try {
    const token = await SecureStore.getItemAsync("userToken");
    const res = await fetch(`${API_BASE_URL}/requestes/events/${event.event_id}`, {
      method: "PUT",
      headers: { Authorization: `${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ response }),
    });
    
    if (res.ok) {
      await db.runAsync("DELETE FROM event_requests WHERE event_id = ?", [event.event_id])        
      if(response === "rejected"){
        await db.runAsync("DELETE FROM events WHERE event_id = ?", [event.event_id])        
      }
      Toast.show({type: "success", text1 : `${response.toUpperCase()}`, text2 : `${event.title} is ${response}`})
    } else {
      console.log("Failed to respond to this event");
    }
  } catch (error) {
    console.log(error);
  }
}

export async function handleTeamRequestResponse(
  response: "accepted" | "rejected",
  request: TeamRequest
) {
  try {
    const token = await SecureStore.getItemAsync("userToken");
    const res = await fetch(`${API_BASE_URL}/requestes/people/${request.request_id}`, {
      method: "PUT",
      headers: { Authorization: `${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ response }),
    });

    if (res.ok) {
      await db.runAsync("DELETE FROM join_requests WHERE request_id = ?",[request.request_id])
      const data  = {user_id : request.user_id, contact_user_id : request.sent_by}
      if(response === "accepted"){
        if(request.request_type === "contact"){
          await upsertTable("contacts",["user_id", "contact_user_id"],[data],["user_id", "contact_user_id"])
        }else if(request.request_type === "team"){
          await upsertTable("teams", ["team_id"],[request.branch?.team],["team_id","team_name","team_description","joined_at"])
          await upsertTable("branches", ["branch_id"],[request.branch],["branch_id","team_id","parent_branch_id","branch_name","branch_description","created_by","created_at"])
          await upsertTable("branch_members", ["branch_id","user_id","team_id"],[{branch_id : request.branch?.branch_id, user_id: request.user_id, team_id: request.branch?.team_id, role: "member"}],["branch_id","user_id","team_id","role"])
          await upsertTable("team_members", ["user_id","team_id"],[{user_id: request.user_id, team_id: request.branch?.team_id, role: "member"}],["user_id","team_id","role"])
        }
      }
      Toast.show({type: "success",text1 : `New ${request.request_type} Added`, text2: request.request_type === "team" ? request.branch?.team.team_name : request.sender.name})
      console.log(`${response} request from ${request.sender.name}`);
    } else {
      console.log("Failed to respond");
    }
  } catch (error) {
    console.log(error);
  }
}
