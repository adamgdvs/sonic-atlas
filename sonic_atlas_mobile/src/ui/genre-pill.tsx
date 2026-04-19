import { StyleSheet, Text, View } from "react-native";

import { getGenreColor } from "@/lib/genre-color";
import { theme } from "@/theme/theme";

export function GenrePill({ genre }: { genre: string }) {
  return (
    <View style={[styles.pill, { borderColor: getGenreColor(genre) }]}>
      <Text style={styles.label}>{genre}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.mono,
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  pill: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
