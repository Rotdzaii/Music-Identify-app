import { StyleSheet } from 'react-native';

import { Theme } from '@/constants/Theme';

export const glassmorphism = {
  card50: Theme.colors.alphaCardGlass,
  card30: 'rgba(26, 26, 26, 0.3)',
  blurIntensitySm: 20,
  blurIntensityMd: 28,
  blurIntensityLg: 36,
};

export const globalStyles = StyleSheet.create({
  glassCard: {
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: glassmorphism.card50,
  },
  mutedCard: {
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: glassmorphism.card30,
  },
  centeredIcon: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
