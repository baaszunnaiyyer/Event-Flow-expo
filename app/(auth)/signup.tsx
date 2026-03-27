import { SignUpAuthChoice } from "@/components/auth/SignUpAuthChoice";
import { SignUpEmailWizard } from "@/components/auth/SignUpEmailWizard";
import { Creator } from "@/types/model";
import { queueDB } from "@/utils/db/DatabaseQueue";
import { upsertTable } from "@/utils/db/SyncDB";
import { GoogleSignin, isErrorWithCode, statusCodes } from "@react-native-google-signin/google-signin";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import Toast from "react-native-toast-message";
import { API_BASE_URL } from "../../utils/constants";

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
  const [loading, setLoading] = useState(false);
  const [emailFlow, setEmailFlow] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        "556429365376-7s2h4hid83pfn2gv14ga627pjh9un5ai.apps.googleusercontent.com",
    });
  }, []);

  const signIn = async () => {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      await GoogleSignin.signOut();

      const signInResult = await GoogleSignin.signIn();
      if (!signInResult?.data?.idToken) {
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: signInResult.data?.idToken }),
      });

      const data = await response.json();

      if (response.status === 201 || response.status === 200) {
        if (!data.token || !data.user?.user_id) {
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "Invalid response from server.",
          });
          return;
        }
        await SecureStore.setItemAsync("userToken", data.token);
        await SecureStore.setItemAsync("userId", data.user.user_id);

        try {
          const res = await fetch(`${API_BASE_URL}/settings`, {
            headers: { Authorization: `Bearer ${data.token}` },
          });
          if (res.ok) {
            const settingsRes: Creator = await res.json();
            await queueDB(() =>
              upsertTable("users", ["user_id"], [settingsRes], [
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
                "timezone",
                "created_at",
                "updated_at",
                "status",
              ])
            );
          }
        } catch (e) {
          console.warn("Settings fetch on signup:", e);
        }

        router.replace("./loading");
        return;
      }

      Toast.show({
        type: "error",
        text1: "Error",
        text2: `Unexpected status: ${response.status}`,
      });
    } catch (error: unknown) {
      console.error("Google Sign-In Error Details:", error);

      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            Toast.show({
              type: "info",
              text1: "Sign-In",
              text2: "Sign-in already in progress",
            });
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            Toast.show({
              type: "error",
              text1: "Google Sign-In",
              text2: "Play Services not available or outdated",
            });
            break;
          default:
            Toast.show({
              type: "error",
              text1: "Google Sign-In Error",
              text2: error.message || "Something went wrong",
            });
        }
      } else {
        const msg = error instanceof Error ? error.message : "An unexpected error occurred";
        Toast.show({
          type: "error",
          text1: "Unknown Error",
          text2: msg,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkToken = async () => {
      const token = await SecureStore.getItemAsync("userToken");
      if (token) {
        router.replace("/(tabs)");
      }
    };
    checkToken();
  }, []);

  const handleLoginLink = () => {
    router.replace("../(auth)");
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.flex}>
        {!emailFlow ? (
          <SignUpAuthChoice
            loading={loading}
            onGoogle={signIn}
            onEmail={() => setEmailFlow(true)}
            onLogin={handleLoginLink}
          />
        ) : (
          <SignUpEmailWizard
            loading={loading}
            setLoading={setLoading}
            onBack={() => setEmailFlow(false)}
            onLogin={handleLoginLink}
            onGoogle={signIn}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "rgba(247, 247, 247, 1)" },
  flex: { flex: 1 },
});
