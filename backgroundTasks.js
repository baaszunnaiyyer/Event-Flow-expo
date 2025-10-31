import { getApp } from "@react-native-firebase/app";
import { getMessaging, setBackgroundMessageHandler } from "@react-native-firebase/messaging";
import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("EventFlowDB.db");

const fetchAndSaveData = async (userId, token) => {
  try {
    const response = await fetch(`https://your-api-url.com/sync-data/${userId}`, {
      headers: {
        Authorization: token,
      },
    });

    const data = await response.json();

    await db.execAsync("BEGIN TRANSACTION;");

    // Example: saving events
    for (const event of data.events) {
      await db.runAsync(
        `INSERT OR REPLACE INTO events (event_id, name, date) VALUES (?, ?, ?);`,
        [event.id, event.name, event.date]
      );
    }

    await db.execAsync("COMMIT;");
    console.log("✅ Synced and saved to local DB in background!");
  } catch (error) {
    console.error("❌ Background sync failed:", error);
  }
};

export const setupBackgroundHandler = () => {
  const app = getApp();
  const messaging = getMessaging(app);

  setBackgroundMessageHandler(messaging, async (remoteMessage) => {
    console.log("⚙️ Background message received:", remoteMessage.data);

    // // Extract user info (you can store these securely)
    // const userId = remoteMessage.data?.userId;
    // const token = remoteMessage.data?.authToken;

    // if (userId && token) {
    //   await fetchAndSaveData(userId, token);
    // }

    return Promise.resolve();
  });
};
