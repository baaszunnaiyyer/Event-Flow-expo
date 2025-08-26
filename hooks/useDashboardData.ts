import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "@/utils/constants";
import { Event, Request } from "@/types/model";
import { happensToday, getMonday } from "@/utils/Dashboard/dateHelper";
import { generateWeeklyChartData } from "@/utils/Dashboard/chartHealper";

export function useDashboardData() {
  const [loading, setLoading] = useState(true);
  const [todayEvents, setTodayEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [previousEvents, setPreviousEvents] = useState<Event[]>([]);
  const [eventRequests, setEventRequests] = useState<Request[]>([]);
  const [teamRequests, setTeamRequests] = useState<Request[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      const processData = (
        eventsData: Event[],
        eventRequestsData: Request[],
        teamRequestsData: Request[]
      ) => {
        const now = new Date();
        const upcoming: Event[] = [];
        const previous: Event[] = [];

        eventsData.forEach((event) => {
          const eventDate = new Date(event.start_time);
          if (eventDate >= now) {
            upcoming.push(event);
          } else {
            previous.push(event);
          }
        });

        setUpcomingEvents(upcoming);
        setPreviousEvents(previous);
        setEventRequests(eventRequestsData);
        setTeamRequests(teamRequestsData);

        setTodayEvents(eventsData.filter((e) => happensToday(e)));

        const earliestEventDate = eventsData.length
          ? new Date(Math.min(...eventsData.map((e) => new Date(e.start_time).getTime())))
          : new Date();

        const mondayThreeWeeksBefore = getMonday(new Date(earliestEventDate));
        mondayThreeWeeksBefore.setDate(mondayThreeWeeksBefore.getDate() - 21);

        const hasEventsInThreeWeeksBefore = eventsData.some((event) => {
          const eventDate = new Date(event.start_time);
          return eventDate >= mondayThreeWeeksBefore && eventDate < earliestEventDate;
        });

        const chartStartDate = hasEventsInThreeWeeksBefore
          ? mondayThreeWeeksBefore
          : getMonday(earliestEventDate);

        setChartData(generateWeeklyChartData(eventsData, chartStartDate));
      };

      const loadCachedData = async () => {
        const cachedEvents = await AsyncStorage.getItem("cachedEvents");
        const cachedEventRequests = await AsyncStorage.getItem("cachedEventRequests");
        const cachedTeamRequests = await AsyncStorage.getItem("cachedTeamRequests");

        if (cachedEvents && cachedEventRequests && cachedTeamRequests) {
          processData(
            JSON.parse(cachedEvents),
            JSON.parse(cachedEventRequests),
            JSON.parse(cachedTeamRequests)
          );
        }
      };

      const fetchFreshData = async () => {
        try {
          const token = await SecureStore.getItemAsync("userToken");
          if (!token) throw new Error("User token missing");

          const [eventsRes, eventReqRes, teamReqRes] = await Promise.all([
            fetch(`${API_BASE_URL}/events`, { headers: { Authorization: token } }),
            fetch(`${API_BASE_URL}/requestes/events`, { headers: { Authorization: token } }),
            fetch(`${API_BASE_URL}/requestes/people`, { headers: { Authorization: token } }),
          ]);

          if (!eventsRes.ok || !eventReqRes.ok || !teamReqRes.ok) {
            throw new Error("Failed to fetch one or more data sets");
          }

          const eventsData: Event[] = await eventsRes.json();
          const eventRequestsData: Request[] = await eventReqRes.json();
          const teamRequestsData: Request[] = await teamReqRes.json();

          await AsyncStorage.setItem("cachedEvents", JSON.stringify(eventsData));
          await AsyncStorage.setItem("cachedEventRequests", JSON.stringify(eventRequestsData));
          await AsyncStorage.setItem("cachedTeamRequests", JSON.stringify(teamRequestsData));

          processData(eventsData, eventRequestsData, teamRequestsData);
        } catch (error) {
          console.warn("Fetch failed, keeping cached data.", error);
        }
      };

      const init = async () => {
        setLoading(true);
        await loadCachedData();
        setLoading(false);
        fetchFreshData();
      };

      init();
    }, [])
  );

  return { loading, todayEvents, upcomingEvents, previousEvents, eventRequests, teamRequests, chartData };
}
