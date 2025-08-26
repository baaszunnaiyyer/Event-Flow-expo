import { Stack } from "expo-router";
export default function RootLayout() {
  return (
    <Stack>
        <Stack.Screen name="create_contact" options={{ headerShown: false}} />
        <Stack.Screen name="[contact]" options={{ headerShown: false}} />
        <Stack.Screen name="(event)" options={{ headerShown: false}} />
    </Stack>
  );
}