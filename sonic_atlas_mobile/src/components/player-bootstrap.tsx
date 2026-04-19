import { PropsWithChildren, useEffect } from "react";
import { usePlaybackState, useTrackPlayerEvents } from "react-native-track-player";

import { fetchArtistPreview, fetchSimilarArtists } from "@/lib/api";
import { ensurePlayerSetup, Event, TrackPlayer } from "@/lib/audio-player";
import { usePlayerStore } from "@/store/player-store";

export function PlayerBootstrap({ children }: PropsWithChildren) {
  const appendToQueue = usePlayerStore((state) => state.appendToQueue);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const currentTrackIndex = usePlayerStore((state) => state.currentTrackIndex);
  const hydrate = usePlayerStore((state) => state.hydrate);
  const queue = usePlayerStore((state) => state.queue);
  const radioMode = usePlayerStore((state) => state.radioMode);
  const playbackState = usePlaybackState();
  const setPlaybackState = usePlayerStore((state) => state.setPlaybackState);
  const setCurrentTrack = usePlayerStore((state) => state.setCurrentTrack);

  useEffect(() => {
    void hydrate();
    void ensurePlayerSetup();
  }, [hydrate]);

  useEffect(() => {
    setPlaybackState(playbackState.state);
  }, [playbackState.state, setPlaybackState]);

  useTrackPlayerEvents([Event.PlaybackActiveTrackChanged], async () => {
    const [activeTrack, activeTrackIndex] = await Promise.all([
      TrackPlayer.getActiveTrack(),
      TrackPlayer.getActiveTrackIndex(),
    ]);
    setCurrentTrack(activeTrack, activeTrackIndex);
  });

  useEffect(() => {
    if (!radioMode || !currentTrack.artist) {
      return;
    }

    const remainingTracks = queue.length - currentTrackIndex - 1;
    if (remainingTracks > 2) {
      return;
    }

    let cancelled = false;

    async function extendRadioQueue() {
      try {
        const similarArtists = await fetchSimilarArtists(currentTrack.artist, 8);
        const existingArtists = new Set(queue.map((track) => track.artist.toLowerCase()));
        const nextArtist = similarArtists.find(
          (artist) => !existingArtists.has(artist.name.toLowerCase()) && artist.name.toLowerCase() !== currentTrack.artist.toLowerCase()
        );

        if (!nextArtist || cancelled) {
          return;
        }

        const previewTracks = await fetchArtistPreview(nextArtist.name);
        const radioTracks = previewTracks.slice(0, 3);

        if (!radioTracks.length || cancelled) {
          return;
        }

        await appendToQueue(radioTracks);
      } catch {
        // Keep radio silent on transient API failures.
      }
    }

    void extendRadioQueue();

    return () => {
      cancelled = true;
    };
  }, [appendToQueue, currentTrack.artist, currentTrackIndex, queue, radioMode]);

  return children;
}
