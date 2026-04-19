import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/theme/theme";

type SectionHeadingProps = {
  eyebrow: string;
  subtitle?: string;
  title: string;
};

export function SectionHeading({ eyebrow, subtitle, title }: SectionHeadingProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  eyebrow: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  title: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.heading,
    fontSize: 24,
    lineHeight: 28,
  },
});
