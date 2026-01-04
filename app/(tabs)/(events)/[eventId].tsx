import { PRIMARY_COLOR } from "@/constants/constants";
import { BranchMember, TeamMember } from "@/types/model";
import { API_BASE_URL } from "@/utils/constants";
import { db } from "@/utils/db/schema";
import { DeleteEventNotification } from "@/utils/Notifications/EventNotifications";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

type User = {
  user_id: string;
  name: string;
  email: string;
};

type EventState = "Todo" | "InProgress" | "Completed";


type Team = {
  team_id: string;
  team_name: string;
  team_members : TeamMember | unknown | null;
};

type Branch = {
  branch_id: string;
  branch_name: string;
  branch_members : Branch| unknown | null, 
};

type EventMember = {
  user_id: string;
  user: User | null;
};

type Event = {
  event_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  category?: string;
  state: string;
  location?: string;
  created_by: string;
  creator: User | null;
  team?: Team | null;
  branch?: Branch | null;
  branch_id? : string | null; 
  team_id? : string | null;
  event_members: EventMember[] | null;
  is_recurring: boolean;
  frequency?: "Daily" | "Weekly" | "Monthly" | "Yearly";
  interval?: number;
  by_day?: string[];
  until?: string;
};

type FormattedEvent = Event & {
  branch: (Branch & { branch_members?: BranchMember[] }) | null;
  creator: User | null;
  event_members: (EventMember & { user?: User | null })[] | null;
  team: (Team & { team_members?: TeamMember[] }) | null;
};

