import { db } from "@/utils/db/schema";
import { upsertTable } from "@/utils/db/SyncDB";
import { Feather, Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { API_BASE_URL } from "../../../utils/constants";

interface ProfileForm {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  country: string;
  is_private: boolean;
  availability_day_of_week: string;
  availability_start_time: string;
  availability_end_time: string;
  updated_at: string;
  created_at: string;
  timezone: string;
  status: string;
}

export default function ProfileScreen() {
  const [form, setForm] = useState<ProfileForm>({
    user_id: "",
    name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    country: "",
    is_private: false,
    availability_day_of_week: "",
    availability_start_time: "",
    availability_end_time: "",
    updated_at: "",
    created_at: "",
    timezone: "",
    status: "",
  });

  const [showDOBPicker, setShowDOBPicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch and populate profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userId = await SecureStore.getItemAsync("userId");
        if (!userId) return;

        const localUser = await db.getFirstAsync<any>(
          `SELECT * FROM users WHERE user_id = ?`,
          [userId]
        );

        if (localUser) {
          setForm({
            ...localUser,
            is_private: !!localUser.is_private,
          });
        }
      } catch (error) {
        console.log("Error fetching profile:", error);
        Alert.alert("Error", "Unable to fetch profile data.");
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    setSaving(true);
    try {
      const token = await SecureStore.getItemAsync("userToken");
      const userId = await SecureStore.getItemAsync("userId");
      if (!token || !userId) throw new Error("Missing auth details");

      const payload = {
        ...form,
        date_of_birth: form.date_of_birth
          ? form.date_of_birth.includes("T")
            ? form.date_of_birth
            : new Date(form.date_of_birth + "T00:00:00.000Z").toISOString()
          : form.date_of_birth,
      };

      const res = await fetch(`${API_BASE_URL}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        await upsertTable(
          "users",
          ["user_id"],
          [form],
          [
            "user_id",
            "name",
            "email",
            "phone",
            "date_of_birth",
            "gender",
            "country",
            "is_private",
            "availability_day_of_week",
            "availability_start_time",
            "availability_end_time",
            "created_at",
            "status",
            "timezone",
            "updated_at",
          ]
        );
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Successfully updated Profile Info",
        });
        setIsEditing(false);
        router.back();
      } else {
        console.error("Failed to update:", data);
        Alert.alert("Error", `Failed to update profile: ${data.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error in update request:", error);
      Alert.alert("Error", "Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleDateChange = (event: any, date: Date | undefined, key: keyof ProfileForm) => {
    if (date) {
      if (key === "date_of_birth") {
        const dateAtMidnight = new Date(date);
        dateAtMidnight.setHours(0, 0, 0, 0);
        const formatted = dateAtMidnight.toISOString();
        handleChange(key, formatted);
      } else {
        const formatted = date.toISOString();
        handleChange(key, formatted);
      }
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not set";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return "Not set";
    try {
      return new Date(timeString).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid time";
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#090040" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={styles.editButton}
          disabled={saving}
        >
          <Text style={styles.editButtonText}>
            {saving ? "Saving..." : isEditing ? "Save" : "Edit"}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <Feather name="user" size={48} color="rgba(247, 247, 247, 1)" />
            </View>
            <Text style={styles.profileName}>{form.name || "Your Name"}</Text>
            <Text style={styles.profileEmail}>{form.email || "email@example.com"}</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                editable={isEditing}
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={form.name}
                onChangeText={(val) => handleChange("name", val)}
                placeholder="Enter your full name"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                editable={false}
                style={[styles.input, styles.inputDisabled]}
                value={form.email}
                placeholder="Email address"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                editable={isEditing}
                style={[styles.input, !isEditing && styles.inputDisabled]}
                keyboardType="phone-pad"
                value={form.phone}
                onChangeText={(val) => handleChange("phone", val)}
                placeholder="Enter phone number"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date of Birth</Text>
              <TouchableOpacity
                style={[styles.input, styles.dateInput, !isEditing && styles.inputDisabled]}
                onPress={() => isEditing && setShowDOBPicker(true)}
                disabled={!isEditing}
              >
                <Text style={[styles.dateText, !form.date_of_birth && styles.placeholderText]}>
                  {formatDate(form.date_of_birth)}
                </Text>
                {isEditing && <Feather name="calendar" size={20} color="#090040" />}
              </TouchableOpacity>
              {showDOBPicker && isEditing && (
                <DateTimePicker
                  mode="date"
                  display="default"
                  value={form.date_of_birth ? new Date(form.date_of_birth) : new Date("2000-01-01")}
                  maximumDate={new Date()}
                  onChange={(event, date) => {
                    setShowDOBPicker(false);
                    handleDateChange(event, date, "date_of_birth");
                  }}
                />
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender</Text>
              <TextInput
                editable={isEditing}
                style={[styles.input, !isEditing && styles.inputDisabled]}
                placeholder="Enter gender"
                placeholderTextColor="#999"
                value={form.gender}
                onChangeText={(val) => handleChange("gender", val)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Country</Text>
              <TextInput
                editable={isEditing}
                style={[styles.input, !isEditing && styles.inputDisabled]}
                placeholder="Enter country"
                placeholderTextColor="#999"
                value={form.country}
                onChangeText={(val) => handleChange("country", val)}
              />
            </View>

            <View style={styles.switchGroup}>
              <View style={styles.switchLabelContainer}>
                <Text style={styles.label}>Private Profile</Text>
                <Text style={styles.switchDescription}>
                  Enable to set availability hours
                </Text>
              </View>
              <Switch
                value={form.is_private}
                onValueChange={(val) => handleChange("is_private", val)}
                disabled={!isEditing}
                trackColor={{ false: "#E0E0E0", true: "#090040" }}
                thumbColor="#fff"
              />
            </View>

            {form.is_private && isEditing && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Availability Start Time</Text>
                  <TouchableOpacity
                    style={[styles.input, styles.dateInput]}
                    onPress={() => setShowStartTimePicker(true)}
                  >
                    <Text style={[styles.dateText, !form.availability_start_time && styles.placeholderText]}>
                      {formatTime(form.availability_start_time)}
                    </Text>
                    <Feather name="clock" size={20} color="#090040" />
                  </TouchableOpacity>
                  {showStartTimePicker && (
                    <DateTimePicker
                      mode="time"
                      value={
                        form.availability_start_time
                          ? new Date(form.availability_start_time)
                          : new Date()
                      }
                      onChange={(event, date) => {
                        setShowStartTimePicker(false);
                        handleDateChange(event, date, "availability_start_time");
                      }}
                    />
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Availability End Time</Text>
                  <TouchableOpacity
                    style={[styles.input, styles.dateInput]}
                    onPress={() => setShowEndTimePicker(true)}
                  >
                    <Text style={[styles.dateText, !form.availability_end_time && styles.placeholderText]}>
                      {formatTime(form.availability_end_time)}
                    </Text>
                    <Feather name="clock" size={20} color="#090040" />
                  </TouchableOpacity>
                  {showEndTimePicker && (
                    <DateTimePicker
                      mode="time"
                      value={
                        form.availability_end_time
                          ? new Date(form.availability_end_time)
                          : new Date()
                      }
                      onChange={(event, date) => {
                        setShowEndTimePicker(false);
                        handleDateChange(event, date, "availability_end_time");
                      }}
                    />
                  )}
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

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
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#090040",
  },
  scrollContent: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  profileCard: {
    backgroundColor: "#090040",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "700",
    color: "rgba(247, 247, 247, 1)",
    marginBottom: 8,
  },
  profileEmail: {
    fontSize: 16,
    fontWeight: "400",
    color: "rgba(247, 247, 247, 0.9)",
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#090040",
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "rgba(247, 247, 247, 1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "transparent",
  },
  inputDisabled: {
    backgroundColor: "#F5F5F5",
    color: "#666",
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateText: {
    fontSize: 16,
    color: "#333",
  },
  placeholderText: {
    color: "#999",
  },
  switchGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
    paddingVertical: 12,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  switchDescription: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
});
