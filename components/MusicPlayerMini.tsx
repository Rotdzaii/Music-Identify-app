import { BlurView } from 'expo-blur';
import { Pause, Play, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    Image,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { Theme } from '@/constants/Theme';
import type { PlayerTrack } from '@/hooks/useMusicPlayer';

interface MusicPlayerMiniProps {
  track: PlayerTrack | null;
  isVisible: boolean;
  isPlaying: boolean;
  isBuffering: boolean;
  playbackPosition: number;
  duration: number;
  onPlayPause: () => void;
  onClose: () => void;
}

function formatTime(millis: number): string {
  const seconds = Math.max(0, Math.floor(millis / 1000));
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export default function MusicPlayerMini({
  track,
  isVisible,
  isPlaying,
  isBuffering,
  playbackPosition,
  duration,
  onPlayPause,
  onClose,
}: MusicPlayerMiniProps) {
  const [displayVisible, setDisplayVisible] = useState(false);
  const translateY = useRef(new Animated.Value(260)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible && track) {
      setDisplayVisible(true);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 260,
        duration: 280,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setDisplayVisible(false);
      }
    });
  }, [backdropOpacity, isVisible, track, translateY]);

  if (!displayVisible || !track) {
    return null;
  }

  const safeDuration = duration > 0 ? duration : 30000;
  const percent = Math.min(100, Math.max(0, (playbackPosition / safeDuration) * 100));

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.overlay, { opacity: backdropOpacity }]}> 
        <Pressable style={styles.overlayPressable} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.container, { transform: [{ translateY }] }]}> 
        <BlurView intensity={45} tint="dark" style={styles.blurCard}>
          <View style={styles.dragHandleWrap}>
            <View style={styles.dragHandle} />
          </View>

          <View style={styles.headerRow}>
            <Image
              source={{
                uri:
                  track.albumArt ||
                  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=300&q=80',
              }}
              style={styles.albumArt}
            />

            <View style={styles.trackInfo}>
              <Text numberOfLines={1} style={styles.title}>
                {track.title}
              </Text>
              <Text numberOfLines={1} style={styles.artist}>
                {track.artist}
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.85}>
              <X size={16} color={Theme.colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressBar, { width: `${percent}%` }]} />
            </View>
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatTime(playbackPosition)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>

          <View style={styles.controlsRow}>
            <TouchableOpacity
              onPress={onPlayPause}
              disabled={isBuffering}
              style={[styles.playButton, isBuffering ? styles.playButtonDisabled : undefined]}
              activeOpacity={0.9}
            >
              {isPlaying ? (
                <Pause size={22} color={Theme.colors.foreground} />
              ) : (
                <Play size={22} color={Theme.colors.foreground} />
              )}
            </TouchableOpacity>
          </View>
        </BlurView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 40,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  overlayPressable: {
    flex: 1,
  },
  container: {
    width: '100%',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  blurCard: {
    overflow: 'hidden',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Theme.colors.alphaBorderStrong,
    backgroundColor: Theme.colors.alphaCardGlassStrong,
    paddingBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.26,
    shadowRadius: 14,
    elevation: 18,
  },
  dragHandleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 8,
  },
  dragHandle: {
    width: 44,
    height: 4,
    borderRadius: 4,
    backgroundColor: Theme.colors.alphaBorderStrong,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  albumArt: {
    width: 54,
    height: 54,
    borderRadius: 10,
    backgroundColor: Theme.colors.alphaCardGlass,
  },
  trackInfo: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: Theme.colors.foreground,
    fontSize: 14,
    fontWeight: '800',
  },
  artist: {
    color: Theme.colors.mutedForeground,
    fontSize: 12,
    fontWeight: '500',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.alphaCardGlass,
  },
  progressWrap: {
    marginTop: 10,
    paddingHorizontal: 14,
    gap: 6,
  },
  progressTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: Theme.colors.alphaBorderStrong,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Theme.colors.secondary,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    color: Theme.colors.mutedForeground,
    fontSize: 11,
    fontWeight: '600',
  },
  controlsRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  playButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.primary,
    shadowColor: Theme.colors.primary,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 9,
  },
  playButtonDisabled: {
    opacity: 0.6,
  },
});