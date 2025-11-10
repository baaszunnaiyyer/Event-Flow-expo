import * as Notifications from "expo-notifications";

export type Reminder ={
  label : string,
  ms : number
}

// How notifications behave when triggered (foreground)
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});
  
export async function requestNotificationPermissions() {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        return newStatus === "granted";
    }
    return true;
}

export async function sendTestNotification() {
  // const triggerDate = new Date(Date.now() + 5000);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Event Notifiaction",
      body: "This is your first local notification!",
      data: { customData: "123" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 0,
    },
  });
}