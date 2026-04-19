import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useProgress } from "react-native-track-player";

import {
  addTrackToUserPlaylist,
  fetchArtistInfo,
  fetchArtistPreview,
  fetchGenreArtists,
  fetchMyPlaylists,
} from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { usePlayerStore } from "@/store/player-store";
import { theme } from "@/theme/theme";
import { ShellScreen } from "@/ui/shell-screen";
import { TrackRow } from "@/ui/track-row";

type ActivePanel = "history" | "queue" | "save";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainderSeconds = Math.floor(seconds % 60);
  return `${minutes}:${String(remainderSeconds).padStart(2, "0")}`;
}

export default function NowPlayingScreen() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const authStatus = useAuthStore((state) => state.status);
  const {
    clearHistory,
    currentTrack,
    currentTrackIndex,
    history,
    isPlaying,
    playTrack,
    queue,
    radioMode,
    setQueue,
    setRadioMode,
    skipNext,
    skipPrevious,
    togglePlayback,
  } = usePlayerStore();
  const [activePanel, setActivePanel] = useState<ActivePanel>("queue");
  const progress = useProgress();
  const progressWidth: `${number}%` =
    progress.duration && progress.duration > 0
      ? `${Math.min(100, Math.max(0, (progress.position / progress.duration) * 100))}%`
      : "0%";

  const upNext = useMemo(
    () => queue.filter((_, index) => index > currentTrackIndex).slice(0, 8),
    [currentTrackIndex, queue]
  );

  const playlistsQuery = useQuery({
    enabled: authStatus === "signed_in" && !!accessToken,
    queryKey: ["my-playlists"],
    queryFn: () => fetchMyPlaylists(accessToken!),
  });

  const surgeMutation = useMutation({
    mutationFn: async () => {
      const artistInfo = await fetchArtistInfo(currentTrack.artist);
      const primaryGenre = artistInfo.genres[0];

      if (!primaryGenre) {
        throw new Error("No genre context available for this track");
      }

      const genreArtists = await fetchGenreArtists(primaryGenre, 18);
      const shuffledArtists = genreArtists
        .filter((artist) => artist.name.toLowerCase() !== currentTrack.artist.toLowerCase())
        .sort(() => Math.random() - 0.5);
      const selectedArtist = shuffledArtists[0];

      if (!selectedArtist) {
        throw new Error("No related artists found for surge");
      }

      const previewTracks = await fetchArtistPreview(selectedArtist.name);
      const playableTracks = previewTracks.slice(0, 5);

      if (!playableTracks.length) {
        throw new Error("No playable tracks found for surge");
      }

      await setQueue(playableTracks, 0);

      return {
        artist: selectedArtist.name,
        genre: primaryGenre,
      };
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (playlistId: string) => {
      if (!accessToken) {
        throw new Error("Sign in to save tracks");
      }

      return addTrackToUserPlaylist(accessToken, playlistId, currentTrack);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["my-playlists"] });
    },
  });

  return (
    <ShellScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>NOW_PLAYING</Text>
        <Text style={styles.title}>Your vinyl player.</Text>

        <View style={styles.playerSurface}>
          {currentTrack.artwork ? (
            <Image blurRadius={40} source={{ uri: currentTrack.artwork }} style={styles.backgroundArt} />
          ) : null}
          <View style={styles.backgroundOverlay} />
          <View style={styles.record}>
            <View style={styles.grooveRingLarge} />
            <View style={styles.grooveRingSmall} />
            <View style={styles.recordInner}>
              {currentTrack.artwork ? <Image source={{ uri: currentTrack.artwork }} style={styles.albumArt} /> : null}
              <View pointerEvents="none" style={styles.recordLabel}>
                <View style={styles.spindle} />
              </View>
            </View>
          </View>

          <View style={styles.trackMeta}>
            <Text style={styles.trackTitle}>{currentTrack.title}</Text>
            <Text style={styles.trackArtist}>{currentTrack.artist}</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusChip}>
                <Text style={styles.statusText}>{currentTrack.videoId ? "FULL TRACK" : "PREVIEW"}</Text>
              </View>
              {queue.length ? (
                <View style={styles.statusChip}>
                  <Text style={styles.statusText}>QUEUE {Math.max(1, currentTrackIndex + 1)}/{queue.length}</Text>
                </View>
              ) : null}
              {radioMode ? (
                <View style={[styles.statusChip, styles.statusChipActive]}>
                  <Text style={[styles.statusText, styles.statusTextActive]}>RADIO ON</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.progressBlock}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: progressWidth }]} />
            </View>
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatTime(progress.position)}</Text>
              <Text style={styles.timeText}>
                -{formatTime(Math.max(0, (progress.duration || 0) - progress.position))}
              </Text>
            </View>
          </View>

          <View style={styles.controls}>
            <Ionicons color={theme.colors.textMuted} name="shuffle" size={22} />
            <Pressable
              onPress={() => {
                void skipPrevious();
              }}
            >
              <Ionicons color={theme.colors.textPrimary} name="play-skip-back" size={26} />
            </Pressable>
            <Pressable
              onPress={() => {
                void togglePlayback();
              }}
              style={styles.playButton}
            >
              <Ionicons color={theme.colors.background} name={isPlaying ? "pause" : "play"} size={28} />
            </Pressable>
            <Pressable
              onPress={() => {
                void skipNext();
              }}
            >
              <Ionicons color={theme.colors.textPrimary} name="play-skip-forward" size={26} />
            </Pressable>
            <Ionicons color={theme.colors.textMuted} name="repeat" size={22} />
          </View>
        </View>

        <View style={styles.utilityRow}>
          <UtilityChip active={activePanel === "queue"} label="Queue" onPress={() => setActivePanel("queue")} />
          <UtilityChip active={activePanel === "history"} label="History" onPress={() => setActivePanel("history")} />
          <UtilityChip active={radioMode} label={radioMode ? "Radio On" : "Radio"} onPress={() => setRadioMode(!radioMode)} />
          <UtilityChip
            active={surgeMutation.isPending}
            label={surgeMutation.isPending ? "Surging" : "Surge"}
            onPress={() => {
              void surgeMutation.mutateAsync();
            }}
          />
          <UtilityChip active={activePanel === "save"} label="Save" onPress={() => setActivePanel("save")} />
        </View>

        {surgeMutation.data ? (
          <View style={styles.feedbackBanner}>
            <Text style={styles.feedbackText}>
              Surge jumped into {surgeMutation.data.artist} via the {surgeMutation.data.genre} lane.
            </Text>
          </View>
        ) : null}

        {surgeMutation.error ? (
          <View style={styles.feedbackBanner}>
            <Text style={styles.feedbackText}>
              {surgeMutation.error instanceof Error ? surgeMutation.error.message : "Surge failed"}
            </Text>
          </View>
        ) : null}

        {activePanel === "queue" ? (
          <View style={styles.queuePanel}>
            <Text style={styles.queueLabel}>QUEUE / {queue.length} TRACKS</Text>
            <Text style={styles.queueCopy}>
              Tap a track to jump to it.
            </Text>
            <View style={styles.stack}>
              <TrackRow
                artwork={currentTrack.artwork}
                meta="LIVE"
                onPress={() => {
                  if (queue.length) {
                    void setQueue(queue, currentTrackIndex);
                  }
                }}
                subtitle={currentTrack.artist}
                title={currentTrack.title}
              />
              {upNext.map((track, index) => (
                <TrackRow
                  artwork={track.artwork}
                  key={`${track.title}-${track.videoId ?? `${track.artist}-${index}`}`}
                  meta={`UP ${currentTrackIndex + index + 2}`}
                  onPress={() => {
                    void setQueue(queue, currentTrackIndex + index + 1);
                  }}
                  subtitle={track.artist}
                  title={track.title}
                />
              ))}
              {upNext.length === 0 ? (
                <View style={styles.emptyPanel}>
                  <Text style={styles.emptyLabel}>Queue ends here</Text>
                  <Text style={styles.emptyCopy}>
                    Add more tracks from artist or playlist detail, or switch radio on so related tracks append automatically.
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {activePanel === "history" ? (
          <View style={styles.queuePanel}>
            <View style={styles.panelHeader}>
              <Text style={styles.queueLabel}>HISTORY / {history.length} TRACKS</Text>
              <Pressable
                onPress={() => {
                  void clearHistory();
                }}
              >
                <Text style={styles.clearText}>CLEAR</Text>
              </Pressable>
            </View>
            <Text style={styles.queueCopy}>Your recent listening history — tap any track to play it again.</Text>
            <View style={styles.stack}>
              {history.map((entry) => (
                <TrackRow
                  artwork={entry.track.artwork}
                  key={`${entry.playedAt}-${entry.track.title}`}
                  meta={new Date(entry.playedAt).toLocaleDateString()}
                  onPress={() => {
                    void playTrack(entry.track);
                  }}
                  subtitle={entry.track.artist}
                  title={entry.track.title}
                />
              ))}
              {!history.length ? (
                <View style={styles.emptyPanel}>
                  <Text style={styles.emptyLabel}>No history yet</Text>
                  <Text style={styles.emptyCopy}>Play a few tracks and they will show up here for quick relaunch.</Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {activePanel === "save" ? (
          <View style={styles.queuePanel}>
            <Text style={styles.queueLabel}>SAVE / PLAYLISTS</Text>
            <Text style={styles.queueCopy}>
              Save the active track into one of your authenticated My Atlas playlists.
            </Text>
            {authStatus !== "signed_in" ? (
              <View style={styles.emptyPanel}>
                <Text style={styles.emptyLabel}>Sign in required</Text>
                <Text style={styles.emptyCopy}>Use the My Atlas tab to sign in before saving tracks.</Text>
              </View>
            ) : (
              <View style={styles.stack}>
                {playlistsQuery.data?.map((playlist) => (
                  <Pressable
                    key={playlist.id}
                    onPress={() => {
                      void saveMutation.mutateAsync(playlist.id);
                    }}
                    style={({ pressed }) => [styles.playlistSaveRow, pressed ? styles.playlistSaveRowPressed : null]}
                  >
                    <View style={styles.copy}>
                      <Text style={styles.saveTitle}>{playlist.name}</Text>
                      <Text style={styles.saveSubtitle}>
                        {playlist.trackCount} tracks · {playlist.description ?? "Personal playlist lane"}
                      </Text>
                    </View>
                    <Ionicons color={theme.colors.accent} name="add-circle-outline" size={22} />
                  </Pressable>
                ))}
                {!playlistsQuery.isLoading && !playlistsQuery.data?.length ? (
                  <View style={styles.emptyPanel}>
                    <Text style={styles.emptyLabel}>No playlists available</Text>
                    <Text style={styles.emptyCopy}>Create a playlist in My Atlas, then come back here to save tracks.</Text>
                  </View>
                ) : null}
                {saveMutation.error ? (
                  <View style={styles.feedbackBanner}>
                    <Text style={styles.feedbackText}>
                      {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
                    </Text>
                  </View>
                ) : null}
                {saveMutation.isSuccess ? (
                  <View style={styles.feedbackBanner}>
                    <Text style={styles.feedbackText}>Track saved to your playlist.</Text>
                  </View>
                ) : null}
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>
    </ShellScreen>
  );
}

function UtilityChip({
  active,
  label,
  onPress,
}: {
  active?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.utilityChip, active ? styles.utilityChipActive : null, pressed ? styles.utilityChipPressed : null]}>
      <Text style={[styles.utilityText, active ? styles.utilityTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  albumArt: {
    borderRadius: 74,
    height: 148,
    width: 148,
  },
  backgroundArt: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.42,
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(6,6,6,0.72)",
  },
  clearText: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.mono,
    fontSize: 10,
    letterSpacing: 1.3,
  },
  content: {
    gap: 22,
    paddingBottom: 120,
  },
  controls: {
    alignItems: "center",
    flexDirection: "row",
    gap: 20,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  emptyCopy: {
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 21,
  },
  emptyLabel: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.heading,
    fontSize: 18,
    lineHeight: 22,
  },
  emptyPanel: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  feedbackBanner: {
    backgroundColor: "rgba(255,88,65,0.08)",
    borderColor: "rgba(255,88,65,0.24)",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  feedbackText: {
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  grooveRingLarge: {
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 145,
    borderWidth: 2,
    height: 230,
    position: "absolute",
    width: 230,
  },
  grooveRingSmall: {
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 110,
    borderWidth: 1,
    height: 180,
    position: "absolute",
    width: 180,
  },
  kicker: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.mono,
    fontSize: 11,
    letterSpacing: 1.8,
  },
  panelHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  playButton: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: 40,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  playerSurface: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: 18,
    overflow: "hidden",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  playlistSaveRow: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  playlistSaveRowPressed: {
    backgroundColor: theme.colors.surfaceElevated,
  },
  progressBlock: {
    gap: 8,
    width: "100%",
  },
  progressFill: {
    backgroundColor: theme.colors.accent,
    height: "100%",
  },
  progressTrack: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    height: 5,
    overflow: "hidden",
    width: "100%",
  },
  queueCopy: {
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 22,
  },
  queueLabel: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.mono,
    fontSize: 11,
    letterSpacing: 1.5,
  },
  queuePanel: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  record: {
    alignItems: "center",
    backgroundColor: "#0A0A0A",
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 160,
    borderWidth: 1,
    height: 260,
    justifyContent: "center",
    shadowColor: theme.colors.accent,
    shadowOpacity: 0.35,
    shadowRadius: 28,
    width: 260,
  },
  recordInner: {
    alignItems: "center",
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 120,
    borderWidth: 18,
    height: 180,
    justifyContent: "center",
    overflow: "hidden",
    width: 180,
  },
  recordLabel: {
    alignItems: "center",
    borderRadius: 40,
    height: 80,
    justifyContent: "center",
    position: "absolute",
    width: 80,
  },
  saveSubtitle: {
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.body,
    fontSize: 13,
  },
  saveTitle: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.heading,
    fontSize: 16,
  },
  spindle: {
    backgroundColor: "#111111",
    borderColor: "rgba(255,255,255,0.4)",
    borderRadius: 7,
    borderWidth: 1,
    height: 14,
    width: 14,
  },
  stack: {
    gap: 10,
  },
  statusChip: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusChipActive: {
    backgroundColor: "rgba(255,88,65,0.12)",
    borderColor: "rgba(255,88,65,0.28)",
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  statusText: {
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.mono,
    fontSize: 10,
    letterSpacing: 1.1,
  },
  statusTextActive: {
    color: theme.colors.accent,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeText: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  title: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.heading,
    fontSize: 30,
    lineHeight: 34,
  },
  trackArtist: {
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.body,
    fontSize: 15,
  },
  trackMeta: {
    alignItems: "center",
    gap: 10,
  },
  trackTitle: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.heading,
    fontSize: 24,
    textAlign: "center",
  },
  utilityChip: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  utilityChipActive: {
    backgroundColor: "rgba(255,88,65,0.12)",
    borderColor: theme.colors.accent,
  },
  utilityChipPressed: {
    opacity: 0.84,
  },
  utilityRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  utilityText: {
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  utilityTextActive: {
    color: theme.colors.accent,
  },
});
