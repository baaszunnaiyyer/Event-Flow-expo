// src/components/RequestCard.tsx
import { Text } from "@/components/AppTypography";
import { PRIMARY_COLOR } from "@/constants/constants";
import { dashboardStyles as styles } from "@/styles/Dashboard.styles";
import { Request } from "@/types/model";
import { formatEventDateTime } from "@/utils/dateTime";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";

type Props = {
  title: string;
  requests: Request[];
  noDataMessage?: string;
  length?: number;
};

const RequestCard: React.FC<Props> = ({
  title,
  requests,
  noDataMessage = "No event requests found.",
  length = 3,
}) => {
  const mapping_Request = requests.slice(0, length);

  if (!requests || requests.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{title}</Text>
        <View style={styles.divider} />
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="mail-unread-outline" size={26} color={PRIMARY_COLOR} />
          </View>
          <Text style={styles.emptyTitle}>You&apos;re all caught up</Text>
          <Text style={styles.emptySubtitle}>{noDataMessage}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.divider} />
      {mapping_Request.map((request, index) => {
        const dateStr = request.date || request.added_at || request.start_time || "";
        return (
          <View style={styles.eventRow} key={request.id || index}>
            <Text style={styles.eventTitle}>
              {request.title ||
                request.branch?.branch_name ||
                request.sender?.name ||
                "Unnamed Request"}
            </Text>
            {dateStr ? (
              <Text style={styles.eventTime}>
                {formatEventDateTime(dateStr)}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
};

export default RequestCard;
