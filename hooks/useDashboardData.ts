import { Event, Request, Team, TeamRequest } from "@/types/model";
import { API_BASE_URL } from "@/utils/constants";
import { generateWeeklyChartData } from "@/utils/Dashboard/chartHealper";
import { getMonday, happensToday } from "@/utils/Dashboard/dateHelper";
import { queueDB } from "@/utils/db/DatabaseQueue";
import { getJoinedEvents, syncEventsWithNestedData } from "@/utils/db/Events";
import { GetAllTeamRequest } from "@/utils/db/Requestes";
import { db } from "@/utils/db/schema";
import { syncTable } from "@/utils/db/SyncDB";
import { SyncTeamRequstWithNestedData } from "@/utils/db/teams";
import { RegisterEventNotifications } from "@/utils/Notifications/EventNotifications";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { AnyActionArg, useCallback, useState } from "react";

// 🟢 Main Hook
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
        teamRequestsData: TeamRequest[]
      ) => {
        const now = new Date();
        const upcoming: Event[] = [];
        const previous: Event[] = [];

        eventsData.forEach((event) => {
          // Filter out recurring events from upcoming and previous
          if (event.is_recurring) {
            return; // Skip recurring events
          }
          
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
        try {
          const events = await getJoinedEvents();
          const eventReqs = await db.getAllAsync<Event>("SELECT * FROM events as e  WHERE EXISTS (SELECT 1 FROM event_requests as er WHERE e.event_id = er.event_id);");
          const teamReqs = await GetAllTeamRequest();        

          // Always process data, even if arrays are empty
          processData(events, eventReqs, teamReqs as AnyActionArg);
          
          // If we have cached data, show it immediately (loading will be turned off after fresh fetch)
          if (events.length || eventReqs.length || teamReqs.length) {
            setLoading(false);
          }
        } catch (error) {
          console.warn("Error loading cached data:", error);
          // Process with empty arrays on error
          processData([], [], []);
        }finally{
          setLoading(false);
        }
      };

      const fetchFreshData = async () => {
        try {
          const token = await SecureStore.getItemAsync("userToken");
          const user_id = await SecureStore.getItemAsync("userId");
          if (!token) {
            setLoading(false);
            router.replace("/(auth)");
            throw new Error("User token missing");
          }

          const [eventsRes, eventReqRes, teamReqRes, teamRes] = await Promise.all([
            fetch(`${API_BASE_URL}/events`, { headers: { Authorization: token } }),
            fetch(`${API_BASE_URL}/requestes/events`, { headers: { Authorization: token } }),
            fetch(`${API_BASE_URL}/requestes/people`, { headers: { Authorization: token } }),
            fetch(`${API_BASE_URL}/teams`, { headers: { Authorization: token } })
          ]);
          if (!eventsRes.ok || !eventReqRes.ok || !teamReqRes.ok  ) {
            throw new Error("Failed to fetch one or more data sets");
          }

          const eventsData: Event[] = await eventsRes.json();
          const eventRequestsData: Event[] = await eventReqRes.json();
          const teamRequestsData: TeamRequest[] = await teamReqRes.json();
          const TeamData : Team[] = await teamRes.json()          

          const eventRequestFormatted = eventRequestsData.map(e => ({
              event_id: e.event_id,
              user_id: user_id,
              status : "pending"
          }));
          
          // 🟢 Sync nested entities
          await syncEventsWithNestedData([...eventsData,...eventRequestsData]);
          
          await RegisterEventNotifications(eventsData);

          await queueDB(()=>
            syncTable("event_requests", ["event_id", "user_id"], eventRequestFormatted, [
              "event_id", "user_id", "status"
            ])
          )
            
          await SyncTeamRequstWithNestedData(teamRequestsData);

          const TeamsFromReq = teamRequestsData.map((r) => {
            if(r.branch?.team){
              return r.branch.team;
            }
            return null;
          })          

          queueDB(()=>
            syncTable("teams", ["team_id"], [...TeamData, ...TeamsFromReq.filter((f) => f !== null)],["team_id", "team_name", "team_description", "joined_at"])
          )          
          // 🟢 Rebuild events with joins
          const rebuiltEvents = await getJoinedEvents();

          processData(rebuiltEvents, eventRequestsData, teamRequestsData);
          setLoading(false);
        } catch (error) {
          console.warn("Fetch failed, keeping cached data.", error);
          setLoading(false);
        }
      };

      const init = async () => {
        setLoading(true);
        await loadCachedData();
        try {
          await fetchFreshData();
        } catch (error) {
          console.warn("Fetch failed, keeping cached data.", error);
        }finally{
          setLoading(false);
        }
      };

      init();
    }, [])
  );

  return { loading, todayEvents, upcomingEvents, previousEvents, eventRequests, teamRequests, chartData };
}
