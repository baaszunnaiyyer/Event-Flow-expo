import { Stack } from "expo-router";
export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="teams" options={{ headerShown: false}} />
      <Stack.Screen name="(team)" options={{ headerShown: false}} />
      <Stack.Screen name="(contact)" options={{ headerShown: false}} />
    </Stack>
  );
}