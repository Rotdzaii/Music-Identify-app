import { Music } from 'lucide-react-native';
import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Theme } from '@/constants/Theme';
import { globalStyles } from '@/constants/globalStyles';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
}

export default function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <View style={globalStyles.centeredIcon}>
          {icon ?? <Music size={44} color={Theme.colors.mutedForeground} />}
        </View>
      </View>

      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Theme.spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.md,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Theme.colors.muted,
  },
  textBlock: {
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    maxWidth: 320,
  },
  title: {
    color: Theme.colors.foreground,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    marginTop: Theme.spacing.xs,
    color: Theme.colors.mutedForeground,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
