import { View, StyleSheet } from "react-native";
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
    // Stretch so OnBoarding (and its paginator footer) spans full width; `center`
    // shrinks the child horizontally and misaligns the paginator vs signup wizard.
    alignItems: "stretch",
    backgroundColor: "rgba(247, 247, 247, 1)",
  },
});