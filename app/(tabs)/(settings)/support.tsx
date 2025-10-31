import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const SupportScreen = () => {
  const openEmail = () => {
    Linking.openURL("mailto:support@youreventapp.com?subject=Support Request");
  };

  const openPhone = () => {
    Linking.openURL("tel:+1234567890");
  };

  return (
    <View style={styles.container}>
      {/* Modern Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("./settings")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#090040" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.description}>
          Need help with managing your events, inviting groups, or resolving a
          problem? Reach out to us or explore the topics below.
        </Text>

        {/* Contact Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Us</Text>
          <TouchableOpacity onPress={openEmail}>
            <Text style={styles.link}>📧 Email: baaszunnaiyyer</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={openPhone}>
            <Text style={styles.link}>📞 Phone: +92 349 3131433</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Help Topics */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Help (Comming Soon)</Text>
          <Text style={styles.bullet}>• How to create an event using emails</Text>
          <Text style={styles.bullet}>• Inviting an entire branch or team</Text>
          <Text style={styles.bullet}>• Resolving scheduling conflicts</Text>
          <Text style={styles.bullet}>• How to report an issue</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default SupportScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(247,247,247,1)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingTop: 64
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#090040",
  },
  content: {
    padding: 20,
    gap: 20,
  },
  heading: {
    fontSize: 26,
    fontWeight: "700",
    color: "#090040",
  },
  description: {
    fontSize: 16,
    color: "#333",
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
    gap: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    color: "#090040",
  },
  link: {
    fontSize: 16,
    color: "#060080ff",
    marginBottom: 6,
  },
  bullet: {
    fontSize: 15,
    color: "#444",
  },
});
