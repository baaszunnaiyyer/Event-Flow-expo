// hooks/useRequestsData.ts
import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "@/utils/constants";
import { Event, TeamRequest } from "@/types/model";

export function useRequestsData(activeTab: "event" | "team") {
  const [loading, setLoading] = useState(true);
  const [eventTasks, setEventTasks] = useState<Event[]>([]);
  const [teamRequests, setTeamRequests] = useState<TeamRequest[]>([]);

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
            activeTab === "event"
              ? setEventTasks(JSON.parse(cached))
              : setTeamRequests(JSON.parse(cached));
            setLoading(false);
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
            await AsyncStorage.setItem("cachedEventRequests", JSON.stringify(formatted));
          } else {
            setTeamRequests(formatted);
            await AsyncStorage.setItem("cachedTeamRequests", JSON.stringify(formatted));
          }
        } catch (err) {
          console.warn("Fetch failed, keeping cached data:", err);
        } finally {
          if (isMounted) setLoading(false);
        }
      };

      setLoading(true);
      loadCachedData();
      fetchFreshData();

      return () => {
        isMounted = false;
      };
    }, [activeTab])
  );

  return { loading, eventTasks, teamRequests };
}
