import { Stack } from "expo-router";
export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="events" options={{ headerShown: false }} />
      <Stack.Screen name="eventForm" options={{ headerShown: false}}  />
      <Stack.Screen name="[eventId]" options={{ headerShown: false}}  />
    </Stack>
  );
}
