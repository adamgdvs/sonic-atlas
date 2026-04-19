import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PlaybackState, Track } from "react-native-track-player";
import { State } from "react-native-track-player";
import { create } from "zustand";

import {
  appendTracks,
  replaceQueue,
  skipNext as skipNativeNext,
  skipPrevious as skipNativePrevious,
  togglePlayback as toggleNativePlayback,
} from "@/lib/audio-player";

const PLAYER_STORAGE_KEY = "sonic-atlas-mobile-player";

export type PlayerTrack = {
  artist: string;
  artwork?: string | null;
  duration?: number;
  previewUrl?: string;
  title: string;
  videoId?: string | null;
};

export type PlayerHistoryEntry = {
  playedAt: string;
  track: PlayerTrack;
};

type PersistedPlayerState = {
  currentTrack: PlayerTrack;
  currentTrackIndex: number;
  history: PlayerHistoryEntry[];
  queue: PlayerTrack[];
  radioMode: boolean;
};

type PlayerState = {
  appendToQueue: (tracks: PlayerTrack[]) => Promise<void>;
  clearHistory: () => Promise<void>;
  currentTrack: PlayerTrack;
  currentTrackIndex: number;
  history: PlayerHistoryEntry[];
  hydrate: () => Promise<void>;
  isPlaying: boolean;
  playTrack: (track: PlayerTrack) => Promise<void>;
  queue: PlayerTrack[];
  radioMode: boolean;
  setCurrentTrack: (track: Track | undefined, index?: number | null) => void;
  setPlaybackState: (state: PlaybackState["state"] | undefined) => void;
  setQueue: (tracks: PlayerTrack[], startIndex?: number) => Promise<void>;
  setRadioMode: (enabled: boolean) => void;
  skipNext: () => Promise<void>;
  skipPrevious: () => Promise<void>;
  togglePlayback: () => Promise<void>;
};

const defaultTrack: PlayerTrack = {
  artist: "Sonic Atlas",
  artwork: null,
  duration: 0,
  previewUrl: "",
  title: "Mobile vinyl assembly",
  videoId: null,
};

function isPlayableTrack(track: PlayerTrack) {
  return Boolean(track.videoId || track.previewUrl);
}

function isSameTrack(left: PlayerTrack, right: PlayerTrack) {
  if (left.videoId && right.videoId) {
    return left.videoId === right.videoId;
  }

  if (left.previewUrl && right.previewUrl) {
    return left.previewUrl === right.previewUrl;
  }

  return left.artist === right.artist && left.title === right.title;
}

function normalizePlayableTracks(tracks: PlayerTrack[]) {
  return tracks.filter(isPlayableTrack);
}

async function persistPlayerState(state: PersistedPlayerState) {
  await AsyncStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(state));
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  appendToQueue: async (tracks) => {
    const playableTracks = normalizePlayableTracks(tracks);

    if (!playableTracks.length) {
      return;
    }

    await appendTracks(playableTracks);
    set((state) => ({
      queue: [...state.queue, ...playableTracks],
    }));
  },
  clearHistory: async () => {
    set({ history: [] });
  },
  currentTrack: defaultTrack,
  currentTrackIndex: 0,
  history: [],
  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(PLAYER_STORAGE_KEY);

      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored) as Partial<PersistedPlayerState>;
      set({
        currentTrack: parsed.currentTrack ?? defaultTrack,
        currentTrackIndex: parsed.currentTrackIndex ?? 0,
        history: parsed.history ?? [],
        queue: parsed.queue ?? [],
        radioMode: parsed.radioMode ?? false,
      });
    } catch {
      await AsyncStorage.removeItem(PLAYER_STORAGE_KEY);
      set({
        currentTrack: defaultTrack,
        currentTrackIndex: 0,
        history: [],
        queue: [],
        radioMode: false,
      });
    }
  },
  isPlaying: false,
  playTrack: async (track) => {
    if (!isPlayableTrack(track)) {
      return;
    }

    await replaceQueue([track], 0);
    set({ currentTrack: track, currentTrackIndex: 0, isPlaying: true, queue: [track] });
  },
  queue: [],
  radioMode: false,
  setCurrentTrack: (track, index) => {
    if (!track) return;

    set((state) => {
      const nextTrack: PlayerTrack = {
        artist: track.artist ?? state.currentTrack.artist,
        artwork: typeof track.artwork === "string" ? track.artwork : state.currentTrack.artwork,
        duration: track.duration ?? state.currentTrack.duration,
        previewUrl: state.currentTrack.previewUrl,
        title: track.title ?? state.currentTrack.title,
        videoId: typeof track.id === "string" ? track.id : state.currentTrack.videoId,
      };

      const nextIndex =
        typeof index === "number" && index >= 0
          ? index
          : state.queue.findIndex((queuedTrack) => isSameTrack(queuedTrack, nextTrack));

      const shouldTrackHistory = nextTrack.title !== defaultTrack.title;
      const nextHistory =
        shouldTrackHistory &&
        !state.history.some((entry, historyIndex) => historyIndex === 0 && isSameTrack(entry.track, nextTrack))
          ? [{ playedAt: new Date().toISOString(), track: nextTrack }, ...state.history].slice(0, 50)
          : state.history;

      return {
        currentTrack: nextTrack,
        currentTrackIndex: nextIndex >= 0 ? nextIndex : 0,
        history: nextHistory,
      };
    });
  },
  setPlaybackState: (playbackState) => {
    set({ isPlaying: playbackState === State.Playing });
  },
  setQueue: async (tracks, startIndex = 0) => {
    const requestedTrack = tracks[startIndex] ?? tracks[0];
    const playableTracks = normalizePlayableTracks(tracks);

    if (!playableTracks.length) {
      return;
    }

    const resolvedIndex = requestedTrack
      ? Math.max(
          0,
          playableTracks.findIndex((track) => isSameTrack(track, requestedTrack))
        )
      : 0;

    await replaceQueue(playableTracks, resolvedIndex);
    set({
      currentTrack: playableTracks[resolvedIndex] ?? playableTracks[0] ?? defaultTrack,
      currentTrackIndex: resolvedIndex,
      isPlaying: true,
      queue: playableTracks,
    });
  },
  setRadioMode: (enabled) => {
    set({ radioMode: enabled });
  },
  skipNext: async () => {
    await skipNativeNext();
  },
  skipPrevious: async () => {
    await skipNativePrevious();
  },
  togglePlayback: async () => {
    await toggleNativePlayback();
  },
}));

usePlayerStore.subscribe((state) => {
  void persistPlayerState({
    currentTrack: state.currentTrack,
    currentTrackIndex: state.currentTrackIndex,
    history: state.history,
    queue: state.queue,
    radioMode: state.radioMode,
  });
});
