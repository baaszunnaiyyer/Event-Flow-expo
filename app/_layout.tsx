import { API_BASE_URL } from "@/utils/constants";
import { initDatabase } from "@/utils/db/schema";
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
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
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
    'FiraCode-Regular': require('../assets/fonts/FiraCode-Regular.ttf'),
    'FiraCode-Bold': require('../assets/fonts/FiraCode-Bold.ttf'),
  });

  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [dbInitialized, setDbInitialized] = useState<boolean>(false);
  const [text, setText] = useState<string>("Authenticating Your Credentials");

  useEffect(()=>{
    setTimeout(()=>{
      setText('Still loading... please check your internet connection.')
    }, 10000)
  })

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
        const userId = await SecureStore.getItemAsync("userId")

        let isTokenValid = false;

        if (token) {
          const res = await fetch(`${API_BASE_URL}/auth/validate-token`, {
            method: "GET",
            headers: {
              Authorization: `${token}`,
            },
          });

          if (res.ok) {
            const data = await res.json();
            if (data.message === "Token is valid") {
              isTokenValid = true;
            }
          } else {
            await SecureStore.deleteItemAsync("userToken");
          }
        }

        if (!hasOnboarded) {
          setInitialRoute("(onboarding)");
        } else if (isTokenValid) {
          setInitialRoute("(tabs)");
        } else {
          setInitialRoute("(auth)");
        }
      } catch (error) {
        console.error("Error checking app state:", error);
        setInitialRoute("(auth)");
      }finally{
        setLoaded(true)
      }
    };

    checkInitialRoute();    
  }, []);

  // Wait for database initialization before rendering app
  if (!initialRoute || !fontsLoaded || !loaded || !dbInitialized) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#090040"/>
        <Text style={{fontWeight: '800'}}>{text}</Text>
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
        fontSize: 16,
        fontWeight: "bold",
        color: "#155724",
      }}
      text2Style={{
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
        fontSize: 16,
        fontWeight: "bold",
        color: "#721c24",
      }}
      text2Style={{
        fontSize: 14,
        color: "#721c24",
      }}
    />
  ),
};
