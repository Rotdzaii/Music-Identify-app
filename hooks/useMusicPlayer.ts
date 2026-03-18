import { Audio, AVPlaybackStatus } from 'expo-av';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface PlayerTrack {
  id: string;
  title: string;
  artist: string;
  albumArt?: string;
  albumName?: string;
  previewUrl: string;
}

interface PlayerState {
  currentTrack: PlayerTrack | null;
  isVisible: boolean;
  isPlaying: boolean;
  isBuffering: boolean;
  playbackPosition: number;
  duration: number;
}

function isLoadedStatus(status: AVPlaybackStatus): status is AVPlaybackStatus & { isLoaded: true } {
  return status.isLoaded;
}

export function useMusicPlayer() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [state, setState] = useState<PlayerState>({
    currentTrack: null,
    isVisible: false,
    isPlaying: false,
    isBuffering: false,
    playbackPosition: 0,
    duration: 0,
  });

  const resetPlaybackState = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isPlaying: false,
      isBuffering: false,
      playbackPosition: 0,
      duration: 0,
    }));
  }, []);

  const unloadSound = useCallback(async () => {
    const sound = soundRef.current;
    if (!sound) {
      return;
    }

    try {
      await sound.stopAsync();
    } catch {
      // Ignore if sound is already stopped.
    }

    try {
      await sound.unloadAsync();
    } catch {
      // Ignore unload errors to keep player resilient.
    }

    soundRef.current = null;
  }, []);

  const handlePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!isLoadedStatus(status)) {
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        isBuffering: false,
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      isPlaying: status.isPlaying,
      isBuffering: status.isBuffering,
      playbackPosition: status.positionMillis ?? 0,
      duration: status.durationMillis ?? prev.duration,
    }));

    if (status.didJustFinish) {
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        playbackPosition: 0,
      }));
    }
  }, []);

  const playTrack = useCallback(
    async (track: PlayerTrack) => {
      if (!track.previewUrl) {
        throw new Error('Track preview URL is missing.');
      }

      const isSameTrack = state.currentTrack?.id === track.id;
      const sound = soundRef.current;

      if (isSameTrack && sound) {
        await sound.playAsync();
        setState((prev) => ({ ...prev, isVisible: true }));
        return;
      }

      await unloadSound();

      const { sound: createdSound, status } = await Audio.Sound.createAsync(
        { uri: track.previewUrl },
        {
          shouldPlay: true,
          progressUpdateIntervalMillis: 250,
        },
        handlePlaybackStatusUpdate
      );

      soundRef.current = createdSound;
      setState((prev) => ({
        ...prev,
        currentTrack: track,
        isVisible: true,
        isPlaying: isLoadedStatus(status) ? status.isPlaying : true,
        isBuffering: isLoadedStatus(status) ? status.isBuffering : false,
        playbackPosition: isLoadedStatus(status) ? status.positionMillis ?? 0 : 0,
        duration: isLoadedStatus(status) ? status.durationMillis ?? 0 : 0,
      }));
    },
    [handlePlaybackStatusUpdate, state.currentTrack?.id, unloadSound]
  );

  const togglePlayPause = useCallback(async () => {
    const sound = soundRef.current;
    if (!sound) {
      return;
    }

    if (state.isPlaying) {
      await sound.pauseAsync();
      return;
    }

    await sound.playAsync();
  }, [state.isPlaying]);

  const closePlayer = useCallback(async () => {
    await unloadSound();
    setState((prev) => ({
      ...prev,
      currentTrack: null,
      isVisible: false,
    }));
    resetPlaybackState();
  }, [resetPlaybackState, unloadSound]);

  useEffect(() => {
    return () => {
      unloadSound().catch(() => undefined);
    };
  }, [unloadSound]);

  return {
    currentTrack: state.currentTrack,
    isVisible: state.isVisible,
    isPlaying: state.isPlaying,
    isBuffering: state.isBuffering,
    playbackPosition: state.playbackPosition,
    duration: state.duration,
    playTrack,
    togglePlayPause,
    closePlayer,
  };
}