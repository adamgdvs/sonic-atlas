import { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { theme } from "@/theme/theme";

export function ShellScreen({ children }: PropsWithChildren) {
  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.background}>
        <View style={styles.grid} />
        <View style={styles.content}>{children}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.gutter,
    paddingTop: 16,
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    opacity: 0.08,
  },
  safeArea: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
});
