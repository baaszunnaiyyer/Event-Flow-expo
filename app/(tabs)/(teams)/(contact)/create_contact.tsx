import { Text, TextInput } from "@/components/AppTypography";
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { API_BASE_URL } from "@/utils/constants";
import Toast from "react-native-toast-message";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import { FadeInEnter } from "@/components/FadeInEnter";

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
          Authorization : `Bearer ${token}`,
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
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <FadeInEnter delayMs={40} duration={400} style={styles.top}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.replace("../teams")} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#090040" />
            </Pressable>
            <Text style={styles.heading}>Add a New Contact</Text>
          </View>
        </FadeInEnter>

        <FadeInEnter delayMs={100} duration={400}>
          <TextInput
            placeholder="Enter Email Address"
            placeholderTextColor="#888"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </FadeInEnter>

        <FadeInEnter delayMs={160} duration={480} translateFrom={0} style={styles.infoSection}>
          <Text style={styles.infoLabel}>Privacy note</Text>
          <Text style={styles.infoText}>
          By adding a contact via email, you consent to sharing your availability, work schedule, and select metadata about private engagements. While private and collaborative events remain restricted, some availability indicators and non-sensitive metadata will be visible to the approved contact — enabling better collaboration and planning without compromising your personal scheduling privacy.
          </Text>
        </FadeInEnter>

        <FadeInEnter delayMs={200} duration={400} style={{ ...styles.lottieWrap, marginTop: 60 }}>
          <LottieView
            source={require("../../../../assets/images/Loading 40 _ Paperplane.json")}
            autoPlay
            loop
            style={styles.lottie}
          />
        </FadeInEnter>
      </ScrollView>

      <FadeInEnter delayMs={220} duration={400} translateFrom={20} style={styles.bottom}>
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
      </FadeInEnter>
    </KeyboardAvoidingView>
  );
};

export default CreateContactScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    paddingTop: 30,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 200,
  },
  top: {
    marginBottom: 8,
  },
  lottieWrap: {
    alignItems: "center",
    marginBottom: 8,
  },
  lottie: {
    width: 200,
    height: 140,
  },
  headerRow: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    color: "#222",
    flex: 1,
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
    marginTop: 16,
    backgroundColor: "#F3F3F7",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(9, 0, 64, 0.06)",
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#090040",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  infoText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 22,
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
  },
});
