import Toast from "react-native-toast-message";
import { db } from "./schema";
import { Team, TeamMember } from "@/types/model";
import { syncTable, upsertTable } from "./SyncDB";
import { queueDB } from "./DatabaseQueue";

export async function SyncTeamRequstWithNestedData(teamData : any) {

  //sync all the TeamRequests At once
  await queueDB(()=>
    syncTable(
      "join_requests",
      ["request_id"],
      teamData,
      [
        "request_id", "user_id", "sent_by", "request_type", "status", "added_at", "branch_id"
      ]
    )
  )

  for(const team of teamData){
    if(team.branch){
      queueDB(()=>
        upsertTable(
          "branches",
          ["branch_id"],
          [team.branch],
          [
            "branch_id", "team_id", "parent_branch_id", "branch_name", "branch_description", "created_by", "created_at", "updated_at"
          ]
        )
      )
      // if(team.branch.team){
      //   queueDB(()=>
      //   upsertTable(
      //     "teams",
      //     ["team_id"],
      //     [team.branch.team],
      //     [
      //       "team_id", "team_name", "team_description", "joined_at"
      //     ]
      //   )
      // )
      // }
    }

    if(team.sender){
      queueDB(()=>
        upsertTable(
          "users",
          ["user_id", "email"],
          [team.sender],
          [
            "user_id",
            "name", 
            "email", 
            "phone", 
            "date_of_birth", 
            "gender", 
            "country", 
            "is_private", 
            "availability_day_of_week", 
            "availability_start_time", 
            "availability_end_time", 
            "timezone", 
            "created_at", 
            "updated_at", 
            "status"
          ]
        )
      )

    }


  }

}

export async function getAllTeam() {
  try {
    const result = await db.getAllAsync(
      "SELECT * FROM teams");
    if (!result)
      return { success: false, data: "Could not fetch team" };

    return { success: true, data: result };
  } catch (error) {
    Toast.show({
      type: "error",
      text1: "Fetch Error",
      text2: `${error}`,
    });
    console.log(error);
    return { success: false };
  }
}

// 🔹 Get Team by ID
export async function getTeam(team_id: string) {
  try {
    const result = await db.getFirstAsync(
      "SELECT * FROM teams WHERE team_id = ?",
      [team_id]
    );
    if (!result)
      return { success: false, data: "Could not fetch team" };

    return { success: true, data: result };
  } catch (error) {
    Toast.show({
      type: "error",
      text1: "Fetch Error",
      text2: `${error}`,
    });
    console.log(error);
    return { success: false };
  }
}

// 🔹 Create Team
export async function insertTeam(team: Team) {
  try {
    const result = await db.runAsync(
      "INSERT INTO teams (team_id, team_name, team_description, joined_at) VALUES (?, ?, ?, ?)",
      [team.team_id, team.team_name, team.team_description, team.joined_at]
    );
    if (result.changes === 0)
      return { success: false, data: "Error inserting data" };

    return { success: true, data: result };
  } catch (error) {
    Toast.show({
      type: "error",
      text1: "Insert Error",
      text2: `${error}`,
    });
    console.log(error);
    return { success: false };
  }
}

// 🔹 Update Team
export async function updateTeam(team: Team) {
  try {
    const result = await db.runAsync(
      "UPDATE teams SET team_name = ?, team_description = ?, joined_at = ? WHERE team_id = ?",
      [team.team_name, team.team_description, team.joined_at, team.team_id]
    );
    if (result.changes === 0)
      return { success: false, data: "No team updated" };

    return { success: true, data: result };
  } catch (error) {
    Toast.show({
      type: "error",
      text1: "Update Error",
      text2: `${error}`,
    });
    console.log(error);
    return { success: false };
  }
}

// 🔹 Delete Team
export async function deleteTeam(team_id: string) {
  try {
    const result = await db.runAsync(
      "DELETE FROM teams WHERE team_id = ?",
      [team_id]
    );
    if (result.changes === 0)
      return { success: false, data: "No team deleted" };

    return { success: true, data: result };
  } catch (error) {
    Toast.show({
      type: "error",
      text1: "Delete Error",
      text2: `${error}`,
    });
    console.log(error);
    return { success: false };
  }
}

//Insert Team Member
export async function insertTeamMember(team: TeamMember) {
  try {
    const result = await db.runAsync(
      `INSERT OR REPLACE INTO team_members (team_id, user_id, role) 
       VALUES (?, ?, ?)`,
      [team.team_id, team.user_id, team.role]
    );

    return { success: true, result };
  } catch (error) {
    Toast.show({
      type: "error",
      text1: "Insert Error",
      text2: `${error}`,
    });
    console.log("insertTeamMember error:", error);
    return { success: false };
  }
}


export async function getTeamMembers(team_id:string) {
    try {
    const result = await db.getAllAsync(
      "SELECT * FROM team_members WHERE team_id = ?",
      [team_id]
    );
    if (!result)
      return { success: false, data: "Could not fetch team_members" };

    return { success: true, data: result };
  } catch (error) {
    Toast.show({
      type: "error",
      text1: "Fetch Error",
      text2: `${error}`,
    });
    console.log(error);
    return { success: false };
  }
}

export async function deleteTeamMember(team_id:string, user_id: string) {

    try {
    const result = await db.runAsync(
      "DELETE FROM team_members WHERE team_id = ?, user_id = ?",
      [team_id, user_id]
    );
    if (result.changes === 0)
      return { success: false, data: "No team deleted" };

    return { success: true, data: result };
  } catch (error) {
    Toast.show({
      type: "error",
      text1: "Delete Error",
      text2: `${error}`,
    });
    console.log(error);
    return { success: false };
  }
    
}

export async function updateTeamMember(team: TeamMember) {
    try {
    const result = await db.runAsync(
      "UPDATE team_members SET user_id = ?, role = ? WHERE team_id = ?",
      [team.team_id, team.user_id, team.role]
    );
    if (result.changes === 0)
      return { success: false, data: "No team updated" };

    return { success: true, data: result };
  } catch (error) {
    Toast.show({
      type: "error",
      text1: "Update Error",
      text2: `${error}`,
    });
    console.log(error);
    return { success: false };
  }
}

export async function getAllBranch(team_id: string){
    try {
        const result = await db.getAllAsync("SELECT * FROM branches WHERE team_id = ?", [team_id])

        if (!result) return ({success : false, data: "Error Fetching Branches"})

        return ({success : true, data: result})
    } catch (error) {
        Toast.show({
            type: "error",
            text1: "Fetch Error",
            text2: `${error}`,
        });
        console.log(error);
        return { success: false };
    }
}

export async function getAllBranchMemberInTeam(team_id:string) {
   try {
        const result = await db.getAllAsync("SELECT * branch_members Where team_id = ?", [team_id])

        if(!result) return ({success : true, data : "Failed to fetch Data"})
   } catch (error) {
        Toast.show({
            type: "error",
            text1: "Fetch Error",
            text2: `${error}`,
        });
        console.log(error);
        return { success: false };
   } 
}