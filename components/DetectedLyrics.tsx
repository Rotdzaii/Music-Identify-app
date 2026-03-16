import { BlurView } from 'expo-blur';
import * as Clipboard from 'expo-clipboard';
import { Check, Copy, Quote } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Theme } from '@/constants/Theme';
import { glassmorphism, globalStyles } from '@/constants/globalStyles';

interface DetectedLyricsProps {
  lyrics: string;
}

export default function DetectedLyrics({ lyrics }: DetectedLyricsProps) {
  const [copied, setCopied] = useState(false);
  const pulse = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 600, useNativeDriver: true }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(lyrics);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <BlurView intensity={glassmorphism.blurIntensityMd} tint="dark" style={[styles.container, globalStyles.mutedCard]}>
      <View style={styles.titleRow}>
        <View style={styles.leftHeader}>
          <Animated.View style={[styles.pulseDot, { opacity: pulse }]} />
          <Text style={styles.title}>Detected Lyrics</Text>
        </View>
        <TouchableOpacity onPress={handleCopy} style={styles.copyButton} activeOpacity={0.85}>
          {copied ? <Check size={16} color={Theme.colors.secondary} /> : <Copy size={16} color={Theme.colors.mutedForeground} />}
        </TouchableOpacity>
      </View>

      <View style={styles.textRow}>
        <Quote size={16} color={Theme.colors.accent} />
        <Text style={styles.lyricsText}>"{lyrics || 'No lyrics detected yet.'}"</Text>
      </View>

      {copied ? <Text style={styles.feedback}>Copied to clipboard</Text> : null}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    padding: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.secondary,
  },
  title: {
    color: Theme.colors.mutedForeground,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  copyButton: {
    borderRadius: Theme.radius.md,
    paddingHorizontal: Theme.spacing.xs,
    paddingVertical: 6,
    backgroundColor: Theme.colors.alphaSecondary14,
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  lyricsText: {
    flex: 1,
    color: Theme.colors.foreground,
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  feedback: {
    marginTop: 8,
    color: Theme.colors.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
});
