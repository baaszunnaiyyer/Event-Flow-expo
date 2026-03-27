import { PRIMARY_COLOR } from "@/constants/constants";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import LottieView from "lottie-react-native";

/** Bundled asset — lives under `event_flow/assets/` (Metro packs it into the JS bundle for Android/iOS). */
const paperplaneSource = require("../../assets/images/Loading 40 _ Paperplane.json");

/**
 * Small looping Lottie for the home dashboard hero so the screen feels less static.
 * Native only — `lottie-react-native` is not wired for web in this project.
 */
export function DashboardHeroLottie() {
  if (Platform.OS === "web") {
    return (
      <View style={styles.placeholder} accessibilityElementsHidden>
        <View style={[styles.placeholderDot, { backgroundColor: `${PRIMARY_COLOR}22` }]} />
      </View>
    );
  }

  return (
    <View style={styles.wrap} accessibilityRole="image" accessibilityLabel="Decorative animation">
      <LottieView
        source={paperplaneSource}
        autoPlay
        loop
        speed={0.85}
        style={styles.lottie}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 132,
    height: 100,
    alignSelf: "center",
  },
  lottie: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    width: 132,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderDot: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
});
