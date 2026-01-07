import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const AboutScreen = () => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#090040" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Us</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroCard}>
          <View style={styles.logoContainer}>
            <Feather name="zap" size={48} color="rgba(247, 247, 247, 1)" />
          </View>
          <Text style={styles.heroTitle}>Event Flow</Text>
          <Text style={styles.heroSubtitle}>Streamline Your Events</Text>
        </View>

        {/* Mission Card */}
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Feather name="target" size={32} color="#090040" />
          </View>
          <Text style={styles.cardTitle}>Our Mission</Text>
          <Text style={styles.cardText}>
            Welcome to our platform! We're committed to making event management more
            accessible and efficient for everyone.
          </Text>
        </View>

        {/* Vision Card */}
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Feather name="eye" size={32} color="#090040" />
          </View>
          <Text style={styles.cardTitle}>Our Vision</Text>
          <Text style={styles.cardText}>
            Our mission is to simplify your event planning by connecting you with teams,
            managing schedules, and organizing events — all in one secure and intuitive app.
          </Text>
        </View>

        {/* Team Card */}
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Feather name="users" size={32} color="#090040" />
          </View>
          <Text style={styles.cardTitle}>Built With Passion</Text>
          <Text style={styles.cardText}>
            Built by passionate developers and designers, we aim to improve your experience
            with innovative features tailored to your needs.
          </Text>
        </View>

        {/* Feedback Card */}
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Feather name="message-circle" size={32} color="#090040" />
          </View>
          <Text style={styles.cardTitle}>We Value Your Feedback</Text>
          <Text style={styles.cardText}>
            Got feedback or questions? Reach out to us anytime — we love hearing from our
            users and continuously improving based on your suggestions!
          </Text>
        </View>

        {/* Footer Info */}
        <View style={styles.footerCard}>
          <View style={styles.footerRow}>
            <Feather name="info" size={20} color="#090040" />
            <Text style={styles.footerText}>Version 1.0.0</Text>
          </View>
          <View style={styles.footerRow}>
            <Feather name="map-pin" size={20} color="#090040" />
            <Text style={styles.footerText}>Made with 💜 in Pakistan</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default AboutScreen;

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
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "rgba(247, 247, 247, 1)",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 18,
    fontWeight: "400",
    color: "rgba(247, 247, 247, 0.9)",
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
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(9, 0, 64, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#090040",
    marginBottom: 12,
  },
  cardText: {
    fontSize: 15,
    color: "#555",
    lineHeight: 24,
  },
  footerCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    marginTop: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: 12,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  footerText: {
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
  },
});
