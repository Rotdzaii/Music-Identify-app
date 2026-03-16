import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Theme } from '@/constants/Theme';
import { glassmorphism, globalStyles } from '@/constants/globalStyles';

const colorTokens = [
  { key: 'primary', value: Theme.colors.primary },
  { key: 'secondary', value: Theme.colors.secondary },
  { key: 'accent', value: Theme.colors.accent },
  { key: 'background', value: Theme.colors.background },
  { key: 'card', value: Theme.colors.card },
  { key: 'muted', value: Theme.colors.muted },
  { key: 'destructive', value: Theme.colors.destructive },
];

const spacingTokens = Object.entries(Theme.spacing);

export default function UIShowcase() {
  return (
    <LinearGradient
      colors={[Theme.colors.background, Theme.colors.backgroundElevated, Theme.colors.backgroundDeep]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.heading}>SoundMatch UI Showcase</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Color Tokens</Text>
            <View style={styles.colorGrid}>
              {colorTokens.map((item) => (
                <View key={item.key} style={styles.colorItem}>
                  <View style={[styles.colorSwatch, { backgroundColor: item.value }]} />
                  <Text style={styles.tokenName}>{item.key}</Text>
                  <Text style={styles.tokenValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Spacing Scale</Text>
            {spacingTokens.map(([name, value]) => (
              <View key={name} style={styles.spacingRow}>
                <Text style={styles.spacingLabel}>{name}</Text>
                <View style={{ width: value, height: 12, backgroundColor: Theme.colors.primary, borderRadius: 4 }} />
                <Text style={styles.spacingValue}>{value}px</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Blur / Glass / Gradient</Text>
            <BlurView intensity={glassmorphism.blurIntensityLg} tint="dark" style={[styles.glassDemo, globalStyles.glassCard]}>
              <Text style={styles.glassTitle}>Glassmorphism Card</Text>
              <Text style={styles.glassBody}>bg-card/50 + backdrop-blur equivalent for React Native.</Text>
            </BlurView>

            <LinearGradient
              colors={[Theme.colors.primary, Theme.colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientDemo}
            >
              <Text style={styles.gradientText}>Primary to Secondary Gradient</Text>
            </LinearGradient>
          </View>
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
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    gap: Theme.spacing.md,
  },
  heading: {
    color: Theme.colors.foreground,
    fontSize: 28,
    fontWeight: '800',
  },
  section: {
    gap: Theme.spacing.xs,
  },
  sectionTitle: {
    color: Theme.colors.foreground,
    fontSize: 18,
    fontWeight: '700',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
  },
  colorItem: {
    width: 104,
    gap: 4,
  },
  colorSwatch: {
    height: 44,
    borderRadius: Theme.radius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.alphaBorderSoft,
  },
  tokenName: {
    color: Theme.colors.foregroundMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  tokenValue: {
    color: Theme.colors.mutedForeground,
    fontSize: 11,
  },
  spacingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  spacingLabel: {
    width: 40,
    color: Theme.colors.foregroundMuted,
    fontSize: 12,
  },
  spacingValue: {
    color: Theme.colors.mutedForeground,
    fontSize: 12,
  },
  glassDemo: {
    overflow: 'hidden',
    padding: Theme.spacing.md,
    gap: Theme.spacing.xs,
  },
  glassTitle: {
    color: Theme.colors.foreground,
    fontSize: 16,
    fontWeight: '700',
  },
  glassBody: {
    color: Theme.colors.mutedForeground,
    fontSize: 13,
  },
  gradientDemo: {
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.md,
    marginTop: Theme.spacing.sm,
  },
  gradientText: {
    color: Theme.colors.foreground,
    fontWeight: '700',
  },
});
