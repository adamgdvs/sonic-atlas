import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  Event,
  State,
  type Track,
} from "react-native-track-player";

import type { PlayerTrack } from "@/store/player-store";
import { getStreamUrl } from "@/lib/api";

let setupPromise: Promise<void> | null = null;

function resolveTrackUrl(track: PlayerTrack): string | null {
  if (track.videoId) {
    return getStreamUrl(track.videoId);
  }

  if (track.previewUrl) {
    return track.previewUrl;
  }

  return null;
}

function toNativeTrack(track: PlayerTrack, index: number): Track | null {
  const url = resolveTrackUrl(track);
  if (!url) {
    return null;
  }

  return {
    artist: track.artist,
    artwork: track.artwork ?? undefined,
    duration: track.duration ?? undefined,
    id: track.videoId ?? `${track.artist}-${track.title}-${index}`,
    title: track.title,
    url,
  };
}

export async function ensurePlayerSetup() {
  if (!setupPromise) {
    setupPromise = (async () => {
      await TrackPlayer.setupPlayer();
      await TrackPlayer.updateOptions({
        android: {
          appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
        },
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
          Capability.SeekTo,
        ],
        compactCapabilities: [Capability.Play, Capability.Pause, Capability.SkipToNext],
        notificationCapabilities: [Capability.Play, Capability.Pause, Capability.SkipToNext, Capability.SkipToPrevious],
        progressUpdateEventInterval: 2,
      });
    })();
  }

  return setupPromise;
}

export async function replaceQueue(tracks: PlayerTrack[], startIndex = 0) {
  await ensurePlayerSetup();

  const playableEntries = tracks
    .map((track, index) => ({
      nativeTrack: toNativeTrack(track, index),
      originalIndex: index,
    }))
    .filter((entry): entry is { nativeTrack: Track; originalIndex: number } => Boolean(entry.nativeTrack));

  const nativeTracks = playableEntries.map((entry) => entry.nativeTrack);

  if (!nativeTracks.length) {
    return;
  }

  const playableStartIndex = playableEntries.findIndex((entry) => entry.originalIndex >= startIndex);
  const resolvedStartIndex = playableStartIndex >= 0 ? playableStartIndex : 0;

  await TrackPlayer.reset();
  await TrackPlayer.add(nativeTracks);
  await TrackPlayer.skip(resolvedStartIndex);
  await TrackPlayer.play();
}

export async function appendTracks(tracks: PlayerTrack[]) {
  await ensurePlayerSetup();

  const nativeTracks = tracks
    .map((track, index) => toNativeTrack(track, index))
    .filter((track): track is Track => Boolean(track));

  if (!nativeTracks.length) {
    return;
  }

  await TrackPlayer.add(nativeTracks);
}

export async function togglePlayback() {
  await ensurePlayerSetup();
  const state = await TrackPlayer.getPlaybackState();

  if (state.state === State.Playing) {
    await TrackPlayer.pause();
    return;
  }

  await TrackPlayer.play();
}

export async function skipNext() {
  await ensurePlayerSetup();
  await TrackPlayer.skipToNext();
}

export async function skipPrevious() {
  await ensurePlayerSetup();
  await TrackPlayer.skipToPrevious();
}

export { Event, State, TrackPlayer };
