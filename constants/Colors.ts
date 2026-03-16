import { Theme } from '@/constants/Theme';

const tintColorLight = Theme.colors.primary;
const tintColorDark = Theme.colors.primary;

export default {
  light: {
    text: '#111827',
    background: '#ffffff',
    tint: tintColorLight,
    tabIconDefault: '#71717a',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: Theme.colors.foreground,
    background: Theme.colors.background,
    tint: tintColorDark,
    tabIconDefault: Theme.colors.mutedForeground,
    tabIconSelected: tintColorDark,
  },
};
