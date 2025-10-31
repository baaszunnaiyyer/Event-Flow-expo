import { useEffect } from "react";
import { getApp } from "@react-native-firebase/app";
import {
  getMessaging,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
  setBackgroundMessageHandler,
} from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";

export function useFirebaseNotifications() {
  useEffect(() => {
    const app = getApp();
    const messaging = getMessaging(app);

    // Foreground
    const unsubscribe = onMessage(messaging, async (remoteMessage) => {
      console.log("📩 Foreground:", remoteMessage);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: remoteMessage.data?.title ?? "New Message",
          body: remoteMessage.data?.body ?? "",
          data: remoteMessage.data,
        },
        trigger: null, // show immediately
      });
    });

    // Background (tap)
    onNotificationOpenedApp(messaging, (remoteMessage) => {
      if (remoteMessage) {
        console.log("📬 Opened from background:", remoteMessage.data);
      }
    });

    // Quit state (tap after app killed)
    getInitialNotification(messaging).then((remoteMessage) => {
      if (remoteMessage) {
        console.log("🚀 Opened from quit:", remoteMessage.data);
      }
    });

    return unsubscribe;
  }, []);
}

// Global background handler (⚠️ must be in index.js, not inside a component)
setBackgroundMessageHandler(getMessaging(getApp()), async (remoteMessage) => {
  console.log("⚙️ Background:", remoteMessage);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: remoteMessage.data?.title ?? "Background Message",
      body: remoteMessage.data?.body ?? "",
      data: remoteMessage.data,
    },
    trigger: null,
  });
});
