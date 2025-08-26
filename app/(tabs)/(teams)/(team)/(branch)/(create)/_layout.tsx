import { Stack } from "expo-router";
export default function RootLayout() {
  return (
    <Stack>
        <Stack.Screen name="(create_event)" options={{ headerShown: false}} />
        <Stack.Screen name="(create_branch)" options={{ headerShown: false}} />
    </Stack>
  );
}