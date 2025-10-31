import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import {
  Ionicons,
  Feather,
  FontAwesome5,
  MaterialIcons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSettingsData, handleSignOut } from "@/hooks/useSettingsData";

const router = useRouter();

export default function SettingsScreen() {

  const {loading, userInfo} = useSettingsData();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#090040" style={{ marginTop: 40 }} />
      ) : (
        <>
          {/* Profile Section */}
          <View style={styles.profileCard}>
            <Text style={styles.profileName}>{userInfo.name}</Text>
            <Text style={styles.profileInfo}>{userInfo.email}</Text>
            <Text style={styles.profileInfo}>{userInfo.phone}</Text>
          </View>

          {/* Options Section */}
          <View style={styles.optionsBox}>
            <SettingsOption
              icon={<Feather name="lock" size={20} color="#090040" />}
              label="Privacy Policy"
              onPress={() => router.push("./privacy_policy")}
            />
            {/* <SettingsOption
              icon={<Ionicons name="notifications-outline" size={20} color="#090040" />}
              label="Notifications"
              onPress={() => router.push("./notifications")}
            /> */}
            <SettingsOption
              icon={<Feather name="user" size={20} color="#090040" />}
              label="Profile"
              onPress={() => router.push("./profile")}
            />
            <SettingsOption
              icon={<MaterialIcons name="info-outline" size={20} color="#090040" />}
              label="About Us"
              onPress={() => router.push("./about_us")}
            />
            {/* <SettingsOption
              icon={<Feather name="sun" size={20} color="#090040" />}
              label="Appearance"
              onPress={() => router.push("./appearance")}
            /> */}
            <SettingsOption
              icon={<MaterialCommunityIcons name="lifebuoy" size={20} color="#090040" />}
              label="Support"
              onPress={() => router.push("./support")}
            />
            <SettingsOption
              icon={<FontAwesome5 name="sign-out-alt" size={20} color="#090040" />}
              label="Sign Out"
              isLogout
              onPress={handleSignOut}
            />
          </View>
        </>
      )}
    </ScrollView>
  );
}

function SettingsOption({
  icon,
  label,
  isLogout = false,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  isLogout?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.option, isLogout && styles.logoutOption]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.optionRow}>
        {icon}
        <Text style={[styles.optionText, isLogout && styles.logoutText]}>{label}</Text>
      </View>
      <Feather name="chevron-right" size={20} color="#ccc" />
    </TouchableOpacity>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    paddingVertical: 40,
    paddingBottom: 110,
    paddingHorizontal: 24,
    backgroundColor: "rgba(247, 247, 247, 1)",
  },
  profileCard: {
    backgroundColor: "#090040",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 32,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "700",
    color: "rgba(247, 247, 247, 1)",
    marginBottom: 6,
  },
  profileInfo: {
    fontSize: 16,
    fontWeight: "200",
    color: "rgba(247, 247, 247, 1)",
  },
  optionsBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 8,
    gap: 4,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  optionText: {
    fontSize: 16,
    color: "#090040",
  },
  logoutOption: {
    backgroundColor: "#c5bfcfff",
  },
  logoutText: {
    color: "#090040",
    fontWeight: "600",
  },
});
