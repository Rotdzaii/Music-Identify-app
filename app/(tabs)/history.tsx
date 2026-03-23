import { useFocusEffect } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Trash2 } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import EmptyState from '@/components/EmptyState';
import MusicPlayerMini from '@/components/MusicPlayerMini';
import { Theme } from '@/constants/Theme';
import { glassmorphism } from '@/constants/globalStyles';
import { useMusicPlayer } from '@/hooks/useMusicPlayer';
import { formatRelativeTime } from '@/lib/music-utils';
import { clearHistory, getHistory, type HistoryTrack } from '@/services/historyService';

export default function HistoryScreen() {
  const [history, setHistory] = useState<HistoryTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const {
    currentTrack,
    isVisible,
    isPlaying,
    isBuffering,
    playbackPosition,
    duration,
    playTrack,
    togglePlayPause,
    closePlayer,
  } = useMusicPlayer();

  const refreshHistory = async (showLoading = false) => {
    if (showLoading) {
      setIsLoading(true);
    }

    const items = await getHistory();
    setHistory(items);
    setIsLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      refreshHistory(true);
    }, [])
  );

  const handlePlayHistoryTrack = async (item: HistoryTrack) => {
    if (!item.preview_url) {
      Alert.alert('Lỗi', 'Không có bản nghe thử cho bài hát này');
      return;
    }

    try {
      await playTrack({
        id: item.id,
        title: item.title,
        artist: item.artist,
        albumArt: item.album_art,
        previewUrl: item.preview_url,
      });
    } catch {
      Alert.alert('Lỗi', 'Không thể phát bản nghe thử');
    }
  };

  const handleClearAll = async () => {
    Alert.alert('Xóa lịch sử', 'Bạn có chắc muốn xóa toàn bộ lịch sử?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => {
          clearHistory()
            .then(() => {
              setHistory([]);
              closePlayer().catch(() => undefined);
            })
            .catch(() => {
              Alert.alert('Lỗi', 'Không thể xóa lịch sử');
            });
        },
      },
    ]);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshHistory();
    setIsRefreshing(false);
  };

  return (
    <LinearGradient
      colors={[Theme.colors.background, Theme.colors.backgroundElevated, Theme.colors.backgroundDeep]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Recognition History</Text>
            <View style={styles.headerMetaRow}>
              <Text style={styles.subtitle}>{history.length} songs recognized</Text>
              {history.length > 0 ? (
                <TouchableOpacity style={styles.clearAllButton} onPress={handleClearAll} activeOpacity={0.85}>
                  <Trash2 size={14} color={Theme.colors.destructive} />
                  <Text style={styles.clearAllText}>Clear all</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {isLoading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator color={Theme.colors.primary} size="large" />
            </View>
          ) : history.length > 0 ? (
            <FlatList
              data={history}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  tintColor={Theme.colors.primary}
                />
              }
              renderItem={({ item }) => (
                <BlurView intensity={26} tint="dark" style={styles.itemCard}>
                  <TouchableOpacity
                    style={styles.itemContent}
                    activeOpacity={0.9}
                    onPress={() => {
                      handlePlayHistoryTrack(item).catch(() => undefined);
                    }}
                  >
                    <Image
                      source={{
                        uri:
                          item.album_art ||
                          'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=300&q=80',
                      }}
                      style={styles.albumArt}
                    />

                    <View style={styles.songInfo}>
                      <Text numberOfLines={1} style={styles.songTitle}>
                        {item.title}
                      </Text>
                      <Text numberOfLines={1} style={styles.songArtist}>
                        {item.artist}
                      </Text>
                      <Text style={styles.songTime}>{formatRelativeTime(item.timestamp)}</Text>
                    </View>

                    <View style={styles.actions}>
                      <TouchableOpacity style={styles.iconButton} onPress={() => handlePlayHistoryTrack(item)}>
                        <Play size={16} color={Theme.colors.secondary} />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </BlurView>
              )}
            />
          ) : (
            <EmptyState
              title="No Recognition History"
              description="Start recognizing songs to build your history."
            />
          )}
        </View>

        <MusicPlayerMini
          track={currentTrack}
          isVisible={isVisible}
          isPlaying={isPlaying}
          isBuffering={isBuffering}
          playbackPosition={playbackPosition}
          duration={duration}
          onPlayPause={() => {
            togglePlayPause().catch(() => undefined);
          }}
          onClose={() => {
            closePlayer().catch(() => undefined);
          }}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 8,
  },
  header: {
    marginBottom: 14,
    gap: 2,
  },
  headerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: Theme.colors.foreground,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: Theme.colors.mutedForeground,
    fontSize: 13,
    fontWeight: '500',
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: Theme.colors.alphaCardGlass,
    borderWidth: 1,
    borderColor: Theme.colors.alphaBorderSoft,
  },
  clearAllText: {
    color: Theme.colors.destructive,
    fontSize: 12,
    fontWeight: '700',
  },
  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 24,
    gap: 10,
  },
  itemCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.colors.alphaBorderSoft,
    overflow: 'hidden',
    backgroundColor: glassmorphism.card50,
  },
  itemContent: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  albumArt: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: Theme.colors.alphaCardGlass,
  },
  songInfo: {
    flex: 1,
    minWidth: 0,
    backgroundColor: 'transparent',
  },
  songTitle: {
    color: Theme.colors.foregroundMuted,
    fontSize: 16,
    fontWeight: '700',
  },
  songArtist: {
    color: Theme.colors.secondary,
    fontSize: 13,
    marginTop: 2,
  },
  songTime: {
    color: Theme.colors.mutedForeground,
    fontSize: 12,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.alphaCardHover,
    borderWidth: 1,
    borderColor: Theme.colors.alphaBorderSoft,
  },
});
