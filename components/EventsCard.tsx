import React, { useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  Vibration,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Pressable,
} from 'react-native';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  PanGestureHandlerProps,
  LongPressGestureHandler,
  State as GestureState,
  LongPressGestureHandlerEventPayload
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { HandlerStateChangeEvent } from "react-native-gesture-handler";

import { EventItem } from '@/app/(tabs)/(events)/events';
import { router } from 'expo-router';

interface EventItemCardProps
  extends Pick<PanGestureHandlerProps, 'simultaneousHandlers'> {
  event: EventItem;
  onDismiss?: (event: EventItem) => void;
  onComplete?: (event: EventItem) => void;
  onDelete?: (event: EventItem) => void;
  swipeEnabled?: boolean;
}

const LIST_ITEM_HEIGHT = 100;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TRANSLATE_X_THRESHOLD = -SCREEN_WIDTH * 0.2;
const RIGHT_SWIPE_THRESHOLD = SCREEN_WIDTH * 0.2;

const vibrate = () => Vibration.vibrate([0, 10, 120, 10], false);

const EventItemCard: React.FC<EventItemCardProps> = ({
  event,
  onDelete,
  onDismiss,
  onComplete,
  simultaneousHandlers,
  swipeEnabled,
}) => {
  const [showDelete, setShowDelete] = useState(false);
  const translateX = useSharedValue(0);
  const itemHeight = useSharedValue(LIST_ITEM_HEIGHT);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const margin = useSharedValue(1);


  const panGesture = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onActive: (event) => {
      translateX.value = event.translationX;
    },
    onEnd: () => {
      const swipedLeft = translateX.value < TRANSLATE_X_THRESHOLD;
      const swipedRight = translateX.value > RIGHT_SWIPE_THRESHOLD;

      if (swipedLeft) {
        translateX.value = withTiming(-SCREEN_WIDTH);
        itemHeight.value = withTiming(0);
        opacity.value = withTiming(0, undefined, (finished) => {
          if (finished && onDismiss) {
            runOnJS(vibrate)();
            runOnJS(onDismiss)(event);
          }
        });
      } else if (swipedRight) {
        translateX.value = withTiming(SCREEN_WIDTH);
        itemHeight.value = withTiming(0);
        opacity.value = withTiming(0, undefined, (finished) => {
          if (finished && onComplete) {
            runOnJS(vibrate)();
            runOnJS(onComplete)(event);
          }
        });
      } else {
        translateX.value = withTiming(0);
      }
    },
  });



  const handleLongPress = ({
    nativeEvent,
  }: HandlerStateChangeEvent<LongPressGestureHandlerEventPayload>) => {
    if (nativeEvent.state === GestureState.ACTIVE) {
      runOnJS(vibrate)();
      setShowDelete(true);
    }
  };


  const rStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
    marginBottom : margin.value
  }));

  const animateShrinkAndRemove = (action?: (e: EventItem) => void) => {
    scale.value = withTiming(0, { duration: 300 }, () => {
      itemHeight.value = withTiming(0);
      margin.value = withTiming(0)
      opacity.value = withTiming(0, undefined, (finished) => {
        if (finished && action) {
          runOnJS(vibrate)();
          runOnJS(action)(event);
        }
      });
    });
  };

  const rContainerStyle = useAnimatedStyle(() => ({
    height: itemHeight.value,
    opacity: opacity.value,
    marginVertical: 10,
  }));

  const limitWords = (text: string, wordLimit: number) => {
    const words = text.split(' ');
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(' ') + '...';
  };

  return (
    <Animated.View style={[styles.container, rContainerStyle]}>
      {/* Swipe Icons */}
      <Animated.View style={[styles.iconContainer, styles.leftIcon]}>
        <Ionicons name="sparkles-outline" size={30} color="white" />
      </Animated.View>
      <Animated.View style={[styles.iconContainer, styles.rightIcon]}>
        <Ionicons name="cog-outline" size={30} color="white" />
      </Animated.View>

      <LongPressGestureHandler onHandlerStateChange={handleLongPress} minDurationMs={500}>
        <Animated.View style={{ width: '100%' }}>
          <Pressable 
            onPress={() => router.push(`./${event.event_id}`)}
            style={({ pressed }) => [
              { transform: [{ scale: pressed ? 0.98 : 1 }]}
            ]}
          >
          <PanGestureHandler
            enabled={swipeEnabled}
            simultaneousHandlers={simultaneousHandlers}
            onGestureEvent={panGesture}
            activeOffsetX={[-15, 15]}  // Allow X-axis swipe only when it's >15px
            failOffsetY={[-10, 10]}
          >
            <Animated.View style={[styles.card, !swipeEnabled && {backgroundColor : "#d8d8d8ff"}, rStyle]}>
              <Text style={styles.tag}>
                {event.state === 'InProgress' ? 'In Progress' : event.state}
              </Text>
              <Text style={styles.title}>{limitWords(event.title, 5)}</Text>
              <Text style={styles.description}>{limitWords(event.description, 8)}</Text>
              <View style={{flexDirection:"row", marginTop: 10, gap : 16}}>
                <Text style={styles.from}><Ionicons name="person-outline" size={12} color="#666" /> {event.creator.name}</Text>
                <Text style={styles.location}><Ionicons name="compass-outline" size={12} color={"#666"}></Ionicons> {event.location}</Text>
              </View>
            </Animated.View>
          </PanGestureHandler>
          </Pressable>
          {/* Delete Popup */}
          {showDelete && (
            <>
              <TouchableWithoutFeedback onPress={() => setShowDelete(false)}>
                <View style={StyleSheet.absoluteFillObject} />
              </TouchableWithoutFeedback>
              <View style={styles.deletePopup}>
                <TouchableOpacity
                  onPress={() => {
                    setShowDelete(false);
                    animateShrinkAndRemove(onDelete);
                  }}
                >
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </Animated.View>
      </LongPressGestureHandler>
    </Animated.View>
  );
};

export default EventItemCard;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: "center"
  },
  card: {
    width: '99%',
    minHeight: LIST_ITEM_HEIGHT,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 2,
  },
  tag: {
    position: 'absolute',
    top: 8,
    right: 12,
    backgroundColor: '#090040',
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#222',
  },
  description: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  from: {
    marginTop: 4,
    fontSize: 12,
    color: '#888',
  },
  location: {
    marginTop: 4,
    fontSize: 13,
    color: '#444',
  },
  iconContainer: {
    position: 'absolute',
    width: LIST_ITEM_HEIGHT * 1.5,
    height: LIST_ITEM_HEIGHT * 1.1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    top: 0,
  },
  leftIcon: {
    left: '5%',
    backgroundColor: '#06b1ebff',
  },
  rightIcon: {
    right: '5%',
    backgroundColor: '#b43f11ff',
  },
  deletePopup: {
    position: 'absolute',
    bottom: 10,
    right: 15,
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 10,
  },
  deleteText: {
    color: "#090040",
    fontWeight: '900',
    fontSize: 20,
  },
});
