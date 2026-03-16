import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Share2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Theme } from '@/constants/Theme';
import { formatTime } from '@/lib/music-utils';
import type { RecognitionResult } from '@/types/recognition';

interface ResultCardProps {
	result: RecognitionResult;
}

export default function ResultCard({ result }: ResultCardProps) {
	const [isFavorited, setIsFavorited] = useState(false);

	const recognizedTime = useMemo(() => {
		return formatTime(result.timestamp);
	}, [result.timestamp]);

	return (
		<LinearGradient
			colors={[Theme.colors.gradientCardStart, Theme.colors.gradientCardEnd]}
			start={{ x: 0, y: 0 }}
			end={{ x: 1, y: 1 }}
			style={styles.card}
		>
			<View style={styles.artWrap}>
				<Image
					source={{
						uri:
							result.albumArtUri ??
							'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1000&q=80',
					}}
					resizeMode="cover"
					style={styles.artImage}
				/>
			</View>

			<View style={styles.infoBlock}>
				<Text numberOfLines={2} style={styles.title}>
					{result.title}
				</Text>
				<Text numberOfLines={1} style={styles.artist}>
					{result.artist}
				</Text>
				<Text style={styles.caption}>Recognized at {recognizedTime}</Text>
			</View>

			<View style={styles.actions}>
				<TouchableOpacity
					onPress={() => setIsFavorited((prev) => !prev)}
					activeOpacity={0.85}
					style={[styles.actionButton, isFavorited ? styles.favoriteActive : undefined]}
				>
					<Heart
						size={18}
						color={isFavorited ? Theme.colors.foreground : Theme.colors.mutedForeground}
					/>
					<Text style={[styles.actionText, isFavorited ? styles.actionTextActive : undefined]}>
						{isFavorited ? 'Favorited' : 'Favorite'}
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					onPress={() => Alert.alert('Share', 'Share action will be connected in next iteration.')}
					activeOpacity={0.85}
					style={styles.actionButton}
				>
					<Share2 size={18} color={Theme.colors.secondary} />
					<Text style={styles.actionText}>Share</Text>
				</TouchableOpacity>
			</View>
		</LinearGradient>
	);
}

const styles = StyleSheet.create({
	card: {
		borderRadius: 22,
		padding: 16,
		borderWidth: 1,
		borderColor: Theme.colors.alphaPrimary20,
		shadowColor: Theme.colors.primary,
		shadowOpacity: 0.3,
		shadowOffset: { width: 0, height: 8 },
		shadowRadius: 16,
		elevation: 10,
		width: '100%',
	},
	artWrap: {
		borderRadius: 14,
		overflow: 'hidden',
		height: 165,
		marginBottom: 14,
	},
	artImage: {
		width: '100%',
		height: '100%',
	},
	infoBlock: {
		gap: 4,
	},
	title: {
		color: Theme.colors.foreground,
		fontSize: 24,
		fontWeight: '800',
	},
	artist: {
		color: Theme.colors.secondary,
		fontSize: 17,
		fontWeight: '500',
	},
	caption: {
		marginTop: 8,
		color: Theme.colors.mutedForeground,
		fontSize: 12,
		textTransform: 'uppercase',
		letterSpacing: 0.6,
	},
	actions: {
		marginTop: 14,
		flexDirection: 'row',
		gap: 10,
	},
	actionButton: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		gap: 6,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: Theme.colors.alphaBorderMedium,
		paddingVertical: 11,
		backgroundColor: Theme.colors.alphaCardGlass,
	},
	favoriteActive: {
		backgroundColor: Theme.colors.alphaPrimary70,
		borderColor: Theme.colors.alphaPrimary80,
	},
	actionText: {
		color: Theme.colors.mutedForeground,
		fontSize: 14,
		fontWeight: '600',
	},
	actionTextActive: {
		color: Theme.colors.foreground,
	},
});

