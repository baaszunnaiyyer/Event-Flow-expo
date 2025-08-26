import { Tabs } from "expo-router";
import { Platform } from "react-native";
import Ionicons from '@expo/vector-icons/Ionicons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown : false,
        tabBarActiveTintColor: "#090040",
        tabBarInactiveTintColor: "gray",
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginBottom: Platform.OS === "android" ? 4 : 0,
          fontFamily : "FiraCode-Regular"
        },
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "#ffffff",
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          height: 100,
          opacity : 1,
          borderTopWidth: 0,
          elevation: 5, // Android shadow
          shadowColor: "#000", // iOS shadow
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
        },
      }}
    >
      <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) =>
              focused ? (
                <Ionicons name="home-sharp" size={24} color="#090040" />
              ) : (
                <Ionicons name="home-outline" size={24} color="#090040" />
              ),
            headerShown: true,
            headerStyle: {
              backgroundColor: "#fff", // Light background
              shadowColor: "#000",
              elevation: 3, // for Android
              shadowOffset: { width: 0, height: 2 }, // for iOS
              shadowOpacity: 0.2,
              shadowRadius: 3,
            },
            headerTitleStyle: {
              fontSize: 36,
              fontWeight: "bold",
              color: "#333",
            },
            headerTintColor: "coral", // Back arrow or buttons color
            headerTitleAlign: "left",
            headerLeftContainerStyle: {
              paddingLeft: 8,
            },
          }}
        />
      <Tabs.Screen
          name="(events)"
          options={{
            title: "Events",
            tabBarIcon: ({ color, focused }) =>
              focused ? (
                <Ionicons name="book-sharp" size={24} color="#090040" />
              ) : (
                <Ionicons name="book-outline" size={24} color="#090040" />
              ),
            headerShown: true,
            headerStyle: {
              backgroundColor: "#fff", // Light background
              shadowColor: "#000",
              elevation: 3, // for Android
              shadowOffset: { width: 0, height: 2 }, // for iOS
              shadowOpacity: 0.2,
              shadowRadius: 3,
            },
            headerTitleStyle: {
              fontSize: 36,
              fontWeight: "bold",
              color: "#333",
            },
            headerTintColor: "coral", // Back arrow or buttons color
            headerTitleAlign: "left",
            headerLeftContainerStyle: {
              paddingLeft: 8,
            },
          }}
        />
      <Tabs.Screen
        name="notification"
        options={{
          title: "Requests",
          tabBarIcon: ({ color, focused }) =>
            focused ? (
              <Ionicons name="notifications-sharp" size={24} color="#090040" />
            ) : (
              <Ionicons name="notifications-outline" size={24} color="#090040" />
            ),
            headerShown: true,
            headerStyle: {
              backgroundColor: "#fff", // Light background
              shadowColor: "#000",
              elevation: 3, // for Android
              shadowOffset: { width: 0, height: 2 }, // for iOS
              shadowOpacity: 0.2,
              shadowRadius: 3,
            },
            headerTitleStyle: {
              fontSize: 36,
              fontWeight: "bold",
              color: "#333",
            },
            headerTintColor: "coral", // Back arrow or buttons color
            headerTitleAlign: "left",
            headerLeftContainerStyle: {
              paddingLeft: 8,
            },
        }}
      />
      <Tabs.Screen
        name="(teams)"
        options={{
          title: "Teams",
          tabBarIcon: ({ color, focused }) =>
            focused ? (
              <Ionicons name="people-sharp" size={24} color="#090040" />
            ) : (
              <Ionicons name="people-outline" size={24} color="#090040" />
            ),
            headerShown: true,
            headerStyle: {
              backgroundColor: "#fff", // Light background
              shadowColor: "#000",
              elevation: 3, // for Android
              shadowOffset: { width: 0, height: 2 }, // for iOS
              shadowOpacity: 0.2,
              shadowRadius: 3,
            },
            headerTitleStyle: {
              fontSize: 36,
              fontWeight: "bold",
              color: "#333",
            },
            headerTintColor: "coral", // Back arrow or buttons color
            headerTitleAlign: "left",
            headerLeftContainerStyle: {
              paddingLeft: 8,
            },
        }}
      />
      <Tabs.Screen
        name="(settings)"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) =>
            focused ? (
              <Ionicons name="settings" size={24} color="#090040" />
            ) : (
              <Ionicons name="settings-outline" size={24} color="#090040" />
            ),
             headerShown: true,
            headerStyle: {
              backgroundColor: "#fff", // Light background
              shadowColor: "#000",
              elevation: 3, // for Android
              shadowOffset: { width: 0, height: 2 }, // for iOS
              shadowOpacity: 0.2,
              shadowRadius: 3,
            },
            headerTitleStyle: {
              fontSize: 36,
              fontWeight: "bold",
              color: "#333",
            },
            headerTintColor: "coral", // Back arrow or buttons color
            headerTitleAlign: "left",
            headerLeftContainerStyle: {
              paddingLeft: 8,
            },
        }}
      />
    </Tabs>
  );
}
