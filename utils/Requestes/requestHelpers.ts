// utils/requestHelpers.ts
import { API_BASE_URL } from "@/utils/constants";
import * as SecureStore from "expo-secure-store";
import { Event, TeamRequest } from "@/types/model";

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
      console.log(`This ${event.title} is ${response}`);
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
      console.log(`${response} request from ${request.sender.name}`);
    } else {
      console.log("Failed to respond");
    }
  } catch (error) {
    console.log(error);
  }
}
