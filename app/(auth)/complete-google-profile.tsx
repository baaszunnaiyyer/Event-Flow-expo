import { GoogleProfileWizard } from "@/components/auth/GoogleProfileWizard";
import { handleSignOut } from "@/hooks/useSettingsData";
import { router } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";

export default function CompleteGoogleProfileScreen() {
  const [loading, setLoading] = useState(false);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.flex}>
        <GoogleProfileWizard
          loading={loading}
          setLoading={setLoading}
          onSignOut={handleSignOut}
          onComplete={() => router.replace("./loading")}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "rgba(247, 247, 247, 1)" },
  flex: { flex: 1 },
});
