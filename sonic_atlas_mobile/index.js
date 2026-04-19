import TrackPlayer from "react-native-track-player";

import { playbackService } from "./src/services/playback-service";

import "expo-router/entry";

TrackPlayer.registerPlaybackService(() => playbackService);
