import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import {
  createUserPlaylist,
  fetchMyBookmarks,
  fetchMyPlaylists,
} from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { theme } from "@/theme/theme";
import { AtlasCard } from "@/ui/atlas-card";
import { ShellScreen } from "@/ui/shell-screen";

export default function MyAtlasScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const errorMessage = useAuthStore((state) => state.errorMessage);
  const signIn = useAuthStore((state) => state.signIn);
  const signOut = useAuthStore((state) => state.signOut);
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const [email, setEmail] = useState("explorer@sonicatlas.com");
  const [password, setPassword] = useState("signalpass");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const bookmarksQuery = useQuery({
    enabled: status === "signed_in" && !!accessToken,
    queryKey: ["my-bookmarks"],
    queryFn: () => fetchMyBookmarks(accessToken!),
  });

  const playlistsQuery = useQuery({
    enabled: status === "signed_in" && !!accessToken,
    queryKey: ["my-playlists"],
    queryFn: () => fetchMyPlaylists(accessToken!),
  });

  const playlistMutation = useMutation({
    mutationFn: async () => {
      if (!accessToken) {
        throw new Error("You need to sign in first");
      }

      return createUserPlaylist(accessToken, {
        description,
        name,
      });
    },
    onSuccess: async () => {
      setDescription("");
      setName("");
      await queryClient.invalidateQueries({ queryKey: ["my-playlists"] });
    },
  });

  const createPlaylistDisabled = !name.trim() || playlistMutation.isPending;

  async function handleSignIn() {
    setLocalError(null);

    try {
      await signIn(email, password);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign in failed";
      setLocalError(message);
    }
  }

  return (
    <ShellScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>MY_ATLAS</Text>
          <Text style={styles.title}>Your artists, playlists, and listening history.</Text>
          <Text style={styles.subtitle}>
            Sign in to access your bookmarked artists, saved playlists, and personalized atlas.
          </Text>
        </View>

        {status !== "signed_in" ? (
          <View style={styles.stack}>
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Sign in or create a test account</Text>
              <Text style={styles.panelCopy}>
                Use your Sonic Atlas account credentials. New here? Enter any email and password to create a free account.
              </Text>

              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="email"
                placeholderTextColor={theme.colors.textMuted}
                style={styles.input}
                value={email}
              />
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setPassword}
                placeholder="password"
                placeholderTextColor={theme.colors.textMuted}
                secureTextEntry
                style={styles.input}
                value={password}
              />

              <Pressable
                onPress={() => {
                  void handleSignIn();
                }}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed ? styles.primaryButtonPressed : null,
                  status === "loading" ? styles.primaryButtonDisabled : null,
                ]}
              >
                <Text style={styles.primaryButtonText}>
                  {status === "loading" ? "CONNECTING..." : "ENTER MY ATLAS"}
                </Text>
              </Pressable>

              {localError || errorMessage ? (
                <Text style={styles.errorText}>{localError ?? errorMessage}</Text>
              ) : null}
            </View>

            <AtlasCard
              accent={theme.colors.signal}
              detail="Save your favourite artists, create playlists, and track your listening history."
              meta="MY ATLAS"
              title="Your personal music atlas"
            />
          </View>
        ) : (
          <View style={styles.stack}>
            <View style={styles.accountRow}>
              <View style={styles.accountBlock}>
                <Text style={styles.accountLabel}>SIGNED IN</Text>
                <Text style={styles.accountValue}>{user?.email ?? user?.name ?? "Mobile explorer"}</Text>
              </View>
              <Pressable
                onPress={() => {
                  void signOut();
                }}
                style={({ pressed }) => [styles.secondaryButton, pressed ? styles.secondaryButtonPressed : null]}
              >
                <Text style={styles.secondaryButtonText}>SIGN OUT</Text>
              </Pressable>
            </View>

            <View style={styles.dualStats}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{bookmarksQuery.data?.length ?? 0}</Text>
                <Text style={styles.statLabel}>Bookmarked artists</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{playlistsQuery.data?.length ?? 0}</Text>
                <Text style={styles.statLabel}>Created playlists</Text>
              </View>
            </View>

            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Create a playlist</Text>
              <TextInput
                onChangeText={setName}
                placeholder="playlist name"
                placeholderTextColor={theme.colors.textMuted}
                style={styles.input}
                value={name}
              />
              <TextInput
                onChangeText={setDescription}
                placeholder="description"
                placeholderTextColor={theme.colors.textMuted}
                style={[styles.input, styles.textArea]}
                value={description}
              />
              <Pressable
                disabled={createPlaylistDisabled}
                onPress={() => {
                  void playlistMutation.mutateAsync();
                }}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed ? styles.primaryButtonPressed : null,
                  createPlaylistDisabled ? styles.primaryButtonDisabled : null,
                ]}
              >
                <Text style={styles.primaryButtonText}>
                  {playlistMutation.isPending ? "CREATING..." : "CREATE PLAYLIST"}
                </Text>
              </Pressable>
              {playlistMutation.error ? (
                <Text style={styles.errorText}>
                  {playlistMutation.error instanceof Error ? playlistMutation.error.message : "Failed to create playlist"}
                </Text>
              ) : null}
            </View>

            <Text style={styles.sectionTitle}>Bookmarked artists</Text>
            <View style={styles.stack}>
              {bookmarksQuery.data?.map((bookmark) => (
                <AtlasCard
                  key={bookmark.id}
                  accent={theme.colors.accent}
                  detail={bookmark.genres.join(" · ") || "Saved artist"}
                  meta={new Date(bookmark.createdAt).toLocaleDateString()}
                  onPress={() => router.push(`/artist/${encodeURIComponent(bookmark.name)}`)}
                  title={bookmark.name}
                />
              ))}
              {!bookmarksQuery.isLoading && !bookmarksQuery.data?.length ? (
                <AtlasCard
                  accent={theme.colors.borderStrong}
                  detail="Use the bookmark action on an artist page to start building your atlas."
                  meta="EMPTY"
                  title="No saved artists yet"
                />
              ) : null}
            </View>

            <Text style={styles.sectionTitle}>Your playlists</Text>
            <View style={styles.stack}>
              {playlistsQuery.data?.map((playlist) => (
                <AtlasCard
                  key={playlist.id}
                  accent={theme.colors.signal}
                  detail={playlist.description ?? "Personal playlist lane"}
                  meta={`${playlist.trackCount} TRACKS`}
                  title={playlist.name}
                />
              ))}
              {!playlistsQuery.isLoading && !playlistsQuery.data?.length ? (
                <AtlasCard
                  accent={theme.colors.borderStrong}
                  detail="Create one above and start saving tracks into it in the next mobile pass."
                  meta="EMPTY"
                  title="No playlists yet"
                />
              ) : null}
            </View>
          </View>
        )}
      </ScrollView>
    </ShellScreen>
  );
}

