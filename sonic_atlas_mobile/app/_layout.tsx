import { Stack } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { queryClient } from "@/lib/query-client";
import { theme } from "@/theme/theme";
import { AuthBootstrap } from "@/components/auth-bootstrap";
import { PlayerBootstrap } from "@/components/player-bootstrap";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthBootstrap>
          <PlayerBootstrap>
            <StatusBar style="light" backgroundColor={theme.colors.background} />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: theme.colors.background },
              }}
            >
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="artist/[name]" />
              <Stack.Screen name="playlist/[id]" />
            </Stack>
          </PlayerBootstrap>
        </AuthBootstrap>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
