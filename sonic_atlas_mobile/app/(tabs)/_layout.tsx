import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { View } from "react-native";

import { theme } from "@/theme/theme";
import { MiniPlayer } from "@/ui/mini-player";

const tabIcon =
  (focusedIcon: keyof typeof Ionicons.glyphMap, unfocusedIcon: keyof typeof Ionicons.glyphMap) =>
  ({ color, focused, size }: { color: string; focused: boolean; size: number }) =>
    <Ionicons color={color} name={focused ? focusedIcon : unfocusedIcon} size={size} />;

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerTintColor: theme.colors.textPrimary,
          headerTitleStyle: {
            fontFamily: theme.fonts.mono,
            fontSize: 12,
            letterSpacing: 1.6,
          },
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            height: 72,
            paddingTop: 8,
            paddingBottom: 10,
          },
          tabBarActiveTintColor: theme.colors.accent,
          tabBarInactiveTintColor: theme.colors.textMuted,
          tabBarLabelStyle: {
            fontFamily: theme.fonts.mono,
            fontSize: 10,
            letterSpacing: 1.2,
            textTransform: "uppercase",
          },
          sceneStyle: {
            backgroundColor: theme.colors.background,
          },
        }}
      >
        <Tabs.Screen
          name="discover"
          options={{
            title: "Discover",
            tabBarIcon: tabIcon("compass", "compass-outline"),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: "Search",
            tabBarIcon: tabIcon("search", "search-outline"),
          }}
        />
        <Tabs.Screen
          name="playlists"
          options={{
            title: "Playlists",
            tabBarIcon: tabIcon("grid", "grid-outline"),
          }}
        />
        <Tabs.Screen
          name="my-atlas"
          options={{
            title: "My Atlas",
            tabBarIcon: tabIcon("albums", "albums-outline"),
          }}
        />
        <Tabs.Screen
          name="now-playing"
          options={{
            title: "Now Playing",
            tabBarIcon: tabIcon("radio", "radio-outline"),
          }}
        />
      </Tabs>
      <MiniPlayer />
    </View>
  );
}
