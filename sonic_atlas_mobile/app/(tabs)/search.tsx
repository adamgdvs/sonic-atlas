import { useRouter } from "expo-router";
import { useDeferredValue, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { fetchAutocomplete, searchArtists, searchPlaylists } from "@/lib/api";
import { AtlasCard } from "@/ui/atlas-card";
import { SectionHeading } from "@/ui/section-heading";
import { ShellScreen } from "@/ui/shell-screen";
import { theme } from "@/theme/theme";

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const trimmedQuery = deferredQuery.trim();

  const enabled = trimmedQuery.length >= 2;
  const autocompleteQuery = useQuery({
    queryKey: ["autocomplete", trimmedQuery],
    queryFn: () => fetchAutocomplete(trimmedQuery),
    enabled,
  });

  const artistSearchQuery = useQuery({
    queryKey: ["artist-search", trimmedQuery],
    queryFn: () => searchArtists(trimmedQuery),
    enabled,
  });

  const playlistSearchQuery = useQuery({
    queryKey: ["playlist-search", trimmedQuery],
    queryFn: () => searchPlaylists(trimmedQuery),
    enabled,
  });

  return (
    <ShellScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>GLOBAL_SEARCH</Text>
        <Text style={styles.title}>Search artists, genres, and playlists.</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setQuery}
          placeholder="search signal"
          placeholderTextColor={theme.colors.textMuted}
          style={styles.input}
          value={query}
        />

        <SectionHeading
          eyebrow="Suggestions"
          title="Autocomplete"
        />
        <View style={styles.stack}>
          {(autocompleteQuery.data ?? []).map((item) => (
            <AtlasCard
              key={`${item.type}-${item.name}`}
              accent={item.type === "genre" ? theme.colors.signal : theme.colors.accent}
              detail={item.subtitle}
              meta={item.type.toUpperCase()}
              onPress={item.type === "artist" ? () => router.push(`/artist/${encodeURIComponent(item.name)}`) : undefined}
              title={item.name}
            />
          ))}
        </View>

        <SectionHeading
          eyebrow="Artists"
          title="Artist results"
        />
        <View style={styles.stack}>
          {(artistSearchQuery.data ?? []).map((item) => (
            <AtlasCard
              key={item.id}
              accent={theme.colors.accent}
              detail={item.subtitle}
              meta="ARTIST"
              onPress={() => router.push(`/artist/${encodeURIComponent(item.name)}`)}
              title={item.name}
            />
          ))}
        </View>

        <SectionHeading
          eyebrow="Playlists"
          title="Playlist results"
        />
        <View style={styles.stack}>
          {(playlistSearchQuery.data ?? []).map((item) => (
            <AtlasCard
              key={item.id}
              accent={theme.colors.signal}
              detail={item.description}
              meta={`${item.category.toUpperCase()}${item.trackCount ? ` · ${item.trackCount}` : ""}`}
              onPress={() => router.push(`/playlist/${encodeURIComponent(item.id)}`)}
              title={item.title}
            />
          ))}
          {!enabled ? (
            <AtlasCard
              accent={theme.colors.borderStrong}
              detail="Search for an artist, genre, or playlist name."
              meta="READY"
              title="Start typing"
            />
          ) : null}
        </View>
      </ScrollView>
    </ShellScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 18,
    paddingBottom: 120,
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
  title: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.heading,
    fontSize: 30,
    lineHeight: 34,
  },
});
