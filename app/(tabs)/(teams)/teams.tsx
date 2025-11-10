import { PRIMARY_COLOR } from "@/constants/constants";
import { API_BASE_URL } from "@/utils/constants";
import { queueDB } from "@/utils/db/DatabaseQueue";
import { syncTable, upsertTable } from "@/utils/db/SyncDB";
import { db } from "@/utils/db/schema";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

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
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const hasFetched = useRef(false);

  const fetchFreshData = async () => {
      try {
        const myUserId = await SecureStore.getItemAsync("userId");
        const token = await SecureStore.getItemAsync("userToken");
        if (!token) {
          console.warn("User token missing");
          setLoading(false);
          return;
        }

        const [teamsRes, contactsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/teams`, {
            headers: { Authorization: `${token}` },
          }),
          fetch(`${API_BASE_URL}/contacts`, {
            headers: { Authorization: `${token}` },
          }),
        ]);

        if (!teamsRes.ok || !contactsRes.ok) {
          throw new Error("Network error fetching teams or contacts");
        }

        const [teamsData, contactsData] = await Promise.all([
          teamsRes.json(),
          contactsRes.json(),
        ]);

        console.log(teamsData);
        

        // STEP 3: Sync new data into SQLite
        await queueDB(() =>
          upsertTable("teams", ["team_id"], teamsData, [
            "team_id",
            "team_name",
            "team_description",
            "joined_at",
          ])
        );

        const contactDataFormatted = contactsData.map((contact: Contact) => ({
          user_id: myUserId,
          contact_user_id: contact.user_id,
        }));

        await queueDB(() =>
          syncTable("contacts", ["user_id", "contact_user_id"], contactDataFormatted, [
            "user_id",
            "contact_user_id",
          ])
        );

        await queueDB(() =>
          upsertTable("users", ["user_id"], contactsData, [
            "country",
            "date_of_birth",
            "email",
            "gender",
            "name",
            "phone",
            "user_id",
          ])
        );

        // STEP 4: Update state with fresh data

        setTeams(teamsData || []);
        setContacts(contactsData || []);
      } catch (err) {
        console.error("❌ Fresh data fetch error:", err);
      } finally {
        setLoading(false);
      }
  };

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      if (hasFetched.current) return; // 🚫 Prevent duplicate call
      hasFetched.current = true;

      const fetchLocalData = async (myUserId: string) => {
        try {
          // STEP 1: Load from local DB immediately
          const localTeams = await db.getAllAsync(
            `
            SELECT DISTINCT t.*
            FROM teams AS t
            LEFT JOIN branches AS b ON b.team_id = t.team_id
            LEFT JOIN join_requests AS jr ON jr.branch_id = b.branch_id AND jr.user_id = ?
            WHERE jr.request_id IS NULL OR jr.status = 'accepted'
            `,
            [myUserId]
          ) as Team[];

          const localContacts = await db.getAllAsync(
            `SELECT u.* 
            FROM users AS u 
            INNER JOIN contacts AS c 
            ON u.user_id = c.contact_user_id 
            WHERE c.user_id = ?`,
            [myUserId]
          ) as Contact[];

          if (isActive) {
            setContacts(localContacts || []);
            setTeams(localTeams || []);
            // If we have cached data, show it immediately
            if (localTeams.length > 0 || localContacts.length > 0) {
              setLoading(false);
            }
          }
        } catch (err) {
          console.error("❌ Local data load error:", err);
          if (isActive) {
            setContacts([]);
            setTeams([]);
          }
        }
      };

      const fetchData = async () => {
        try {
          setLoading(true);
          const myUserId = await SecureStore.getItemAsync("userId");
          if (!myUserId) {
            setLoading(false);
            throw new Error("User ID missing");
          }
          await fetchLocalData(myUserId); // Load from SQLite
        } catch (err) {
          console.error("❌ Fetch error:", err);
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      };

      fetchData();

      // Cleanup
      return () => {
        isActive = false;
        hasFetched.current = false;
      };
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFreshData(); // call the hook’s reload function
    setRefreshing(false);
  };

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
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
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
