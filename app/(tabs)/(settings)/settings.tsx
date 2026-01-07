import { handleSignOut, useSettingsData } from "@/hooks/useSettingsData";
import { API_BASE_URL } from "@/utils/constants";
import {
  Feather,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function SettingsScreen() {
  const router = useRouter();
  const {loading, userInfo} = useSettingsData();
  
  // Report User State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportEmail, setReportEmail] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  

  const handleReportUser = async () => {
    if (!reportEmail.trim()) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please enter the user's email address",
      });
      return;
    }

    if (!reportReason.trim()) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please provide a reason for reporting",
      });
      return;
    }

    try {
      setReportLoading(true);
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Authentication required",
        });
        return;
      }

      const res = await fetch(`${API_BASE_URL}/settings/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          email: reportEmail.trim(),
          reason: reportReason.trim(),
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to report user");
      }

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "User reported successfully",
      });

      setReportEmail("");
      setReportReason("");
      setShowReportModal(false);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to report user",
      });
    } finally {
      setReportLoading(false);
    }
  };


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
              icon={<MaterialIcons name="report-problem" size={20} color="#090040" />}
              label="Report User"
              onPress={() => setShowReportModal(true)}
              isbutton={true}
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

      {/* Report User Modal */}
      <Modal
        visible={showReportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report User</Text>
              <TouchableOpacity onPress={() => setShowReportModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>User Email</Text>
              <TextInput
                style={styles.input}
                placeholder="user@example.com"
                value={reportEmail}
                onChangeText={setReportEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#999"
              />

              <Text style={styles.inputLabel}>Reason for Reporting</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Please describe why you are reporting this user..."
                value={reportReason}
                onChangeText={setReportReason}
                multiline
                numberOfLines={4}
                placeholderTextColor="#999"
              />

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleReportUser}
                disabled={reportLoading}
              >
                {reportLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Report</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

function SettingsOption({
  icon,
  label,
  isLogout = false,
  isbutton = false,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  isLogout?: boolean;
  isbutton?: boolean;
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
      {isbutton !== true && <Feather name="chevron-right" size={20} color="#ccc" />}
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#1a1a1a",
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#090040",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
