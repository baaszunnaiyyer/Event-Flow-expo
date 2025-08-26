import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Pressable,
} from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "@/utils/constants";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import Toast from "react-native-toast-message";

// --- Types ---
type RootStackParamList = {
  ContactDetail: { contact: string };
  CreateEvent: { contactId: string };
};

type Contact = {
  name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  country?: string;
  availability_day_of_week?: string;
  availability_start_time?: string;
  availability_end_time?: string;
};

type RouteParams = RouteProp<RootStackParamList, "ContactDetail">;
type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ContactDetail"
>;

// --- Component ---
const ContactDetailScreen = () => {
  const route = useRoute<RouteParams>();
  const navigation = useNavigation<NavigationProp>();
  const { contact: userId } = route.params;

  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchContact = async () => {
      try {
        const token = await SecureStore.getItemAsync("userToken");
        const res = await fetch(`${API_BASE_URL}/contacts/${userId}`, {
          method: "GET",
          headers: {
            Authorization: `${token}`,
          },
        });
        if (!res.ok) throw new Error("Not found");
        const data: Contact = await res.json();
        setContact(data);
      } catch (err) {
        setError(
          "User is not in your contacts.\nPlease add them to view more information."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchContact();
  }, [userId]);

  const Delete = async () => {
    try{
        const token = await SecureStore.getItemAsync("userToken")
        const res = await fetch(`${API_BASE_URL}/contacts/${userId}`,
            {
                method : "DELETE",
                headers : {
                    Authorization : `${token}`
                }
            }
        )
        if(!res.ok) throw new Error("Error Deleting the Contact")
        router.back()

    }catch (err){
        Toast.show({
            type : "error",
            text1 : "Error",
            text2 : `Having issue Deleting Contact ${err}`
        })
    }
  }

  const handleDelete = () => {
    Alert.alert("Delete Contact", "Are you sure you want to delete this contact?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Delete();
        },
      },
    ]);
  };

  const renderInfoRow = (label: string, value?: string) => {
    if (!value) return null;
    return (
      <View style={styles.infoRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000080" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#090040" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.name}>{contact?.name || "Unnamed Contact"}</Text>
            <Pressable onPress={handleDelete}>
              <Ionicons name="trash-bin-outline" size={22} color="#090040" />
            </Pressable>
          </View>

          {renderInfoRow("Email", contact?.email)}
          {renderInfoRow("Phone", contact?.phone)}
          {renderInfoRow("Date of Birth", contact?.date_of_birth?.split("T")[0])}
          {renderInfoRow("Gender", contact?.gender)}
          {renderInfoRow("Country", contact?.country)}
          {renderInfoRow("Available On", contact?.availability_day_of_week)}
          {renderInfoRow("Start Time", contact?.availability_start_time)}
          {renderInfoRow("End Time", contact?.availability_end_time)}
        </View>
      </ScrollView>

      <Pressable
        style={styles.button}
        onPress={() => router.push(`./(event)/${contact?.email}`)}
      >
        <Text style={styles.buttonText}>Create Event</Text>
      </Pressable>
    </View>
  );
};

export default ContactDetailScreen;

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 100,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 16,
    color: "#D9534F",
    lineHeight: 24,
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  infoRow: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "500",
  },
  button: {
    position: "absolute",
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: "#090040",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
