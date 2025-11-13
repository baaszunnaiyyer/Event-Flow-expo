import EventCard from "@/components/Dashboard/EventCard";
import EventsTimeLine from "@/components/Dashboard/EventsTimeLine";
import FloatingAction from "@/components/Dashboard/FAB";
import RequestCard from "@/components/Dashboard/RequestCard";
import { WeeklyBarChart } from "@/components/Dashboard/weekly-bar-chart";
import { data } from "@/constants/constants";
import { useDashboardData } from "@/hooks/useDashboardData";
import { dashboardStyles as styles } from "@/styles/Dashboard.styles";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
} from "react-native";

const Dashboard: React.FC = () => {
  const [activeWeekIndex, setActiveWeekIndex] = useState(0);


  const { loading, todayEvents, upcomingEvents, previousEvents, eventRequests, teamRequests, chartData } = useDashboardData();

  if (loading) {
    return (
      <View
        style={[styles.scrollContainer, { justifyContent: "center", flex: 1 }]}
      >
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <StatusBar style="dark" />
        <Text style={styles.sectionTitle}>Weekly Progress</Text>
        <View style={styles.cardChart}>
          <View style={styles.chartWrapper}>
            <WeeklyBarChart
              weeks={chartData.length > 0 ? chartData : data}
              activeWeekIndex={activeWeekIndex}
              onWeekChange={setActiveWeekIndex}
            />
          </View>
        </View>
        {
          todayEvents.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Today's TimeLine</Text>
              <EventsTimeLine events={todayEvents} />
            </>
          )
        }

        <Text style={[styles.sectionTitle, { marginTop: 0 }]}>Events</Text>
        <ScrollView
          horizontal
          style={styles.horizontalScroll}
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          snapToInterval={320}
          decelerationRate="fast"
          snapToAlignment="start"
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          <EventCard title="Upcoming Events" events={upcomingEvents} />
          {previousEvents.length > 0 && (
            <EventCard title="Previous Events" events={previousEvents} />
          )}
        </ScrollView>

        <Text style={styles.sectionTitle}>Requests</Text>
        <ScrollView
          horizontal
          style={styles.horizontalScroll}
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          snapToInterval={320}
          decelerationRate="fast"
          snapToAlignment="start"
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          <RequestCard title="Event Requests" requests={eventRequests} noDataMessage="No event requests found." />
          <RequestCard title="Team Requests" requests={teamRequests} noDataMessage="No team requests found." />
        </ScrollView>

      </ScrollView>

      {/* Floating + Button */}
      <FloatingAction/>
    </View>
  );
};

export default Dashboard;