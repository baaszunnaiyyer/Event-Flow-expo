import { RouteProp, useRoute } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "@/utils/constants";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { BACKGROUND_COLOR, PRIMARY_COLOR } from "@/constants/constants";
import { router } from "expo-router";
import HierarchyChart from "@/components/HirarchyChart";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { upsertTable } from "@/utils/db/SyncDB";
import { db } from "@/utils/db/schema";
import { queueDB } from "@/utils/db/DatabaseQueue";
import { BranchMember } from "@/types/model";
import LottieView from "lottie-react-native";

interface Branch {
  branch_id: string;
  branch_name: string;
  branch_description: string;
  parent_branch_id: string | null;
}

type HierarchyNode = { name: string; parent: string };

function buildHierarchyDataFromBranches(
  branchName: string,
  branches: Branch[]
): HierarchyNode[][] {
  // Map of branch_id to branch object for quick lookup
  const branchMap = new Map(branches.map(b => [b.branch_id, b]));

  // Store branches by level index, starting from level 1 for branches (level 0 is team)
  const levels: HierarchyNode[][] = [];

  // First, add level 0 (team root)
  levels[0] = [{ name: branchName, parent: "Null" }];

  // Helper: track which branches have been assigned a level
  const assigned = new Map<string, number>();

  // Recursive function to assign level to a branch
  function assignLevel(branch: Branch): number {
    if (assigned.has(branch.branch_id)) {
      // Already assigned level
      return assigned.get(branch.branch_id)!;
    }

    if (!branch.parent_branch_id) {
      // Root branch (parent_branch_id == null), level 1
      assigned.set(branch.branch_id, 1);
      if (!levels[1]) levels[1] = [];
      levels[1].push({ name: branch.branch_name, parent: branchName });
      return 1;
    }

    // Otherwise, find parent's level first
    const parentBranch = branchMap.get(branch.parent_branch_id);
    if (!parentBranch) {
      // If parent branch not found, treat as root level (1)
      assigned.set(branch.branch_id, 1);
      if (!levels[1]) levels[1] = [];
      levels[1].push({ name: branch.branch_name, parent: branchName });
      return 1;
    }

    const parentLevel = assignLevel(parentBranch); // recursive call
    const branchLevel = parentLevel + 1;
    assigned.set(branch.branch_id, branchLevel);

    if (!levels[branchLevel]) levels[branchLevel] = [];
    levels[branchLevel].push({ name: branch.branch_name, parent: parentBranch.branch_name });

    return branchLevel;
  }

  // Assign levels to all branches
  branches.forEach(branch => assignLevel(branch));

  return levels;
}


type RootStackParamList = {
  TeamDetails: { team_id: string };
};

type TeamRouteProp = RouteProp<RootStackParamList, "TeamDetails">;

interface User {
  user_id : string | null;
  name: string;
  email: string;
}

interface Branch {
  branch_id: string;
  branch_name: string;
  branch_description : string;
}

interface TeamMembers {
  user_id : string;
  role : "admin" | "member" | string;
  name : string;
  email : string;
  phone  : string;
  date_of_birth : string;
  gender : string;
  country : string;
}

interface Member {
  user: User;
  role: string;
}

interface JustTeam {
  team_id : string;
  team_name: string;
  team_description: string;
  joined_at: Date;
}

interface Team {
  team_name: string;
  team_description: string;
  joined_at: Date;
  branch_members: Member[];
  branches: Branch[];
}

