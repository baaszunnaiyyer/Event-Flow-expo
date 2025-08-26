// app/settings/privacy-policy.tsx

import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const PrivacyPolicyScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("./settings")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.heading}>Privacy Policy</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.paragraph}>
          Personal data collected includes name, email address, phone number, and any
          additional details provided when creating or joining events.
        </Text>

        <Text style={styles.paragraph}>
          When users create events using other people's emails or assign members to a
          group or branch, those details are stored and associated with the event.
        </Text>

        <Text style={styles.paragraph}>
          Data is used for event creation, user identification, group and branch
          organization, participant communication, and system improvement. It is not
          shared with third-party marketers.
        </Text>

        <Text style={styles.paragraph}>
          Event participants may see each other's names and emails. Group and branch
          members may also view relevant participant data for coordination.
        </Text>

        <Text style={styles.paragraph}>
          Users are responsible for ensuring they have consent when adding others to
          events or groups. Misuse of personal data violates our policy.
        </Text>

        <Text style={styles.paragraph}>
          Users can request access, update, or deletion of their data. Requests can be
          submitted through the support section.
        </Text>

        <Text style={styles.paragraph}>
          Data is protected using standard encryption and access controls. Absolute
          security cannot be guaranteed.
        </Text>

        <Text style={styles.paragraph}>
          This policy may be updated. Continued use of the app indicates acceptance of
          any changes.
        </Text>

        <Text style={styles.paragraph}>
          For questions or concerns, contact:{" "}
          <Text style={styles.bold}>support@eventapp.com</Text>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PrivacyPolicyScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    marginRight: 12,
  },
  heading: {
    fontSize: 20,
    fontWeight: "600",
    color: "#090040",
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  paragraph: {
    fontSize: 15,
    color: "#555",
    lineHeight: 24,
    marginBottom: 16,
  },
  bold: {
    fontWeight: "600",
    color: "#333",
  },
});
