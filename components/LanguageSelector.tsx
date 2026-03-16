import { BlurView } from 'expo-blur';
import { ChevronDown, Globe } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Theme } from '@/constants/Theme';
import { glassmorphism } from '@/constants/globalStyles';
import { LANGUAGES, type LanguageCode } from '@/lib/music-utils';

interface LanguageSelectorProps {
  language: string;
  onChange: (language: string) => void;
}

export default function LanguageSelector({ language, onChange }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const entries = Object.entries(LANGUAGES) as Array<[LanguageCode, (typeof LANGUAGES)[LanguageCode]]>;

  const selectedLanguage = useMemo(
    () => entries.find(([code]) => code === language)?.[1] ?? entries[0][1],
    [entries, language]
  );

  const handleSelect = (nextLanguage: string) => {
    onChange(nextLanguage);
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      <BlurView intensity={24} tint="dark" style={styles.blurContainer}>
        <TouchableOpacity
          onPress={() => setIsOpen((prev) => !prev)}
          activeOpacity={0.85}
          style={styles.triggerButton}
        >
          <View style={styles.triggerContent}>
            <Globe size={18} color={Theme.colors.secondary} />
            <Text style={styles.triggerText}>{selectedLanguage.name}</Text>
          </View>
          <ChevronDown
            size={18}
            color={Theme.colors.iconNeutral}
            style={isOpen ? styles.chevronOpened : undefined}
          />
        </TouchableOpacity>
      </BlurView>

      {isOpen && (
        <BlurView intensity={36} tint="dark" style={styles.dropdown}>
          <FlatList
            data={entries}
            keyExtractor={([code]) => code}
            scrollEnabled={false}
            renderItem={({ item }) => {
              const [code, info] = item;
              const isActive = code === language;

              return (
                <TouchableOpacity
                  onPress={() => handleSelect(code)}
                  activeOpacity={0.85}
                  style={[styles.optionButton, isActive && styles.optionButtonActive]}
                >
                  <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
                    {info.name}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </BlurView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 340,
    zIndex: 100,
  },
  blurContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.alphaBorderSoft,
    backgroundColor: glassmorphism.card50,
  },
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  triggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  triggerText: {
    color: Theme.colors.foreground,
    fontSize: 15,
    fontWeight: '600',
  },
  chevronOpened: {
    transform: [{ rotate: '180deg' }],
  },
  dropdown: {
    marginTop: 8,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.alphaBorderSoft,
    backgroundColor: glassmorphism.card50,
  },
  optionButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  optionButtonActive: {
    backgroundColor: Theme.colors.alphaPrimary30,
  },
  optionText: {
    color: Theme.colors.mutedForeground,
    fontSize: 14,
    fontWeight: '500',
  },
  optionTextActive: {
    color: Theme.colors.foreground,
  },
});
