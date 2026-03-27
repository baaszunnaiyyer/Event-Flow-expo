import { Text } from "@/components/AppTypography";
import { PRIMARY_COLOR } from "@/constants/constants";
import { format } from "date-fns";
import { View } from "react-native";
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";

export type Day = {
  day: Date;
  value: number; // 0 - 1
};

type SingleBarChartProps = {
  maxHeight: number;
  width: number;
  day: Day;
};

export const SingleBarChart = ({
  maxHeight,
  width,
  day,
}: SingleBarChartProps) => {
  const rStyle = useAnimatedStyle(() => {
    return {
      height: withTiming(Math.max(maxHeight * day.value, day.value > 0 ? 6 : 0)),
      opacity: withTiming(day.value > 0 ? 1 : 0),
    };
  }, [day.value, maxHeight]);

  return (
    <View style={{ width, alignItems: "center" }}>
      <View
        style={{
          height: maxHeight,
          width,
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            position: "absolute",
            bottom: 0,
            width,
            height: maxHeight,
            backgroundColor: "#E8EAEF",
            borderRadius: 15,
          }}
        />
        <Animated.View
          style={[
            {
              width,
              backgroundColor: PRIMARY_COLOR,
              borderRadius: 15,
            },
            rStyle,
          ]}
        />
      </View>
      <Text
        style={{
          width,
          textAlign: "center",
          fontSize: 12,
          marginTop: 8,
          color: "#6B7280",
          textTransform: "lowercase",
        }}
      >
        {format(day.day, "eeeee")}
      </Text>
    </View>
  );
};
