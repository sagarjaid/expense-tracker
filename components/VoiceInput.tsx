/** @format */

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic } from 'lucide-react';
import wave from '@/app/wave.gif';
import Image from 'next/image';
import Wave from './wave';
import { useTheme } from 'next-themes';

interface VoiceInputProps {
  onResult: (
    data: Partial<{
      amount: string;
      description: string;
      category: string;
      subcategory: string;
      date: Date;
    }>
  ) => void;
}

const MAX_RECORDING_TIME = 30000; // 30 seconds

const VoiceInput: React.FC<VoiceInputProps> = ({ onResult }) => {
  const { theme } = useTheme();
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [mimeType, setMimeType] = useState<string>('');

  const gradientColor =
    theme === 'dark' ? 'rgba(0,0,0,1)' : 'rgba(255,255,255,1)';
  const gradientColor70 =
    theme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)';
  const gradientColor20 =
    theme === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)';

  const startRecording = async () => {
    setError(null);
    setTimeLeft(30);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      // Dynamically select supported MIME type
      let selectedMimeType = '';
      if (MediaRecorder.isTypeSupported('audio/webm')) {
        selectedMimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        selectedMimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/mpeg')) {
        selectedMimeType = 'audio/mpeg';
      } else if (MediaRecorder.isTypeSupported('audio/wav')) {
        selectedMimeType = 'audio/wav';
      } else if (MediaRecorder.isTypeSupported('audio/aac')) {
        selectedMimeType = 'audio/aac';
      } else {
        setError('No supported audio format found on this device.');
        return;
      }
      setMimeType(selectedMimeType);
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
      });
      audioChunks.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
        }
        // Stop the audio stream to release the mic
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        // Check if any audio was recorded (not just empty chunks)
        const hasAudio = audioChunks.current.some((chunk) => chunk.size > 0);
        if (!hasAudio) {
          setError('No audio detected. Please try again.');
          setRecording(false);
          setTimeLeft(30);
          return;
        }
        const blob = new Blob(audioChunks.current, { type: selectedMimeType });
        sendAudioToAPI(blob, selectedMimeType);
        setTimeLeft(30);
      };
      mediaRecorderRef.current.start();
      setRecording(true);
      // Auto-stop after 30 seconds
      timerRef.current = window.setTimeout(() => {
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state === 'recording'
        ) {
          mediaRecorderRef.current.stop();
          setRecording(false);
        }
      }, MAX_RECORDING_TIME);
      // Start countdown
      countdownRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (
              mediaRecorderRef.current &&
              mediaRecorderRef.current.state === 'recording'
            ) {
              mediaRecorderRef.current.stop();
              setRecording(false);
            }
            if (countdownRef.current) {
              clearInterval(countdownRef.current);
            }
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError('Could not access microphone.');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    mediaRecorderRef.current?.stop();
    // Stop the audio stream to release the mic
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setRecording(false);
    setTimeLeft(30);
  };

  const sendAudioToAPI = async (blob: Blob, mimeTypeOverride?: string) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      // Use the correct file extension based on MIME type
      let extension = 'webm';
      if (mimeTypeOverride) {
        const extMap: { [key: string]: string } = {
          'audio/webm': 'webm',
          'audio/mp4': 'mp4',
          'audio/mpeg': 'mp3',
          'audio/wav': 'wav',
          'audio/aac': 'aac',
        };
        extension = extMap[mimeTypeOverride] || 'webm';
      }
      formData.append('audio', blob, `recording.${extension}`);
      const res = await fetch('/api/voice-expense', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else if (data.extracted) {
        onResult(data.extracted);
      } else {
        // Fallback: Use transcription.text from Whisper JSON response
        const parsed = parseExpenseFromText(data.transcription.text);
        if (parsed) onResult(parsed);
      }
    } catch (err) {
      setError('Failed to transcribe audio.');
    }
    setLoading(false);
  };

  // Simple parser for demo; improve as needed
  function parseExpenseFromText(text: string) {
    // Example: "50 dollars for rent under needs category on April 6, 2025"
    const amountMatch = text.match(/(\d+(\.\d+)?)/);
    const amount = amountMatch ? amountMatch[1] : '';
    const descriptionMatch = text.match(/for (.*?) under/);
    const description = descriptionMatch ? descriptionMatch[1] : '';
    const categoryMatch = text.match(/under (.*?) category/);
    const category = categoryMatch ? capitalize(categoryMatch[1]) : '';
    const subcategoryMatch = text.match(/for (.*?) under/);
    const subcategory = subcategoryMatch ? capitalize(subcategoryMatch[1]) : '';
    const dateMatch = text.match(/on (.*)/);
    let date;
    if (dateMatch) {
      const d = new Date(dateMatch[1]);
      if (!isNaN(d.getTime())) date = d;
    }
    return { amount, description, category, subcategory, date };
  }

  function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  return (
    <div className='fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50'>
      <div
        className='flex flex-col items-center justify-center cursor-pointer relative'
        onClick={recording ? stopRecording : startRecording}>
        {/* Gradient background behind the button */}
        <div
          className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none'
          style={{
            width: 250,
            height: 250,
            borderRadius: '100%',
            background: `radial-gradient(circle, ${gradientColor} 0%, ${gradientColor70} 40%, ${gradientColor20} 80%, transparent 100%)`,
            zIndex: 0,
          }}
        />
        {error && (
          <div className='text-red-500 font-semibold text-sm mt-1'>{error}</div>
        )}
        {loading && (
          <div className='text-red-500 font-semibold text-sm'>Hold On!</div>
        )}
        {recording ? (
          <div className='flex flex-col items-center gap-1 justify-center z-10'>
            <div className='text-green-500 font-bold text-sm'>{timeLeft}s</div>
            <div className='flex flex-col items-center justify-center bg-green-500 rounded-full w-16 h-16 shadow-2xl'>
              <Wave className='h-8 w-16 object-contain animate-pulse' />
            </div>
          </div>
        ) : (
          <div className='flex flex-col items-center justify-center bg-red-500 rounded-full w-16 h-16 shadow-2xl z-10'>
            <Mic
              className='text-white'
              size={28}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceInput;
