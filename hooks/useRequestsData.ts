// hooks/useRequestsData.ts
import { Event, TeamRequest } from "@/types/model";
import { API_BASE_URL } from "@/utils/constants";
import { queueDB } from "@/utils/db/DatabaseQueue";
import { db } from "@/utils/db/schema";
import { syncTable, upsertTable } from "@/utils/db/SyncDB";
import { SyncTeamRequstWithNestedData } from "@/utils/db/teams";
import { useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useState } from "react";

export function useRequestsData(activeTab: "event" | "team") {
  const [loading, setLoading] = useState(true);
  const [eventTasks, setEventTasks] = useState<Event[]>([]);
  const [teamRequests, setTeamRequests] = useState<TeamRequest[]>([]);


  const fetchFreshData = useCallback(async () => {
    try {
      setLoading(true);
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
      
      if(activeTab !== "event"){
        await SyncTeamRequstWithNestedData(raw)
        const TeamsFromReq = raw.map((r : any) => {
          if(r.branch?.team){
            return r.branch.team;
          }
          return null;
        })          

        queueDB(()=>
          upsertTable("teams", ["team_id"], [...TeamsFromReq.filter((f: any) => f !== null)],["team_id", "team_name", "team_description", "joined_at"])
        )  
      }else{
        await queueDB(()=>
          syncTable("event_requests", ["event_id", "user_id"], raw, [
            "event_id", "user_id", "status"
          ])
        )
      }
      const formatted = raw.map((item: any, index: number) => ({
        ...item,
        index,
      }));

      if (activeTab === "event") {
        setEventTasks(formatted);
      } else {
        setTeamRequests(formatted);
      }
    } catch (err) {
      console.warn("Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const loadCachedData = async () => {
        try {          
          const query =
            activeTab === "event"
              ?`SELECT
                e.*,
                json(
                  json_object(
                    'name', u.name,
                    'email', u.email,
                    'phone', u.phone,
                    'gender', u.gender,
                    'country', u.country
                  )
                ) AS creator
              FROM events AS e
              LEFT JOIN users AS u
                ON u.user_id = e.created_by
              WHERE EXISTS (
                SELECT 1
                FROM event_requests AS er
                WHERE er.event_id = e.event_id
              );`
              : `SELECT json_group_array(
                json_object(
                  'request_id', j.request_id,
                  'user_id', j.user_id,
                  'sent_by', j.sent_by,
                  'request_type', j.request_type,
                  'status', j.status,
                  'added_at', j.added_at,
                  'branch', json_object(
                    'branch_id', b.branch_id,
                    'team_id', b.team_id,
                    'parent_branch_id', b.parent_branch_id,
                    'branch_name', b.branch_name,
                    'branch_description', b.branch_description,
                    'created_by', b.created_by,
                    'created_at', b.created_at,
                    'updated_at', b.updated_at,
                    'team', json_object(
                      'team_id', t.team_id,
                      'team_name', t.team_name,
                      'team_description', t.team_description,
                      'joined_at', t.joined_at
                    )
                  ),
                  'sender', json_object(
                    'user_id', u.user_id,
                    'name', u.name,
                    'email', u.email,
                    'phone', u.phone,
                    'date_of_birth', u.date_of_birth,
                    'gender', u.gender,
                    'country', u.country,
                    'is_private', u.is_private,
                    'availability_day_of_week', u.availability_day_of_week,
                    'availability_start_time', u.availability_start_time,
                    'availability_end_time', u.availability_end_time,
                    'timezone', u.timezone,
                    'created_at', u.created_at,
                    'updated_at', u.updated_at,
                    'status', u.status
                  )
                )
              ) AS requests
              FROM join_requests j
              LEFT JOIN branches b ON j.branch_id = b.branch_id
              LEFT JOIN teams t ON b.team_id = t.team_id
              LEFT JOIN users u ON j.sent_by = u.user_id;
              `;
          
          const data = await db.getAllAsync<any>(query);
          if (activeTab === "event") {
            let result = data || [];
            result = result.map((r: any) => ({
              ...r,
              creator: r.creator ? JSON.parse(r.creator) : null
            }));
            if (isMounted) {
              setEventTasks(result);
              // If we have cached data, show it immediately
              if (result.length > 0) {
                setLoading(false);
              }
            }
          } else {
            let result = data && data.length > 0 && data[0].requests 
              ? JSON.parse(data[0].requests) 
              : [];
            if (isMounted) {
              setTeamRequests(result);
              // If we have cached data, show it immediately
              if (result.length > 0) {
                setLoading(false);
              }
            }
          }
          
        } catch (err) {
          console.warn("Error loading cached requests:", err);
          // Set empty arrays on error
          if (isMounted) {
            if (activeTab === "event") {
              setEventTasks([]);
            } else {
              setTeamRequests([]);
            }
          }
          setLoading(false);
        }finally {
          setLoading(false);
        }
      };

      setLoading(true);
      loadCachedData();

      return () => {
        isMounted = false;
      };
    }, [activeTab, fetchFreshData])
  );

  return { loading, eventTasks, teamRequests, reload: fetchFreshData };
}
