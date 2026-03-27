import React, { useEffect, type ReactNode } from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

type Props = {
  children: ReactNode;
  /** Delay before the animation starts (ms). */
  delayMs?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  /**
   * Initial vertical offset in px. Negative = enter from above (fade-down),
   * positive = enter from below (fade-up). Use 0 for fade-only.
   */
  translateFrom?: number;
};

/**
 * Fade + slide entrance that works inside ScrollView and other parents where
 * Reanimated layout `entering={...}` often does not run reliably.
 */
export function FadeInEnter({
  children,
  delayMs = 0,
  duration = 400,
  style,
  translateFrom = -14,
}: Props) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(translateFrom);

  useEffect(() => {
    translateY.value = translateFrom;
    opacity.value = 0;
    const timing = { duration, easing: Easing.out(Easing.cubic) };
    opacity.value = withDelay(delayMs, withTiming(1, timing));
    translateY.value = withDelay(delayMs, withTiming(0, timing));
  }, [delayMs, duration, translateFrom]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]} collapsable={false}>
      {children}
    </Animated.View>
  );
}
