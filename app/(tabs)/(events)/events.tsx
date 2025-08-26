import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { GestureHandlerRootView, ScrollView } from "react-native-gesture-handler";
import { API_BASE_URL } from "@/utils/constants";
import EventCard from "@/components/EventsCard";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import { PRIMARY_COLOR } from "@/constants/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

type EventState = "Todo" | "InProgress" | "Completed" | "TodayRecurring";
type EventTypeTab = "Progressive" | "Recursive";

type EventItem = {
  event_id: string;
  title: string;
  description: string;
  state: EventState;
  team_id?: string | null;
  creator: { name: string };
  location: string;
  isAdmin: boolean;
  created_at: string;
  is_recurring: boolean;
  frequency?: string;
  until?: string;
  by_day?: string[];
  branch: {
    branch_name: string;
    team: {
      team_name: string;
    };
  } | null;
  sender: {
    name: string;
  };
};

// ✅ Utility: Ensures event object matches EventItem type
const formatEvent = (event: any): EventItem => ({
  ...event,
  team_id: event.team_id || null,
  creator: {
    name: event.creator?.name || "Unknown",
  },
  branch: event.branch || null,
  sender: {
    name: event.sender?.name || "Unknown",
  },
});


export default function HomeScreen() {
  const [search, setSearch] = useState("");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<EventState>("Todo");
  const [eventTypeTab, setEventTypeTab] = useState<EventTypeTab>("Progressive");
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);

      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        console.warn("User token missing");
        setLoading(false);
        return;
      }

      // Promise to get fresh data
      const fetchFresh = async () => {
        const res = await fetch(`${API_BASE_URL}/events`, {
          headers: { Authorization: `${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch events");
        const data = await res.json();        
        const formatted = data.map((event: any) => formatEvent(event));
        
                
        // Save cache for next time
        await AsyncStorage.setItem("cachedEvents", JSON.stringify(formatted));
        return formatted;
      };

      // Promise to get cached data
      const loadCached = async () => {
        try {
          const cached = await AsyncStorage.getItem("cachedEvents");
          if (cached) {
            return JSON.parse(cached).map((e: any) => formatEvent(e));
          }
        } catch (err) {
          console.warn("Error loading cached events:", err);
        }
        return [];
      };

      try {
        // Race fresh fetch against a 3s timer
        const freshData = await Promise.race([
          fetchFresh(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
        ]);

        if (freshData) {
          // Fresh data arrived in <3s
          setEvents(freshData);
        } else {
          // Fresh data is slow → show cache now
          const cachedData = await loadCached();
          setEvents(cachedData);

          // Now wait for fresh data and update when it arrives
          fetchFresh()
            .then((fresh) => setEvents(fresh))
            .catch((err) => console.warn("Fresh fetch failed:", err));
        }
      } catch (err) {
        console.warn("Error fetching events:", err);
        const cachedData = await loadCached();
        setEvents(cachedData);
      }

      setLoading(false);
    };

    fetchEvents();
  }, [tab]);

  const toBackendState = (state: EventState): string => {
    switch (state) {
      case "InProgress":
        return "InProgress";
      case "Completed":
        return "Completed";filtered
      default:
        return state;
    }
  };
  
  const getEventCountLabel = (state: EventState) => {
    const count = events.filter((e) => e.state === state).length;
    if (count === 0) return ""; // show nothing
    if (count > 99) return " (99+)";
    return ` (${count})`;
  };


  const updateEventState = async (eventId: string, newState: EventState) => {
    const token = await SecureStore.getItemAsync("userToken");
    const res = await fetch(`${API_BASE_URL}/events/${eventId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${token}`,
      },
      body: JSON.stringify({ state: toBackendState(newState) }),
    });

    if (!res.ok) {
      throw new Error("Failed to update event state");
    }

    const updated = await res.json();
    return updated;
  };


  const handleSwipeLeft = async (event: EventItem) => {
    const nextState: EventState | null =
      event.state === "Todo"
        ? "InProgress"
        : event.state === "InProgress"
        ? "Completed"
        : event.state === "Completed"
        ? "Todo"
        : null;

    if (!nextState) return;

    try {
      const updated = await updateEventState(event.event_id, nextState);

      // Update local state
      const updatedEvents = events.map((e) =>
        e.event_id === event.event_id ? formatEvent(updated) : e
      );
      setEvents(updatedEvents);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleDelete = async (event: EventItem) => {
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2 : "No token found"});
        return;
      }

      const response = await fetch(`${API_BASE_URL}/events/${event.event_id}`, {
        method: "DELETE",
        headers: {
          Authorization: `${token}`, // Prefix with Bearer if your backend expects it
          "Content-Type": "application/json",
        },
      });      
      
      if (!response.ok) {
        const errorData = await response.json();
        Toast.show({
          type: "error",
          text1: "Error",
          text2 : `Failed to delete:, ${errorData}`
        });
        return;
      }

      Toast.show({
        type: "success",
        text1: "Sucess",
        text2: "Event Deleted Sucessfully!"});
      // Optionally, refresh the list or call a callback here
    } catch (err) {
      Toast.show(
        {
          type: "error",
          text1: "Error",
          text2: `Error deleting event:, ${err}`
        }
      )
    }
  };


  const handleSwipeRight = async (event: EventItem) => {
    const nextState: EventState | null =
      event.state === "Todo"
        ? "Completed"
        : event.state === "Completed"
        ? "InProgress"
        : event.state === "InProgress"
        ? "Todo"
        : null;

    if (!nextState) return;

    try {
      const updated = await updateEventState(event.event_id, nextState);

      // Update local state
      const updatedEvents = events.map((e) =>
        e.event_id === event.event_id ? formatEvent(updated) : e
      );
      setEvents(updatedEvents);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

    // ✅ Utility: check if event is expired by its "until" date
  const isExpired = (event: EventItem) => {
    if (!event.until) return false; // if no until, treat as active
    const untilDate = new Date(event.until);
    const today = new Date();
    return untilDate < today; // expired if until date is in the past
  };

  let filtered: EventItem[] = [];

  if (eventTypeTab === "Progressive") {
    filtered = events.filter((e) => {
      const title = e.title ?? "";
      const description = e.description ?? "";

      return (
        !isExpired(e) && // 🚫 skip past-until events
        (title.toLowerCase().includes(search.toLowerCase()) ||
          description.toLowerCase().includes(search.toLowerCase())) &&
        e.state === tab
      );
    });
  } else if (eventTypeTab === "Recursive") {
    filtered = events.filter(
      (e) => e.is_recurring === true && !isExpired(e) // 🚫 skip past-until events
    );
  }






  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Top-level tab: Progressive / Recursive */}
      <View style={styles.eventTypeRow}>
        {(["Progressive", "Recursive"] as EventTypeTab[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setEventTypeTab(t)}
            style={[
              styles.eventTypeButton,
              eventTypeTab === t && styles.eventTypeButtonActive,
            ]}
          >
            <Text
              style={[
                styles.eventTypeText,
                eventTypeTab === t && styles.eventTypeTextActive,
              ]}
            >
              {t}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        placeholder="Search events..."
        placeholderTextColor="#888"
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />

      {eventTypeTab === "Progressive" && (
        // ✅ State tabs only for Progressive
        <View style={styles.tabRow}>
          {(["Todo", "InProgress", "Completed"] as EventState[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={[
                styles.tabButton,
                tab === t && styles.tabButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  tab === t && styles.tabTextActive,
                ]}
              >
                {t === "InProgress" ? "In Progress" : t}
                {getEventCountLabel(t)}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={PRIMARY_COLOR} style={{ marginTop: 30 }} />
      ) : (
        <>
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            <View style={{ paddingHorizontal: 2, paddingBottom: 20 }}>
              {filtered.length === 0 ? (
                <Text style={styles.empty}>
                  {eventTypeTab === "Progressive"
                    ? `No events in ${tab === "InProgress" ? "In Progress" : tab} list.`
                    : "No recursive events"}
                </Text>
              ) : eventTypeTab === "Progressive" ? (
                // ✅ Progressive list (EventCards)
                filtered.map((event) => (
                  <View key={event.event_id} style={{ marginBottom: 1 }}>
                    <EventCard
                      swipeEnabled={event.isAdmin}
                      event={event}
                      simultaneousHandlers={scrollRef}
                      onComplete={handleSwipeLeft}
                      onDismiss={handleSwipeRight}
                      onDelete={handleDelete}
                    />
                  </View>
                ))
              ) : (
                // ✅ Recursive list (timeline)
                filtered
                  .sort(
                    (a, b) =>
                      new Date(a.created_at).getTime() -
                      new Date(b.created_at).getTime()
                  )
                  .map((event) => (
                    <Pressable onPress={() => router.push(`./${event.event_id}`)} key={event.event_id} style={styles.timelineItem}>
                      <View style={styles.timelineDot} />
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineTitle}>{event.title}</Text>
                        <Text style={styles.timelineDesc}>{event.description}</Text>
                        <Text style={styles.timelineDate}>
                          {new Date(event.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                    </Pressable>
                  ))
              )}
            </View>
          </ScrollView>

          <Pressable
            onPress={() => router.replace("./eventForm")}
            style={styles.fab}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </Pressable>
        </>
      )}
    </GestureHandlerRootView>
  );

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  search: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  tabRow: {
    marginTop : 20,
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#eee",
  },
  tabButtonActive: {
    backgroundColor: "#090040",
  },
  tabText: {
    color: "#333",
    fontWeight: "500",
  },
  tabTextActive: {
    color: "#fff",
  },
  fab: {
    position: "absolute",
    right: 10,
    bottom: 120,
    backgroundColor: "#090040",
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    color: "#fff",
    fontSize: 30,
    lineHeight: 34,
  },
  empty: {
    textAlign: "center",
    marginTop: 80,
    fontSize: 16,
    color: "#888",
    fontStyle: "italic",
    },
    timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: PRIMARY_COLOR,
    marginRight: 10,
    marginTop: 6,
  },
  timelineContent: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    elevation: 2,
  },
  timelineTitle: {
    fontWeight: "bold",
    fontSize: 16,
  },
  timelineDesc: {
    fontSize: 14,
    color: "#555",
    marginTop: 4,
  },
  timelineDate: {
    fontSize: 12,
    color: "#999",
    marginTop: 6,
  },
  eventTypeRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  eventTypeButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "#eee",
    marginHorizontal: 5,
  },
  eventTypeButtonActive: {
    backgroundColor: "#090040",
  },
  eventTypeText: {
    color: "#333",
    fontWeight: "500",
  },
  eventTypeTextActive: {
    color: "#fff",
  },

});

export { EventItem };
