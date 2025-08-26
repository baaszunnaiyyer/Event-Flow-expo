import { Text, View, StyleSheet } from "react-native";
import { Link } from "expo-router";
import OnBoarding from "@/components/Onboarding";


export default function Index() {
  return (
    <View style={styles.view}>
      <OnBoarding/>
    </View>
  );
}

const styles = StyleSheet.create({
  view: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor : "rgba(247, 247, 247, 1)",
  }
})