import React, { useRef, useState } from "react";
import { View, TouchableOpacity, Pressable, Animated, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { dashboardStyles as styles } from "@/styles/Dashboard.styles";

type Anim = Animated.Value | Animated.AnimatedInterpolation<any> | Animated.ValueXY;


export default function FloatingAction() {

      const [fabOpen, setFabOpen] = useState(false);
    
    const animation = useRef(new Animated.Value(0)).current;
    
      const toggleFab = () => {
        const toValue = fabOpen ? 0 : 1;
    
        Animated.timing(animation, {
          toValue,
          duration: 500,
          easing: Easing.elastic(1.2),
          useNativeDriver: true,
        }).start();
    
        setFabOpen(!fabOpen);
      };
    
      // Rotate main FAB (+ → ×)
      const rotation = animation.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "45deg"],
      });
    
      // Translate Y for sub-buttons
      const translateY1 = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -70],
      });
      const translateY2 = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -140],
      });
      const translateY3 = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -210],
      });

  return (
    <View style={styles.fabContainer}>
      {/* Sub Button 1 */}
      <Animated.View style={[styles.subFab, { transform: [{ translateY: translateY1 }] }]}>
        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => {
            toggleFab();
            router.push("/(events)/eventForm");
          }}
        >
          <Ionicons name="calendar-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* Sub Button 2 */}
      <Animated.View style={[styles.subFab, { transform: [{ translateY: translateY2 }] }]}>
        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => {
            toggleFab();
            router.push("./(teams)/(team)/create_team");
          }}
        >
          <Ionicons name="people-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* Sub Button 3 */}
      <Animated.View style={[styles.subFab, { transform: [{ translateY: translateY3 }] }]}>
        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => {
            toggleFab();
            router.push("./(teams)/(contact)/create_contact");
          }}
        >
          <Ionicons name="person-add-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* Main FAB */}
      <Pressable style={styles.fab} onPress={toggleFab}>
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <Ionicons name="add" size={32} color="#fff" />
        </Animated.View>
      </Pressable>
    </View>
  );
}