export default function EventDetailScreen() {
  const { eventId } = useLocalSearchParams();
  const router = useRouter();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [trigger, setTrigger] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false)
  const [edit, setEdit] = useState(false)


  useEffect(() => {
    const fetchEventDetails = async () => {
      setLoading(true);
      try {
        const SQLitedata = await db.getFirstAsync<any>("SELECT * FROM events WHERE event_id = ?", [String(eventId)])
        const Foramted : any = {
          ...SQLitedata,
          branch : SQLitedata?.branch_id
            ? await db.getFirstAsync<Branch>("SELECT * FROM branches WHERE branch_id = ? ", [SQLitedata.branch_id])
            : null,
          creator : SQLitedata?.created_by
            ? await db.getFirstAsync<User>("SELECT * FROM users WHERE user_id = ?", [SQLitedata.created_by])
            : null,
          event_members : SQLitedata?.event_id 
            ? await db.getAllAsync<EventMember>("SELECT * FROM event_members WHERE event_id = ?", [SQLitedata.event_id])
            : null,
          team : SQLitedata?.team_id
            ? (await db.getFirstAsync<Team>("SELECT * FROM teams WHERE team_id = ?", [SQLitedata.team_id]))
            : null,
          by_day : SQLitedata.by_day !== "[]"
            ? SQLitedata.by_day.replace(/^\[|\]$/g, "").split(",").map((day : any) => day.trim())
            : [],
          is_recurring : Boolean(SQLitedata.is_recurring)
        }        

        if(Foramted?.event_members)
        {
          for(const e of Foramted.event_members){
            e.user = await db.getFirstAsync("SELECT * FROM users WHERE user_id = ?", [e.user_id])
          }
        }
        if(Foramted?.team){
          Foramted.team.team_members = await db.getAllAsync("SELECT * FROM team_members WHERE team_id = ?", [Foramted.team.team_id])
        }
        if(Foramted?.branch){
          Foramted.branch.branch_members = await db.getAllAsync("SELECT * FROM branch_members WHERE branch_id = ?", [Foramted.branch.branch_id])
        }        
        // console.log(Foramted);
        // const token = await SecureStore.getItemAsync("userToken");
        // const res = await fetch(`${API_BASE_URL}/events/${eventId}`, {
        //   headers: { Authorization: `${token}` },
        // });

        // if(!res.ok){
        //   Toast.show({type: 'error', text1 : "Error" , text2 : "Error Fetching data of this event"})
        // }

        const data = Foramted;                                
        setEvent(data);

        const userId = (await SecureStore.getItemAsync("userId"))?.trim();

        if(data.team && data.branch){
          // ✅ Safely check both team and branch
          const teamAdmin = data?.team?.team_members?.some(
            (member: any) => member.user_id === userId && member.role === "admin"
          );
    
          const branchAdmin = data?.branch?.branch_members?.some(
            (member: any) => member.user_id === userId && member.role === "admin"
          );
    
          const isAdmin = Boolean(teamAdmin || branchAdmin);
    
          setIsAdmin(isAdmin);
        }else{
          setIsAdmin(true)
        }
      } catch (err) {
        Alert.alert("Error fetching event details.");
      } finally {
        setLoading(false);
      }
    };

  fetchEventDetails();
}, [eventId, trigger]); // ✅ no Admin / isAdmin here



  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const sameDay =
      startDate.getDate() === endDate.getDate() &&
      startDate.getMonth() === endDate.getMonth();

    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
    };

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    };

    const formattedDate = startDate.toLocaleDateString("en-US", options);
    const startTime = startDate.toLocaleTimeString("en-US", timeOptions);
    const endTime = endDate.toLocaleTimeString("en-US", timeOptions);

    return sameDay
      ? `${formattedDate} • ${startTime} - ${endTime}`
      : `${startDate.toLocaleDateString("en-US", options)} ${startTime} - ${endDate.toLocaleDateString("en-US", options)} ${endTime}`;
  };


  const updateEventState = async (eventId: string, newState: EventState) => {
    try {
      setButtonLoading(true);
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) throw new Error("User token not found");

      const res = await fetch(`${API_BASE_URL}/events/${eventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify({ state: newState }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        Toast.show({
          type: "error",
          text1: "Error",
          text2: `${errorText}`,
        });
        throw new Error(`Failed to update event state (${res.status}): ${errorText}`);
      }

      db.runAsync("UPDATE events SET state = ? WHERE event_id  = ?", [newState, eventId])

      setTrigger((prev) => !prev);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: `Event State changed to ${newState}`,
      });

      return await res.json();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Some error occurred while changing state",
      });
      console.error("Error updating event state:", error);
      throw error;
    } finally {
      setButtonLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setButtonLoading(true);
      const token = await SecureStore.getItemAsync("userToken");
      const res = await fetch(`${API_BASE_URL}/events/${eventId}`, {
        method: "DELETE",
        headers: { Authorization: `${token}` },
      });
      if (res.ok) {
        Toast.show({
          type: "info",
          text1: "Event Deleted",
          text2: "Successfully Deleted Event!"
        });

        await db.runAsync("DELETE FROM events WHERE event_id = ?", [String(eventId)]);

        await DeleteEventNotification(String(eventId));

        router.back();
      } else {
        Alert.alert("Failed to delete event");
      }
    } catch {
      Alert.alert("Server error");
    } finally {
      setButtonLoading(false);
    }
  };


  if (loading || !event) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#090040" />
      </View>
    );
  }
  

  return (
    <View style={styles.container}>
      {/* Edit Button */}
      {isAdmin && 
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => setEdit(true)}
      >
        {/* <Ionicons name="create-outline" size={24} color="#000" /> */}
      </TouchableOpacity>
      }

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Event Details */}
        <View style={styles.eventCard}>
          <Pressable onPress={() => router.replace('../events')} style={{flexDirection: 'row', alignItems : 'center', gap: 10}}>
            <Ionicons size={22} name="arrow-back-outline" color={PRIMARY_COLOR}/>
            <Text style={styles.title}>{event.title}</Text>
          </Pressable>
          <View style={styles.divider} />

          {event.description && (
            <>
              <Text style={styles.label}>Description</Text>
              <Text style={styles.text}>{event.description}</Text>
              <View style={styles.divider} />
            </>
          )}

          <Text style={styles.label}>Schedule</Text>
          <Text style={styles.text}>{formatDateRange(event.start_time, event.end_time)}</Text>
          <View style={styles.divider} />

          {event.location && (
            <>
              <Text style={styles.label}>Location</Text>
              <Text style={styles.text}>{event.location}</Text>
              <View style={styles.divider} />
            </>
          )}

          <Text style={styles.label}>Created By</Text>
          <Text style={styles.text}>{event.creator?.name}</Text>
          <View style={styles.divider} />

          <Text style={styles.label}>Category</Text>
          <Text style={styles.text}>{event.category}</Text>
          <View style={styles.divider} />

          {event.is_recurring && (
            <>
              <Text style={styles.label}>Recurrence</Text>
              <Text style={styles.text}>
                {event.frequency} with an Interval of {event.interval}
              </Text>

              {event.until && (
                <Text style={styles.text}>
                  Until {new Date(event.until).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </Text>
              )}

              {event.frequency === "Weekly" && event.by_day && event.by_day.length > 0 && (
                <View style={styles.byDayContainer}>
                  {event.by_day.map((day, idx) => (
                    <View key={idx} style={styles.byDayChip}>
                      <Text style={styles.byDayText}>{day}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.divider} />
            </>
          )}

          {event.team && event.branch && (
            <>
              <Text style={styles.label}>Team | Branch</Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.link}>{event.team.team_name} | {event.branch.branch_name}</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
            </>
          )}

          {/* Expenses Button - Admin Only */}
          {isAdmin && (
            <>
              <TouchableOpacity
                style={styles.expenseButton}
                onPress={() => router.push(`./expenses?eventId=${event.event_id}`)}
              >
                <View style={styles.expenseButtonContent}>
                  <Ionicons name="receipt-outline" size={20} color={PRIMARY_COLOR} />
                  <Text style={styles.expenseButtonText}>View Expenses</Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={20} color="#666" />
              </TouchableOpacity>
              <View style={styles.divider} />
            </>
          )}

          {/* {
            <>
              <TouchableOpacity
                style={styles.expenseButton}
                
              >
                <View style={styles.expenseButtonContent}>
                  <Ionicons name="images-outline" size={20} color={PRIMARY_COLOR} />
                  <Text style={styles.expenseButtonText}>View Photos</Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={20} color="#666" />
              </TouchableOpacity>
              <View style={styles.divider} />
            </>
          } */}
        </View>

        {/* Event Members Section */}
        <Text style={styles.sectionTitle}>Event Members</Text>
        <View style={styles.membersContainer}>
          {event.event_members?.map((member, idx) => (
            <View key={idx} style={styles.memberCard}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {member.user?.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.memberName}>{member.user?.name}</Text>
            </View>
          ))}
        </View>

          <View style={styles.divider} />
        {/* Footer Buttons */}
        {isAdmin && 
        <View style={styles.footer}>
          {edit ? (
            <>
              <View style={{flexDirection: 'row', gap: 5}}>
                    <TouchableOpacity
                        style={styles.statusButton}
                        onPress={() => setEdit(false)}
                        disabled={buttonLoading}
                      >
                        {buttonLoading ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.buttonText}>
                            Save
                          </Text>
                        )}
                      </TouchableOpacity>

                    <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => setEdit(false)}>
                      {buttonLoading ? (
                        <ActivityIndicator color="#fff"/>
                      ): (<Text style={styles.buttonText}>
                        Cancle
                      </Text>)}
                    </TouchableOpacity>
                  </View>
            </>
          ) : (
            <>
              {
                !event.is_recurring &&
                  <View style={{flexDirection: 'row', gap: 5}}>
                    <TouchableOpacity
                        style={styles.statusButton}
                        onPress={() => {
                          event.state === "Todo"
                            ? updateEventState(event.event_id, "Completed")
                            : event.state === "Completed"
                            ? updateEventState(event.event_id, "InProgress")
                            : updateEventState(event.event_id, "Todo");
                        }}
                        disabled={buttonLoading}
                      >
                        {buttonLoading ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.buttonText}>
                            {event.state === "Todo"
                              ? "Completed"
                              : event.state === "Completed"
                              ? "InProgress"
                              : "Todo"}
                          </Text>
                        )}
                      </TouchableOpacity>

                    <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => {
                      event.state === "Todo"
                      ? updateEventState(event.event_id, "InProgress")
                      : event.state === "Inprogress"
                      ? updateEventState(event.event_id, "Completed")
                      : updateEventState(event.event_id, "Todo")
                    }}>
                      {buttonLoading ? (
                        <ActivityIndicator color="#fff"/>
                      ): (<Text style={styles.buttonText}>
                        {event.state == "Todo"
                        ? "In Progress"
                        : event.state == "InProgress"
                        ? "Completed"
                        : "Todo"}
                      </Text>)}
                    </TouchableOpacity>
                  </View>
              }
              
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
                disabled={buttonLoading}
              >
                {buttonLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Delete Event</Text>
                )}
              </TouchableOpacity>
            </>
          )
          
          }
        </View>
        
        }

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    paddingTop: 40,
    paddingHorizontal: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  editButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 50,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
  },
  eventCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    marginHorizontal: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    color: "#555",
    marginBottom: 2,
    fontWeight: "600",
  },
  text: {
    fontSize: 15,
    color: "#222",
    marginBottom: 12,
  },
  link: {
    fontSize: 15,
    color: "#1a1a1a",
    fontWeight: "600",
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginBottom: 16,
  },
  membersList: {
    marginBottom: 20,
  },
  memberText: {
    fontSize: 16,
    color: "#000",
  },
  footer: {
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 120,
  },
  statusButton: {
    flex: 1,
    backgroundColor: "#090040",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "#090040",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  sectionTitle: {
  fontSize: 20,
  fontWeight: "bold",
  marginVertical: 12,
  color: "#333",
},

membersContainer: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 12,
  marginBottom : 20
},

memberCard: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#fff",
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 16,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
  marginRight: 10,
  marginBottom: 10,
},

avatarCircle: {
  width: 16,
  height: 16,
  borderRadius: 16,
  backgroundColor: "#4e73df",
  justifyContent: "center",
  alignItems: "center",
  marginRight: 8,
},

avatarText: {
  color: "#fff",
  fontWeight: "bold",
  fontSize: 10,
},

memberName: {
  fontSize: 10,
  color: "#333",
},
byDayContainer: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 8,
  marginBottom: 12,
},

byDayChip: {
  backgroundColor: "#e0e7ff",
  paddingVertical: 6,
  paddingHorizontal: 12,
  borderRadius: 16,
  marginRight: 8,
  marginBottom: 8,
},

byDayText: {
  color: "#1e3a8a",
  fontWeight: "600",
  fontSize: 12,
},
expenseButton: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingVertical: 12,
  paddingHorizontal: 4,
},
expenseButtonContent: {
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
},
expenseButtonText: {
  fontSize: 16,
  fontWeight: "600",
  color: PRIMARY_COLOR,
},


});
