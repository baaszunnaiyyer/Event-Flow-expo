import { StyleSheet, Text, View } from 'react-native';
import React, { useState, useEffect } from 'react';
import { router } from 'expo-router';
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from '@/utils/constants';
import { syncEventsWithNestedData } from '@/utils/db/Events';
import { queueDB } from '@/utils/db/DatabaseQueue';
import { syncTable, upsertTable } from '@/utils/db/SyncDB';
import { SyncTeamRequstWithNestedData } from '@/utils/db/teams';
import LottieView from 'lottie-react-native';
import { PRIMARY_COLOR } from '@/constants/constants';
import { getApp } from '@react-native-firebase/app';
import { getMessaging, getToken, requestPermission } from '@react-native-firebase/messaging';

const LoadingScreen = () => {
  const [loadingText, setLoadingText] = useState('Events are flowing into your device...');

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingText('Still loading... please check your internet connection.');
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {

    const ensureFcmTokenRegistered = async (token:string) => {
      try {
        const app = getApp();
        const messaging = getMessaging(app);

        // iOS requires explicit permission; Android 13+ needs POST_NOTIFICATIONS
        try {
          await requestPermission(messaging);
        } catch {}

        const fcmToken = await getToken(messaging);
        if (!fcmToken) return;            
        console.log("FCM token : ", fcmToken);
        
        await fetch(`${API_BASE_URL}/auth/save-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
          body: JSON.stringify({
            token: fcmToken,
          }),
        });
      } catch (e) {
        console.warn("Failed to register FCM token:", e);
      }
    };
    
    const fetchFreshData = async () => {
      try {
        const token = await SecureStore.getItemAsync("userToken");
        const user_id = await SecureStore.getItemAsync("userId");

        if (!token) {
          router.replace("/(auth)");
          return;
        }

        const [settingsRes,eventsRes, eventReqRes, teamReqRes, teamRes] = await Promise.all([
          fetch(`${API_BASE_URL}/settings`, { headers: { Authorization: token } }),
          fetch(`${API_BASE_URL}/events`, { headers: { Authorization: token } }),
          fetch(`${API_BASE_URL}/requestes/events`, { headers: { Authorization: token } }),
          fetch(`${API_BASE_URL}/requestes/people`, { headers: { Authorization: token } }),
          fetch(`${API_BASE_URL}/teams`, { headers: { Authorization: token } }),
        ]);

        if (!eventsRes.ok || !eventReqRes.ok || !teamReqRes.ok || !teamRes.ok) {
          throw new Error("Failed to fetch one or more data sets");
        }

        const [settingResData,eventsData, eventRequestsData, teamRequestsData, TeamData] = await Promise.all([
          settingsRes.json(),
          eventsRes.json(),
          eventReqRes.json(),
          teamReqRes.json(),
          teamRes.json(),
        ]);

        await queueDB(()=>
          upsertTable("users", ["user_id"], [settingResData], 
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
            ])
        )

        const eventRequestFormatted = eventRequestsData.map((e: any) => ({
          event_id: e.event_id,
          user_id,
          status: "pending",
        }));

        await syncEventsWithNestedData([...eventsData, ...eventRequestsData]);

        await queueDB(async () =>
          await syncTable(
            "event_requests",
            ["event_id", "user_id"],
            eventRequestFormatted,
            ["event_id", "user_id", "status"]
          )
        );

        await SyncTeamRequstWithNestedData(teamRequestsData);

        const TeamsFromReq = teamRequestsData.map((r: any) => r.branch?.team).filter(Boolean);

        await queueDB(async () =>
          await syncTable(
            "teams",
            ["team_id"],
            [...TeamData, ...TeamsFromReq],
            ["team_id", "team_name", "team_description", "joined_at"]
          )
        );

        ensureFcmTokenRegistered(token)

        router.replace("/(tabs)");
      } catch (error) {
        console.warn("Fetch failed, keeping cached data.", error);
        setLoadingText("Using cached data... Redirecting soon");
        setTimeout(() => router.replace("/(tabs)"), 2000);
      }
    };

    setTimeout(()=>{
        fetchFreshData();
    }, 5000)
  }, []);

  return (
    <View style={styles.container}>
      <LottieView
        source={require('../../assets/images/Jump loading.json')}
        autoPlay
        loop
        style={{ width: 300, height: 300 }}
      />
      <Text style={styles.text}>{loadingText}</Text>
    </View>
  );
};

export default LoadingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(253, 253, 253, 1)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    color: PRIMARY_COLOR,
    fontSize: 16,
    marginTop: 20,
    fontWeight : '800',
    textAlign: 'center',
  },
});
