import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from "react-native";
import { API_BASE_URL } from "@/utils/constants";
import Toast from "react-native-toast-message";
import * as SecureStore  from "expo-secure-store"
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const CreateTeamScreen = () => {
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [members, setMembers] = useState<string[]>([]);

  const handleAddEmail = () => {
    const emails = emailInput
      .trim()
      .split(/[ ,\n]/)
      .filter((email) => email && !members.includes(email));

    setMembers([...members, ...emails]);
    setEmailInput("");
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setMembers(members.filter((email) => email !== emailToRemove));
  };


  // inside CreateTeamScreen component
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!teamName || !teamDescription || members.length === 0) {
      Toast.show({
        type: "error", // changed from success to error for validation
        text1: "Error",
        text2: "Please fill all fields and add at least one member."
      });
      return;
    }

    const payload = {
      team_name: teamName,
      team_description: teamDescription,
      members,
    };

    try {
      setLoading(true); // start loading
      const token = await SecureStore.getItemAsync("userToken");

      const response = await fetch(`${API_BASE_URL}/teams`, {
        method: "POST",
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Failed to create team");

      router.back();
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Team created successfully!"
      });

      setTeamName("");
      setTeamDescription("");
      setMembers([]);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Something went wrong."
      });
    } finally {
      setLoading(false); // stop loading in all cases
    }
  };


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.inner}>
        <View style={{flexDirection: "row", gap: 5}}>
          <Pressable onPress={() => router.replace("../teams")} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#090040" />
          </Pressable>
          <Text style={styles.heading}>Create a Team</Text>
        </View>
        <TextInput
          placeholderTextColor="#999"
          style={styles.input}
          placeholder="Team Name"
          value={teamName}
          onChangeText={setTeamName}
        />

        <TextInput
          placeholderTextColor="#999"
          style={[styles.input, { height: 100 }]}
          placeholder="Team Description"
          value={teamDescription}
          onChangeText={setTeamDescription}
          multiline
        />

        <View style={styles.emailInputContainer}>
          <TextInput
            placeholderTextColor="#999"
            style={styles.emailInput}
            placeholder="Add member emails (press space or enter)"
            value={emailInput}
            onChangeText={(text) => {
              setEmailInput(text);
              if (text.endsWith(" ") || text.endsWith("\n")) handleAddEmail();
            }}
            onSubmitEditing={handleAddEmail}
            blurOnSubmit={false}
          />
        </View>

        <View style={styles.emailChipsContainer}>
          {members.map((email) => (
            <Pressable
              key={email}
              style={styles.chip}
              onPress={() => handleRemoveEmail(email)}
            >
              <Text style={styles.chipText}>{email} ✕</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Team</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CreateTeamScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  inner: { padding: 20 },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#090040",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
  },
  emailInputContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 10,
  },
  emailInput: {
    padding: 12,
  },
  emailChipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  chip: {
    backgroundColor: "#090040",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    color: "#fff",
    fontSize: 13,
  },
  button: {
    backgroundColor: "#090040",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  backButton: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 16,
},
backText: {
  marginLeft: 6,
  fontSize: 16,
  color: "#090040",
  fontWeight: "600",
},

});
