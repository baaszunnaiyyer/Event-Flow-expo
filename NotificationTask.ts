// backgroundTasks/notificationTask.ts
import * as TaskManager from "expo-task-manager";
import * as Notifications from "expo-notifications";
import { AppState, Platform } from "react-native";

const BACKGROUND_NOTIFICATION_TASK = "BACKGROUND-NOTIFICATION-TASK";

// Define the task
TaskManager.defineTask(
  BACKGROUND_NOTIFICATION_TASK,
  ({ data, error }) : any => {
    if (error) {
      console.log("❌ Background notification error:", error);
      return;
    }

    console.log(
      `${Platform.OS} BACKGROUND-NOTIFICATION: App state is ${AppState.currentState}`
    );
    console.log("📩 Background notification data:", JSON.stringify(data, null, 2));
  }
);

// Register the task
Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK)
  .then(() => console.log("✅ Registered background notification task"))
  .catch((err) => console.log("❌ Task registration failed:", err));
