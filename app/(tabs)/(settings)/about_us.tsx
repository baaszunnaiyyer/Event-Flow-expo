import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { router } from "expo-router";

const AboutScreen = () => {
  const navigation = useNavigation();

  const handleBack = () => {
    router.replace("./settings");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#090040" />
        </Pressable>
        <Text style={styles.heading}>About Us</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.paragraph}>
          Welcome to our platform! We’re committed to making on-demand services more accessible and efficient.
        </Text>
        <Text style={styles.paragraph}>
          Our mission is to simplify your daily tasks by connecting you with skilled professionals — from electricians to event organizers — all in one secure app.
        </Text>
        <Text style={styles.paragraph}>
          Built by passionate developers and designers, we aim to improve your experience with innovative features tailored to your needs.
        </Text>
        <Text style={styles.paragraph}>
          Got feedback or questions? Reach out to us anytime — we love hearing from our users!
        </Text>
        <Text style={styles.footer}>Version 1.0.0 • Made with 💜 in Pakistan</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AboutScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    paddingTop: 4,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 8,
    marginRight: 8, 
  },
  heading: {
    fontSize: 20,
    fontWeight: "600",
    color: "#090040",
  },
  content: {
    padding: 20,
  },
  paragraph: {
    fontSize: 16,
    color: "#444",
    lineHeight: 24,
    marginBottom: 16,
  },
  footer: {
    marginTop: 24,
    textAlign: "center",
    color: "#999",
    fontSize: 14,
  },
});
