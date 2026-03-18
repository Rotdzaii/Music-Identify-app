import { Mic, Square } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import {
    ActivityIndicator,
    Animated,
    Easing,
    StyleSheet,
    TouchableOpacity,
    Vibration,
    View,
} from 'react-native';

import { Theme } from '@/constants/Theme';

export type RecordingStatus = 'idle' | 'recording' | 'processing';

interface RecordButtonProps {
	status: RecordingStatus;
	onStart: () => void | Promise<void>;
	onStop: () => void | Promise<void>;
}

export default function RecordButton({ status, onStart, onStop }: RecordButtonProps) {
	const pulse = useRef(new Animated.Value(0)).current;
	const isRecording = status === 'recording';
	const isProcessing = status === 'processing';

	useEffect(() => {
		if (!isRecording) {
			pulse.setValue(0);
			return;
		}

		const loop = Animated.loop(
			Animated.timing(pulse, {
				toValue: 1,
				duration: 1200,
				easing: Easing.out(Easing.quad),
				useNativeDriver: true,
			})
		);

		loop.start();
		return () => loop.stop();
	}, [isRecording, pulse]);

	const handlePress = async () => {
		if (isProcessing) {
			return;
		}

		Vibration.vibrate(12);

		if (isRecording) {
			await onStop();
			return;
		}

		await onStart();
	};

	const pulseScale = pulse.interpolate({
		inputRange: [0, 1],
		outputRange: [0.92, 1.28],
	});

	const pulseOpacity = pulse.interpolate({
		inputRange: [0, 1],
		outputRange: [0.55, 0],
	});

	return (
		<View style={styles.wrap}>
			{isRecording ? (
				<Animated.View
					style={[
						styles.pulseRing,
						{
							opacity: pulseOpacity,
							transform: [{ scale: pulseScale }],
						},
					]}
				/>
			) : null}

			<TouchableOpacity
				style={[styles.button, isRecording ? styles.buttonRecording : undefined]}
				onPress={() => {
					handlePress().catch(() => undefined);
				}}
				activeOpacity={0.88}
				disabled={isProcessing}
			>
				{isProcessing ? (
					<ActivityIndicator color={Theme.colors.foreground} size="large" />
				) : isRecording ? (
					<Square size={42} color={Theme.colors.foreground} />
				) : (
					<Mic size={42} color={Theme.colors.foreground} />
				)}
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {
		width: 170,
		height: 170,
		alignItems: 'center',
		justifyContent: 'center',
	},
	pulseRing: {
		position: 'absolute',
		width: 170,
		height: 170,
		borderRadius: 85,
		borderWidth: 2,
		borderColor: Theme.colors.alphaDestructive50,
		backgroundColor: Theme.colors.alphaDestructive08,
	},
	button: {
		width: 132,
		height: 132,
		borderRadius: 66,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: Theme.colors.primary,
		shadowColor: Theme.colors.primary,
		shadowOffset: { width: 0, height: 10 },
		shadowRadius: 16,
		shadowOpacity: 0.45,
		elevation: 10,
	},
	buttonRecording: {
		backgroundColor: Theme.colors.destructive,
		shadowColor: Theme.colors.destructive,
	},
});
