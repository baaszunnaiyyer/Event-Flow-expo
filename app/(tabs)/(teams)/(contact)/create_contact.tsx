import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { API_BASE_URL } from "@/utils/constants";
import Toast from "react-native-toast-message";
import * as SecureStore from "expo-secure-store"
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const CreateContactScreen = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateContact = async () => {
    if (!email.trim()) {
      Toast.show({
        type : "error",
        text1 : "Error",
        text2 : "Missing Field, Please enter a valid email."});
      return;
    }

    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("userToken")
      const response = await fetch(`${API_BASE_URL}/contacts`, {
        method: "POST",
        headers: {
          Authorization : `${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Something went wrong!");
      }

      router.back()
      Toast.show({
        type : "success",
        text1 : 'Success',
        text2 : "Contact request sent successfully!"});
      setEmail("");
    } catch (err: any) {
      Toast.show({
        type : "error",
        text1 : "Error",
        text2 : `Error, ${err.message}`});
    } finally {
      setLoading(false);
    }
  };

  const isValid = !!email.trim();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.top}>
          <View style={{flexDirection: 'row', gap : 5}}>
            <Pressable onPress={() => router.replace("../teams")} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#090040" />
            </Pressable>
            <Text style={styles.heading}>Add a New Contact</Text>
          </View>
          <TextInput
            placeholder="Enter Email Address"
            placeholderTextColor="#888"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            By initiating the addition of a contact through their email address,
            you are consenting to share visibility into your professional availability matrix, 
            work-life synchronization parameters, and select metadata regarding private engagements 
            and schedule configurations. Please be advised that although private and collaborative events 
            retain restricted access, certain personal availability indicators and non-sensitive metadata 
            will be visible to the approved contact. This level of transparency is designed to foster 
            streamlined collaboration, better contextual planning, and enhance mutual productivity 
            without infringing upon personal scheduling sanctity or sensitive interpersonal engagements.
          </Text>
        </View>
      </View>

      <View style={styles.bottom}>
        <Pressable
          style={[
            styles.button,
            (!isValid || loading) && styles.buttonDisabled,
          ]}
          onPress={handleCreateContact}
          disabled={!isValid || loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Sending..." : "Send Contact Request"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

export default CreateContactScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  content: {
    flex: 1,
  },
  top: {
    marginBottom: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    color: "#222",
    marginBottom: 12,
  },
  input: {
    height: 50,
    borderColor: "#CCC",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    backgroundColor: "#FFF",
    fontSize: 16,
  },
  infoSection: {
    flex: 1,
    marginTop: 20,
    backgroundColor: "#FAFAFA", // Same as container for consistency
    padding: 20,
  },
  infoText: {
    fontSize: 15,
    color: "#444",
    lineHeight: 24,
    textAlign: "justify",
  },
  bottom: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 120,
  },
  button: {
    backgroundColor: "#090040",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#A0A0A0",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 16,
},
});
