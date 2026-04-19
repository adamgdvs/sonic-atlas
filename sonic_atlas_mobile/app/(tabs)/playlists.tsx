import { useRouter } from "expo-router";
import { useDeferredValue, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { fetchCatalog, fetchPlaylistCollections } from "@/lib/api";
import { AtlasCard } from "@/ui/atlas-card";
import { SectionHeading } from "@/ui/section-heading";
import { ShellScreen } from "@/ui/shell-screen";
import { theme } from "@/theme/theme";

const PLAYLIST_TABS = ["featured", "genre", "mood", "activity", "era"] as const;

export default function PlaylistsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<(typeof PLAYLIST_TABS)[number]>("featured");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const trimmedQuery = deferredQuery.trim();

  const collectionsQuery = useQuery({
    queryKey: ["playlist-collections", activeTab, trimmedQuery],
    queryFn: () =>
      fetchPlaylistCollections({
        collection: activeTab,
        limit: trimmedQuery ? 20 : 12,
        query: trimmedQuery || undefined,
      }),
  });

  const catalogQuery = useQuery({
    queryKey: ["playlist-catalog", activeTab],
    queryFn: () => fetchCatalog(12),
    enabled: trimmedQuery.length === 0,
  });

  const collectionItems = collectionsQuery.data?.items ?? [];
  const collectionSubtitle =
    trimmedQuery.length >= 2
      ? "Showing curated catalog + live Deezer matches"
      : `Browsing the ${activeTab} lane`;

  return (
    <ShellScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>PLAYLIST_HUB / CURATED_LANES</Text>
          <Text style={styles.title}>418 curated playlists across mood, genre, era, and activity.</Text>
          <Text style={styles.subtitle}>
            Search the full catalog or browse by lane. Live Deezer editorial playlists appear at the top of search results.
          </Text>
        </View>

        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setQuery}
          placeholder="search catalog or deezer playlists"
          placeholderTextColor={theme.colors.textMuted}
          style={styles.input}
          value={query}
        />

        <ScrollView
          contentContainerStyle={styles.tabRow}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {PLAYLIST_TABS.map((tab) => {
            const selected = tab === activeTab;

            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={({ pressed }) => [
                  styles.tab,
                  selected ? styles.tabActive : null,
                  pressed ? styles.tabPressed : null,
                ]}
              >
                <Text style={[styles.tabText, selected ? styles.tabTextActive : null]}>{tab}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <SectionHeading
          eyebrow={trimmedQuery.length >= 2 ? "Search Results" : activeTab}
          title={trimmedQuery.length >= 2 ? "Curated + live matches" : "Editorial fronts"}
          subtitle={collectionSubtitle}
        />
        <View style={styles.stack}>
          {collectionItems.map((item) => (
            <AtlasCard
              key={item.id}
              accent={item.accent}
              detail={item.description}
              meta={item.kind.toUpperCase()}
              onPress={() => router.push(`/playlist/${encodeURIComponent(item.id)}`)}
              title={item.title}
            />
          ))}
          {!collectionsQuery.isLoading && collectionItems.length === 0 ? (
            <AtlasCard
              accent={theme.colors.borderStrong}
              detail="Try a broader search or switch to another lane."
              meta="EMPTY"
              title="No collections matched"
            />
          ) : null}
        </View>

        {trimmedQuery.length === 0 ? (
          <>
            <SectionHeading
              eyebrow="Catalog"
              title="More curated lanes"
            />
            <View style={styles.stack}>
              {catalogQuery.data?.map((item) => (
                <AtlasCard
                  key={item.id}
                  accent={item.accent}
                  detail={item.description}
                  meta={item.category.toUpperCase()}
                  onPress={() => router.push(`/playlist/${encodeURIComponent(item.id)}`)}
                  title={item.title}
                />
              ))}
            </View>
          </>
        ) : null}
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
    gap: 12,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.body,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  kicker: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.mono,
    fontSize: 11,
    letterSpacing: 1.8,
  },
  stack: {
    gap: 10,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 24,
  },
  tab: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  tabActive: {
    backgroundColor: "rgba(255,88,65,0.12)",
    borderColor: theme.colors.accent,
  },
  tabPressed: {
    opacity: 0.8,
  },
  tabRow: {
    gap: 10,
  },
  tabText: {
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  tabTextActive: {
    color: theme.colors.accent,
  },
  title: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.heading,
    fontSize: 30,
    lineHeight: 36,
  },
});
