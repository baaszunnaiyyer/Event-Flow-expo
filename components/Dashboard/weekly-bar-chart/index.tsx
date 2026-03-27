import { Text } from "@/components/AppTypography";
import { PRIMARY_COLOR } from "@/constants/constants";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";

import { SingleBarChart, type Day } from "./single-bar-chart";

type Week = Day[];

type WeeklyBarChartProps = {
  weeks: Week[];
  activeWeekIndex: number;
  onWeekChange: (index: number) => void;
};

export const WeeklyBarChart = ({
  weeks,
  activeWeekIndex,
  onWeekChange,
}: WeeklyBarChartProps) => {
  const { width: windowWidth } = useWindowDimensions();
  const activeWeek = weeks[activeWeekIndex];

  const BarChartWidth = windowWidth * 0.8;
  const BarChartGap = 10;
  const BarWidth =
    (BarChartWidth - BarChartGap * (activeWeek.length - 1)) / activeWeek.length;
  const MaxBarHeight = 150;
  const ScrollViewHeight = 60;

  return (
    <View
      style={{
        height: ScrollViewHeight + MaxBarHeight,
        width: windowWidth,
      }}>
      <View
        style={{
          height: MaxBarHeight,
          flexDirection: 'row',
          gap: BarChartGap,
          alignItems: 'flex-end',
          marginHorizontal: (windowWidth - BarChartWidth) / 2,
        }}>
        {activeWeek.map((day, index) => (
          <SingleBarChart
            key={index}
            maxHeight={MaxBarHeight}
            width={BarWidth}
            day={day}
          />
        ))}
      </View>
      <ScrollView
        horizontal
        snapToInterval={windowWidth}
        decelerationRate={'fast'}
        showsHorizontalScrollIndicator={false}
        disableIntervalMomentum
        scrollEventThrottle={16} // 60 FPS - 1000ms / 60 = 16.6666
        onScroll={({ nativeEvent }) => {
          const scrollOffset = nativeEvent.contentOffset.x;
          const activeIndex = Math.round(scrollOffset / windowWidth);
          onWeekChange(activeIndex);
        }}
        style={{
          width: windowWidth,
          height: ScrollViewHeight,
        }}>
        {weeks.map((week, index) => {
          return (
            <View
              key={index}
              style={[
                styles.weekStripPage,
                { height: ScrollViewHeight, width: windowWidth },
              ]}
              accessibilityLabel="Swipe left or right to change week"
            >
              <View style={styles.weekStripCluster}>
                <Ionicons name="chevron-back" size={20} color={PRIMARY_COLOR} />
                <View style={styles.labelPill}>
                  <Text style={styles.label}>
                    Week of {format(week[0].day, "d MMMM")}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={PRIMARY_COLOR} />
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  weekStripPage: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  weekStripCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 1,
  },
  labelPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  label: {
    color: "#374151",
    fontSize: 13,
    letterSpacing: 0.2,
  },
});