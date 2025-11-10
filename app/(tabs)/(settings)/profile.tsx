import { db } from "@/utils/db/schema";
import { upsertTable } from "@/utils/db/SyncDB";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View, } from "react-native";
import Toast from "react-native-toast-message";
import { API_BASE_URL } from "../../../utils/constants";

interface ProfileForm {
  user_id: string
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
  updated_at: string,
  created_at: string,
  timezone: string,
  status: string,
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
    status: ""
  });

  const [showDOBPicker, setShowDOBPicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch and populate profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userId = await SecureStore.getItemAsync("userId");
        if (!userId) return;

        // 1️⃣ Try SQLite first
        const localUser = await db.getFirstAsync<any>(
          `SELECT * FROM users WHERE user_id = ?`,
          [userId]
        );
        // ✅ Initialize form with local values (if present)
        if (localUser) {
          setForm({
            ...localUser,
            is_private: !!localUser.is_private, // int → bool
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
    try {
      const token = await SecureStore.getItemAsync("userToken");
      const userId = await SecureStore.getItemAsync("userId");
      if (!token || !userId) throw new Error("Missing auth details");

      // 👇 Prepare the payload with properly formatted date_of_birth
      const payload = {
        ...form,
        // Ensure date_of_birth is in ISO datetime format
        date_of_birth: form.date_of_birth 
          ? (form.date_of_birth.includes('T') 
              ? form.date_of_birth 
              : new Date(form.date_of_birth + 'T00:00:00.000Z').toISOString())
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
      console.log("Response:", data);

      if (res.ok) {
        // ✅ Update SQLite after successful API update
        await upsertTable("users", ["user_id"], [form], 
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
            "updated_at"
          ]);
        Toast.show({type : 'success', text1 : 'Success', text2 : "Successfully updated Profile Info"})
        router.replace("./settings");
      } else {
        console.error("Failed to update:", data);
        Alert.alert("Error", `Failed to update profile: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error in update request:", error);
      Alert.alert("Error", "Something went wrong while saving.");
    }
  };

  const handleChange = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleDateChange = (event: any, date: Date | undefined, key: keyof ProfileForm) => {
    if (date) {
      if (key === "date_of_birth") {
        // 👇 Convert to ISO datetime string with time set to midnight UTC
        const dateAtMidnight = new Date(date);
        dateAtMidnight.setHours(0, 0, 0, 0);
        const formatted = dateAtMidnight.toISOString();
        handleChange(key, formatted);
      } else {
        // For time fields, use full ISO string
        const formatted = date.toISOString();
        handleChange(key, formatted);
      }
    }
  };
  

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <View style={styles.headerRow}>
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={() => router.replace("/settings")}>
              <Ionicons name="arrow-back" size={24} color="#090040" />
            </TouchableOpacity>
            <Text style={styles.heading}>Edit Profile</Text>
          </View>
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
            <Text style={styles.editText}>{isEditing ? "Cancel" : "Edit"}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Name</Text>
        <TextInput
          editable={isEditing}
          pointerEvents={isEditing ? "auto" : "none"}
          style={styles.input}
          value={form.name}
          onChangeText={(val) => handleChange("name", val)}
        />
        <Text style={styles.label}>Phone</Text>
        <TextInput
          editable={isEditing}
          pointerEvents={isEditing ? "auto" : "none"}
          style={styles.input}
          keyboardType="numeric"
          value={form.phone}
          onChangeText={(val) => handleChange("phone", val)}
        />

        <Text style={styles.label}>Date of Birth</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowDOBPicker(true)}
          disabled={!isEditing}
        >
          <Text>{form.date_of_birth || "No Date Of Birth Set | Select Date"}</Text>
        </TouchableOpacity>
        {showDOBPicker && (
          <DateTimePicker
            mode="date"
            display="default"
            value={form.date_of_birth ? new Date(form.date_of_birth) : new Date("2000-01-01")}
            onChange={(event, date) => {
              setShowDOBPicker(false);
              handleDateChange(event, date, "date_of_birth");
            }}
          />
        )}

        <Text style={styles.label}>Gender</Text>
        <TextInput
          editable={isEditing}
          pointerEvents={isEditing ? "auto" : "none"}
          style={styles.input}
          placeholder="Enter Gender"
          value={form.gender}
          onChangeText={(val) => handleChange("gender", val)}
        />

        <Text style={styles.label}>Country</Text>
        <TextInput
          editable={isEditing}
          pointerEvents={isEditing ? "auto" : "none"}
          style={styles.input}
          placeholder="Enter Country"
          value={form.country}
          onChangeText={(val) => handleChange("country", val)}
        />

        <View style={styles.switchRow}>
          <Text style={styles.label}>Private Profile</Text>
          <Switch
            value={form.is_private}
            onValueChange={(val) => {
              handleChange("is_private", val);
            }}
            trackColor={{ false: "#ccc", true: "#090040" }}
            thumbColor="#fff"
          />
        </View>

        {form.is_private && (
          <>
            <Text style={styles.label}>Start Time</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowStartTimePicker(true)}
            >
              <Text>
                {form.availability_start_time
                  ? new Date(form.availability_start_time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Select Time"}
              </Text>
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

            <Text style={styles.label}>End Time</Text>
            <TouchableOpacity
              style={isEditing ? styles.input : (styles.input, { marginBottom: 200 })}
              onPress={() => setShowEndTimePicker(true)}
            >
              <Text>
                {form.availability_end_time
                  ? new Date(form.availability_end_time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Select Time"}
              </Text>
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
          </>
        )}

        {isEditing && (
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  heading: { fontSize: 22, fontWeight: "bold", marginBottom: 20, color: "#090040", paddingHorizontal: 16 },
  label: { fontSize: 14, marginBottom: 6, marginTop: 12, color: "#888", fontWeight: 700 },
  input: { backgroundColor: "#f3f3f3", borderRadius: 10, paddingHorizontal: 15, paddingVertical: 12, },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16, },
  saveButton: { marginTop: 30, backgroundColor: "#090040", paddingVertical: 14, borderRadius: 12, alignItems: "center", marginBottom: 200, },
  saveText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  headerRow: { borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, marginTop: 32 },
  editText: { fontSize: 16, color: "#090040", fontWeight: "600", },
  headerContainer: { flexDirection: "row", justifyContent: "flex-start" }
});
