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
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { API_BASE_URL } from "@/utils/constants";
import Toast from "react-native-toast-message";
import * as SecureStore  from "expo-secure-store"
import { router, useLocalSearchParams } from "expo-router";

const CreateTeamScreen = () => {
  const { team_name, branch_name, team_id, branch_id } = useLocalSearchParams();

  const [activityLoading, setActivityLoading] = useState<boolean>(false)

  const [branchName, setBranchName] = useState("");
  const [branchDescription, setBranchDescription] = useState("");
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

  const handleSubmit = async () => {
    if (!branchName || !branchDescription || members.length === 0) {
      Toast.show({
        type : "success",
        text1 : "Success",
        text2 : "Please fill all fields and add at least one member."});
      return;
    }

    const payload = {
      name: branchName,
      description: branchDescription,
      members,
    };

    try {
      setActivityLoading(true)
      const token = await SecureStore.getItemAsync("userToken")
      console.log(token);
      
      const response = await fetch(`${API_BASE_URL}/teams/${team_id}/${branch_id}`, {
        method: "POST",
        headers: { 
            Authorization : `${token}`,
            "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Failed to create team");

      router.back()
      Toast.show({
        type : "success",
        text1 : "Success",
        text2 : "Success, Team created successfully!" });
      setBranchName("");
      setBranchDescription("");
      setMembers([]);
    } catch (error: any) {
      Toast.show({
        type : "error",
        text1 : "Error",
        text2 : `Error, ${error.message} || Something went wrong.`});
    }finally{
      setActivityLoading(false)
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={styles.heading}>Creating a Branch</Text>
        <Text style={{color : "#777", fontSize: 14, marginBottom: 16, fontWeight: 600}}>Creating Children of : {branch_name} | {team_name}</Text>
        <TextInput
          placeholderTextColor="#999"
          style={styles.input}
          placeholder="Branch Name"
          value={branchName}
          onChangeText={setBranchName}
        />

        <TextInput
          placeholderTextColor="#999"
          style={[styles.input, { height: 100 }]}
          placeholder="Branch Description"
          value={branchDescription}
          onChangeText={setBranchDescription}
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

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={activityLoading}>
          {activityLoading ? (
            <ActivityIndicator color="#fff"/>
          ) : (
            <Text style={styles.buttonText}>Create Branch</Text>
          )}
        </TouchableOpacity>
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
});
