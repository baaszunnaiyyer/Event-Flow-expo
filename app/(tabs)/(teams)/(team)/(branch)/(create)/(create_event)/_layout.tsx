import { Stack } from "expo-router";
export default function RootLayout() {
  return (
    <Stack>
        <Stack.Screen name="[team_event]" options={{ headerShown: false}} />
    </Stack>
  );
}