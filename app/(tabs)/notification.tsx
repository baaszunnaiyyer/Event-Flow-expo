import React, { useCallback, useRef, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, TextInput, View, Text, ActivityIndicator } from 'react-native';
import {
  ScrollView,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import ListItem from '../../components/ListItems';
import { API_BASE_URL } from '@/utils/constants';
import TeamRequestItem from '@/components/TeamRequest';
import { useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store'
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Team{
  team_id : string,
  team_name : string,
  team_description : string,
  joined_at : string
}

interface Branch { 
  branch_id : string;
  team_id : string;
  parent_branch_id : string;
  branch_name: string;
  branch_description : string;
  team : Team
}


interface TeamRequest {
  request_id : string;
  request_type : string;
  status : string;
  added_at : string;
  index: number;
  branch : Branch | null;
  sender : Creator;
}


interface Creator {
  name : string,
  email : string,
  phone : string,
  date_of_birth : Date,
  gender : string,
  country : string
  is_private : boolean,
  availability_day_of_week : string
  availability_start_time : Date,
  availability_end_time : Date
}


interface TaskInterface {
  event_id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  category: string;
  state: string;
  location: string | null;
  created_by: string;
  team_id: string | null;
  branch_id: string | null;
  created_at: string;
  updated_at: string;
  index: number;
  creator : Creator
  is_recurring: boolean;
  frequency?: "Daily" | "Weekly" | "Monthly" | "Yearly";
  interval?: number;
  by_day?: string[];
  until?: string | null;
}

const BACKGROUND_COLOR = '#FAFBFF';

function Requestes() {
  const [activeTab, setActiveTab] = useState<'event' | 'team'>('event');
  const [eventTasks, setEventTasks] = useState<TaskInterface[]>([]);
 const [teamRequests, setTeamRequests] = useState<TeamRequest[]>([]);
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  const scrollRef = useRef(null);


  const gettingData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');

      const [eventResponse, teamResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/requestes/events`, {
          method: "GET",
          headers: {
            Authorization: `${token}`,
          },
        }),
        fetch(`${API_BASE_URL}/requestes/people`, {
          method: "GET",
          headers: {
            Authorization: `${token}`,
          },
        }),
      ]);

      if (!eventResponse.ok || !teamResponse.ok) {
        console.error("Failed to fetch one or both requests:", {
          eventStatus: eventResponse.status,
          teamStatus: teamResponse.status,
        });
        return;
      }

      const eventDataRaw = await eventResponse.json();
      const teamDataRaw = await teamResponse.json();

      const eventData: TaskInterface[] = eventDataRaw.map((item: any, index: number) => ({
        ...item,
        index,
      }));

      const teamData: TeamRequest[] = teamDataRaw.map((item: any, index: number) => ({
        ...item,
        index,
      }));

      setEventTasks(eventData);
      setTeamRequests(teamData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadCachedData = async () => {
        try {
          const key =
            activeTab === "event"
              ? "cachedEventRequests"
              : "cachedTeamRequests";

          const cached = await AsyncStorage.getItem(key);
          if (cached && isMounted) {
            if (activeTab === "event") {
              setEventTasks(JSON.parse(cached));
            } else {
              setTeamRequests(JSON.parse(cached));
            }
            setLoading(false); // stop loader once we show cached
          }
        } catch (err) {
          console.warn("Error loading cached requests:", err);
        }
      };

      const fetchFreshData = async () => {
        try {
          const token = await SecureStore.getItemAsync("userToken");
          if (!token) throw new Error("User token missing");

          const endpoint =
            activeTab === "event"
              ? `${API_BASE_URL}/requestes/events`
              : `${API_BASE_URL}/requestes/people`;

          const res = await fetch(endpoint, {
            headers: { Authorization: `${token}` },
          });

          if (!res.ok) throw new Error(`Failed to fetch ${activeTab} requests`);

          const raw = await res.json();
          const formatted = raw.map((item: any, index: number) => ({
            ...item,
            index,
          }));

          if (!isMounted) return;
          if (activeTab === "event") {
            setEventTasks(formatted);
            await AsyncStorage.setItem(
              "cachedEventRequests",
              JSON.stringify(formatted)
            );
          } else {
            setTeamRequests(formatted);
            await AsyncStorage.setItem(
              "cachedTeamRequests",
              JSON.stringify(formatted)
            );
          }
        } catch (err) {
          console.warn("Fetch failed, keeping cached data:", err);
        } finally {
          if (isMounted) setLoading(false);
        }
      };

      setLoading(true);
      loadCachedData(); // show cached first if exists
      fetchFreshData(); // always refresh in background

      return () => {
        isMounted = false;
      };
    }, [activeTab])
  );


  const handelEventResponse = async (response : 'accepted' | 'rejected', event : TaskInterface) =>{
    try {
      const token  = await SecureStore.getItemAsync("userToken")
      const res = await fetch(`${API_BASE_URL}/requestes/events/${event.event_id}`, {
        method : "PUT",
        headers : {
          Authorization : `${token}`,
          "Content-Type": "application/json"
        },
        body : JSON.stringify({response : `${response}`})
      })      
  
      if(res.ok){
        console.log(`This ${event.title} is ${response}`);
      }else{
        console.log("failed to responed to this event");
      }
    } catch (error) {
      console.log(error);
    }
  }

  const handelTeamRequestResponse = async (response : 'accepted' | 'rejected', request : TeamRequest) => {
    try {
      const token = await SecureStore.getItemAsync("userToken");
      const res = await fetch(`${API_BASE_URL}/requestes/people/${request.request_id}`,{
        method: `PUT`,
        headers : {
          Authorization : `${token}`,
          "Content-Type": "application/json"
        },
        body : JSON.stringify({response : `${response}` })
      })

      if(res.ok){
        console.log(`Rejected Request from ${request.sender.name}`);
      }else{
        console.log(`Failed To Respond `);
      }
    } catch (error) {

      console.log(error);
    }
  }

  const isEventTab = activeTab === 'event';
  const filteredEventTasks = eventTasks.filter((task) =>
    task.title.toLowerCase().includes(search.toLowerCase()) ||
    task.description.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTeamRequests = teamRequests.filter((request) =>
    request.branch !== null ? (
    request.branch.branch_name.toLowerCase().includes(search.toLowerCase()) ||
    request.sender.name.toLowerCase().includes(search.toLowerCase()) ||
    request.sender.phone.includes(search.toLowerCase())
    ) : (
      request.sender.name.toLowerCase().includes(search.toLowerCase()) ||
      request.sender.email.toLowerCase().includes(search.toLowerCase()) ||
      request.sender.phone.includes(search.toLowerCase())
    )
  );


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tab, isEventTab && styles.activeTab]}
          onPress={() => setActiveTab('event')}
        >
          <Text style={[styles.tabText, isEventTab && styles.activeTabText]}>
            Event Requests
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, !isEventTab && styles.activeTab]}
          onPress={() => setActiveTab('team')}
        >
          <Text style={[styles.tabText, !isEventTab && styles.activeTabText]}>
            Team Requests
          </Text>
        </Pressable>
      </View>

      <View style={styles.header}>
        <TextInput
          placeholder="Search requests..."
          placeholderTextColor="#888"
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <Text style={styles.sectionTitle}>Requests</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#090040" />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          ref={scrollRef}
          style={{ flex: 1 , marginBottom: 100}}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
        >
          {isEventTab ? (
            filteredEventTasks.length > 0 ? (
              filteredEventTasks.map((task, index) => (
                <ListItem
                  key={`${index}`}
                  task={task}
                  onDismiss={() => handelEventResponse('rejected', task)}
                  onComplete={() => handelEventResponse('accepted', task)}
                />
              ))
            ) : (
              <Text style={{ textAlign: "center", marginTop: 20, fontSize : 15, color : "#666" }}>No Requests Found</Text>
            )
          ) : (
            filteredTeamRequests.length > 0 ? (
              filteredTeamRequests.map((request, index) => (
                <TeamRequestItem
                  key={`${index}`}
                  request={request}
                  onDismiss={() => handelTeamRequestResponse("rejected", request)}
                  onComplete={() => handelTeamRequestResponse("accepted", request)}
                />
              ))
            ) : (
              <Text style={{ textAlign: "center", marginTop: 20, fontSize : 15, color : "#666" }}>No Requests Found</Text>
            )
          )}
        </ScrollView>
      )}

    </SafeAreaView>
  );
}

export default () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Requestes />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
    padding: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    marginTop: 10,
    color: "#090040",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  filterButton: {
    marginLeft: 10,
    backgroundColor: "#090040",
    padding: 10,
    borderRadius: 10,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    elevation: 2,
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
});

export { TaskInterface, TeamRequest };
