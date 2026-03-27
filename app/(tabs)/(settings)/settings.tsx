import { Text, TextInput } from "@/components/AppTypography";
import { BACKGROUND_COLOR, PRIMARY_COLOR } from "@/constants/constants";
import { handleSignOut, useSettingsData } from "@/hooks/useSettingsData";
import { API_BASE_URL } from "@/utils/constants";
import {
  Feather,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Image
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { FadeInEnter } from "@/components/FadeInEnter";

const settingsCardDelayMs = (index: number) => 70 + index * 70;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loading, userInfo } = useSettingsData();

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportEmail, setReportEmail] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [reportLoading, setReportLoading] = useState(false);

  const initials = useMemo(
    () => getInitials(userInfo?.name ?? ""),
    [userInfo?.name]
  );

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
          Authorization: `Bearer ${token}`,
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

  const bottomPad = Math.max(insets.bottom, 12) + 92;

  return (
    <ScrollView
      contentContainerStyle={[
        styles.screen,
        {
          paddingTop: Math.max(insets.top, 12) + 8,
          paddingBottom: bottomPad,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {loading ? (
        <ActivityIndicator size="large" color={PRIMARY_COLOR} style={styles.loader} />
      ) : (
        <>
          <FadeInEnter delayMs={settingsCardDelayMs(0)} duration={400} style={styles.profileSection}>
            <View style={styles.avatarOuter}>
              <View style={styles.avatarInner}>
                {/* <Text style={styles.avatarText}>{initials}</Text> */}
                <Image
                  source={require("../../../assets/images/Settings.gif")}
                  style={{width: "100%", height: "100%", position: "absolute", borderRadius: 34, alignItems: "center", justifyContent: "center", alignSelf: "center"}}
                  resizeMode="cover"
                />
              </View>
            </View>
            <View style={styles.profileTextBlock}>
              <Text style={styles.profileName} numberOfLines={2}>
                {userInfo.name}
              </Text>
              <View style={styles.metaRow}>
                <Ionicons name="mail-outline" size={14} color="#9CA3AF" />
                <Text style={styles.metaText} numberOfLines={1}>
                  {userInfo.email}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="call-outline" size={14} color="#9CA3AF" />
                <Text style={styles.metaText} numberOfLines={1}>
                  {userInfo.phone}
                </Text>
              </View>
            </View>
          </FadeInEnter>

          <FadeInEnter delayMs={settingsCardDelayMs(1)} duration={400}>
            <Text style={styles.sectionLabel}>Account & help</Text>
            <View style={styles.menuCard}>
              <SettingsOption
                icon={<Feather name="lock" size={18} color={PRIMARY_COLOR} />}
                label="Privacy Policy"
                onPress={() => router.push("./privacy_policy")}
                showDivider={false}
              />
              <SettingsOption
                icon={<Feather name="user" size={18} color={PRIMARY_COLOR} />}
                label="Profile"
                onPress={() => router.push("./profile")}
                showDivider
              />
              <SettingsOption
                icon={<MaterialIcons name="info-outline" size={20} color={PRIMARY_COLOR} />}
                label="About Us"
                onPress={() => router.push("./about_us")}
                showDivider
              />
              <SettingsOption
                icon={<MaterialCommunityIcons name="lifebuoy" size={20} color={PRIMARY_COLOR} />}
                label="Support"
                onPress={() => router.push("./support")}
                showDivider
              />
              <SettingsOption
                icon={<MaterialIcons name="report-problem" size={20} color={PRIMARY_COLOR} />}
                label="Report User"
                onPress={() => setShowReportModal(true)}
                hideChevron
                showDivider
              />
            </View>
          </FadeInEnter>

          <FadeInEnter delayMs={settingsCardDelayMs(2)} duration={400}>
            <TouchableOpacity
              style={styles.signOutCard}
              onPress={handleSignOut}
              activeOpacity={0.75}
            >
              <View style={styles.iconWellMuted}>
                <FontAwesome5 name="sign-out-alt" size={16} color="#B91C1C" />
              </View>
              <Text style={styles.signOutLabel}>Sign out</Text>
              <Feather name="chevron-right" size={18} color="#D1D5DB" />
            </TouchableOpacity>
          </FadeInEnter>
        </>
      )}

      <Modal
        visible={showReportModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report User</Text>
              <TouchableOpacity onPress={() => setShowReportModal(false)} hitSlop={12}>
                <Ionicons name="close" size={24} color="#374151" />
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
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.inputLabel}>Reason for Reporting</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Please describe why you are reporting this user..."
                value={reportReason}
                onChangeText={setReportReason}
                multiline
                numberOfLines={4}
                placeholderTextColor="#9CA3AF"
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
  onPress,
  showDivider,
  hideChevron,
}: {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
  showDivider?: boolean;
  hideChevron?: boolean;
}) {
  return (
    <>
      {showDivider ? <View style={styles.menuDivider} /> : null}
      <TouchableOpacity
        style={styles.menuRow}
        onPress={onPress}
        activeOpacity={0.65}
      >
        <View style={styles.iconWell}>{icon}</View>
        <Text style={styles.menuLabel}>{label}</Text>
        {!hideChevron ? (
          <Feather name="chevron-right" size={18} color="#C4C4CC" />
        ) : (
          <View style={{ width: 18 }} />
        )}
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 20,
    backgroundColor: BACKGROUND_COLOR,
    flexGrow: 1,
  },
  loader: {
    marginTop: 48,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#ECECF0",
    ...Platform.select({
      ios: {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
      },
      android: { elevation: 3 },
    }),
  },
  avatarOuter: {
    padding: 3,
    borderRadius: 999,
    backgroundColor: `${PRIMARY_COLOR}18`,
  },
  avatarInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: BACKGROUND_COLOR,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 22,
    color: "#fff",
  },
  profileTextBlock: {
    flex: 1,
    marginLeft: 16,
    minWidth: 0,
  },
  profileName: {
    fontSize: 20,
    color: "#111827",
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  metaIcon: {
    color: "#9CA3AF",
  },
  metaText: {
    flex: 1,
    fontSize: 14,
    color: "#6B7280",
  },
  sectionLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 10,
    marginLeft: 4,
    letterSpacing: 0.3,
  },
  menuCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ECECF0",
    overflow: "hidden",
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
      },
      android: { elevation: 2 },
    }),
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#ECECF0",
    marginLeft: 64,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  iconWell: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },
  signOutCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    backgroundColor: "#FFFBFB",
  },
  iconWellMuted: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  signOutLabel: {
    flex: 1,
    fontSize: 16,
    color: "#B91C1C",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 18,
    color: "#111827",
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputLabel: {
    fontSize: 13,
    color: "#4B5563",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#111827",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  textArea: {
    height: 108,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});
