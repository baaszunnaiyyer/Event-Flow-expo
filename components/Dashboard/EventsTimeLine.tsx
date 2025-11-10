import { BACKGROUND_COLOR, PRIMARY_COLOR } from '@/constants/constants';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type EventItem = {
  event_id : string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
};

function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }
  return str.slice(0, maxLength) + "...";
}

export default function Example({ events }: { events: EventItem[] }) {
  // Helper function to add 5 hours to a time string
  const addFiveHours = (timeString: string): string => {
    const date = new Date(timeString);
    date.setHours(date.getHours() + 5);
    return date.toISOString();
  };

  // Helper function to format time with +5 hours
  const formatTime = (timeString: string): string => {
    const adjustedTime = addFiveHours(timeString);
    const timePart = adjustedTime.split("T")[1];
    const [hours, minutes] = timePart.split(":");
    return `${hours} : ${minutes}`;
  };

  // Sort events by start_time (earliest first)
  const sortedEvents = [...(events || [])].sort((a, b) => {
    const timeA = new Date(a.start_time).getTime();
    const timeB = new Date(b.start_time).getTime();
    return timeA - timeB;
  });

  return (
    <SafeAreaView style={{ backgroundColor: BACKGROUND_COLOR }}>
      <ScrollView contentContainerStyle={styles.container}>
        {sortedEvents.map((e :  any, index : number) => {
          return (
            <TouchableOpacity
              key={index}
              onPress={() => {
                router.push(`./(events)/${e.event_id}`)
              }}>
              <View style={styles.card}>
                <View style={styles.cardIcon}>
                  <Text style={styles.cardDates}>{formatTime(e.start_time)}</Text>
                </View>

                <View style={styles.cardDelimiter}>
                  {index !== sortedEvents.length - 1 && (
                    <View style={styles.cardDelimiterLine} />
                  )}

                  <View
                    style={[styles.cardDelimiterInset]} />
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.cardBodyContent}>
                    <Text style={styles.cardTitle}>{truncateString(e.title, 25)}</Text>

                    <Text style={styles.cardSubtitle}>{truncateString(e.description, 30)}</Text>

                    <Text style={styles.cardDates}>End's at : {formatTime(e.end_time)}</Text>
                  </View>

                  <View style={styles.cardBodyAction}>
                    <Ionicons name="arrow-forward-outline" color={PRIMARY_COLOR}/>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1d1d1d',
    marginBottom: 12,
  },
  /** Card */
  card: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDelimiter: {
    position: 'relative',
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  cardDelimiterLine: {
    position: 'absolute',
    left: 30,
    top: '50%',
    borderLeftWidth: 1,
    borderColor: '#eee',
    height: '100%',
    zIndex: 1,
  },
  cardDelimiterInset: {
    width: 12,
    height: 12,
    borderWidth: 3,
    borderRadius: 9999,
    backgroundColor: '#fff',
    borderColor: PRIMARY_COLOR,
    zIndex: 9,
    position: 'relative',
  },
  cardBody: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
  },
  cardBodyContent: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2a2a2a',
    marginBottom: 3,
  },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#464646',
    marginBottom: 3,
  },
  cardDates: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ababab',
  },
  cardBodyAction: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    maxWidth: 28,
    alignItems: 'flex-end',
  },
});