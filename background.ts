import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import * as SecureStore from "expo-secure-store";
import * as Notifications from "expo-notifications";
import { API_BASE_URL } from "@/utils/constants";

const TASK_NAME = "CHECK_FOR_CHANGES_TASK";

// Helper to deep compare two JSON objects
const hasDataChanged = (oldData: any, newData: any) => {
  return JSON.stringify(oldData) !== JSON.stringify(newData);
};

TaskManager.defineTask(TASK_NAME, async () => {
  try {
    const token = await SecureStore.getItemAsync("userToken");
    if (!token) return BackgroundFetch.BackgroundFetchResult.NoData;

    const [eventsRes, eventReqRes, teamReqRes] = await Promise.all([
      fetch(`${API_BASE_URL}/events`, { headers: { Authorization: token } }),
      fetch(`${API_BASE_URL}/requestes/events`, { headers: { Authorization: token } }),
      fetch(`${API_BASE_URL}/requestes/people`, { headers: { Authorization: token } }),
    ]);

    if (!eventsRes.ok || !eventReqRes.ok || !teamReqRes.ok) {
      throw new Error("Failed to fetch one or more data sets");
    }

    const eventsData = await eventsRes.json();
    const eventRequestsData = await eventReqRes.json();
    const teamRequestsData = await teamReqRes.json();

    // Load cached data
    const cachedEventsStr = await SecureStore.getItemAsync("cachedEvents");
    const cachedEventRequestsStr = await SecureStore.getItemAsync("cachedEventRequests");
    const cachedTeamRequestsStr = await SecureStore.getItemAsync("cachedTeamRequests");

    const cachedEvents = cachedEventsStr ? JSON.parse(cachedEventsStr) : null;
    const cachedEventRequests = cachedEventRequestsStr ? JSON.parse(cachedEventRequestsStr) : null;
    const cachedTeamRequests = cachedTeamRequestsStr ? JSON.parse(cachedTeamRequestsStr) : null;

    // Check if any data changed
    const eventsChanged = hasDataChanged(cachedEvents, eventsData);
    const eventRequestsChanged = hasDataChanged(cachedEventRequests, eventRequestsData);
    const teamRequestsChanged = hasDataChanged(cachedTeamRequests, teamRequestsData);

    if (eventsChanged || eventRequestsChanged || teamRequestsChanged) {
      // Send notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Updates Available",
          body: "New changes detected in events or requests. Tap to check.",
        },
        trigger: null,
      });

      // Update cache
      await Promise.all([
        SecureStore.setItemAsync("cachedEvents", JSON.stringify(eventsData)),
        SecureStore.setItemAsync("cachedEventRequests", JSON.stringify(eventRequestsData)),
        SecureStore.setItemAsync("cachedTeamRequests", JSON.stringify(teamRequestsData)),
      ]);

      return BackgroundFetch.BackgroundFetchResult.NewData;
    }

    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error("Background task error:", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundCheck() {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);

  if (!isRegistered) {
    await BackgroundFetch.registerTaskAsync(TASK_NAME, {
      minimumInterval: 300, // every 5 mins, adjust as needed
      stopOnTerminate: false,
      startOnBoot: true,
    });
  }

  await BackgroundFetch.setMinimumIntervalAsync(300);
}
