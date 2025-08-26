import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Pressable,
  SafeAreaView,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "@/utils/constants";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PRIMARY_COLOR } from "@/constants/constants";

// types.ts
interface Team {
  team_id: string;
  team_name: string;
  team_description: string;
  joined_at: string;
}

interface Contact {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  country: string;
}


function TeamsAndContacts() {
  const [activeTab, setActiveTab] = useState<"teams" | "contacts">("teams");
  const [teams, setTeams] = useState<Team[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          const token = await SecureStore.getItemAsync("userToken");

          const [teamsRes, contactsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/teams`, {
              headers: { Authorization: `${token}` },
            }),
            fetch(`${API_BASE_URL}/contacts`, {
              headers: { Authorization: `${token}` },
            }),
          ]);

          const teamsData = await teamsRes.json();
          const contactsData = await contactsRes.json();

          setTeams(teamsData || []);
          setContacts(contactsData || []);
        } catch (err) {
          console.error("Fetch error:", err);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, [activeTab])
  );

  const filteredTeams = teams.filter((team) =>
    team.team_name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderTeamCard = (team: Team) => (
    <Pressable key={team.team_id} android_ripple={{color: "#ffff"}} onPress={() => router.push(`./(team)/${team.team_id}`)}>
    <View style={styles.card}>
      <View style={[styles.iconCircle, { backgroundColor: "#090040" }]}>
        <Ionicons name="people" size={24} color="#fff" />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{limitWords(team.team_name, 5)}</Text>
        <Text style={styles.cardSub}>{limitWords(team.team_description, 6)}</Text>
      </View>
    </View>
    </Pressable>
  );

  const renderContactCard = (contact: Contact) => (
    <Pressable key={contact.user_id} onPress={() => router.push(`./(contact)/${contact.user_id}`)}>
    <View style={styles.card}>
      <View style={[styles.iconCircle, { backgroundColor: "#090040" }]}>
        <Ionicons name="person" size={24} color="#fff" />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{contact.name}</Text>
        <Text style={styles.cardMeta}>{contact.email}</Text>
      </View>
    </View>
    </Pressable>
  );

  const limitWords = (text: string, wordLimit: number) => {
    const words = text.split(' ');
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(' ') + '...';
  };

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tab, activeTab == 'teams' && styles.activeTab]}
          onPress={() => setActiveTab('teams')}
        >
          <Text style={[styles.tabText, activeTab == 'teams' && styles.activeTabText]}>
            Orginizations 
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab == 'contacts' && styles.activeTab]}
          onPress={() => setActiveTab('contacts')}
        >
          <Text style={[styles.tabText, activeTab == 'contacts' && styles.activeTabText]}>
            Individuals
          </Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder={`Search ${activeTab}...`}
        placeholderTextColor="#888"
        value={search}
        onChangeText={setSearch}
      />

      {loading ? (
        <ActivityIndicator size="large" color={PRIMARY_COLOR} style={{ marginTop: 30 }} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          {activeTab === "teams"
            ? filteredTeams.map(renderTeamCard)
            : filteredContacts.map(renderContactCard)}
          {activeTab === "teams" && filteredTeams.length === 0 && (
            <Text style={styles.noData}>No teams found.</Text>
          )}
          {activeTab === "contacts" && filteredContacts.length === 0 && (
            <Text style={styles.noData}>No contacts found.</Text>
          )}
        </ScrollView>
      )}
      <Pressable style={styles.fab} onPress={activeTab === "teams" ? () => router.push("./(team)/create_team") : () => router.push("./(contact)/create_contact")}>
        <Ionicons
          name="add"
          size={22}
          color="#fff"
          style={{ marginRight: 2 }}
        />
        <Ionicons
          name={activeTab === "teams" ? "people" : "person"}
          size={22}
          color="#fff"
        />
      </Pressable>

    </SafeAreaView>
  );
}

export default () => (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <TeamsAndContacts />
  </GestureHandlerRootView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 16,
    paddingTop: 50,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#e4e4e4',
    marginHorizontal: 5,
  },
  activeTab: {
    backgroundColor: '#090040',
  },
  tabText: {
    color: '#333',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
  },
  searchInput: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    elevation: 2,
    marginBottom: 16,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginHorizontal : 2,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  cardSub: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  cardMeta: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 4,
  },
  noData: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 15,
    marginTop: 20,
  },
  fab: {
    position: "absolute",
    bottom: 110,
    right: 20,
    backgroundColor: "#090040",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 999,
  },
});
