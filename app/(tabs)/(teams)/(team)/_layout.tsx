import { Stack } from "expo-router";
export default function RootLayout() {
  return (
    <Stack>
        <Stack.Screen name="create_team" options={{ headerShown: false}} />
        <Stack.Screen name="[team_id]" options={{ headerShown: false}} />
        <Stack.Screen name="(branch)" options={{ headerShown: false}} />
        <Stack.Screen name="(member)" options={{ headerShown: false}} />
    </Stack>
  );
}