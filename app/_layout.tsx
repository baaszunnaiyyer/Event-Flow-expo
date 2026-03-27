import { APP_FONT_FAMILY } from "@/utils/constants";
import { getAllEvents } from "@/utils/db/Events";
import { initDatabase } from "@/utils/db/schema";
import { RegisterEventNotifications } from "@/utils/Notifications/EventNotifications";
import { requestNotificationPermissions } from "@/utils/Notifications/notification";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp } from '@react-native-firebase/app';
import { getMessaging, onMessage, onNotificationOpenedApp, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import { useFonts } from 'expo-font';
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { SQLiteProvider } from "expo-sqlite";
import { Suspense, useEffect, useLayoutEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import Toast, { BaseToast, ErrorToast } from "react-native-toast-message";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});


export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    [APP_FONT_FAMILY]: require("../assets/fonts/ChangaOne-Regular.ttf"),
  });

  const [initialRoute, setInitialRoute] = useState<string | null>("(tabs)");
  const [loaded, setLoaded] = useState<boolean>(false);
  const [dbInitialized, setDbInitialized] = useState<boolean>(false);




  // Initialize database ONCE when component mounts
  useEffect(() => {
    let mounted = true;
    const initializeDB = async () => {
      try {
        await initDatabase();
        if (mounted) {
          setDbInitialized(true);
        }
      } catch (error) {
        console.error("❌ Database initialization error:", error);
        // Still proceed even if init fails (tables might already exist)
        if (mounted) {
          setDbInitialized(true);
        }
      }
    };
    initializeDB();
    requestNotificationPermissions();
    return () => {
      mounted = false;
    };
  }, []); // Only run once on mount


  useLayoutEffect(() => {
    const app = getApp(); // required for modular API
    const messaging = getMessaging(app);

    // Foreground message
    const unsubscribe = onMessage(messaging, async (remoteMessage) => {
      console.log("📩 Foreground message:", remoteMessage);
    });

    // When notification opens the app from background
    onNotificationOpenedApp(messaging, (remoteMessage) => {
      console.log("📬 Opened from background:", remoteMessage.notification);
    });

    // Background handler (must be outside of component usually, but can also be set here)
    setBackgroundMessageHandler(messaging, async (remoteMessage) => {
      console.log("⚙️ Background message:", remoteMessage.notification);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const checkInitialRoute = async () => {
      try {
        const hasOnboarded = await AsyncStorage.getItem("hasOnboarded");
        const token = await SecureStore.getItemAsync("userToken");

        // Optimistic check: If we have a token, go to tabs. 
        // Validation happens in the background in (tabs)/_layout.tsx
        if (!hasOnboarded) {
          setInitialRoute("(onboarding)");
        } else if (token) {
          setInitialRoute("(tabs)");

          // Schedule notifications (keep this as it doesn't block UI much, or move to background)
          getAllEvents().then((eventsResult) => {
            if (eventsResult.success && eventsResult.data) {
              RegisterEventNotifications(eventsResult.data).catch(console.error);
            }
          }).catch(console.error);
        } else {
          setInitialRoute("(auth)");
        }
      } catch (error) {
        console.error("Error checking app state:", error);
        setInitialRoute("(auth)");
      } finally {
        setLoaded(true);
      }
    };

    checkInitialRoute();
  }, []);

  // Wait for database initialization before rendering app
  if (!initialRoute || !fontsLoaded || !loaded || !dbInitialized) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#090040" />
      </View>
    );
  }

  return (
    <>
      <Suspense>
        <SQLiteProvider
          databaseName="EventFlowDB.db"
          useSuspense>
          {initialRoute &&
            <Stack initialRouteName={initialRoute}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
            </Stack>
          }
          <Toast config={toastConfig} position="bottom" bottomOffset={100} />
        </SQLiteProvider>
      </Suspense>
    </>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(253, 253, 253, 1)"
  },
});

// ✅ Custom Toast Style
const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: "#28a745",
        borderLeftWidth: 6,
        backgroundColor: "#e9f9f0",
        borderRadius: 10,
      }}
      text1Style={{
        fontFamily: APP_FONT_FAMILY,
        fontSize: 16,
        color: "#155724",
      }}
      text2Style={{
        fontFamily: APP_FONT_FAMILY,
        fontSize: 14,
        color: "#155724",
      }}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: "#090040",
        borderLeftWidth: 6,
        backgroundColor: "#f8d7da",
        marginBottom: 20,
        borderRadius: 10,
      }}
      text1Style={{
        fontFamily: APP_FONT_FAMILY,
        fontSize: 16,
        color: "#721c24",
      }}
      text2Style={{
        fontFamily: APP_FONT_FAMILY,
        fontSize: 14,
        color: "#721c24",
      }}
    />
  ),
};
