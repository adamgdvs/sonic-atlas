import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useProgress } from "react-native-track-player";

import { usePlayerStore } from "@/store/player-store";
import { theme } from "@/theme/theme";

export function MiniPlayer() {
  const router = useRouter();
  const { currentTrack, isPlaying, togglePlayback } = usePlayerStore();
  const progress = useProgress();
  const progressWidth: `${number}%` =
    progress.duration && progress.duration > 0
      ? `${Math.min(100, Math.max(0, (progress.position / progress.duration) * 100))}%`
      : "0%";

  return (
    <Pressable onPress={() => router.push("/(tabs)/now-playing")} style={({ pressed }) => [styles.container, pressed ? styles.pressed : null]}>
      <View style={[styles.progress, { width: progressWidth }]} />
      <View style={styles.inner}>
        <View style={styles.record}>
          {currentTrack.artwork ? <Image source={{ uri: currentTrack.artwork }} style={styles.artwork} /> : null}
          {currentTrack.artwork ? <View pointerEvents="none" style={styles.grooveRing} /> : null}
          <View pointerEvents="none" style={styles.recordDot} />
        </View>
        <View style={styles.copy}>
          <Text numberOfLines={1} style={styles.title}>
            {currentTrack.title}
          </Text>
          <Text numberOfLines={1} style={styles.subtitle}>
            {currentTrack.artist}
          </Text>
        </View>
        <Pressable
          hitSlop={8}
          onPress={(event) => {
            event.stopPropagation();
            togglePlayback();
          }}
          style={styles.button}
        >
          <Ionicons color={theme.colors.background} name={isPlaying ? "pause" : "play"} size={20} />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  artwork: {
    borderRadius: 18,
    height: 36,
    width: 36,
  },
  button: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  container: {
    backgroundColor: "rgba(10,10,10,0.96)",
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    bottom: 86,
    left: 16,
    overflow: "hidden",
    position: "absolute",
    right: 16,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  inner: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pressed: {
    opacity: 0.96,
  },
  progress: {
    backgroundColor: theme.colors.accent,
    height: 3,
    width: "0%",
  },
  grooveRing: {
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 18,
    borderWidth: 1,
    height: 28,
    position: "absolute",
    width: 28,
  },
  record: {
    alignItems: "center",
    backgroundColor: "#080808",
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  recordDot: {
    backgroundColor: theme.colors.accent,
    borderRadius: 6,
    height: 12,
    position: "absolute",
    width: 12,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 13,
  },
  title: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.heading,
    fontSize: 15,
  },
});
