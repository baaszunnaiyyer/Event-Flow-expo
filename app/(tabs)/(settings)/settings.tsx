import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  Ionicons,
  Feather,
  FontAwesome5,
  MaterialIcons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "@/utils/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

const router = useRouter();

const handleSignOut = async () => {
  try {
    // Remove auth token
    await SecureStore.deleteItemAsync("userToken");
    await SecureStore.deleteItemAsync("userId")

    // Remove all cached data
    const cacheKeys = [
      "cachedEvents",
      "cachedEventRequests",
      "cachedTeamRequests",
      "cachedSettings",
    ];
    for (const key of cacheKeys) {
      await AsyncStorage.removeItem(key);
    }

    router.replace("../../(auth)");
    console.log("Token and cached data deleted successfully");
  } catch (error) {
    console.error("Error during logout:", error);
  }
};

export default function SettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({
    name: "Loading...",
    email: "Loading...",
    phone: "Loading...",
  });

  useEffect(() => {
    let isMounted = true;

    const loadCachedSettings = async () => {
      try {
        const cached = await AsyncStorage.getItem("cachedSettings");
        if (cached && isMounted) {
          setUserInfo(JSON.parse(cached));
          setLoading(false); // show cached instantly
        }
      } catch (err) {
        console.warn("Error loading cached settings:", err);
      }
    };

    const fetchFreshSettings = async () => {
      try {
        const token = await SecureStore.getItemAsync("userToken");
        if (!token) throw new Error("User token missing");

        const res = await fetch(`${API_BASE_URL}/settings`, {
          headers: {
            Authorization: `${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch settings");
        }

        const data = await res.json();
        const formatted = {
          name: data.name || "N/A",
          email: data.email || "N/A",
          phone: data.phone || "N/A",
        };

        if (!isMounted) return;
        setUserInfo(formatted);
        await AsyncStorage.setItem(
          "cachedSettings",
          JSON.stringify(formatted)
        );
      } catch (err: any) {
        Alert.alert("Error", err.message || "Failed to fetch user data");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    setLoading(true);
    loadCachedSettings(); // load instantly from cache if available
    fetchFreshSettings(); // refresh in background

    return () => {
      isMounted = false;
    };
  }, []);

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
              onPress={() => router.replace("./privacy_policy")}
            />
            <SettingsOption
              icon={<Ionicons name="notifications-outline" size={20} color="#090040" />}
              label="Notifications"
              onPress={() => router.replace("./notifications")}
            />
            <SettingsOption
              icon={<Feather name="user" size={20} color="#090040" />}
              label="Profile"
              onPress={() => router.replace("./profile")}
            />
            <SettingsOption
              icon={<MaterialIcons name="info-outline" size={20} color="#090040" />}
              label="About Us"
              onPress={() => router.replace("./about_us")}
            />
            <SettingsOption
              icon={<Feather name="sun" size={20} color="#090040" />}
              label="Appearance"
              onPress={() => router.replace("./appearance")}
            />
            <SettingsOption
              icon={<MaterialCommunityIcons name="lifebuoy" size={20} color="#090040" />}
              label="Support"
              onPress={() => router.replace("./support")}
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
