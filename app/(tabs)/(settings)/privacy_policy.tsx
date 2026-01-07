import { handleSignOut, useSettingsData } from "@/hooks/useSettingsData";
import { API_BASE_URL } from "@/utils/constants";
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
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

const PrivacyPolicyScreen = () => {
  const { userInfo } = useSettingsData();
  
  // Delete Account State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmationName, setConfirmationName] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDeleteAccount = async () => {
    if (!confirmationName.trim()) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please enter your name to confirm",
      });
      return;
    }

    if (confirmationName.trim() !== userInfo.name) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Name does not match. Please enter your exact name.",
      });
      return;
    }

    try {
      setDeleteLoading(true);
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Authentication required",
        });
        return;
      }

      const res = await fetch(`${API_BASE_URL}/settings`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          confirmation_name: confirmationName.trim(),
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to delete account");
      }

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Account deleted successfully",
      });

      // Clear all data and logout
      await handleSignOut();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to delete account",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#090040" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Feather name="shield" size={32} color="#090040" />
          </View>
          <Text style={styles.title}>Data Collection</Text>
          <Text style={styles.paragraph}>
            Personal data collected includes name, email address, phone number, and any
            additional details provided when creating or joining events.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Feather name="users" size={32} color="#090040" />
          </View>
          <Text style={styles.title}>Event Data Storage</Text>
          <Text style={styles.paragraph}>
            When users create events using other people's emails or assign members to a
            group or branch, those details are stored and associated with the event.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Feather name="target" size={32} color="#090040" />
          </View>
          <Text style={styles.title}>Data Usage</Text>
          <Text style={styles.paragraph}>
            Data is used for event creation, user identification, group and branch
            organization, participant communication, and system improvement. It is not
            shared with third-party marketers.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Feather name="eye" size={32} color="#090040" />
          </View>
          <Text style={styles.title}>Data Visibility</Text>
          <Text style={styles.paragraph}>
            Event participants may see each other's names and emails. Group and branch
            members may also view relevant participant data for coordination.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Feather name="check-circle" size={32} color="#090040" />
          </View>
          <Text style={styles.title}>User Responsibility</Text>
          <Text style={styles.paragraph}>
            Users are responsible for ensuring they have consent when adding others to
            events or groups. Misuse of personal data violates our policy.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Feather name="settings" size={32} color="#090040" />
          </View>
          <Text style={styles.title}>Your Rights</Text>
          <Text style={styles.paragraph}>
            Users can request access, update, or deletion of their data. Requests can be
            submitted through the support section.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Feather name="lock" size={32} color="#090040" />
          </View>
          <Text style={styles.title}>Data Security</Text>
          <Text style={styles.paragraph}>
            Data is protected using standard encryption and access controls. Absolute
            security cannot be guaranteed.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Feather name="refresh-cw" size={32} color="#090040" />
          </View>
          <Text style={styles.title}>Policy Updates</Text>
          <Text style={styles.paragraph}>
            This policy may be updated. Continued use of the app indicates acceptance of
            any changes.
          </Text>
        </View>

        <View style={[styles.card, styles.contactCard]}>
          <View style={styles.iconContainerLight}>
            <Feather name="mail" size={32} color="rgba(247, 247, 247, 1)" />
          </View>
          <Text style={styles.titleLight}>Contact Us</Text>
          <Text style={styles.paragraphLight}>
            For questions or concerns, please contact us at:
          </Text>
          <Text style={styles.email}>baaszunnaiyyer@gmail.com</Text>
        </View>

        {/* Delete Account Section */}
        <View style={[styles.card, styles.deleteCard]}>
          <View style={styles.deleteIconContainer}>
            <MaterialIcons name="delete-outline" size={32} color="#e74c3c" />
          </View>
          <Text style={styles.deleteTitle}>Delete Account</Text>
          <Text style={styles.deleteParagraph}>
            If you wish to permanently delete your account and all associated data, you can do so below. This action cannot be undone.
          </Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => setShowDeleteModal(true)}
          >
            <Text style={styles.deleteButtonText}>Delete My Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Delete Account Modal */}
      <Modal
        visible={showDeleteModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setShowDeleteModal(false);
          setConfirmationName("");
        }}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContent}>
            <View style={styles.deleteModalIconContainer}>
              <Ionicons name="alert-circle" size={64} color="#e74c3c" />
            </View>
            <Text style={styles.deleteModalTitle}>Delete Account</Text>
            <Text style={styles.deleteModalMessage}>
              You understand that by going through this process all your data will be deleted permanently.
            </Text>
            <Text style={styles.deleteModalSubtext}>
              This action cannot be undone. Please enter your exact name to confirm:
            </Text>
            <Text style={styles.deleteModalNameHint}>
              {userInfo.name}
            </Text>
            
            <TextInput
              style={styles.deleteModalInput}
              placeholder="Enter your exact name"
              value={confirmationName}
              onChangeText={setConfirmationName}
              placeholderTextColor="#999"
              autoCapitalize="words"
            />

            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.deleteCancelButton}
                onPress={() => {
                  setShowDeleteModal(false);
                  setConfirmationName("");
                }}
                disabled={deleteLoading}
              >
                <Text style={styles.deleteCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteConfirmButton}
                onPress={handleDeleteAccount}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.deleteConfirmButtonText}>Delete Account</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default PrivacyPolicyScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(247, 247, 247, 1)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#090040",
  },
  content: {
    padding: 24,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(9, 0, 64, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#090040",
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    color: "#555",
    lineHeight: 24,
  },
  contactCard: {
    backgroundColor: "#090040",
  },
  iconContainerLight: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  titleLight: {
    fontSize: 20,
    fontWeight: "700",
    color: "rgba(247, 247, 247, 1)",
    marginBottom: 12,
  },
  paragraphLight: {
    fontSize: 15,
    color: "rgba(247, 247, 247, 0.9)",
    lineHeight: 24,
  },
  email: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(247, 247, 247, 1)",
    marginTop: 8,
    textDecorationLine: "underline",
  },
  deleteCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#fee",
  },
  deleteIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(231, 76, 60, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  deleteTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#e74c3c",
    marginBottom: 12,
  },
  deleteParagraph: {
    fontSize: 15,
    color: "#555",
    lineHeight: 24,
    marginBottom: 20,
  },
  deleteButton: {
    backgroundColor: "#e74c3c",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  deleteModalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  deleteModalIconContainer: {
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 12,
    textAlign: "center",
  },
  deleteModalMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 22,
  },
  deleteModalSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginBottom: 8,
  },
  deleteModalNameHint: {
    fontSize: 16,
    fontWeight: "700",
    color: "#090040",
    marginBottom: 16,
    textAlign: "center",
  },
  deleteModalInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#1a1a1a",
    width: "100%",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  deleteModalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  deleteCancelButton: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  deleteCancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteConfirmButton: {
    flex: 1,
    backgroundColor: "#e74c3c",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  deleteConfirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
