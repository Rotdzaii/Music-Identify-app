import { BlurView } from 'expo-blur';
import { Check, ChevronDown, Languages, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { Theme } from '@/constants/Theme';

export type SupportedLanguage = 'vi' | 'en';

interface LanguagePickerProps {
	selectedLanguage: SupportedLanguage;
	onSelectLanguage: (language: SupportedLanguage) => void;
}

const OPTIONS: Array<{ code: SupportedLanguage; label: string; emoji: string }> = [
	{ code: 'vi', label: 'Tiếng Việt', emoji: '🇻🇳' },
	{ code: 'en', label: 'English', emoji: '🇺🇸' },
];

export default function LanguagePicker({ selectedLanguage, onSelectLanguage }: LanguagePickerProps) {
	const [isOpen, setIsOpen] = useState(false);

	const selected = useMemo(
		() => OPTIONS.find((option) => option.code === selectedLanguage) ?? OPTIONS[0],
		[selectedLanguage]
	);

	const handleSelect = (code: SupportedLanguage) => {
		onSelectLanguage(code);
		setIsOpen(false);
	};

	return (
		<>
			<BlurView intensity={24} tint="dark" style={styles.triggerWrap}>
				<TouchableOpacity style={styles.triggerButton} activeOpacity={0.88} onPress={() => setIsOpen(true)}>
					<View style={styles.triggerLeft}>
						<Languages size={16} color={Theme.colors.secondary} />
						<Text style={styles.triggerText}>{`${selected.emoji} ${selected.code.toUpperCase()}`}</Text>
					</View>
					<ChevronDown size={15} color={Theme.colors.iconNeutral} />
				</TouchableOpacity>
			</BlurView>

			<Modal visible={isOpen} transparent animationType="slide" onRequestClose={() => setIsOpen(false)}>
				<Pressable style={styles.backdrop} onPress={() => setIsOpen(false)}>
					<Pressable style={styles.sheetWrap} onPress={(event) => event.stopPropagation()}>
						<BlurView intensity={36} tint="dark" style={styles.sheetCard}>
							<View style={styles.sheetHeader}>
								<Text style={styles.sheetTitle}>Chọn ngôn ngữ</Text>
								<TouchableOpacity style={styles.closeButton} onPress={() => setIsOpen(false)} activeOpacity={0.85}>
									<X size={16} color={Theme.colors.mutedForeground} />
								</TouchableOpacity>
							</View>

							<View style={styles.optionList}>
								{OPTIONS.map((option) => {
									const active = option.code === selectedLanguage;
									return (
										<TouchableOpacity
											key={option.code}
											style={[styles.optionButton, active ? styles.optionButtonActive : undefined]}
											onPress={() => handleSelect(option.code)}
											activeOpacity={0.88}
										>
											<View style={styles.optionInfo}>
												<Text style={styles.optionEmoji}>{option.emoji}</Text>
												<Text style={[styles.optionLabel, active ? styles.optionLabelActive : undefined]}>
													{option.label}
												</Text>
											</View>

											{active ? <Check size={17} color={Theme.colors.secondary} /> : null}
										</TouchableOpacity>
									);
								})}
							</View>
						</BlurView>
					</Pressable>
				</Pressable>
			</Modal>
		</>
	);
}

const styles = StyleSheet.create({
	triggerWrap: {
		borderRadius: 999,
		overflow: 'hidden',
		borderWidth: 1,
		borderColor: Theme.colors.alphaBorderSoft,
		backgroundColor: Theme.colors.alphaCardGlassStrong,
	},
	triggerButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 8,
		paddingHorizontal: 12,
		paddingVertical: 8,
		minWidth: 98,
	},
	triggerLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	triggerText: {
		color: Theme.colors.foreground,
		fontSize: 12,
		fontWeight: '700',
		letterSpacing: 0.4,
	},
	backdrop: {
		flex: 1,
		justifyContent: 'flex-end',
		backgroundColor: 'rgba(0, 0, 0, 0.45)',
	},
	sheetWrap: {
		paddingHorizontal: 12,
		paddingBottom: 14,
	},
	sheetCard: {
		borderRadius: 22,
		overflow: 'hidden',
		borderWidth: 1,
		borderColor: Theme.colors.alphaBorderStrong,
		backgroundColor: Theme.colors.alphaCardGlassStrong,
		paddingHorizontal: 14,
		paddingTop: 12,
		paddingBottom: 14,
		gap: 10,
	},
	sheetHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	sheetTitle: {
		color: Theme.colors.foreground,
		fontSize: 15,
		fontWeight: '800',
	},
	closeButton: {
		width: 28,
		height: 28,
		borderRadius: 14,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: Theme.colors.alphaCardGlass,
	},
	optionList: {
		gap: 8,
	},
	optionButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		borderRadius: 12,
		borderWidth: 1,
		borderColor: Theme.colors.alphaBorderStrong,
		backgroundColor: Theme.colors.alphaCardGlass,
		paddingHorizontal: 12,
		paddingVertical: 12,
	},
	optionButtonActive: {
		borderColor: Theme.colors.alphaSecondary20,
		backgroundColor: Theme.colors.alphaSecondary14,
	},
	optionInfo: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	optionEmoji: {
		fontSize: 18,
	},
	optionLabel: {
		color: Theme.colors.foregroundMuted,
		fontSize: 14,
		fontWeight: '600',
	},
	optionLabelActive: {
		color: Theme.colors.foreground,
	},
});
