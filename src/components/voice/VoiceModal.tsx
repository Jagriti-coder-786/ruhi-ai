'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, X, Sparkles } from 'lucide-react';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (text: string) => void;
  lastAssistantResponse?: string;
}

export function VoiceModal({
  isOpen,
  onClose,
  onSendMessage,
  lastAssistantResponse,
}: VoiceModalProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        setVoiceStatus('idle');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Text-To-Speech for assistant response
  useEffect(() => {
    if (!isOpen || !lastAssistantResponse) return;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any previous speech

      // Clean markdown tags for spoken voice
      const cleanText = lastAssistantResponse
        .replace(/[*_#`[\]()]/g, ' ')
        .replace(/https?:\/\/\S+/g, '')
        .slice(0, 400);

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      // Select natural sounding voice if available
      const voices = window.speechSynthesis.getVoices();
      const naturalVoice = voices.find(
        (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))
      );
      if (naturalVoice) utterance.voice = naturalVoice;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setVoiceStatus('speaking');
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setVoiceStatus('idle');
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setVoiceStatus('idle');
      };

      window.speechSynthesis.speak(utterance);
    }
  }, [lastAssistantResponse, isOpen]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setVoiceStatus('idle');
    } else {
      // Stop speech synthesis if talking
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }

      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
      setVoiceStatus('listening');
    }
  };

  const handleSendSpokenQuery = () => {
    if (!transcript.trim()) return;
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    setVoiceStatus('thinking');
    onSendMessage(transcript.trim());
    setTranscript('');
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setVoiceStatus('idle');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg p-8 rounded-3xl bg-slate-900 border border-purple-500/30 shadow-2xl flex flex-col items-center text-center">
        {/* Close Button */}
        <button
          onClick={() => {
            stopSpeaking();
            if (isListening && recognitionRef.current) recognitionRef.current.stop();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Visualizer Aura */}
        <div className="relative my-8 flex items-center justify-center">
          <div
            className={`absolute w-44 h-44 rounded-full blur-2xl transition-all duration-700 ${
              voiceStatus === 'listening'
                ? 'bg-purple-600/40 scale-125 animate-pulse'
                : voiceStatus === 'speaking'
                ? 'bg-pink-600/40 scale-125 animate-pulse'
                : voiceStatus === 'thinking'
                ? 'bg-cyan-600/40 scale-110 animate-spin'
                : 'bg-purple-600/15 scale-100'
            }`}
          />
          <button
            onClick={toggleListening}
            className={`relative z-10 w-28 h-28 rounded-full flex items-center justify-center text-white shadow-2xl transition-all transform active:scale-95 ${
              isListening
                ? 'bg-gradient-to-tr from-purple-600 to-pink-500 ring-4 ring-purple-400/50'
                : 'bg-slate-800 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            {isListening ? (
              <Mic className="w-10 h-10 animate-bounce" />
            ) : (
              <MicOff className="w-10 h-10 text-slate-400" />
            )}
          </button>
        </div>

        {/* Status Text */}
        <div className="mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            {voiceStatus === 'listening'
              ? 'Listening to you...'
              : voiceStatus === 'speaking'
              ? 'Ruhi is speaking...'
              : voiceStatus === 'thinking'
              ? 'Processing thought...'
              : 'Tap microphone to speak'}
          </span>
        </div>

        <h3 className="text-xl font-bold text-white mb-2">Hands-Free Ruhi Voice</h3>
        <p className="text-sm text-slate-400 mb-6 max-w-sm">
          Natural speech-to-text and auditory synthesis. Speak your prompt or question naturally.
        </p>

        {/* Real-time transcript box */}
        <div className="w-full min-h-[70px] p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-sm text-slate-200 mb-6 text-left flex items-center justify-center italic">
          {transcript ? `"${transcript}"` : <span className="text-slate-500">Your transcribed speech will appear here...</span>}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 w-full">
          {transcript && (
            <button
              onClick={handleSendSpokenQuery}
              className="flex-1 py-3 px-5 rounded-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/25 transition-all text-sm"
            >
              Send to Ruhi
            </button>
          )}

          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all text-sm"
            >
              <VolumeX className="w-4 h-4 text-pink-400" />
              <span>Mute Voice</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default VoiceModal;
