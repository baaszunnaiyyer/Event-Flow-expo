import React from 'react';
import { Button, Dimensions, StyleSheet, Text, Vibration, View } from 'react-native';
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
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { TaskInterface } from '../app/(tabs)/notification';
import { FontAwesome5 } from '@expo/vector-icons';

interface ListItemProps
  extends Pick<PanGestureHandlerProps, 'simultaneousHandlers'> {
  task: TaskInterface;
  onDismiss?: (task: TaskInterface) => void;
  onComplete?: (task: TaskInterface) => void;
}

const vibrateShort = () => Vibration.vibrate(10);
const vibratePattern = () => Vibration.vibrate([0, 10, 150, 10], false);

const LIST_ITEM_HEIGHT = 120;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TRANSLATE_X_THRESHOLD = -SCREEN_WIDTH * 0.2;
const RIGHT_SWIPE_THRESHOLD = SCREEN_WIDTH * 0.2;

const ListItem: React.FC<ListItemProps> = ({
  task,
  onDismiss,
  onComplete,
  simultaneousHandlers,
}) => {
  const translateX = useSharedValue(0);
  const itemHeight = useSharedValue(LIST_ITEM_HEIGHT);
  const marginVertical = useSharedValue(10);
  const opacity = useSharedValue(1);

  const panGesture = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onActive: (event) => {
      translateX.value = event.translationX;
    },
    onEnd: () => {
      const swipedLeft = translateX.value < TRANSLATE_X_THRESHOLD;
      const swipedRight = translateX.value > RIGHT_SWIPE_THRESHOLD;

      if (swipedLeft) {
        console.log(`Rejected : ${task.title}`);

        
        translateX.value = withTiming(-SCREEN_WIDTH, {duration: 200});
        itemHeight.value = withTiming(0);
        marginVertical.value = withTiming(0);
        opacity.value = withTiming(0, undefined, (isFinished) => {
          if (isFinished && onDismiss) {
            runOnJS(vibratePattern)();
            runOnJS(onDismiss)(task);
          }
        });
      } else if (swipedRight) {
        translateX.value = withTiming(SCREEN_WIDTH, {duration: 200});
        itemHeight.value = withTiming(0);
        marginVertical.value = withTiming(0);
        opacity.value = withTiming(0, undefined, (isFinished) => {
          if (isFinished && onComplete) {
            runOnJS(vibratePattern)();
            runOnJS(onComplete)(task);
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

  const rLeftIconStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(translateX.value > RIGHT_SWIPE_THRESHOLD ? 1 : 0),
    };
  });

  const rRightIconStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(translateX.value < TRANSLATE_X_THRESHOLD ? 1 : 0),
    };
  });

  const rTaskContainerStyle = useAnimatedStyle(() => ({
    height: itemHeight.value,
    marginVertical: marginVertical.value,
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.taskContainer, rTaskContainerStyle]}>
      {/* Right Swipe Icon (Complete) */}
      <Animated.View style={[styles.leftIconContainer, rLeftIconStyle]}>
        <FontAwesome5
          name="check-circle"
          size={LIST_ITEM_HEIGHT * 0.4}
          color="white"
        />
      </Animated.View>

      {/* Left Swipe Icon (Delete) */}
      <Animated.View style={[styles.rightIconContainer, rRightIconStyle]}>
        <FontAwesome5
          name="trash-alt"
          size={LIST_ITEM_HEIGHT * 0.4}
          color="white"
        />
      </Animated.View>

      <PanGestureHandler
        simultaneousHandlers={simultaneousHandlers}
        onGestureEvent={panGesture}
      >
        <Animated.View style={[styles.task, rStyle]}>
        <View style={styles.header}>
          <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
          <Text style={styles.tag}>{task.category}</Text>
        </View>

        <Text style={styles.taskDescription} numberOfLines={1}>
          {task.description || 'No description provided'}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.fromText}>From : {task.creator.name}</Text>
          <Text style={styles.timeText}>
            Time : {new Date(task.start_time).toLocaleString()} -{" "}
            {new Date(task.end_time).toLocaleTimeString()}
          </Text>
          {task.is_recurring &&
          <View style={{flexDirection: 'row', gap: 45}}>
          <Text style={styles.timeText}>Frequency : {task.frequency}</Text>
          {task.until && (
            <Text style={styles.timeText}>Until : {new Date(task.until).toLocaleDateString()}</Text>
          )}
          </View>
          }
        </View>
      </Animated.View>

              
      </PanGestureHandler>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  taskContainer: {
    width: '100%',
    alignItems: 'center',
  },
  task: {
    width: '99%',
    minHeight: LIST_ITEM_HEIGHT,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    justifyContent: 'center',

    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },
  tag: {
    backgroundColor: '#4b0082',
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  taskTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#222',
    flex: 1,
    marginRight: 10,
  },  
  taskDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  taskSender: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  rightIconContainer: {
    height: LIST_ITEM_HEIGHT,
    width: LIST_ITEM_HEIGHT,
    borderRadius: 8,
    position: 'absolute',
    right: '5%',
    justifyContent: 'center',
    backgroundColor: "red",
    alignItems: 'center',
  },
  leftIconContainer: {
    borderRadius: 8,
    height: LIST_ITEM_HEIGHT,
    width: LIST_ITEM_HEIGHT,
    position: 'absolute',
    left: '5%',
    backgroundColor: "green",
    justifyContent: 'center',
    alignItems: 'center',
  },
  fromText: {
    fontSize: 12,
    color: '#777',
    marginBottom: 2,
  },
  header: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 6,
},
footer: {
  flexDirection: 'column',
  justifyContent: 'space-between',
},



timeText: {
  fontSize: 12,
  color: '#999',
},
  
});


export default ListItem;