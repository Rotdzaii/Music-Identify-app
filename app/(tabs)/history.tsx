import { useFocusEffect } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Trash2 } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import EmptyState from '@/components/EmptyState';
import { Theme } from '@/constants/Theme';
import { glassmorphism } from '@/constants/globalStyles';
import { formatRelativeTime } from '@/lib/music-utils';
import { deleteHistoryItem, loadHistory } from '@/services/historyStorage';
import type { RecognitionResult } from '@/types/recognition';

export default function HistoryScreen() {
  const [history, setHistory] = useState<RecognitionResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshHistory = async (showLoading = false) => {
    if (showLoading) {
      setIsLoading(true);
    }

    const items = await loadHistory();
    setHistory(items);
    setIsLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      refreshHistory(true);
    }, [])
  );

  const handleDelete = async (id: string) => {
    await deleteHistoryItem(id);
    setHistory((prev) => prev.filter((item) => item.id !== id));
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
            <Text style={styles.subtitle}>{history.length} songs recognized</Text>
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
                  <View style={styles.itemContent}>
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
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => Alert.alert('Preview', 'Tinh nang nghe thu se duoc bo sung.')}
                      >
                        <Play size={16} color={Theme.colors.secondary} />
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.iconButton} onPress={() => handleDelete(item.id)}>
                        <Trash2 size={16} color={Theme.colors.destructive} />
                      </TouchableOpacity>
                    </View>
                  </View>
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
