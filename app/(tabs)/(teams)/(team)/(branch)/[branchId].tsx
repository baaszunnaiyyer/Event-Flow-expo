import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import Toast from "react-native-toast-message";
import * as SecureStore from "expo-secure-store";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "@/utils/constants";
import { PRIMARY_COLOR, BACKGROUND_COLOR } from "@/constants/constants";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

interface User {
  name: string;
  email: string;
}

interface BranchMember {
  user_id: string;
  role: string;
  joined_at: string;
  user: User;
}

interface ChildBranch {
  branch_id: string;
  branch_name: string;
  branch_description: string;
}

interface Event {
    event_id : string;
    title : string;
    description : string;
    start_time : string;
    end_time : string;
    category : string;
    state : string;
    location : string;
}

interface BranchData {
  branch_id: string;
  branch_name: string;
  branch_description: string;
  parent_branch_id: string | null;
  created_at: string;
  updated_at: string;
  team: {
    team_name: string;
  };
  parent_branch?: {
    branch_name: string;
    branch_description: string;
  } | null;
  events: Event[];
  children: ChildBranch[];
  branch_members: BranchMember[];
}

const BranchDetails = () => {
  const { team_id, branch_id } = useLocalSearchParams<{
    team_id: string;
    branch_id: string;
  }>();
  const [addMember, setAddMember] = useState(false)
  const [mail , setMail] = useState<string>("")
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [branch, setBranch] = useState<BranchData | null>(null);
  const [branchName , setBranchName] = useState<string>()
  const [activityLoading ,setActivityLoading] = useState<boolean>(false)
  const [branchDescription , setBranchDescription] = useState<string>()
  const [isAdmin, setIsAdmin] = useState<boolean>(false);


  useFocusEffect(
    useCallback(() => {
      const fetchBranch = async () => {
        try {
          const token = await SecureStore.getItemAsync("userToken");
          const userId = await SecureStore.getItemAsync("userId")
          const res = await fetch(
            `${API_BASE_URL}/teams/${team_id}/${branch_id}`,
            {
              headers: {
                Authorization: `${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!res.ok) throw new Error("Failed to fetch branch");

          const data = await res.json();
          console.log((data.branch_members.some((m : any) => (m.user_id == userId && m.role == 'admin')) || data.team.team_members.some((m: any) => (m.user_id == userId && m.role == 'admin'))));
          
          setIsAdmin((data.branch_members.some((m : any) => (m.user_id == userId && m.role == 'admin')) || data.team.team_members.some((m: any) => (m.user_id == userId && m.role == 'admin'))))
          setBranch(data);
          setBranchName(data.branch_name);
          setBranchDescription(data.branch_description);
        } catch (err: any) {
          Toast.show({
            type: "error",
            text1: "Error",
            text2: err.message,
          });
        } finally {
          setLoading(false);
        }
      };

      fetchBranch();

      // Optional: cleanup if needed (e.g., cancel fetch)
      return () => {
        // cleanup logic here if necessary
      };
    }, [team_id, branch_id, isEditing]) // dependencies
  );

  const handleDelete = () => {
    Alert.alert("Delete Branch", "Are you sure you want to delete this branch?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setActivityLoading(true)
            const token = await SecureStore.getItemAsync("userToken");
            const res = await fetch(
              `${API_BASE_URL}/teams/${team_id}/${branch_id}`,
              {
                method: "DELETE",
                headers: { Authorization: `${token}` },
              }
            );

            if (!res.ok) throw new Error("Failed to delete");

            Toast.show({ type: "success", text1: "Branch deleted" });
            router.back();
          } catch (err: any) {
            Toast.show({
              type: "error",
              text1: "Delete Failed",
              text2: err.message,
            });
          }finally {
            setActivityLoading(false)
          }
        },
      },
    ]);
  };

  const handelEdit = () => {
    Toast.show({
        type : "info",
        text1 : "Editing Branch Info"
    })

    setIsEditing(true);
  }

  const handelSave = async () => {
    
    try {
        setActivityLoading(true)
        const token  = await SecureStore.getItemAsync("userToken");
        const res = await fetch(`${API_BASE_URL}/teams/${team_id}/${branch_id}`, {
            method : 'PUT',
            headers : {
                Authorization : `${token}`,
                "Content-Type": "application/json"
            },
            body : JSON.stringify({name : branchName, description : branchDescription})
        })
    
        if(!res.ok) throw new Error("Failed to Edit");
    
        Toast.show({ type: "success", text1: "Branch Eidited" });
    
        
    } catch (error) {
        Toast.show({
              type: "error",
              text1: "Edit Failed",
            });
    }finally{
        setActivityLoading(false)
        setIsEditing(false)
    }
  }

  const handelRequest = async () => {
    try {
      setActivityLoading(true)
      const token  = await SecureStore.getItemAsync("userToken");
      const res = await fetch(`${API_BASE_URL}/teams/${team_id}/${branch_id}/members`, {
        method : "POST",
        headers : {
          Authorization : `${token}`,
          "Content-Type": "application/json"
        },
        body : JSON.stringify({email : mail})
      })
      
      if(!res.ok) throw new Error("Failed to Send Team Requset");

      Toast.show({ type: "success", text1: "Success", text2 : "Request Send Successfully" });

      setAddMember(false)

    } catch (error : any) {
      Toast.show({
              type: "error",
              text1: "Edit Failed",
              text2: `${error.message}`
            });
    }finally{
      setActivityLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={PRIMARY_COLOR} size="large" />
      </View>
    );
  }

  if (!branch) {
    return (
      <View style={styles.centered}>
        <Text>Branch not found.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0} // Adjust for your header height
    >
    <ScrollView style={{ backgroundColor: BACKGROUND_COLOR }} contentContainerStyle={styles.container}>
      {/* Branch Info Card */}
      <View style={styles.card}>

        {!isEditing ? (<Text style={styles.title}>{branch.branch_name}</Text>) : (
            <>
            <Text style={styles.label}>Team</Text>
            <TextInput style={styles.input} value={branchName} onChangeText={setBranchName}/>
            </>
        )}


        <Text style={styles.label}>Description</Text>
        {!isEditing ?  (<Text style={styles.value}>{branch.branch_description}</Text>) : (
            <TextInput style={styles.input} value={branchDescription} onChangeText={setBranchDescription}/>
        )}

        <Text style={styles.label}>Team</Text>
        <Text style={styles.value}>{branch.team.team_name}</Text>
      </View>

      {/* Parent Branch Card */}
      {branch.parent_branch && (
        <View style={styles.card}>
          <Text style={styles.label}>Parent Branch</Text>
          <Text style={styles.value}>{branch.parent_branch.branch_name}</Text>
          <Text style={styles.subText}>{branch.parent_branch.branch_description}</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={[styles.label]}>Branch Events</Text>
        {
            branch.events.length == 0 ? (
                <View style={{alignItems: 'center'}}>
                    <Text style={[styles.label , {color: "#333", fontWeight: 800, marginTop: 32, marginBottom: 32}]}>No Events On this Branch</Text>
                </View>
            ) : (
                <View>
                    {branch.events.map( (eve, index) => (
                      
                        <TouchableOpacity onPress={()=> {router.push({ pathname : "../../../(events)/[eventId]", params : {eventId : eve.event_id}})}} key={index} style={styles.eventCard}>
                          <View style={{flexDirection: "row",alignItems : "center", gap : 12}}>
                            <Ionicons name="analytics-outline" size={24} color={PRIMARY_COLOR} />
                            <View style={{flexDirection: "column"}}>
                              <Text style={styles.eventTitle}>{eve.title}</Text>
                              <Text style={styles.description}>{eve.description}</Text>
                              <View style={{flexDirection: "row", gap: 12}}>
                                <View style={styles.infoRow}>
                                    <Ionicons name="location-outline" size={12} color="#555" />
                                    <Text style={styles.infoText}>{eve.location}</Text>
                                </View>

                                <View style={styles.infoRow}>
                                    <Ionicons name="briefcase-outline" size={12} color="#555" />
                                    <Text style={styles.infoText}>{eve.category}</Text>
                                </View>

                                <View style={styles.infoRow}>
                                    <Ionicons name="information-circle-outline" size={12} color="#555" />
                                    <Text style={styles.infoText}>{eve.state}</Text>
                                </View>
                              </View>
                            </View>
                          </View>
                          <View style={styles.adjustable}>
                            <View style={styles.separator} />
                          </View>
                        </TouchableOpacity>
                    ))}
                </View>
            )
        }
        {
          isAdmin &&
          <>
          {!isEditing && (<TouchableOpacity
            style={styles.primaryButton}
            onPress={() =>
              !activityLoading &&
              router.push({
                pathname: "./(create)/(create_event)/[team_event]",
                params: {
                  team_id,
                  branch_id,
                  branch_name: branch.branch_name,
                  team_name: branch.team.team_name,
                },
              })
            }
            disabled={activityLoading}
          >
            {activityLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="add-circle-outline" size={18} color="#fff" />
                <Text style={styles.primaryText}>Create Event</Text>
              </View>
            )}
          </TouchableOpacity>)}  
          </>
        }
      </View>

      {/* Child Branches Card */}
      <View style={styles.card}>
          <Text style={styles.label}>Child Branches</Text>
      {branch.children && branch.children.length > 0 ? (
        <View>
          {branch.children.map((child) => (
            <TouchableOpacity key={child.branch_id} onPress={() => router.push({pathname : './[branchId]', params : {team_id, branch_id : child.branch_id}})}>
              <View style={styles.itemRow} >
                <Ionicons name="git-branch-outline" size={16} color={PRIMARY_COLOR} />
                <View style={{flexDirection: 'column'}}>
                  <Text style={styles.itemText}>{child.branch_name}</Text>
                  <Text style={styles.subText}>{child.branch_description}</Text>
                </View>  
              </View>
              <View style={styles.adjustable}>
                <View style={styles.separator} />
              </View>
            </TouchableOpacity>
          ))}
          </View>
        ) : (
          <View style={{alignItems: 'center'}}>
              <Text style={[styles.label , {color: "#333", fontWeight: 800, marginTop: 32, marginBottom: 32}]}>No Children Of this Branchs</Text>
          </View>
        )}

        {isAdmin &&
          <>
          {!isEditing && (<TouchableOpacity
            style={styles.primaryButton}
            onPress={() =>
              !activityLoading &&
              router.push({
                pathname: "./(create)/(create_branch)/[create_branch]",
                params: {
                  team_id,
                  branch_id,
                  branch_name: branch.branch_name,
                  team_name: branch.team.team_name,
                },
              })
            }
            disabled={activityLoading}
          >
            {activityLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="add-circle-outline" size={18} color="#fff" />
                <Text style={styles.primaryText}>Create Branch</Text>
              </View>
            )}
          </TouchableOpacity>)}
          
          </>
        }

        </View>

      {/* Branch Members Card */}
      <View style={styles.card}>
        <Text style={styles.label}>Branch Members</Text>
        {branch.branch_members.map((member) => (
          <TouchableOpacity 
          onPress={()=> {router.push({pathname : `../(member)/[member]`, params : {team_id, branch_id,  user_id :member.user_id, isAdmin : `${isAdmin}`}})}} 
          key={member.user_id}>
            <View style={styles.itemRow}>
              <Ionicons name="person" size={16} color={PRIMARY_COLOR} />
              <View style={{flexDirection : 'column'}}>
                  <Text style={styles.itemText}>{member.user.name}</Text>
                  <Text style={styles.subText}>{member.role}</Text>
              </View>
            </View>
            <View style={styles.adjustable}>
                <View style={styles.separator} />
            </View>
          </TouchableOpacity>
        ))}
        {isAdmin && 
        <>
        {!isEditing && (
          <View>
          {!addMember ? (<TouchableOpacity
            style={styles.primaryButton}
            onPress={() => !activityLoading && setAddMember(true)}
            disabled={activityLoading}
          >
            {activityLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="add-circle-outline" size={18} color="#fff" />
                <Text style={styles.primaryText}>Add Member</Text>
              </View>
            )}
          </TouchableOpacity>
          ) : (
            <View>

              <Text style={styles.label}>User Mail</Text>
                <TextInput style={styles.input} value={mail} onChangeText={setMail}/>
              <View style={{flexDirection : 'row', justifyContent: 'space-between'}}>
                <TouchableOpacity
                style={styles.primaryButton}
                onPress={handelRequest}
              > 

                <Ionicons name="mail-outline" size={18} color="#fff" />
                <Text style={styles.primaryText}>Send Request</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() =>{
                  setAddMember(false)
                  setMail("")
                }}
              > 

                <Ionicons name="close-circle-outline" size={18} color="#fff" />
                <Text style={styles.primaryText}>Cancel Action</Text>
              </TouchableOpacity>
            </View>
          </View>
          )}
        </View>
        )}
        </>}
      </View>

      {/* Actions */}
      {isAdmin && 
        <>
        
        {!addMember && (<>
        {!isEditing ? (<View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handelEdit}
          >
            <Ionicons name="create-outline" size={16} />
            <Text style={styles.buttonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={activityLoading}
          >
            {activityLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="trash-outline" size={16} color="#fff" />
                <Text style={[styles.buttonText, { color: "#fff" }]}>Delete</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>) : (
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            {/* Save Button */}
            <TouchableOpacity
              style={[styles.primaryButton, { width: 170 }]}
              onPress={handelSave}
              disabled={activityLoading}
            >
              {activityLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="save-outline" size={16} color="#fff" />
                  <Text style={[styles.buttonText, { color: "#fff" }]}>Save</Text>
                </View>
              )}
            </TouchableOpacity>
  
            {/* Cancel Button */}
            <TouchableOpacity
              style={[styles.primaryButton, { width: 170 }]}
              onPress={() => !activityLoading && setIsEditing(false)}
              disabled={activityLoading}
            >
              {activityLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="close-circle-outline" size={16} color="#fff" />
                  <Text style={[styles.buttonText, { color: "#fff" }]}>Cancel</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}
        </>)
        }
        </>
      }
    </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 110,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: "#888",
    marginTop: 12,
    textTransform: "uppercase",
  },
  value: {
    fontSize: 16,
    color: "#000",
    marginTop: 4,
    fontWeight: "500",
  },
  subText: {
    fontSize: 10,
    color: "#666",
    marginTop: 4,
    marginLeft : 8
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  itemText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight : 800,
    color: "#333",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    gap: 12,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eee",
    padding: 10,
    borderRadius: 8,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PRIMARY_COLOR,
    padding: 10,
    borderRadius: 8,
    justifyContent : "center"
  },
  buttonText: {
    marginLeft: 6,
    fontWeight: "600",
  },
  primaryButton: {
    marginTop: 30,
    backgroundColor: PRIMARY_COLOR,
    padding: 16,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  primaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  input: {
    fontSize: 18,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    color: "#000",
  },
  separator: {
    height: 1,
    backgroundColor: "#ccc",
    opacity : 0.5,
    marginTop: 10,
    width : "90%"
  },
  adjustable :{
    justifyContent : "center",
    alignItems : "center"
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#333',
  },
  description: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    marginLeft: 6,
    fontSize: 10,
    color: '#444',
  },
});

export default BranchDetails;
