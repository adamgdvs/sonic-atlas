import { Stack, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

import { fetchPlaylistDetail } from "@/lib/api";
import { usePlayerStore } from "@/store/player-store";
import { theme } from "@/theme/theme";
import { SectionHeading } from "@/ui/section-heading";
import { ShellScreen } from "@/ui/shell-screen";
import { TrackRow } from "@/ui/track-row";

export default function PlaylistDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const playlistId = decodeURIComponent(params.id ?? "");
  const { setQueue } = usePlayerStore();

  const playlistQuery = useQuery({
    enabled: playlistId.length > 0,
    queryKey: ["playlist-detail", playlistId],
    queryFn: () => fetchPlaylistDetail(playlistId),
  });

  const playlist = playlistQuery.data;
  const tracks = playlist?.tracks ?? [];

  return (
    <ShellScreen>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Playlist",
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.textPrimary,
          headerTitleStyle: {
            color: theme.colors.textPrimary,
            fontFamily: theme.fonts.mono,
            fontSize: 12,
          },
        }}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          {playlist?.coverUrl ? <Image source={{ uri: playlist.coverUrl }} style={styles.heroImage} /> : null}
          <Text style={styles.kicker}>PLAYLIST_DETAIL / CURATED_TRACKS</Text>
          <Text style={styles.title}>{playlist?.title ?? "Loading playlist"}</Text>
          <Text style={styles.description}>
            {playlist?.description ?? "Hydrating curated playlist detail from the existing Sonic Atlas playlist route."}
          </Text>
          <Text style={styles.meta}>
            {playlist?.category?.toUpperCase() ?? "CURATED"} · {tracks.length} TRACKS
          </Text>
        </View>

        <SectionHeading
          eyebrow="Track List"
          title="Tap to play"
        />
        <View style={styles.stack}>
          {tracks.map((track, index) => (
            <TrackRow
              artwork={track.artwork}
              key={`${track.title}-${track.videoId ?? index}`}
              meta={track.videoId ? "STREAM" : `${index + 1}`}
              onPress={() => {
                void setQueue(tracks, index);
              }}
              subtitle={track.artist}
              title={track.title}
            />
          ))}
        </View>
      </ScrollView>
    </ShellScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 22,
    paddingBottom: 160,
  },
  description: {
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 24,
  },
  hero: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  heroImage: {
    borderRadius: 16,
    height: 220,
    width: "100%",
  },
  kicker: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.mono,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  meta: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.mono,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  stack: {
    gap: 10,
  },
  title: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.heading,
    fontSize: 32,
    lineHeight: 36,
  },
});
