import { Audio } from 'expo-av';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseRecordingState {
	isRecording: boolean;
	lastRecordingUri: string | null;
}

export function useRecording() {
	const recordingRef = useRef<Audio.Recording | null>(null);
	const [state, setState] = useState<UseRecordingState>({
		isRecording: false,
		lastRecordingUri: null,
	});

	const startRecording = useCallback(async () => {
		if (recordingRef.current) {
			return;
		}

		const permission = await Audio.requestPermissionsAsync();
		if (!permission.granted) {
			console.error('[useRecording] Microphone permission denied', {
				canAskAgain: permission.canAskAgain,
				expires: permission.expires,
				status: permission.status,
			});
			throw new Error('Microphone permission is required.');
		}

		await Audio.setAudioModeAsync({
			allowsRecordingIOS: true,
			playsInSilentModeIOS: true,
			staysActiveInBackground: true,
			playThroughEarpieceAndroid: false,
		});

		const { recording } = await Audio.Recording.createAsync(
			Audio.RecordingOptionsPresets.HIGH_QUALITY
		);

		recordingRef.current = recording;
		setState((prev) => ({ ...prev, isRecording: true }));
	}, []);

	const stopRecording = useCallback(async (): Promise<string | null> => {
		const activeRecording = recordingRef.current;
		if (!activeRecording) {
			return null;
		}

		try {
			// Give encoder a brief moment to flush audio data before unloading.
			await new Promise((resolve) => setTimeout(resolve, 300));
			await activeRecording.stopAndUnloadAsync();
			const uri = activeRecording.getURI() ?? null;

			setState({
				isRecording: false,
				lastRecordingUri: uri,
			});

			return uri;
		} finally {
			recordingRef.current = null;
			await Audio.setAudioModeAsync({
				allowsRecordingIOS: false,
				playsInSilentModeIOS: true,
				staysActiveInBackground: false,
				playThroughEarpieceAndroid: false,
			});
		}
	}, []);

	useEffect(() => {
		return () => {
			const activeRecording = recordingRef.current;
			if (!activeRecording) {
				return;
			}

			activeRecording.stopAndUnloadAsync().catch(() => undefined);
		};
	}, []);

	return {
		isRecording: state.isRecording,
		lastRecordingUri: state.lastRecordingUri,
		startRecording,
		stopRecording,
	};
}