const Team = () => {
  const [hirarchyData, setHirarchyData] = useState<HierarchyNode[][]>([]);
  const [teamMember, setTeamMember] = useState<TeamMembers[] | null>(null);
  const [teamData, setTeamData] = useState<Team | null>(null);
  const [teamName, setTeamName] = useState<string>("");
  const [teamDescription, setTeamDecription] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [activityLoading, setActivityLoading] = useState<boolean>(false);
  const [editing, setEditing] = useState<boolean>(false);
  const route = useRoute<TeamRouteProp>();
  const { team_id } = route.params;
  const [selectedView, setSelectedView] = useState<"tree" | "cards">("tree");


  useFocusEffect(
    useCallback(() => {
      let TeamisDone = false;
      const getTeam = async () => {
        try {
          // Loading Data from LocalCached Data
          let team = await db.getFirstAsync("SELECT * FROM teams WHERE team_id = ?",[team_id]) as Team | null ;
          const branch = await db.getAllAsync("SELECT * FROM branches WHERE team_id = ?",[team_id]) as Branch[];
          const branch_members = await db.getAllAsync("SELECT * FROM branch_members WHERE team_id = ?",[team_id]) as BranchMember[];
          if (team) {
            (team as any).branches = branch;
            (team as any).branch_members = branch_members;
          }

          if(team && team.branch_members && team.branches){
            setHirarchyData(buildHierarchyDataFromBranches(team.team_name, team.branches));
            setTeamData(team);
            setTeamName(team.team_name);
            setTeamDecription(team.team_description);
            TeamisDone = true
          }

          const token = await SecureStore.getItemAsync("userToken");

          const res = await fetch(`${API_BASE_URL}/teams/${team_id}`, {
            method: "GET",
            headers: {
              Authorization: `${token}`,
              "Content-Type": "application/json",
            },
          });

          if (!res.ok) {
            throw new Error(`Failed to fetch team: ${res.status}`);
          }

          const data = await res.json() as Team;

          await queueDB(()=>
            upsertTable("branch_members",["branch_id","team_id","user_id"],data.branch_members, ["branch_id","team_id","user_id","joined_at","role"])
          )

          const branches = data.branches.map((e)=>({
            team_id,
            ...e
          }))          

          
          await queueDB(()=>
            upsertTable("branches",["branch_id"],branches,[
              "branch_description",
              "branch_id",
              "branch_name",
              "parent_branch_id",
              "team_id"])
          )
          

          setHirarchyData(buildHierarchyDataFromBranches(data.team_name, data.branches));
          setTeamData(data);
          setTeamName(data.team_name);
          setTeamDecription(data.team_description);
        } catch (err: any) {
          Toast.show({
            type: "error",
            text1: "Error",
            text2: `${err.message || "Something went wrong"}`,
          });
        } finally {
          setLoading(false);
        }
      };

      const getMembers = async () => {
        try {
          const userId = await SecureStore.getItemAsync("userId")
          const LocalData = await db.getAllAsync("SELECT u.*, t.role FROM users as u LEFT JOIN team_members as t ON u.user_id = t.user_id WHERE t.team_id  = ?",[team_id]) as TeamMembers[];
          if(LocalData.length > 0){
            setIsAdmin(LocalData.some((e : any) => (e.user_id == userId && e.role == 'admin')))
            setTeamMember(LocalData)
            setLoading(false);         
          }

          const token = await SecureStore.getItemAsync("userToken");
          const res = await fetch(`${API_BASE_URL}/teams/${team_id}/members`, {
            method: "GET",
            headers: { Authorization: `${token}` },
          });

          if (!res.ok) {
            throw new Error(`Failed to fetch team members: ${res.status}`);
          }
          
          const data = await res.json();
          const dataFormatted = data.map((member : TeamMembers) => ({
            team_id : team_id,
            user_id : member.user_id,
            role : member.role
          }))

          queueDB(()=>
            upsertTable("team_members",["team_id","user_id"],dataFormatted,
              [
                "team_id",
                "user_id",
                "role"
              ])
          )

          const userSyncData = data.filter((user : User) => user.user_id !== userId)
          queueDB(()=>
            upsertTable("users", ["user_id"], userSyncData, 
              [
                "country",
                "date_of_birth",
                "email",
                "gender",
                "name",
                "phone",
                "user_id"
              ])
          )
          
          setIsAdmin(data.some((e : any) => (e.user_id == userId && e.role == 'admin')))
          
          setTeamMember(data);
        } catch (error: any) {
          Toast.show({
            type: "error",
            text1: "Error",
            text2: `${error.message || "Something went wrong"}`,
          });
        }
      };
      // Fetch both when screen is focused
      getTeam();
      getMembers();

    }, [team_id, editing]) // dependencies
  );


  const onEdit = () => {
    Toast.show({ type: "info", text1: "Editing Enabled" });
    setEditing(true)
  };

  const onSave = async () => {
    try {
        setActivityLoading(true)
        const token  = await SecureStore.getItemAsync("userToken")
        const res = await fetch(`${API_BASE_URL}/teams/${team_id}`,{
            method : "PUT",
            headers : {
                Authorization : `${token}`,
                "Content-Type": "application/json"
            },
            body : JSON.stringify({
                team_name : teamName,
                team_description :teamDescription
            })
        })

        if (!res.ok) {
        throw new Error("Failed to delete team");
        }
        await db.runAsync("UPDATE teams SET team_name = ?, team_description = ? WHERE team_id = ?",[teamName, teamDescription, team_id])

        Toast.show({
        type: "success",
        text1: "Success",
        text2: "Team edited!"
        });

    }catch(err : any){
        Toast.show({
            type: "error",
            text1: "Error deleting team",
            text2: err.message,
        })
    }finally{
        setActivityLoading(false)
        setEditing(false)
    }
  };

  const onDelete = () => {
    Alert.alert(
      "Delete Team",
      "Are you sure you want to delete this team?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setActivityLoading(true)
              const token = await SecureStore.getItemAsync("userToken");
              const res = await fetch(`${API_BASE_URL}/teams/${team_id}`, {
                method: "DELETE",
                headers: {
                  Authorization: `${token}`,
                },
              });

              if (!res.ok) {
                throw new Error("Failed to delete team");
              }
              
              router.back()
              await db.runAsync("DELETE from teams WHERE team_id = ?", [team_id]);
              Toast.show({
                type: "success",
                text1: "Team deleted successfully",
              });

              // Navigate back or refresh screen
            } catch (err: any) {
              Toast.show({
                type: "error",
                text1: "Error deleting team",
                text2: err.message,
              });
            }finally {
              setActivityLoading(false)
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={PRIMARY_COLOR}/>
        <Text style={{fontSize : 16, fontWeight: "800"}}>Getting Your Team</Text>
      </View>
    );
  }

  if (!teamData) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: "gray" }}>No data available</Text>
      </View>
    );
  }

  const formattedDate = new Date(teamData.joined_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Team Name</Text>
      {!editing ? (
        <Text style={styles.TeamTitle}>{teamData.team_name}</Text>
        ) : (
        <TextInput
            value={teamName}
            onChangeText={setTeamName}
            style={styles.input}
        />
        )}

      <View style={styles.divider} />
        <Text style={styles.label}>Branch Description</Text>
        {!editing ? (
        <Text style={styles.value}>{teamData.team_description}</Text>
        ) : (
        <TextInput
            value={teamDescription}
            onChangeText={setTeamDecription}
            style={styles.input}
        />
        )}

      <View style={styles.divider} />

      <Text style={styles.label}>Joined At</Text>
      <Text style={styles.value}>{formattedDate}</Text>
      <View style={styles.divider} />

      <Text style={styles.label}>Total Members</Text>
      <Text style={styles.value}>{teamData.branch_members.length}</Text>
      <View style={styles.divider} />

      <Text style={styles.label}>Total Branches</Text>
      <Text style={styles.value}>{teamData.branches.length}</Text>
      <View style={styles.divider} />

      {isAdmin &&
      <View style={styles.actions}>
        {!editing ? (
           <TouchableOpacity style={styles.editButton} onPress={onEdit}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="create-outline" size={18} color="#000" />
                <Text style={styles.actionText}>Edit</Text>
              </View>
          </TouchableOpacity>
        ) :  
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={onSave} 
              disabled={activityLoading}
            >
              {activityLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="save-outline" size={18} color="#fff" />
                  <Text style={[styles.actionText, { color: "#fff", marginLeft: 6 }]}>
                    Save
                  </Text>
                </View>
              )}
            </TouchableOpacity>

        }

        {!editing && <TouchableOpacity style={styles.primaryButton} onPress={onDelete} disabled={activityLoading}>
          {activityLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="trash-outline" size={18} color="#fff" />
              <Text style={[styles.actionText, { color: "#fff", marginLeft: 6 }]}>Delete</Text>
            </View>
          )}
        </TouchableOpacity>}
      </View>
      }

      <Text style={styles.SectionTitle}>Branch View</Text>

      {/* 🔥 Toggle Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => setSelectedView("tree")}
          style={[
            styles.tabButton,
            selectedView === "tree" && styles.activeTab,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              selectedView === "tree" && styles.activeTabText,
            ]}
          >
            Tree View
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSelectedView("cards")}
          style={[
            styles.tabButton,
            selectedView === "cards" && styles.activeTab,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              selectedView === "cards" && styles.activeTabText,
            ]}
          >
            Cards View
          </Text>
        </TouchableOpacity>
      </View>

      {/* 🔥 Conditional Rendering */}
      
      {selectedView === "tree" ? (
        <HierarchyChart data={(hirarchyData)} />
      ) : (
        <View style={styles.cardContainer}>
          {teamData.branches.map((branch, index) => (
            <TouchableOpacity style={styles.card} key={index} onPress={ () => router.push({pathname : `./(branch)/[branchId]` , params : {branch_id : branch.branch_id, team_id : team_id}})}>
            <View>
              <Text style={styles.cardTitle}>Branch Name  : {branch.branch_name}</Text>
              <Text style={styles.cardText}>{branch.branch_description}</Text>
            </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={[styles.SectionTitle, {marginVertical : 16}]}>Members</Text>

      <View style={styles.teamCard}>
        <Text style={styles.label}>Team Members</Text>
        {teamMember?.map((member, index) => (
          <TouchableOpacity onPress={() => router.push({ pathname : `./(member)/[member]`, params : {team_id, user_id : member.user_id, isAdmin : `${isAdmin}`}})} key={index}>
            <View style={styles.itemRow}>
              <Ionicons name="person" size={16} color={PRIMARY_COLOR} />
              <View style={{ flex: 1, flexDirection: 'column' }}>
                <Text style={styles.itemText}>
                  {member.name} | <Text style={styles.subText}>{member.email}</Text>
                </Text>
                <Text style={styles.subText}>{member.role}</Text>
              </View>
            </View>

            <View style={styles.adjustable}>
              <View style={styles.separator} />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: BACKGROUND_COLOR,
    shadowColor: "#000",
    elevation: 1,
  },
  label: {
    fontSize: 10,
    color: "#333",
    marginBottom: 4,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  TeamTitle :{
    fontSize : 24,
    fontWeight : 700,
  },
  value: {
    fontSize: 12,
    color: "#999",
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 12,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 24,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  actionText: {
    marginLeft: 6,
    fontWeight: "600",
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor : BACKGROUND_COLOR
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  SectionTitle : {
    fontSize : 24,
    fontWeight : 800,
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 16,
    borderRadius: 8,
    backgroundColor: "#f1f1f1",
    overflow: "hidden",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  tabText: {
    color: "#666",
    fontWeight: "600",
  },
  activeTab: {
    backgroundColor: PRIMARY_COLOR,
  },
  activeTabText: {
    color: "#fff",
  },
  cardContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "flex-start",
    paddingVertical: 10,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    elevation: 3,
    shadowColor: "#000",
    width: "100%",
  },
  teamCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    elevation: 3,
    shadowColor: "#000",
    width: "100%",
    marginBottom : 100
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
    color: PRIMARY_COLOR,
  },
  cardText: {
    fontSize: 12,
    color: "#555",
    marginBottom: 4,
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
    color: "#333",
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
  primaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  }
});

export default Team;
