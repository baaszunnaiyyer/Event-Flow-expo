import React from 'react';
import { Dimensions, StyleSheet, Text, Vibration } from 'react-native';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  PanGestureHandlerProps,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { FontAwesome5 } from '@expo/vector-icons';

import { TeamRequest } from '../app/(tabs)/notification'; // or update path

interface TeamRequestItemProps
  extends Pick<PanGestureHandlerProps, 'simultaneousHandlers'> {
  request: TeamRequest;
  displayTitle? : string;
  displaySubtitle?: string;
  onDismiss?: (req: TeamRequest) => void;
  onComplete?: (req: TeamRequest) => void;
}

const LIST_ITEM_HEIGHT = 100;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TRANSLATE_X_THRESHOLD = -SCREEN_WIDTH * 0.2;
const RIGHT_SWIPE_THRESHOLD = SCREEN_WIDTH * 0.2;

const vibrate = () => Vibration.vibrate([0, 10, 120, 10], false);

const TeamRequestItem: React.FC<TeamRequestItemProps> = ({
  request,
  onDismiss,
  onComplete,
  simultaneousHandlers,
}) => {
  const translateX = useSharedValue(0);
  const itemHeight = useSharedValue(LIST_ITEM_HEIGHT);
  const opacity = useSharedValue(1);

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
            runOnJS(onDismiss)(request);
          }
        });
      } else if (swipedRight) {
        translateX.value = withTiming(SCREEN_WIDTH);
        itemHeight.value = withTiming(0);
        opacity.value = withTiming(0, undefined, (finished) => {
          if (finished && onComplete) {
            runOnJS(vibrate)();
            runOnJS(onComplete)(request);
          }
        });
      } else {
        translateX.value = withTiming(0);
      }
    },
  });

  const rStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const rContainerStyle = useAnimatedStyle(() => ({
    height: itemHeight.value,
    opacity: opacity.value,
    marginVertical: 10,
  }));    

  return (
    <Animated.View style={[styles.container, rContainerStyle]}>
      {/* Swipe Icons */}
      <Animated.View style={[styles.iconContainer, styles.leftIcon]}>
        <FontAwesome5 name="check-circle" size={30} color="white" />
      </Animated.View>
      <Animated.View style={[styles.iconContainer, styles.rightIcon]}>
        <FontAwesome5 name="times-circle" size={30} color="white" />
      </Animated.View>

      <PanGestureHandler
        simultaneousHandlers={simultaneousHandlers}
        onGestureEvent={panGesture}
      >
        <Animated.View style={[styles.card, rStyle]}>
          <Text style={styles.tag}>
            {request.request_type === "team" ? "Team": "Contact"}
          </Text>

          {request.request_type === "team" ? (
            <Text style={styles.title}>
              {String( request.request_type === "team" ? request.branch?.team?.team_name ?? request.branch?.branch_name  : request.sender ? request.sender?.name : "Unnamed")}
            </Text>
          ) : (
            <Text style={[styles.title, { marginBottom: 10 }]}>
              {String(request.sender?.name ?? "Unknown Sender")}
            </Text>
          )}

          {request.request_type === "team" ? (
            <Text style={styles.description}>
              For Branch: {String(request.branch?.branch_description ?? "No description")}
            </Text>
          ) : (
            <Text style={styles.description}>
              Email: {String(request.sender?.email ?? "No email")}
            </Text>
          )}

          {request.request_type === "team" && (
            <Text style={styles.from}>From: {String(request.sender?.name ?? "Unknown")}</Text>
          )}
        </Animated.View>
      </PanGestureHandler>
    </Animated.View>
  );
};

export default TeamRequestItem;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
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
    shadowRadius: 8,
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
    marginTop: 6,
    fontSize: 14,
    color: '#666',
  },
  from: {
    marginTop: 4,
    fontSize: 12,
    color: '#888',
  },
  iconContainer: {
    position: 'absolute',
    width: LIST_ITEM_HEIGHT,
    height: LIST_ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    top: 0,
  },
  leftIcon: {
    left: '5%',
    backgroundColor: 'green',
  },
  rightIcon: {
    right: '5%',
    backgroundColor: 'red',
  },
});
