import { useState, useCallback, AnyActionArg } from "react";
import { useFocusEffect } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "@/utils/constants";
import { Creator, Event, Request, Team, TeamRequest } from "@/types/model";
import { happensToday, getMonday, getAllowedWeekdays } from "@/utils/Dashboard/dateHelper";
import { generateWeeklyChartData } from "@/utils/Dashboard/chartHealper";
import { db } from "@/utils/db/schema";
import { syncTable, upsertTable } from "@/utils/db/SyncDB";
import { GetAllTeamRequest } from "@/utils/db/Requestes";
import { getJoinedEvents, syncEventsWithNestedData } from "@/utils/db/Events";
import { SyncTeamRequstWithNestedData } from "@/utils/db/teams";
import { queueDB } from "@/utils/db/DatabaseQueue";

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
        const events = await getJoinedEvents();
        const eventReqs = await db.getAllAsync<Event>("SELECT * FROM events as e  WHERE EXISTS (SELECT 1 FROM event_requests as er WHERE e.event_id = er.event_id);");
        const teamReqs = await GetAllTeamRequest()        

        if (events.length || eventReqs.length || teamReqs.length) {
          processData(events, eventReqs, teamReqs as AnyActionArg );
          setLoading(false);
        }
      };

      const fetchFreshData = async () => {
        try {
          const token = await SecureStore.getItemAsync("userToken");
          const user_id = await SecureStore.getItemAsync("userId");
          if (!token) throw new Error("User token missing");

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
