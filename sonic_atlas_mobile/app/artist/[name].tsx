import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  createBookmark,
  fetchArtistDiscography,
  fetchArtistEvents,
  deleteBookmark,
  fetchArtistInfo,
  fetchArtistPreview,
  fetchMyBookmarks,
  fetchSimilarArtists,
} from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { usePlayerStore } from "@/store/player-store";
import { theme } from "@/theme/theme";
import { AtlasCard } from "@/ui/atlas-card";
import { GenrePill } from "@/ui/genre-pill";
import { SectionHeading } from "@/ui/section-heading";
import { ShellScreen } from "@/ui/shell-screen";
import { TrackRow } from "@/ui/track-row";

export default function ArtistDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ name: string }>();
  const artistName = decodeURIComponent(params.name ?? "");
  const accessToken = useAuthStore((state) => state.accessToken);
  const authStatus = useAuthStore((state) => state.status);
  const { playTrack, setQueue } = usePlayerStore();

  const infoQuery = useQuery({
    enabled: artistName.length > 0,
    queryKey: ["artist-info", artistName],
    queryFn: () => fetchArtistInfo(artistName),
  });

  const previewQuery = useQuery({
    enabled: artistName.length > 0,
    queryKey: ["artist-preview", artistName],
    queryFn: () => fetchArtistPreview(artistName),
  });

  const similarQuery = useQuery({
    enabled: artistName.length > 0,
    queryKey: ["artist-similar", artistName],
    queryFn: () => fetchSimilarArtists(artistName, 10),
  });

  const eventsQuery = useQuery({
    enabled: artistName.length > 0,
    queryKey: ["artist-events", artistName],
    queryFn: () => fetchArtistEvents(artistName),
  });

  const discographyQuery = useQuery({
    enabled: artistName.length > 0,
    queryKey: ["artist-discography", artistName],
    queryFn: () => fetchArtistDiscography(artistName),
  });

  const bookmarksQuery = useQuery({
    enabled: authStatus === "signed_in" && !!accessToken,
    queryKey: ["my-bookmarks"],
    queryFn: () => fetchMyBookmarks(accessToken!),
  });

  const info = infoQuery.data;
  const tracks = previewQuery.data ?? [];
  const playableTracks = discographyQuery.data?.topTracks.length ? discographyQuery.data.topTracks : tracks;
  const artistId = artistName.trim().toLowerCase();
  const isBookmarked = (bookmarksQuery.data ?? []).some((bookmark) => bookmark.artistId === artistId);

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (!accessToken) {
        throw new Error("Sign in first");
      }

      if (isBookmarked) {
        await deleteBookmark(accessToken, artistId);
        return;
      }

      await createBookmark(accessToken, {
        artistId,
        genres: info?.genres ?? [],
        imageUrl: info?.image ?? null,
        name: info?.name ?? artistName,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["my-bookmarks"] });
    },
  });

  return (
    <ShellScreen>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Artist",
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
          {info?.image || discographyQuery.data?.artistImage ? (
            <Image source={{ uri: info?.image ?? discographyQuery.data?.artistImage ?? undefined }} style={styles.heroImage} />
          ) : null}
          <Text style={styles.kicker}>ARTIST_INTEL / DETAIL_VIEW</Text>
          <Text style={styles.title}>{info?.name ?? artistName}</Text>
          <Text style={styles.meta}>
            {info?.location ? `${info.location} · ` : ""}
            {info?.yearStarted ? `${info.yearStarted} · ` : ""}
            {info?.nbFans ? `${info.nbFans.toLocaleString()} fans` : "Loading profile"}
          </Text>
          <View style={styles.actionRow}>
            <Pressable
              onPress={() => {
                if (authStatus !== "signed_in") {
                  router.push("/my-atlas");
                  return;
                }

                void bookmarkMutation.mutateAsync();
              }}
              style={({ pressed }) => [
                styles.bookmarkButton,
                isBookmarked ? styles.bookmarkButtonActive : null,
                pressed ? styles.bookmarkButtonPressed : null,
              ]}
            >
              <Text style={[styles.bookmarkButtonText, isBookmarked ? styles.bookmarkButtonTextActive : null]}>
                {bookmarkMutation.isPending
                  ? "SYNCING..."
                  : isBookmarked
                    ? "SAVED TO ATLAS"
                    : authStatus === "signed_in"
                      ? "SAVE TO ATLAS"
                      : "SIGN IN TO SAVE"}
              </Text>
            </Pressable>
          </View>
          <Text numberOfLines={6} style={styles.bio}>
            {info?.bio ?? "Loading artist dossier from the Sonic Atlas backend."}
          </Text>
        </View>

        <View style={styles.pills}>
          {(info?.genres ?? []).slice(0, 8).map((genre) => (
            <GenrePill genre={genre} key={genre} />
          ))}
        </View>

        <SectionHeading
          eyebrow="Top Tracks"
          title="Play now"
        />
        <View style={styles.stack}>
          {playableTracks.slice(0, 8).map((track) => (
            <TrackRow
              artwork={track.artwork}
              key={`${track.title}-${track.videoId ?? track.previewUrl}`}
              meta={track.videoId ? "FULL" : "PREVIEW"}
              onPress={() => {
                const index = playableTracks.findIndex(
                  (candidate) =>
                    candidate.title === track.title &&
                    candidate.artist === track.artist &&
                    candidate.videoId === track.videoId
                );

                void setQueue(playableTracks, index >= 0 ? index : 0);
              }}
              subtitle={track.artist}
              title={track.title}
            />
          ))}
        </View>

        <SectionHeading
          eyebrow="Quick Start"
          title="Jump right in"
        />
        <View style={styles.stack}>
          {tracks.slice(0, 1).map((track) => (
            <TrackRow
              artwork={track.artwork}
              key={`${track.title}-single`}
              meta="START"
              onPress={() => {
                void playTrack(track);
              }}
              subtitle={track.artist}
              title={track.title}
            />
          ))}
        </View>

        <SectionHeading
          eyebrow="Similar Artists"
          title="Sonic neighbors"
        />
        <View style={styles.stack}>
          {(similarQuery.data ?? []).slice(0, 6).map((artist) => (
            <AtlasCard
              accent={theme.colors.accent}
              detail={artist.genres.join(" · ") || "Related artist"}
              key={artist.name}
              meta={`${Math.round(artist.match * 100)}% MATCH`}
              onPress={() => router.push(`/artist/${encodeURIComponent(artist.name)}`)}
              title={artist.name}
            />
          ))}
        </View>

        <SectionHeading
          eyebrow="Tour Status"
          title="Upcoming dates"
        />
        <View style={styles.stack}>
          {eventsQuery.data?.hasEvents && eventsQuery.data.nextEvent ? (
            <AtlasCard
              accent={theme.colors.signal}
              detail={`${eventsQuery.data.nextEvent.venue} · ${eventsQuery.data.nextEvent.city}`}
              meta={`${eventsQuery.data.eventCount} DATES · ${eventsQuery.data.nextEvent.date}`}
              title={eventsQuery.data.nextEvent.name}
            />
          ) : (
            <AtlasCard
              accent={theme.colors.borderStrong}
              detail="No upcoming events currently surfaced for this artist."
              meta="TOUR"
              title="No live dates found"
            />
          )}
        </View>

        <SectionHeading
          eyebrow="Discography"
          title="Recent releases"
        />
        <View style={styles.stack}>
          {(discographyQuery.data?.albums ?? []).slice(0, 6).map((album) => (
            <View key={album.id} style={styles.albumRow}>
              {album.coverUrl ? <Image source={{ uri: album.coverUrl }} style={styles.albumCover} /> : <View style={styles.albumCoverFallback} />}
              <View style={styles.albumCopy}>
                <Text style={styles.albumMeta}>ALBUM</Text>
                <Text numberOfLines={2} style={styles.albumTitle}>
                  {album.title}
                </Text>
                <Text style={styles.albumDate}>{album.releaseDate ?? "Release date unavailable"}</Text>
              </View>
            </View>
          ))}
          {!discographyQuery.isLoading && !(discographyQuery.data?.albums ?? []).length ? (
            <AtlasCard
              accent={theme.colors.borderStrong}
              detail="No album data came back for this artist."
              meta="DISCOGRAPHY"
              title="No releases surfaced"
            />
          ) : null}
        </View>
      </ScrollView>
    </ShellScreen>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
  },
  albumCopy: {
    flex: 1,
    gap: 6,
  },
  albumCover: {
    borderRadius: 14,
    height: 92,
    width: 92,
  },
  albumCoverFallback: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.border,
    borderRadius: 14,
    borderWidth: 1,
    height: 92,
    width: 92,
  },
  albumDate: {
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.body,
    fontSize: 13,
  },
  albumMeta: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.mono,
    fontSize: 10,
    letterSpacing: 1.3,
  },
  albumRow: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    padding: 12,
  },
  albumTitle: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.heading,
    fontSize: 17,
    lineHeight: 22,
  },
  bio: {
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 24,
  },
  bookmarkButton: {
    alignItems: "center",
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 14,
  },
  bookmarkButtonActive: {
    backgroundColor: "rgba(255,88,65,0.14)",
    borderColor: theme.colors.accent,
  },
  bookmarkButtonPressed: {
    opacity: 0.85,
  },
  bookmarkButtonText: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
  },
  bookmarkButtonTextActive: {
    color: theme.colors.accent,
  },
  content: {
    gap: 22,
    paddingBottom: 160,
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
  pills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  stack: {
    gap: 10,
  },
  title: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.heading,
    fontSize: 34,
    lineHeight: 38,
  },
});
