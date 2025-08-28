import Toast from "react-native-toast-message";
import { db } from "./schema";
import { SchemaBranch } from "@/types/model";


export async function getBranch(branch_id:string) {
    try {
        const result = await db.getFirstAsync("SELECT * FROM branches where branch_id = ?", [branch_id])

        if(!result) return ({success : false, data : "Could not Fetch"})
        return ({success : true, data : result})
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

export async function getAllChildBranch(parent_branch_id:string, team_id :string) {
    try {
        const result = await db.getAllAsync("SELECT * FROM branches WHERE parent_branch_id = ? AND team_id = ?", [parent_branch_id, team_id])

        if(!result) return ({success : false, data : "Could not Fetch" })

        return ({success : true, data : result})

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

export async function getAllBranchMember(branch_id: string, team_id: string){
    try{
        const result = await db.getAllAsync("SELECT * FROM branch_members WHERE branch_id = ? AND team_id = ?", [branch_id, team_id])

        if(!result) return ({success : false, data : "Could not Fetch" })

        return ({success : true, data : result})
    }catch(error){
        Toast.show({
            type: "error",
            text1: "Fetch Error",
            text2: `${error}`,
        });
        console.log(error);
        return { success: false };
    }
}

export async function getAllBranchEvents(branch_id:string, team_id: string) {
    try{
        const result = await db.getAllAsync("SELECT * FROM events WHERE branch_id = ? AND team_id = ?", [branch_id, team_id])

        if(!result) return ({success : false, data : "Could not Fetch" })

        return ({success : true, data : result})
    }catch(error){
        Toast.show({
            type: "error",
            text1: "Fetch Error",
            text2: `${error}`,
        });
        console.log(error);
        return { success: false };
    }
}