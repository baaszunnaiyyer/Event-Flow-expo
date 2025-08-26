import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, Switch } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { router } from "expo-router";

const AppearanceScreen = () => {
  const navigation = useNavigation();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleSwitch = async () => {
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);
    await AsyncStorage.setItem("theme", newValue ? "dark" : "light");
  };

  const loadTheme = async () => {
    const storedTheme = await AsyncStorage.getItem("theme");
    if (storedTheme === "dark") setIsDarkMode(true);
    else setIsDarkMode(false);
  };

  useEffect(() => {
    loadTheme();
  }, []);

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <View style={styles.header}>
        <Pressable onPress={() => {router.replace("./settings")}} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#090040" />
        </Pressable>
        <Text style={[styles.headerText, isDarkMode && styles.darkText]}>Appearance</Text>
      </View>

      <View style={styles.settingRow}>
        <Text style={[styles.settingText, isDarkMode && styles.darkText]}>Dark Mode</Text>
        <Switch
        value={isDarkMode}
        onValueChange={()=>{setIsDarkMode(!isDarkMode)}}
        trackColor={{ false: "#ccc", true: "#090040" }}
        thumbColor={isDarkMode ? "#fff" : "#fff"}
        />
      </View>
    </SafeAreaView>
  );
};

export default AppearanceScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
  },
  darkContainer: {
    backgroundColor: "#111",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    marginRight: 8,
    padding: 8,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#090040",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 8,
  },
  settingText: {
    fontSize: 18,
    color: "#333",
  },
  darkText: {
    color: "#f1f1f1",
  },
});
