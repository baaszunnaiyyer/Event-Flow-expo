import Toast from "react-native-toast-message";
import { db } from "./schema";
import { Creator } from "@/types/model";

export async function deleteUser(user_id: string) {
  try {
    await db.runAsync("DELETE FROM users WHERE user_id = ?", [user_id]);
    return { success: true };
  } catch (error) {
    Toast.show({ type: "error", text1: "Delete Error", text2: `${error}` });
    console.error("Error deleting user:", error);
    return { success: false, error };
  }
}

export async function updateUser(user: Creator) {
  try {
    await db.runAsync(
      `UPDATE users 
       SET 
        name = ?, 
        email = ?, 
        phone = ?, 
        date_of_birth = ?, 
        gender = ?, 
        country = ?, 
        is_private = ?, 
        availability_day_of_week = ?, 
        availability_start_time = ?, 
        availability_end_time = ?, 
        password = ?, 
        timezone = ?, 
        created_at = ?, 
        updated_at = ?, 
        status = ?
       WHERE user_id = ?`,
      [
        user.name,
        user.email,
        user.phone,
        user.date_of_birth,
        user.gender,
        user.country,
        user.is_private ? 1 : 0, // SQLite stores booleans as 0/1
        user.availability_day_of_week,
        user.availability_start_time,
        user.availability_end_time,
        user.password,
        user.timezone,
        user.created_at,
        user.updated_at,
        user.status,
        user.user_id, // WHERE condition
      ]
    );

    return { success: true };
  } catch (error) {
    Toast.show({type : "error", text1 : 'Error', text2 : `${error}`})
    console.error("Error updating user:", error);
    return { success: false, error };
  }
}


export async function insertUser(user: Creator) {
  try {
    await db.runAsync(
      `INSERT INTO users (
        user_id, 
        name, 
        email, 
        phone, 
        date_of_birth, 
        gender, 
        country, 
        is_private, 
        availability_day_of_week, 
        availability_start_time, 
        availability_end_time, 
        password, 
        timezone, 
        created_at, 
        updated_at, 
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.user_id,
        user.name,
        user.email,
        user.phone,
        user.date_of_birth,
        user.gender,
        user.country,
        user.is_private ? 1 : 0,
        user.availability_day_of_week,
        user.availability_start_time,
        user.availability_end_time,
        user.password,
        user.timezone,
        user.created_at,
        user.updated_at,
        user.status,
      ]
    );

    return { success: true };
  } catch (error) {
    Toast.show({ type: "error", text1: "Insert Error", text2: `${error}` });
    console.error("Error inserting user:", error);
    return { success: false, error };
  }
}


export async function getUser(user_id:string) {
    try {
        await db.runAsync("SELECT * FROM users WHERE user_id = ? ", [user_id])
        return { success: true };
    }catch(error) {
        Toast.show({ type: "error", text1: "Insert Error", text2: `${error}` });
        console.error("Error inserting user:", error);
        return { success: false, error }
    }
}
