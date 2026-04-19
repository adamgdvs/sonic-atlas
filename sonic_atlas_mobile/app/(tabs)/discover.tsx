import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { fetchFeed, fetchFeaturedCollections, fetchGenres } from "@/lib/api";
import { AtlasCard } from "@/ui/atlas-card";
import { GenrePill } from "@/ui/genre-pill";
import { SectionHeading } from "@/ui/section-heading";
import { ShellScreen } from "@/ui/shell-screen";
import { theme } from "@/theme/theme";

export default function DiscoverScreen() {
  const router = useRouter();
  const featuredQuery = useQuery({
    queryKey: ["featured-collections"],
    queryFn: () => fetchFeaturedCollections("featured"),
  });

  const genresQuery = useQuery({
    queryKey: ["genres", 16],
    queryFn: () => fetchGenres(16),
  });

  const feedQuery = useQuery({
    queryKey: ["feed"],
    queryFn: fetchFeed,
  });

  return (
    <ShellScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>SONIC_ATLAS / DISCOVER</Text>
          <Text style={styles.title}>Explore sonic neighborhoods.</Text>
          <Text style={styles.subtitle}>
            Curated playlists, genre quick-links, and a live pulse of what people are listening to right now.
          </Text>
        </View>

        <SectionHeading
          eyebrow="Featured"
          title="Curated lanes"
        />
        <View style={styles.grid}>
          {(featuredQuery.data ?? []).slice(0, 8).map((item) => (
            <AtlasCard
              key={item.id}
              accent={item.accent}
              title={item.title}
              detail={item.description}
              meta={item.kind.toUpperCase()}
              onPress={() => router.push(`/playlist/${encodeURIComponent(item.id)}`)}
            />
          ))}
          {featuredQuery.isLoading ? (
            <AtlasCard accent={theme.colors.surface} title="Loading…" detail="" meta="FETCH" />
          ) : null}
        </View>

        <SectionHeading
          eyebrow="Genres"
          title="Quick links"
        />
        <View style={styles.pills}>
          {(genresQuery.data ?? []).map((genre) => (
            <GenrePill key={genre.name} genre={genre.name} />
          ))}
        </View>

        <SectionHeading
          eyebrow="Frequency Hub"
          title="Live activity"
        />
        <View style={styles.stack}>
          {(feedQuery.data ?? []).slice(0, 5).map((entry) => (
            <AtlasCard
              key={`${entry.artistName}-${entry.timestamp}`}
              accent={theme.colors.signal}
              title={entry.artistName}
              detail={entry.genres.join(" · ") || "Scan event"}
              meta={entry.timeAgo}
              onPress={() => router.push(`/artist/${encodeURIComponent(entry.artistName)}`)}
            />
          ))}
          {!feedQuery.isLoading && !feedQuery.data?.length ? (
            <AtlasCard
              accent={theme.colors.borderStrong}
              title="No activity yet"
              detail="Scan and play some artists to start building the feed."
              meta="LIVE"
            />
          ) : null}
        </View>
      </ScrollView>
    </ShellScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 24,
    paddingBottom: 120,
  },
  hero: {
    gap: 14,
    marginBottom: 8,
  },
  kicker: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.mono,
    fontSize: 11,
    letterSpacing: 1.8,
  },
  title: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.heading,
    fontSize: 36,
    lineHeight: 40,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 24,
    maxWidth: 520,
  },
  grid: {
    gap: 12,
  },
  pills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  stack: {
    gap: 10,
  },
});
