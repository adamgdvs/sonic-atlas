import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "@/theme/theme";

type AtlasCardProps = {
  accent: string;
  detail: string;
  meta: string;
  onPress?: () => void;
  title: string;
};

export function AtlasCard({ accent, detail, meta, onPress, title }: AtlasCardProps) {
  const content = (
    <>
      <View style={[styles.rule, { backgroundColor: accent }]} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.meta}>{meta}</Text>
          {onPress ? <Ionicons color={theme.colors.textMuted} name="arrow-forward" size={14} /> : null}
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.detail}>{detail}</Text>
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}>
        {content}
      </Pressable>
    );
  }

  return (
    <View style={styles.card}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardPressed: {
    backgroundColor: theme.colors.surfaceElevated,
  },
  content: {
    gap: 8,
    padding: 14,
  },
  detail: {
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  meta: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rule: {
    height: 3,
    width: "100%",
  },
  title: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.heading,
    fontSize: 18,
    lineHeight: 22,
  },
});
