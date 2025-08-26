import { Stack } from "expo-router";
export default function RootLayout() {
  return (
    <Stack>
        <Stack.Screen name="[contact_event]" options={{ headerShown: false}} />
    </Stack>
  );
}