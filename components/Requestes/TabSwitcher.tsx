// components/Requests/TabSwitcher.tsx
import React from "react";
import { Pressable, View, Text } from "react-native";
import { notificationStyles as styles } from "@/styles/Notification.styles";

export default function TabSwitcher({ activeTab, setActiveTab } : any) {
  const isEventTab = activeTab === "event";
  return (
    <View style={styles.tabContainer}>
      <Pressable
        style={[styles.tab, isEventTab && styles.activeTab]}
        onPress={() => setActiveTab("event")}
      >
        <Text style={[styles.tabText, isEventTab && styles.activeTabText]}>
          Event Requests
        </Text>
      </Pressable>
      <Pressable
        style={[styles.tab, !isEventTab && styles.activeTab]}
        onPress={() => setActiveTab("team")}
      >
        <Text style={[styles.tabText, !isEventTab && styles.activeTabText]}>
          Team Requests
        </Text>
      </Pressable>
    </View>
  );
}
