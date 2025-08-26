// src/components/RequestCard.tsx
import React from "react";
import { View, Text } from "react-native";
import { Request } from "@/types/model";
import { dashboardStyles as styles } from "@/styles/Dashboard.styles";

type Props = {
  title: string;
  requests: Request[];
  noDataMessage?: string;
};

const RequestCard: React.FC<Props> = ({ title, requests, noDataMessage = "No event requests found." }) => {
  if (!requests || requests.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{title}</Text>
        <View style={styles.divider} />
        <Text style={{ color: "#999", fontStyle: "italic" }}>
          {noDataMessage}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.divider} />
      {requests.map((request, index) => {
        const dateStr = request.date || request.added_at || request.start_time || "";
        return (
          <View style={styles.eventRow} key={request.id || index}>
            <Text style={styles.eventTitle}>
              {request.title || request.branch?.branch_name || request.sender?.name || "Unnamed Request"}
            </Text>
            {dateStr ? (
              <Text style={styles.eventTime}>
                {new Date(dateStr).toLocaleString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
};

export default RequestCard;
