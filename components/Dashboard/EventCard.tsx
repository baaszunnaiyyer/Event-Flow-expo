// src/components/EventCard.tsx
import { Text } from "@/components/AppTypography";
import { PRIMARY_COLOR } from "@/constants/constants";
import { dashboardStyles as styles } from "@/styles/Dashboard.styles";
import { Event } from "@/types/model";
import { formatEventDateTime } from "@/utils/dateTime";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";

type Props = {
  title: string;
  events: Event[];
};

const EventCard: React.FC<Props> = ({ title, events }) => {
  if (!events || events.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{title}</Text>
        <View style={styles.divider} />
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="calendar-outline" size={26} color={PRIMARY_COLOR} />
          </View>
          <Text style={styles.emptyTitle}>Nothing scheduled yet</Text>
          <Text style={styles.emptySubtitle}>
            Create an event from the + button when you&apos;re ready to plan something new.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.divider} />
      {events.slice(0, 3).map((event, index) => (
        <View style={styles.eventRow} key={event.event_id || index}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.eventTime}>
            {formatEventDateTime(event.start_time)}
          </Text>
        </View>
      ))}
    </View>
  );
};

export default EventCard;
