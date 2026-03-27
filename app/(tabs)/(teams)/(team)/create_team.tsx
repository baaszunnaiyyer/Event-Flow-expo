import { Text, TextInput } from "@/components/AppTypography";
import React, { useState } from "react";
import { View, Pressable, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Image } from "react-native";
import { API_BASE_URL } from "@/utils/constants";
import Toast from "react-native-toast-message";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { FadeInEnter } from "@/components/FadeInEnter";

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
          Authorization: `Bearer ${token}`,
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
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <FadeInEnter delayMs={30} duration={380} style={styles.headerRow}>
          <Pressable onPress={() => router.replace("../teams")} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#090040" />
          </Pressable>
          <Text style={styles.heading}>Create a Team</Text>
        </FadeInEnter>

        <FadeInEnter delayMs={95} duration={380}>
          <TextInput
            placeholderTextColor="#999"
            style={styles.input}
            placeholder="Team Name"
            value={teamName}
            onChangeText={setTeamName}
          />
        </FadeInEnter>

        <FadeInEnter delayMs={140} duration={380}>
          <TextInput
            placeholderTextColor="#999"
            style={[styles.input, styles.inputMultiline]}
            placeholder="Team Description"
            value={teamDescription}
            onChangeText={setTeamDescription}
            multiline
          />
        </FadeInEnter>

        <FadeInEnter delayMs={185} duration={380}>
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
        </FadeInEnter>

        <View style={styles.emailChipsContainer}>
          {members.map((email, index) => (
            <FadeInEnter
              key={email}
              delayMs={index * 40}
              duration={280}
              translateFrom={0}
            >
              <Pressable style={styles.chip} onPress={() => handleRemoveEmail(email)}>
                <Text style={styles.chipText}>{email} ✕</Text>
              </Pressable>
            </FadeInEnter>
          ))}
        </View>
        
        <FadeInEnter delayMs={55} duration={380} style={styles.lottieWrap}>
          <Image source={require("../../../../assets/images/BusinessAnalytics.gif")} style={{width: 200, height: 200, marginBottom: -24}} />
        </FadeInEnter>

        <FadeInEnter delayMs={230} duration={400} translateFrom={18}>
          <Pressable
            style={[styles.button, loading && styles.buttonLoading]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Team</Text>
            )}
          </Pressable>
        </FadeInEnter>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CreateTeamScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  inner: { padding: 20, paddingBottom: 32 },
  headerRow: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    marginBottom: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#090040",
    flex: 1,
  },
  lottieWrap: {
    alignItems: "center",
    marginBottom: 4,
  },
  lottie: {
    width: 200,
    height: 140,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
  },
  inputMultiline: {
    height: 100,
    textAlignVertical: "top",
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
  buttonLoading: {
    opacity: 0.75,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
});
