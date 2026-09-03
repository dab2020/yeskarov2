import { useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync } from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

const MAX_SECONDS = 120;

export function useVoiceRecorder() {
  const nativeRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const webRecorder = useRef<MediaRecorder | null>(null);
  const webStream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audioBlobOrUri, setAudio] = useState<Blob | string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(async () => {
    if (!isRecording) return audioBlobOrUri;
    setIsRecording(false);
    if (Platform.OS === 'web') {
      const recorder = webRecorder.current;
      if (!recorder || recorder.state === 'inactive') return null;
      return new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          const blob = new Blob(chunks.current, { type: recorder.mimeType || 'audio/webm' });
          setAudio(blob); resolve(blob);
          webStream.current?.getTracks().forEach((track) => track.stop());
        };
        recorder.stop();
      });
    }
    await nativeRecorder.stop();
    const uri = nativeRecorder.uri;
    if (uri) setAudio(uri);
    return uri;
  }, [audioBlobOrUri, isRecording, nativeRecorder]);

  const start = useCallback(async () => {
    try {
      setError(null); setAudio(null); setSeconds(0); chunks.current = [];
      if (Platform.OS === 'web') {
        if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') throw new Error('Audio recording is not supported in this browser.');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        webStream.current = stream;
        const preferred = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
        const recorder = new MediaRecorder(stream, { mimeType: preferred });
        recorder.ondataavailable = (event) => { if (event.data.size) chunks.current.push(event.data); };
        recorder.start(500); webRecorder.current = recorder;
      } else {
        const permission = await requestRecordingPermissionsAsync();
        if (!permission.granted) throw new Error('Microphone permission is required to record project terms.');
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await nativeRecorder.prepareToRecordAsync();
        nativeRecorder.record();
      }
      setIsRecording(true);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Could not start recording.';
      setError(message); throw cause;
    }
  }, [nativeRecorder]);

  useEffect(() => {
    if (!isRecording) return;
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [isRecording]);

  useEffect(() => {
    if (isRecording && seconds >= MAX_SECONDS) void stop();
  }, [isRecording, seconds, stop]);

  useEffect(() => () => webStream.current?.getTracks().forEach((track) => track.stop()), []);

  return { isRecording, start, stop, audioBlobOrUri, seconds, maxSeconds: MAX_SECONDS, error };
}
