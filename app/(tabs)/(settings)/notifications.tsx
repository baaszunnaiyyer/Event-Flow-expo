import React, { useEffect, useState } from "react";
import { View, Text, Switch, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

const NotificationsScreen = () => {
  const [eventReminders, setEventReminders] = useState(true);
  const [appUpdates, setAppUpdates] = useState(true);
  const [marketing, setMarketing] = useState(false);

  const STORAGE_KEYS = {
    eventReminders: "@notif_event_reminders",
    appUpdates: "@notif_app_updates",
    marketing: "@notif_marketing",
  };

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const event = await AsyncStorage.getItem(STORAGE_KEYS.eventReminders);
        const updates = await AsyncStorage.getItem(STORAGE_KEYS.appUpdates);
        const market = await AsyncStorage.getItem(STORAGE_KEYS.marketing);

        if (event !== null) setEventReminders(JSON.parse(event));
        if (updates !== null) setAppUpdates(JSON.parse(updates));
        if (market !== null) setMarketing(JSON.parse(market));
      } catch (error) {
        console.log("Failed to load notification settings", error);
      }
    };

    loadSettings();
  }, []);

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.eventReminders, JSON.stringify(eventReminders));
      await AsyncStorage.setItem(STORAGE_KEYS.appUpdates, JSON.stringify(appUpdates));
      await AsyncStorage.setItem(STORAGE_KEYS.marketing, JSON.stringify(marketing));
    } catch (error) {
      console.log("Failed to save settings", error);
    }
  };

  const handleBack = async () => {
    await saveSettings();
    router.replace("./settings");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#090040" />
        </TouchableOpacity>
        <Text style={styles.heading}>Notifications</Text>
      </View>

      <View style={styles.setting}>
        <Text style={styles.label}>Event Reminders</Text>
        <Switch
          value={eventReminders}
          onValueChange={(value) => {
            setEventReminders(value);
            AsyncStorage.setItem(STORAGE_KEYS.eventReminders, JSON.stringify(value));
          }}
          trackColor={{ false: "#ccc", true: "#090040" }}
          thumbColor={eventReminders ? "#fff" : "#fff"}
        />
      </View>

      <View style={styles.setting}>
        <Text style={styles.label}>App Updates</Text>
        <Switch
          value={appUpdates}
          onValueChange={(value) => {
            setAppUpdates(value);
            AsyncStorage.setItem(STORAGE_KEYS.appUpdates, JSON.stringify(value));
          }}
          trackColor={{ false: "#ccc", true: "#090040" }}
          thumbColor={appUpdates ? "#fff" : "#fff"}
        />
      </View>

      <View style={styles.setting}>
        <Text style={styles.label}>Marketing Notifications</Text>
        <Switch
          value={marketing}
          onValueChange={(value) => {
            setMarketing(value);
            AsyncStorage.setItem(STORAGE_KEYS.marketing, JSON.stringify(value));
          }}
          trackColor={{ false: "#ccc", true: "#090040" }}
          thumbColor={marketing ? "#fff" : "#fff"}
        />
      </View>
    </SafeAreaView>
  );
};

export default NotificationsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    marginRight: 12,
  },
  heading: {
    fontSize: 20,
    fontWeight: "600",
    color: "#090040",
  },
  setting: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 22,
    paddingHorizontal: 20,
    borderBottomColor: "#f0f0f0",
    borderBottomWidth: 1,
  },
  label: {
    fontSize: 16,
    color: "#333",
  },
});
