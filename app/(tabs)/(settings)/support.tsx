import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const SupportScreen = () => {
  const openEmail = () => {
    Linking.openURL("mailto:baaszunnaiyyer@gmail.com?subject=Support Request");
  };

  const openPhone = () => {
    Linking.openURL("tel:+923493131433");
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#090040" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroCard}>
          <View style={styles.iconContainer}>
            <Feather name="life-buoy" size={48} color="rgba(247, 247, 247, 1)" />
          </View>
          <Text style={styles.heroTitle}>We're Here to Help</Text>
          <Text style={styles.heroSubtitle}>
            Need assistance? Reach out to us and we'll get back to you as soon as possible.
          </Text>
        </View>

        {/* Contact Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="mail" size={24} color="#090040" />
            <Text style={styles.cardTitle}>Email Support</Text>
          </View>
          <Text style={styles.cardDescription}>
            Send us an email and we'll respond within 24 hours.
          </Text>
          <TouchableOpacity style={styles.contactButton} onPress={openEmail}>
            <Text style={styles.contactButtonText}>baaszunnaiyyer@gmail.com</Text>
            <Feather name="external-link" size={20} color="rgba(247, 247, 247, 1)" />
          </TouchableOpacity>
        </View>

        {/* Phone Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="phone" size={24} color="#090040" />
            <Text style={styles.cardTitle}>Phone Support</Text>
          </View>
          <Text style={styles.cardDescription}>
            Call us during business hours for immediate assistance.
          </Text>
          <TouchableOpacity style={styles.contactButton} onPress={openPhone}>
            <Text style={styles.contactButtonText}>+92 349 3131433</Text>
            <Feather name="phone-call" size={20} color="rgba(247, 247, 247, 1)" />
          </TouchableOpacity>
        </View>

        {/* Help Topics Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="help-circle" size={24} color="#090040" />
            <Text style={styles.cardTitle}>Quick Help Topics</Text>
          </View>
          <Text style={styles.cardDescription}>
            Common questions and guides (Coming Soon)
          </Text>
          <View style={styles.topicList}>
            <View style={styles.topicItem}>
              <Feather name="chevron-right" size={16} color="#666" />
              <Text style={styles.topicText}>How to create an event using emails</Text>
            </View>
            <View style={styles.topicItem}>
              <Feather name="chevron-right" size={16} color="#666" />
              <Text style={styles.topicText}>Inviting an entire branch or team</Text>
            </View>
            <View style={styles.topicItem}>
              <Feather name="chevron-right" size={16} color="#666" />
              <Text style={styles.topicText}>Resolving scheduling conflicts</Text>
            </View>
            <View style={styles.topicItem}>
              <Feather name="chevron-right" size={16} color="#666" />
              <Text style={styles.topicText}>How to report an issue</Text>
            </View>
          </View>
        </View>

        {/* FAQ Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="message-square" size={24} color="#090040" />
            <Text style={styles.cardTitle}>Frequently Asked Questions</Text>
          </View>
          <Text style={styles.comingSoonText}>FAQ section coming soon...</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default SupportScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(247, 247, 247, 1)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#090040",
  },
  content: {
    padding: 24,
    paddingBottom: 100,
  },
  heroCard: {
    backgroundColor: "#090040",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "rgba(247, 247, 247, 1)",
    marginBottom: 12,
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 15,
    fontWeight: "400",
    color: "rgba(247, 247, 247, 0.9)",
    textAlign: "center",
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#090040",
  },
  cardDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 16,
  },
  contactButton: {
    backgroundColor: "#090040",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(247, 247, 247, 1)",
  },
  topicList: {
    gap: 12,
  },
  topicItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  topicText: {
    fontSize: 15,
    color: "#555",
    flex: 1,
  },
  comingSoonText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 16,
  },
});