const styles = StyleSheet.create({
  accountBlock: {
    flex: 1,
    gap: 4,
  },
  accountLabel: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.mono,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  accountRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  accountValue: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.heading,
    fontSize: 18,
    lineHeight: 22,
  },
  content: {
    gap: 18,
    paddingBottom: 160,
  },
  dualStats: {
    flexDirection: "row",
    gap: 12,
  },
  errorText: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 18,
  },
  hero: {
    gap: 14,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  kicker: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.mono,
    fontSize: 11,
    letterSpacing: 1.8,
  },
  panel: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  panelCopy: {
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 21,
  },
  panelTitle: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.heading,
    fontSize: 20,
    lineHeight: 24,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.sm,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },
  primaryButtonText: {
    color: theme.colors.background,
    fontFamily: theme.fonts.mono,
    fontSize: 11,
    letterSpacing: 1.6,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.heading,
    fontSize: 24,
    lineHeight: 28,
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 14,
  },
  secondaryButtonPressed: {
    backgroundColor: theme.colors.surfaceElevated,
  },
  secondaryButtonText: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
  },
  stack: {
    gap: 12,
  },
  statCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flex: 1,
    gap: 10,
    padding: 16,
  },
  statLabel: {
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 18,
  },
  statValue: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.heading,
    fontSize: 34,
    lineHeight: 36,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 24,
  },
  textArea: {
    minHeight: 86,
    textAlignVertical: "top",
  },
  title: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.heading,
    fontSize: 30,
    lineHeight: 34,
  },
});
