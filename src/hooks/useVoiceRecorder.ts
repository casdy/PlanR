/**
 * @file src/hooks/useVoiceRecorder.ts
 * @description Custom hook that manages microphone recording via the Web MediaRecorder API.
 *
 * Used in the Active Workout Overlay so users can verbally log their set reps/weight
 * which is then transcribed and injected into the exercise log form.
 *
 * Usage:
 *   const { isRecording, audioBlob, startRecording, stopRecording } = useVoiceRecorder();
 */
import { useState, useCallback, useRef } from 'react';

/**
 * Manages the start/stop lifecycle of a microphone recording session.
 * Once `stopRecording()` is called, the final audio is available as `audioBlob`.
 */
export const useVoiceRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    /** The final audio recording as a Blob once the session ends. */
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    /** Accumulates raw audio chunks as they stream in. */
    const chunksRef = useRef<Blob[]>([]);

    /** Requests microphone access and begins recording. Resets any previous blob. */
    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                // Assemble all collected chunks into a single audio blob
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                // Stop all tracks to release the microphone indicator in the OS
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setAudioBlob(null);
        } catch (err) {
            console.error('Failed to start recording', err);
        }
    }, []);

    /** Stops the active recording and triggers blob assembly via `onstop`. */
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }, [isRecording]);

    return {
        isRecording,
        audioBlob,
        startRecording,
        stopRecording
    };
};
