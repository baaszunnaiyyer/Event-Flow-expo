import { Text } from "@/components/AppTypography";
import { DashboardHeroLottie } from "@/components/Dashboard/DashboardHeroLottie";
import EventCard from "@/components/Dashboard/EventCard";
import EventsTimeLine from "@/components/Dashboard/EventsTimeLine";
import FloatingAction from "@/components/Dashboard/FAB";
import RequestCard from "@/components/Dashboard/RequestCard";
import { WeeklyBarChart } from "@/components/Dashboard/weekly-bar-chart";
import { data, PRIMARY_COLOR } from "@/constants/constants";
import { useDashboardData } from "@/hooks/useDashboardData";
import { dashboardStyles as styles } from "@/styles/Dashboard.styles";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { ActivityIndicator, ScrollView, View, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CARD_PAGE_WIDTH = 316;

const Dashboard: React.FC = () => {
  const [activeWeekIndex, setActiveWeekIndex] = useState(0);
  const insets = useSafeAreaInsets();

  const {
    loading,
    todayEvents,
    upcomingEvents,
    previousEvents,
    eventRequests,
    teamRequests,
    chartData,
  } = useDashboardData();

  if (loading) {
    return (
      <View
        style={[styles.scrollContainer, { justifyContent: "center", flex: 1 }]}
      >
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingTop: Math.max(insets.top, 8) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <StatusBar style="dark" />

        <View style={styles.welcomeBanner}>
          <View style={styles.welcomeHeroRow}>
            <View style={styles.welcomeTextCol}>
              <Text style={styles.welcomeEyebrow}>OVERVIEW</Text>
              <Text style={styles.welcomeTitle}>Your week at a glance</Text>
              <Text style={styles.welcomeSubtitle}>
                Swipe the chart below to browse weeks. Events and requests update as you go.
              </Text>
            </View>
            <Image source={require("../../assets/images/EventflowAnimatedLogo.gif")} style={{ width: 100, height: 100 }} />
            {/* <DashboardHeroLottie /> */}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Ionicons name="stats-chart" size={20} color={PRIMARY_COLOR} />
          <Text style={styles.sectionTitle}>Weekly progress</Text>
        </View>
        <View style={styles.cardChart}>
          <View style={styles.chartCard}>
            <View style={styles.chartWrapper}>
              <WeeklyBarChart
                weeks={chartData.length > 0 ? chartData : data}
                activeWeekIndex={activeWeekIndex}
                onWeekChange={setActiveWeekIndex}
              />
            </View>
          </View>
        </View>

        {todayEvents.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Ionicons name="today-outline" size={22} color={PRIMARY_COLOR} />
              <Text style={styles.sectionTitle}>Today&apos;s timeline</Text>
            </View>
            <EventsTimeLine events={todayEvents} />
          </>
        )}

        <View style={styles.sectionHeader}>
          <Ionicons name="calendar-outline" size={20} color={PRIMARY_COLOR} />
          <Text style={styles.sectionTitle}>Events</Text>
        </View>
        <Text style={styles.sectionHint}>Upcoming and past events at a glance</Text>
        <ScrollView
          horizontal
          style={styles.horizontalScroll}
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          snapToInterval={CARD_PAGE_WIDTH}
          snapToAlignment="start"
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
        >
          <EventCard title="Upcoming events" events={upcomingEvents} />
          {previousEvents.length > 0 && (
            <EventCard title="Previous events" events={previousEvents} />
          )}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Ionicons name="notifications-outline" size={20} color={PRIMARY_COLOR} />
          <Text style={styles.sectionTitle}>Requests</Text>
        </View>
        <Text style={styles.sectionHint}>Pending invites and team actions</Text>
        <ScrollView
          horizontal
          style={styles.horizontalScroll}
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          snapToInterval={CARD_PAGE_WIDTH}
          snapToAlignment="start"
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
        >
          <RequestCard
            title="Event requests"
            requests={eventRequests}
            noDataMessage="No event requests found."
          />
          <RequestCard
            title="Team requests"
            requests={teamRequests}
            noDataMessage="No team requests found."
          />
        </ScrollView>
      </ScrollView>

      <FloatingAction />
    </View>
  );
};

export default Dashboard;
