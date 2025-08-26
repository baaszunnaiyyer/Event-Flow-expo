import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Alert,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import Toast from "react-native-toast-message";
import { RouteProp, useRoute } from "@react-navigation/native";
import { API_BASE_URL } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { BACKGROUND_COLOR, PRIMARY_COLOR } from "@/constants/constants";
import { router } from "expo-router";

interface Branch {
  branch_id: string;
  branch_name: string;
  branch_description: string;
  parent_branch_id: string | null;
}

interface BranchMember {
  branch_id: string;
  user_id: string;
  role: string;
  user: {
    name: string;
    email: string;
    user_id: string;
  };
}

interface TeamData {
  team_id: string;
  team_name: string;
  team_description: string;
  branches: Branch[];
  branch_members: BranchMember[];
}

interface TeamMember {
  user_id: string;
  role: string;
  name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  country: string;
}

type ParamList = {
  UserDetail: {
    team_id: string;
    user_id: string;
    isAdmin : string;
    branch_id : string;
  };
};

const UserDetailScreen: React.FC = () => {
  const route = useRoute<RouteProp<ParamList, "UserDetail">>();
  const { team_id,branch_id, user_id, isAdmin } = route.params;

  

  
  const [trigger, setTrigger] = useState<boolean>(false);
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [buttonloading, setButtonLoading] = useState<boolean>(false);

  const [selectedUser, setSelectedUser] = useState<TeamMember | null>(null);
  const [userBranches, setUserBranches] = useState<Branch[]>([]);
  const [admin, setAdmin] = useState<boolean>(false);

  useEffect(() => {
    setAdmin((isAdmin == "true"))
    const getTeam = async () => {
      try {
        const token = await SecureStore.getItemAsync("userToken");
        const res = await fetch(`${API_BASE_URL}/teams/${team_id}`, {
          headers: {
            Authorization: `${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) throw new Error(`Failed to fetch team: ${res.status}`);

        const data: TeamData = await res.json();
        setTeamData(data);
      } catch (err: any) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: err.message || "Something went wrong",
        });
      }
    };

    const getMembers = async () => {
      try {
        const token = await SecureStore.getItemAsync("userToken");
        let url = `${API_BASE_URL}/teams/${team_id}/members`
        if(branch_id){
          url = `${API_BASE_URL}/teams/${team_id}/${branch_id}/members`
        }
        const res = await fetch(url, {
          headers: {
            Authorization: `${token}`,
          },
        });

        if (!res.ok) throw new Error(`Failed to fetch members: ${res.status}`);

        const data: TeamMember[] = await res.json();
        setMembers(data);
      } catch (err: any) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: err.message || "Something went wrong",
        });
      }
    };

    Promise.all([getTeam(), getMembers()]).finally(() => setLoading(false));
  }, [team_id, trigger]);

  // Match selected user & branches
  useEffect(() => {
    if (teamData && members.length > 0) {
      const user = members.find((m) => m.user_id === user_id) || null;
      setSelectedUser(user);

      if (user) {
        const branches = teamData.branches.filter((branch) =>
          teamData.branch_members.some(
            (bm) => bm.user_id === user_id && bm.branch_id === branch.branch_id
          )
        );
        setUserBranches(branches);
      }
    }
  }, [teamData, members]);

  const confirmChangeRole = () => {
    if (!selectedUser) return;
    const newRole = selectedUser.role === "admin" ? "member" : "admin";
    Alert.alert(
      "Change Role",
      `Do you want to change ${selectedUser.name}'s role in this team to ${newRole}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: () => handelChange()
            
        },
      ]
    );
  };

  const confirmDelete = () => {
    if (!selectedUser) return;
    Alert.alert(
      "Delete Member",
      `Are you sure you want to remove ${selectedUser.name} from this team?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handelDelete()
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      </View>
    );
  }

  if (!selectedUser) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={40} color="#999" />
        <Text style={{ marginTop: 8 }}>User not found</Text>
      </View>
    );
  }

    const handelChange = async () => {
      setButtonLoading(true)
      try {        
        const toRole = selectedUser.role == "member" ? "admin" : 'member'
  
        const token = await SecureStore.getItemAsync("userToken");
        let url = `${API_BASE_URL}/teams/${team_id}/members/${user_id}`
        if(branch_id)
          url = `${API_BASE_URL}/teams/${team_id}/${branch_id}/members/${user_id}`

        const res = await fetch(url, {
          method : "PUT",
          headers : {
            Authorization : `${token}`,
            "Content-Type": "application/json"
          },
          body : JSON.stringify({role : toRole})
        })
      console.log();
      
      if (res.status == 400) {
        throw new Error("Can't Demote the Only admin");
      }else if (!res.ok){
        throw new Error("Failed To update Role");
      }
      setTrigger(!trigger);
  
      Toast.show({
        type : 'success',
        text1 : "Success",
        text2 : "Member Role Changed Sucessfully"
      })
      router.back()
  
      } catch (err : any) {
         Toast.show({
            type: "error",
            text1: "Error Changing Role",
            text2: err.message,
          });
      }
      finally {
        setButtonLoading(false)
      }
    }
  
    const handelDelete = async () => {
      setButtonLoading(false)
      try {
        
        const token = await SecureStore.getItemAsync("userToken")
        let url = `${API_BASE_URL}/teams/${team_id}/members/${user_id}`
        if(branch_id)
          url = `${API_BASE_URL}/teams/${team_id}/${branch_id}/members/${user_id}`
        const res = await fetch(url, {
          method : "DELETE",
          headers : {
            Authorization : `${token}`
          }
        }
        )
  
      if (!res.ok) {
        throw new Error("Failed to Update Role");
      }
  
      Toast.show({
        type : 'success',
        text1 : "Success",
        text2 : "Member Deleted Sucessfully"
      })
  
      setTrigger(!trigger)
      router.back()
  
      } catch (err : any) {
        Toast.show({
            type: "error",
            text1: "Error Deleting Member",
            text2: err.message,
          });
      }finally {
        setButtonLoading(false)
      }
    }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* User Info */}
      <View style={styles.card}>
        <Ionicons
          name="person-circle-outline"
          size={64}
          color={PRIMARY_COLOR}
          style={{ alignSelf: "center" }}
        />
        <Text style={styles.header}>{selectedUser.name}</Text>
        <Text style={styles.sub}>{selectedUser.email}</Text>

        <View style={styles.infoRow}>
          <Ionicons name="briefcase-outline" size={20} color={PRIMARY_COLOR} />
          <Text style={styles.infoText}>Role: {selectedUser.role}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={20} color={PRIMARY_COLOR} />
          <Text style={styles.infoText}>{selectedUser.phone}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={20} color={PRIMARY_COLOR} />
          <Text style={styles.infoText}>
            DOB: {new Date(selectedUser.date_of_birth).toDateString()}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons
            name="male-female-outline"
            size={20}
            color={PRIMARY_COLOR}
          />
          <Text style={styles.infoText}>{selectedUser.gender}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="earth-outline" size={20} color={PRIMARY_COLOR} />
          <Text style={styles.infoText}>{selectedUser.country}</Text>
        </View>
      </View>

      {/* Branches */}

      {!branch_id && (<View style={{backgroundColor : BACKGROUND_COLOR, elevation : 2, borderRadius : 12, padding: 12}}>
      <Text style={styles.sectionTitle}>Present in Branch</Text>
      {userBranches.length > 0 ? (
        userBranches.map((branch) => (
          <View key={branch.branch_id}>
          <View  style={styles.branchCard}>
            <Ionicons
              name="git-branch-outline"
              size={22}
              color={PRIMARY_COLOR}
            />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.branchName}>{branch.branch_name}</Text>
              <Text style={styles.branchDesc}>
                {branch.branch_description}
              </Text>
            </View>
          </View>
            <View style={styles.adjustable}>
                <View style={styles.separator} />
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.sub}>No branches found</Text>
      )}
      </View>)}

      {/* Bottom Buttons */}
      <View style={{ marginTop: 30 , marginBottom : 120}}>
        {
          admin ?  (<>
            <Pressable
              style={[styles.button, { backgroundColor: PRIMARY_COLOR }]}
              disabled={buttonloading}
              onPress={confirmChangeRole}
            >
              {buttonloading ? (<ActivityIndicator color={BACKGROUND_COLOR}/>) : (
                <>
                  <Ionicons
                    name="create-outline"
                    size={20}
                    color="#fff"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.buttonText}>Change Role</Text>
                </>
              )}
            </Pressable>

            <Pressable
              style={[
                styles.button,
                { backgroundColor: PRIMARY_COLOR, marginTop: 12 },
              ]}
              disabled={buttonloading}
              onPress={confirmDelete}
            >
              {buttonloading ? (<ActivityIndicator color={BACKGROUND_COLOR}/>) : (
                <>
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color="#fff"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.buttonText}>Delete Member</Text>
                </>
              )}
            </Pressable>
            </>) : (<></>)
        }
      </View>
    </ScrollView>
  );
};

export default UserDetailScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
  },
  sub: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginTop: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#555",
  },
  sectionTitle: {
    fontSize: 12,
    color: "#888",
    marginLeft : 12,
    marginTop: 12,
    textTransform: "uppercase",
    fontWeight : 600
  },
  branchCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BACKGROUND_COLOR,
    padding: 12,
    borderRadius: 8,
  },
  branchName: {
    fontWeight: "bold",
    fontSize: 16,
  },
  branchDesc: {
    fontSize: 13,
    color: "#666",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  separator: {
    height: 1,
    backgroundColor: "#ccc",
    opacity : 0.5,
    marginBottom: 10,
    width : "90%"
  },
  adjustable :{
    justifyContent : "center",
    alignItems : "center"
  }
});
