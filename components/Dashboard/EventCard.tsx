// src/components/EventCard.tsx
import React from "react";
import { View, Text } from "react-native";
import { Event } from "@/types/model";
import { dashboardStyles as styles } from "@/styles/Dashboard.styles";

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
        <Text style={{ color: "#999", fontStyle: "italic" }}>
          No events found.
        </Text>
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
            {new Date(event.start_time).toLocaleString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      ))}
    </View>
  );
};

export default EventCard;
