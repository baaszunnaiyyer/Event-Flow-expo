import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "@/utils/constants";
import { db } from "@/utils/db/schema";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";

const router = useRouter();

export const handleSignOut = async () => {
  try {
    await SecureStore.deleteItemAsync("userToken");
    await SecureStore.deleteItemAsync("userId");

    await db.execAsync('BEGIN TRANSACTION;');
    await db.execAsync(`
      DELETE FROM users;
      DELETE FROM events;
      DELETE FROM teams;
      DELETE FROM team_members;
      DELETE FROM branch_members;
      DELETE FROM branches;
      DELETE FROM event_members;
      DELETE FROM contacts;
      DELETE FROM join_requests;
      DELETE FROM event_requests;
    `);
    await db.execAsync('COMMIT;');

    router.replace("/(auth)");
  } catch (error) {
    console.error("Error during logout:", error);
  }
};

export function useSettingsData() {
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>({
    name: "Loading...",
    email: "Loading...",
    phone: "Loading...",
    country: "Loading...",
    gender: "Loading...",
    availability_day_of_week: null,
    availability_start_time: null,
    availability_end_time: null,
    date_of_birth: null,
    is_private: false,
  });

  useEffect(() => {
    let isMounted = true;

    const loadFromSQLite = async () => {
      try {
        const userId = await SecureStore.getItemAsync("userId");
        if (!userId) return null;

        const user = await db.getFirstAsync<any>(
          `SELECT * FROM users WHERE user_id = ?`,
          [userId]
        );        

        if (user && isMounted) {
          setUserInfo(user);
        }
        return user;
      } catch (err) {
        console.warn("Error loading from SQLite:", err);
        return null;
      }
    };

    const fetchFreshSettings = async () => {
      try {
        const token = await SecureStore.getItemAsync("userToken");
        const userId = await SecureStore.getItemAsync("userId");
        if (!token || !userId) throw new Error("User token or ID missing");

        const res = await fetch(`${API_BASE_URL}/settings`, {
          headers: { Authorization: token },
        });
        if (!res.ok) throw new Error("Failed to fetch settings");

        const apiData = await res.json();
        
        setUserInfo(apiData);

        await db.runAsync(`
        INSERT INTO users (
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
          timezone,
          created_at,
          updated_at,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          name = excluded.name,
          email = excluded.email,
          phone = excluded.phone,
          date_of_birth = excluded.date_of_birth,
          gender = excluded.gender,
          country = excluded.country,
          is_private = excluded.is_private,
          availability_day_of_week = excluded.availability_day_of_week,
          availability_start_time = excluded.availability_start_time,
          availability_end_time = excluded.availability_end_time,
          timezone = excluded.timezone,
          created_at = excluded.created_at,
          updated_at = excluded.updated_at,
          status = excluded.status
      `, [
        apiData.user_id,
        apiData.name,
        apiData.email,
        apiData.phone || null,
        apiData.date_of_birth || null,
        apiData.gender || null,
        apiData.country || null,
        apiData.is_private ? 1 : 0,
        apiData.availability_day_of_week || null,
        apiData.availability_start_time || null,
        apiData.availability_end_time || null,
        apiData.timezone || null,
        apiData.created_at || null,
        apiData.updated_at || null,
        apiData.status || null,
      ]);        
          
      } catch (err: any) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: `${err.message} || "Failed to fetch user data"`,
        });
        console.log(err.message);
        
      }
    };

    const init = async () => {
      setLoading(true);
      const localUser = await loadFromSQLite();
      if(!localUser){
        await fetchFreshSettings();
      }
      if (isMounted) setLoading(false);
    };

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  return { loading, userInfo };
}
