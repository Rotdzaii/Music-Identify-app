import { LinearGradient } from 'expo-linear-gradient';
import { Mic, RotateCcw, Square, X } from 'lucide-react-native';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import DetectedLyrics from '@/components/DetectedLyrics';
import LanguageSelector from '@/components/LanguageSelector';
import ResultCard from '@/components/ResultCard';
import { Theme } from '@/constants/Theme';
import { useRecording } from '@/hooks/useRecording';
import { generateId } from '@/lib/music-utils';
import { appendHistory } from '@/services/historyStorage';
import { searchSongByLyrics } from '@/services/musicSearch';
import { convertSpeechToText } from '@/services/sttService';
import { cleanLyrics } from '@/services/text-processor';
import type { RecognitionResult } from '@/types/recognition';

export default function HomeScreen() {
  const [language, setLanguage] = useState('en');
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedLyrics, setDetectedLyrics] = useState('');
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const { isRecording, lastRecordingUri, startRecording, stopRecording } = useRecording();

  const showProcessingError = (error: unknown) => {
    const message = error instanceof Error ? error.message : '';

    if (message.includes('Network Error') || message.includes('network') || message.includes('Network')) {
      Alert.alert('Lỗi mạng', 'Vui lòng kiểm tra kết nối Internet và thử lại.');
      return;
    }

    if (message) {
      Alert.alert('Lỗi từ server', message);
      return;
    }

    Alert.alert('Có lỗi xảy ra', 'Không thể xử lý âm thanh. Vui lòng thử lại.');
  };

  const runRecognition = async (audioUri: string) => {
    setIsProcessing(true);

    try {
      const rawText = await convertSpeechToText(audioUri, language);
      setDetectedLyrics(rawText);

      const cleanedLyrics = cleanLyrics(rawText);

      if (!cleanedLyrics) {
        Alert.alert('Khong ro loi bai hat', 'Vui long thu lai voi am thanh ro hon.');
        return;
      }

      const song = await searchSongByLyrics(cleanedLyrics);

      if (!song) {
        Alert.alert('Không tìm thấy bài hát phù hợp', 'Không tìm thấy bài hát phù hợp');
        return;
      }

      const recognitionResult: RecognitionResult = {
        id: generateId(song.id),
        title: song.title,
        artist: song.artist,
        lyrics: song.matchedLyricsSnippet ?? song.lyrics,
        language,
        audioUri,
        timestamp: new Date().toISOString(),
        albumArtUri: song.albumArtUri,
      };

      setResult(recognitionResult);
      await appendHistory(recognitionResult);
    } catch (error) {
      showProcessingError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecordButton = async () => {
    if (isProcessing) {
      return;
    }

    try {
      if (isRecording) {
        const audioUri = await stopRecording();
        if (audioUri) {
          await runRecognition(audioUri);
        }
        return;
      }

      await startRecording();
    } catch {
      Alert.alert('Khong the ghi am', 'Vui long cap quyen micro va thu lai.');
    }
  };

  const handleClear = () => {
    setResult(null);
    setDetectedLyrics('');
  };

  const handleRetry = async () => {
    handleClear();

    if (lastRecordingUri) {
      await runRecognition(lastRecordingUri);
      return;
    }

    await handleRecordButton();
  };

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
          <LanguageSelector language={language} onChange={setLanguage} />

          <View style={styles.centerSection}>
            <View style={styles.recordWrap}>
              {isRecording ? <View style={styles.pulseRing} /> : null}

              <TouchableOpacity
                style={[styles.recordButton, isRecording ? styles.recordButtonActive : undefined]}
                onPress={handleRecordButton}
                activeOpacity={0.88}
                disabled={isProcessing}
              >
                {isRecording ? (
                  <Square size={44} color={Theme.colors.foreground} />
                ) : (
                  <Mic size={44} color={Theme.colors.foreground} />
                )}
              </TouchableOpacity>
            </View>

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

            {result ? (
              <View style={styles.resultArea}>
                <ResultCard result={result} />
                <DetectedLyrics lyrics={detectedLyrics || result.lyrics} />

                <View style={styles.actionRow}>
                  <TouchableOpacity onPress={handleClear} style={styles.secondaryButton} activeOpacity={0.85}>
                    <X size={16} color={Theme.colors.foregroundMuted} />
                    <Text style={styles.secondaryButtonText}>Clear</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handleRetry} style={styles.primaryButton} activeOpacity={0.85}>
                    <RotateCcw size={16} color={Theme.colors.foreground} />
                    <Text style={styles.primaryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>
        </ScrollView>
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
  centerSection: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingTop: 18,
  },
  recordWrap: {
    width: 170,
    height: 170,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 120,
    borderWidth: 2,
    borderColor: Theme.colors.alphaDestructive50,
    backgroundColor: Theme.colors.alphaDestructive08,
  },
  recordButton: {
    width: 132,
    height: 132,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.primary,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 16,
    shadowOpacity: 0.45,
    elevation: 10,
  },
  recordButtonActive: {
    backgroundColor: Theme.colors.destructive,
    shadowColor: Theme.colors.destructive,
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
});
