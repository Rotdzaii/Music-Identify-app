import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { RotateCcw, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import DetectedLyrics from '@/components/DetectedLyrics';
import LanguagePicker, { type SupportedLanguage } from '@/components/LanguagePicker';
import MusicPlayerMini from '@/components/MusicPlayerMini';
import RecordButton, { type RecordingStatus } from '@/components/RecordButton';
import { Theme } from '@/constants/Theme';
import { useMusicPlayer } from '@/hooks/useMusicPlayer';
import { useRecording } from '@/hooks/useRecording';
import { generateId } from '@/lib/music-utils';
import { ApiError } from '@/services/apiService';
import { saveToHistory } from '@/services/historyService';
import type { SttSongMatch } from '@/services/sttService';
import { transcribeAudio } from '@/services/sttService';

const LANGUAGE_STORAGE_KEY = '@musicid/selected-language';

export default function HomeScreen() {
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('vi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sttTexts, setSttTexts] = useState<{ rawText: string; cleanedText: string } | null>(null);
  const [songMatches, setSongMatches] = useState<SttSongMatch[]>([]);
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
  const { isRecording, lastRecordingUri, startRecording, stopRecording } = useRecording();

  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (saved === 'vi' || saved === 'en') {
          setSelectedLanguage(saved);
        }
      } catch {
        // Ignore persisted language read errors.
      }
    };

    loadSavedLanguage().catch(() => undefined);
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, selectedLanguage).catch(() => undefined);
  }, [selectedLanguage]);

  const showProcessingError = (error: unknown) => {
    if (error instanceof ApiError) {
      if (error.code === 'NETWORK') {
        Alert.alert('Lỗi', 'Không thể kết nối với máy chủ');
        return;
      }

      if (error.code === 'NO_SPEECH') {
        Alert.alert('Lỗi', 'Không thể nhận diện được lời thoại. Hãy ghi âm rõ hơn từ 2-4 giây.');
        return;
      }

      if (error.code === 'NO_MATCH') {
        Alert.alert('Lỗi', 'Không tìm thấy bài hát phù hợp');
        return;
      }
    }

    const message = error instanceof Error ? error.message : '';

    if (message.includes('network') || message.includes('Network')) {
      Alert.alert('Lỗi', 'Không thể kết nối với máy chủ');
      return;
    }

    if (message.includes('Không thể nhận diện được lời thoại')) {
      Alert.alert('Lỗi', 'Không thể nhận diện được lời thoại. Hãy ghi âm rõ hơn từ 2-4 giây.');
      return;
    }

    if (message.includes('Không tìm thấy bài hát phù hợp')) {
      Alert.alert('Lỗi', 'Không tìm thấy bài hát phù hợp');
      return;
    }

    if (message.includes('Không thể xử lý định dạng audio đầu vào')) {
      Alert.alert('Lỗi', 'Server không xử lý được định dạng audio. Vui lòng thử lại.');
      return;
    }

    if (message.includes('Không thể khởi tạo mô hình STT trên server')) {
      Alert.alert('Lỗi', 'Server STT chưa sẵn sàng. Vui lòng kiểm tra backend.');
      return;
    }

    if (message) {
      Alert.alert('Lỗi từ server', message);
      return;
    }

    Alert.alert('Lỗi', 'Không thể kết nối với máy chủ');
  };

  const runRecognition = async (audioUri: string) => {
    setIsProcessing(true);

    try {
      const sttResult = await transcribeAudio(audioUri, selectedLanguage);
      setSttTexts(sttResult);
      setSongMatches(sttResult.matches);

      const cleanedLyrics = sttResult.cleanedText;

      if (!cleanedLyrics) {
        Alert.alert('Lỗi', 'Không thể nhận diện được lời thoại. Hãy ghi âm rõ hơn từ 2-4 giây.');
        return;
      }

      if (sttResult.matches.length === 0) {
        Alert.alert('Lỗi', 'Không tìm thấy bài hát phù hợp');
        return;
      }

      const firstMatch = sttResult.matches[0];
      await saveToHistory({
        id: generateId('history'),
        title: firstMatch.title,
        artist: firstMatch.artist,
        album_art: firstMatch.albumArt,
        preview_url: firstMatch.previewUrl,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      showProcessingError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartRecording = async () => {
    if (isProcessing) {
      return;
    }

    try {
      await startRecording();
    } catch {
      Alert.alert('Khong the ghi am', 'Vui long cap quyen micro va thu lai.');
    }
  };

  const handleStopRecording = async () => {
    if (isProcessing || !isRecording) {
      return;
    }

    try {
      const audioUri = await stopRecording();
      if (audioUri) {
        await runRecognition(audioUri);
      }
    } catch {
      Alert.alert('Khong the ghi am', 'Vui long cap quyen micro va thu lai.');
    }
  };

  const handleClear = () => {
    setSttTexts(null);
    setSongMatches([]);
    closePlayer().catch(() => undefined);
  };

  const handleSelectTrack = async (song: SttSongMatch, index: number) => {
    if (!song.previewUrl) {
      Alert.alert('Lỗi', 'Không có bản nghe thử cho bài hát này');
      return;
    }

    try {
      await playTrack({
        id: `${song.title}-${song.artist}-${index}`,
        title: song.title,
        artist: song.artist,
        albumArt: song.albumArt,
        albumName: song.albumName,
        previewUrl: song.previewUrl,
      });
    } catch {
      Alert.alert('Lỗi', 'Không thể phát bản nghe thử');
    }
  };

  const handleRetry = async () => {
    handleClear();

    if (lastRecordingUri) {
      await runRecognition(lastRecordingUri);
      return;
    }

    await handleStartRecording();
  };

  const recordingStatus: RecordingStatus = isProcessing ? 'processing' : isRecording ? 'recording' : 'idle';

  return (
    <LinearGradient
      colors={[Theme.colors.background, Theme.colors.backgroundElevated, Theme.colors.backgroundDeep]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.languagePickerWrap}>
            <LanguagePicker selectedLanguage={selectedLanguage} onSelectLanguage={setSelectedLanguage} />
          </View>

          <View style={styles.centerSection}>
            <RecordButton status={recordingStatus} onStart={handleStartRecording} onStop={handleStopRecording} />

            <View style={styles.statusWrap}>
              <Text style={styles.statusText}>
                {isRecording
                  ? 'Dang ghi am... bam lan nua de dung'
                  : isProcessing
                  ? 'Dang xu ly am thanh...'
                  : 'Cham de nhan dien bai hat'}
              </Text>
              {isProcessing ? <ActivityIndicator color={Theme.colors.primary} style={styles.loading} /> : null}
            </View>

            {sttTexts ? (
              <View style={styles.resultArea}>
                {sttTexts ? (
                  <>
                    <DetectedLyrics lyrics={sttTexts.rawText} />

                    <View style={styles.cleanedTextCard}>
                      <Text style={styles.cleanedTextLabel}>Cleaned Text</Text>
                      <Text style={styles.cleanedTextValue}>{sttTexts.cleanedText || 'No cleaned text.'}</Text>
                    </View>
                  </>
                ) : null}

                {songMatches.length > 0 ? (
                  <View style={styles.matchesList}>
                    {songMatches.map((song, index) => (
                      <TouchableOpacity
                        key={`${song.title}-${song.artist}-${index}`}
                        style={styles.songCard}
                        activeOpacity={0.9}
                        onPress={() => {
                          handleSelectTrack(song, index).catch(() => undefined);
                        }}
                      >
                        <Image
                          source={{
                            uri:
                              song.albumArt ||
                              'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=300&q=80',
                          }}
                          style={styles.songArt}
                        />
                        <View style={styles.songInfo}>
                          <Text numberOfLines={1} style={styles.songTitle}>
                            {song.title}
                          </Text>
                          <Text numberOfLines={1} style={styles.songSubtitle}>
                            {song.artist}
                          </Text>
                          <Text numberOfLines={1} style={styles.songAlbum}>
                            {song.albumName || 'Unknown album'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}

                <View style={styles.actionRow}>
                  <TouchableOpacity onPress={handleClear} style={styles.secondaryButton} activeOpacity={0.85}>
                    <X size={16} color={Theme.colors.foregroundMuted} />
                    <Text style={styles.secondaryButtonText}>Xóa</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handleRetry} style={styles.primaryButton} activeOpacity={0.85}>
                    <RotateCcw size={16} color={Theme.colors.foreground} />
                    <Text style={styles.primaryButtonText}>Tìm lại</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>
        </ScrollView>

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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 24,
    alignItems: 'center',
  },
  languagePickerWrap: {
    width: '100%',
    alignItems: 'flex-end',
  },
  centerSection: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingTop: 18,
  },
  statusWrap: {
    alignItems: 'center',
    minHeight: 52,
  },
  statusText: {
    color: Theme.colors.mutedForeground,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  loading: {
    marginTop: 8,
  },
  resultArea: {
    width: '100%',
    maxWidth: 380,
    gap: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: Theme.colors.secondary,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButtonText: {
    color: Theme.colors.foreground,
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.alphaBorderStrong,
    backgroundColor: Theme.colors.alphaCardGlassStrong,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButtonText: {
    color: Theme.colors.foreground,
    fontSize: 14,
    fontWeight: '700',
  },
  cleanedTextCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.alphaBorderStrong,
    backgroundColor: Theme.colors.alphaCardGlassStrong,
    padding: 12,
    gap: 6,
  },
  cleanedTextLabel: {
    color: Theme.colors.mutedForeground,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  cleanedTextValue: {
    color: Theme.colors.foreground,
    fontSize: 14,
    lineHeight: 20,
  },
  matchesList: {
    gap: 10,
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.alphaBorderStrong,
    backgroundColor: Theme.colors.alphaCardGlassStrong,
    padding: 10,
  },
  songArt: {
    width: 62,
    height: 62,
    borderRadius: 10,
    backgroundColor: Theme.colors.alphaCardGlass,
  },
  songInfo: {
    flex: 1,
    gap: 3,
  },
  songTitle: {
    color: Theme.colors.foreground,
    fontSize: 16,
    fontWeight: '800',
  },
  songSubtitle: {
    color: Theme.colors.secondary,
    fontSize: 13,
    fontWeight: '600',
  },
  songAlbum: {
    color: Theme.colors.mutedForeground,
    fontSize: 12,
  },
});
