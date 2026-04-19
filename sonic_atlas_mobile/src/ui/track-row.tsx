import Ionicons from "@expo/vector-icons/Ionicons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "@/theme/theme";

type TrackRowProps = {
  artwork?: string | null;
  meta?: string;
  onPress?: () => void;
  subtitle: string;
  title: string;
};

export function TrackRow({ artwork, meta, onPress, subtitle, title }: TrackRowProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}>
      {artwork ? (
        <Image source={{ uri: artwork }} style={styles.artwork} />
      ) : (
        <View style={styles.fallbackArt}>
          <View style={styles.fallbackDot} />
        </View>
      )}
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        <Text numberOfLines={1} style={styles.subtitle}>
          {subtitle}
        </Text>
      </View>
      <View style={styles.trailing}>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        <Ionicons color={theme.colors.textMuted} name="play-circle-outline" size={22} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  artwork: {
    borderRadius: 10,
    height: 52,
    width: 52,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  fallbackArt: {
    alignItems: "center",
    backgroundColor: "#0B0B0B",
    borderColor: theme.colors.border,
    borderRadius: 10,
    borderWidth: 1,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  fallbackDot: {
    backgroundColor: theme.colors.accent,
    borderRadius: 7,
    height: 14,
    width: 14,
  },
  meta: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  row: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowPressed: {
    backgroundColor: theme.colors.surfaceElevated,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.body,
    fontSize: 13,
  },
  title: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.heading,
    fontSize: 16,
  },
  trailing: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
});
