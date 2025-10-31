import { Stack } from "expo-router";
import { ActivityIndicator, View, StyleSheet, Platform } from "react-native";
import { useEffect, useState, Suspense, useLayoutEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "@/utils/constants";
import Toast, { BaseToast, ErrorToast } from "react-native-toast-message";
import { useFonts } from 'expo-font';
import * as Notifications from "expo-notifications";
import { SQLiteProvider } from "expo-sqlite";
import { getApp } from '@react-native-firebase/app';
import { getMessaging, onMessage, onNotificationOpenedApp, setBackgroundMessageHandler } from '@react-native-firebase/messaging';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// const loadData = async () =>{
//   const FileName = 'EventFlowDB.db'
//   const dbAssests = require("../assets/LocalDatabase/EventFlowDB.db")
//   const DBUri = Asset.fromModule(dbAssests).uri; 
//   const dbFilePath = `${FileSystem.documentDirectory}SQLite/${FileName}`;


//   const fileInfo = await FileSystem.getInfoAsync(dbFilePath);
//   if (!fileInfo.exists) {
//     await FileSystem.makeDirectoryAsync(
//       `${FileSystem.documentDirectory}SQLite`,
//       {intermediates : true}
//     )
//     await FileSystem.downloadAsync(DBUri, dbFilePath)
//   }

// }

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'FiraCode-Regular': require('../assets/fonts/FiraCode-Regular.ttf'),
    'FiraCode-Bold': require('../assets/fonts/FiraCode-Bold.ttf'),
  });

  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<boolean>(false);

  
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
        } else if (isTokenValid || userId) {
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

  if (!initialRoute || !fontsLoaded || !loaded) {
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
    backgroundColor: "#fff",
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
