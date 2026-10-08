'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Square,
  Globe,
  Paperclip,
  Mic,
  Copy,
  Check,
  RotateCw,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Cpu,
  ChevronDown,
  X,
  FileText,
  Image as ImageIcon,
  Calculator,
  Lock,
  Share2,
  Download,
  Volume2,
  VolumeX,
  Pencil,
  Clock,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Plug,
  CalendarClock,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import MarkdownRenderer from './MarkdownRenderer';
import { FeedbackModal } from '@/components/modals/FeedbackModal';
import { IMessage, ModelCapability, ICitation, IAttachment } from '@/types';

interface ChatAreaProps {
  messages: IMessage[];
  currentStreamingText: string;
  isStreaming: boolean;
  onSendMessage: (
    content: string,
    attachments?: IAttachment[],
    webSearch?: boolean,
    modelId?: string
  ) => void;
  onStopStreaming: () => void;
  onRegenerate: () => void;
  onOpenVoice: () => void;
  onOpenUpgrade: () => void;
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  availableModels: ModelCapability[];
  currentCitations: ICitation[];
  toolStatus?: string | null;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onSwitchVersion?: (messageId: string, versionIndex: number) => void;
  onOpenShare?: () => void;
  onOpenExport?: () => void;
  isTemporaryChat?: boolean;
  onToggleTemporaryChat?: () => void;
  onFeedback?: (messageId: string, type: 'like' | 'dislike', reason?: string, comment?: string) => Promise<void>;
  onOpenWorkspace?: (tab?: 'document' | 'code' | 'spreadsheet' | 'presentation') => void;
  onOpenConnectors?: () => void;
  onOpenTasks?: () => void;
}

export function ChatArea({
  messages,
  currentStreamingText,
  isStreaming,
  onSendMessage,
  onStopStreaming,
  onRegenerate,
  onOpenVoice,
  onOpenUpgrade,
  selectedModelId,
  onSelectModel,
  availableModels,
  currentCitations,
  toolStatus,
  onEditMessage,
  onSwitchVersion,
  onOpenShare,
  onOpenExport,
  isTemporaryChat = false,
  onToggleTemporaryChat,
  onFeedback,
  onOpenWorkspace,
  onOpenConnectors,
  onOpenTasks,
}: ChatAreaProps) {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [attachments, setAttachments] = useState<IAttachment[]>([]);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [selectedCitation, setSelectedCitation] = useState<ICitation | null>(null);

  // Editing state for user messages
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Speech (read aloud) state
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  // Feedback modal
  const [feedbackModalMsgId, setFeedbackModalMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll when messages update or streaming text arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentStreamingText]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Adjust textarea height dynamically
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if ((!input.trim() && attachments.length === 0) || isStreaming) return;
    onSendMessage(input.trim(), attachments, webSearchEnabled, selectedModelId);
    setInput('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImage = file.type.startsWith('image/');

      if (isImage) {
        const reader = new FileReader();
        reader.onload = () => {
          setAttachments((prev) => [
            ...prev,
            {
              name: file.name,
              type: 'image',
              mimeType: file.type,
              size: file.size,
              dataBase64: reader.result as string,
            },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        const formData = new FormData();
        formData.append('file', file);
        try {
          const res = await fetch('/api/documents', {
            method: 'POST',
            body: formData,
          });
          if (res.ok) {
            const data = await res.json();
            setAttachments((prev) => [
              ...prev,
              {
                name: file.name,
                type: 'document',
                mimeType: file.type || 'application/pdf',
                size: file.size,
                documentId: data.document?._id,
              },
            ]);
          }
        } catch (err) {
          console.error('File upload failed:', err);
        }
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  // Text-to-Speech (Read Aloud)
  const handleToggleSpeak = (id: string, text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (speakingMsgId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanSpeech = text
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/[#*`_~]/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.rate = 1.0;
    utterance.pitch = 1.02;
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(id);
    window.speechSynthesis.speak(utterance);
  };

  // User Message Editing
  const handleStartEdit = (msg: IMessage) => {
    setEditingMsgId(msg._id);
    setEditingText(msg.content);
  };

  const handleSaveEdit = (msgId: string) => {
    if (!editingText.trim()) return;
    onEditMessage?.(msgId, editingText.trim());
    setEditingMsgId(null);
  };

  const currentModel =
    availableModels.find((m) => m.id === selectedModelId) || availableModels[0];

  const starterPrompts = [
    {
      title: 'Analyze & Reason',
      prompt: 'Explain the core difference between optimistic and pessimistic concurrency control with database examples.',
      icon: <Cpu className="w-4 h-4 text-purple-400" />,
    },
    {
      title: 'Multilingual Hinglish',
      prompt: 'bhai mujhe recursion simple language me samjha',
      icon: <Sparkles className="w-4 h-4 text-pink-400" />,
    },
    {
      title: 'Live News & Research',
      prompt: 'What happened in AI today? Give me top developments with citations.',
      icon: <Globe className="w-4 h-4 text-cyan-400" />,
    },
    {
      title: 'Math & Computation',
      prompt: 'Calculate 98374 × 728.',
      icon: <Calculator className="w-4 h-4 text-emerald-400" />,
    },
  ];

  // Helper to get intelligent follow-up suggestions
  const getFollowUpSuggestions = (content: string): string[] => {
    const text = (content || '').toLowerCase();
    if (text.includes('code') || text.includes('function') || text.includes('def ') || text.includes('const ')) {
      return [
        'Can you show a complete runnable example?',
        'What are common edge cases or pitfalls to avoid?',
        'How would I write unit tests for this?',
      ];
    }
    if (text.includes('news') || text.includes('source') || text.includes('update') || text.includes('announced')) {
      return [
        'What are the broader industry implications?',
        'Give me a 3-bullet summary of key takeaways',
        'How does this compare to competing models?',
      ];
    }
    if (text.includes('vs') || text.includes('difference') || text.includes('compare')) {
      return [
        'Which one should I choose for production?',
        'Summarize the key pros & cons in a table',
        'What are the performance tradeoffs?',
      ];
    }
    return [
      'Can you explain this with a practical example?',
      'Summarize this into 3 concise bullet points',
      'What should be the next step?',
    ];
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#070a13] text-slate-100 overflow-hidden relative">
      {/* Top Header Bar */}
      <header className="h-16 border-b border-slate-800/80 px-4 md:px-8 flex items-center justify-between bg-[#070a13]/80 backdrop-blur-md z-20 flex-shrink-0">
        {/* Model Selector Pill */}
        <div className="relative">
          <button
            onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/40 text-xs font-semibold text-slate-200 transition-all shadow-sm"
          >
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>{currentModel?.displayName || 'Ruhi Balanced'}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {modelDropdownOpen && (
            <div className="absolute top-12 left-0 w-72 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-fade-in">
              <div className="text-[11px] font-semibold text-slate-400 px-3 py-1 uppercase tracking-wider">
                Select Intelligence Model
              </div>
              <div className="space-y-1 mt-1">
                {availableModels.map((m) => {
                  const isLocked = m.isPremiumOnly && user?.plan === 'free';
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        if (isLocked) {
                          onOpenUpgrade();
                        } else {
                          onSelectModel(m.id);
                          setModelDropdownOpen(false);
                        }
                      }}
                      className={`w-full flex items-start justify-between p-2.5 rounded-xl text-left transition-colors ${
                        selectedModelId === m.id
                          ? 'bg-purple-600/15 border border-purple-500/30 text-white'
                          : 'hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold">{m.displayName}</span>
                          {m.isPremiumOnly && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              PRO
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 leading-snug">
                          {m.tagline}
                        </p>
                      </div>
                      {isLocked ? (
                        <Lock className="w-3.5 h-3.5 text-slate-500 mt-1 flex-shrink-0" />
                      ) : (
                        selectedModelId === m.id && (
                          <Check className="w-3.5 h-3.5 text-purple-400 mt-1 flex-shrink-0" />
                        )
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Tools (Temporary Chat, Share, Export, Web Search, Voice) */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Temporary Chat Toggle */}
          <button
            onClick={onToggleTemporaryChat}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              isTemporaryChat
                ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-sm shadow-amber-500/20'
                : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-200'
            }`}
            title="Temporary chats aren't saved to history or memory"
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Temp Chat {isTemporaryChat ? 'ON' : 'OFF'}</span>
          </button>

          {/* Share Button */}
          {onOpenShare && (
            <button
              onClick={onOpenShare}
              className="p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-colors"
              title="Share conversation"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-400" />
            </button>
          )}

          {/* Export Button */}
          {onOpenExport && (
            <button
              onClick={onOpenExport}
              className="p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-colors"
              title="Export conversation (MD, TXT, JSON)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          )}

          {/* Workspace Button */}
          {onOpenWorkspace && (
            <button
              onClick={() => onOpenWorkspace('document')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 transition-colors shadow-sm"
              title="Open Workspace (Docs, Code Sandbox, Spreadsheets, Slides)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Workspace</span>
            </button>
          )}

          {/* Connectors Button */}
          {onOpenConnectors && (
            <button
              onClick={onOpenConnectors}
              className="p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-colors"
              title="Workspace Connectors (Drive, GitHub, Slack, Notion)"
            >
              <Plug className="w-3.5 h-3.5 text-cyan-400" />
            </button>
          )}

          {/* Automations Button */}
          {onOpenTasks && (
            <button
              onClick={onOpenTasks}
              className="p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-colors"
              title="Automations & Scheduled Tasks"
            >
              <CalendarClock className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          )}

          {/* Web Search Toggle */}
          <button
            onClick={() => setWebSearchEnabled(!webSearchEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              webSearchEnabled
                ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-sm shadow-cyan-500/20'
                : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Live Web Research"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Web {webSearchEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Voice Mode */}
          <button
            onClick={onOpenVoice}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 border border-purple-500/40 text-purple-300 transition-all shadow-sm"
            title="Launch Voice Conversation"
          >
            <Mic className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden sm:inline">Voice</span>
          </button>
        </div>
      </header>

      {/* Temporary Chat Notice Banner */}
      {isTemporaryChat && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2 flex items-center justify-between text-xs text-amber-300 flex-shrink-0 animate-fade-in">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              <strong>Temporary Chat Active:</strong> Messages aren't saved to your history or personal memory and expire in 24 hours.
            </span>
          </div>
          <button
            onClick={onToggleTemporaryChat}
            className="text-amber-400 hover:text-amber-200 underline text-[11px] ml-4 flex-shrink-0"
          >
            Turn Off
          </button>
        </div>
      )}

      {/* Message Stream Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-12 py-6 space-y-6">
        {/* Empty State */}
        {messages.length === 0 && !isStreaming && (
          <div className="max-w-3xl mx-auto py-12 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 via-pink-500 to-indigo-500 flex items-center justify-center text-white shadow-2xl shadow-purple-600/30 mb-6 animate-pulse">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
              How can I help you today?
            </h2>
            <p className="text-sm text-slate-400 max-w-md mb-10 leading-relaxed">
              Ruhi AI brings together multi-provider intelligence, vector document analysis, live web research, and neural tools.
            </p>

            {/* Starter Prompt Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
              {starterPrompts.map((card, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(card.prompt, [], webSearchEnabled, selectedModelId)}
                  className="p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-purple-500/40 text-left transition-all group flex items-start gap-3 shadow-md"
                >
                  <div className="p-2 rounded-xl bg-slate-800 border border-slate-700/60 group-hover:scale-110 transition-transform">
                    {card.icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white mb-1 group-hover:text-purple-300 transition-colors">
                      {card.title}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {card.prompt}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Conversation Messages */}
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={`max-w-3xl mx-auto flex gap-4 group ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {/* Assistant Avatar */}
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-600/20 flex-shrink-0 mt-1">
                <Sparkles className="w-4 h-4" />
              </div>
            )}

            <div
              className={`relative max-w-[85%] rounded-2xl px-5 py-4 ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white rounded-tr-none shadow-lg shadow-purple-600/10'
                  : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tl-none shadow-md'
              }`}
            >
              {/* Attachments Preview */}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {msg.attachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/10 text-xs"
                    >
                      {att.type === 'image' ? (
                        <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                      <span className="truncate max-w-[140px]">{att.name}</span>
                    </div>
                  ))}
                </div>
              )}



              {/* Message Content or Inline Edit Form */}
              {editingMsgId === msg._id ? (
                <div className="space-y-2">
                  <textarea
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-900 border border-purple-500/50 rounded-xl p-3 text-sm text-white focus:outline-none"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditingMsgId(null)}
                      className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEdit(msg._id)}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white"
                    >
                      Save & Submit
                    </button>
                  </div>
                </div>
              ) : (
                <MarkdownRenderer content={msg.content} />
              )}

              {/* Verified Citations List */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Sources & Citations
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {msg.citations.map((c, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedCitation(c)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 text-slate-300 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3 text-purple-400 flex-shrink-0" />
                        <span className="truncate max-w-[180px]">{c.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Assistant Message Action Bar */}
              {msg.role === 'assistant' && (
                <div className="flex items-center justify-between mt-3 pt-2 text-slate-500 text-xs">
                  <div className="flex items-center gap-3">
                    {/* Copy */}
                    <button
                      onClick={() => handleCopyMessage(msg._id, msg.content)}
                      className="hover:text-slate-300 transition-colors"
                      title="Copy response"
                    >
                      {copiedMsgId === msg._id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Regenerate */}
                    <button
                      onClick={onRegenerate}
                      className="hover:text-slate-300 transition-colors"
                      title="Regenerate alternative response"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>

                    {/* Read aloud / Text-to-Speech */}
                    <button
                      onClick={() => handleToggleSpeak(msg._id, msg.content)}
                      className={`transition-colors ${
                        speakingMsgId === msg._id ? 'text-pink-400 animate-pulse' : 'hover:text-slate-300'
                      }`}
                      title={speakingMsgId === msg._id ? 'Stop speaking' : 'Read aloud'}
                    >
                      {speakingMsgId === msg._id ? (
                        <VolumeX className="w-3.5 h-3.5" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Thumbs up */}
                    <button
                      onClick={() => onFeedback?.(msg._id, 'like')}
                      className={`transition-colors ${
                        msg.feedback === 'like' ? 'text-emerald-400' : 'hover:text-slate-300'
                      }`}
                      title="Helpful"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>

                    {/* Thumbs down (opens feedback modal) */}
                    <button
                      onClick={() => setFeedbackModalMsgId(msg._id)}
                      className={`transition-colors ${
                        msg.feedback === 'dislike' ? 'text-pink-400' : 'hover:text-slate-300'
                      }`}
                      title="Provide feedback on what went wrong"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Alternative Response Versions Switcher (‹ 2 / 3 ›) */}
                  {msg.versions && msg.versions.length > 1 && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-800/80 text-[11px] text-slate-300 font-mono">
                      <button
                        onClick={() =>
                          onSwitchVersion?.(
                            msg._id,
                            Math.max(0, (msg.activeVersionIndex || 0) - 1)
                          )
                        }
                        disabled={(msg.activeVersionIndex || 0) === 0}
                        className="hover:text-white disabled:opacity-30 p-0.5"
                        title="Previous version"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <span>
                        {(msg.activeVersionIndex || 0) + 1} / {msg.versions.length}
                      </span>
                      <button
                        onClick={() =>
                          onSwitchVersion?.(
                            msg._id,
                            Math.min(msg.versions!.length - 1, (msg.activeVersionIndex || 0) + 1)
                          )
                        }
                        disabled={(msg.activeVersionIndex || 0) >= msg.versions.length - 1}
                        className="hover:text-white disabled:opacity-30 p-0.5"
                        title="Next version"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* User Message Action Bar (Edit button) */}
              {msg.role === 'user' && editingMsgId !== msg._id && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleStartEdit(msg)}
                    className="p-1 rounded-lg bg-black/40 text-purple-200 hover:text-white transition-colors"
                    title="Edit message"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Live Streaming Assistant Message */}
        {isStreaming && (
          <div className="max-w-3xl mx-auto flex gap-4 justify-start">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-600/20 flex-shrink-0 mt-1 animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="relative max-w-[85%] rounded-2xl px-5 py-4 bg-slate-900/90 text-slate-200 border border-purple-500/30 rounded-tl-none shadow-md">
              {currentCitations.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    <Globe className="w-3 h-3 animate-spin" />
                    Retrieved {currentCitations.length} live citations...
                  </span>
                </div>
              )}

              {currentStreamingText ? (
                <>
                  <MarkdownRenderer content={currentStreamingText} />
                  <span className="streaming-cursor" />
                </>
              ) : (
                <div className="flex items-center gap-2.5 text-xs text-purple-300 font-medium py-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                  </span>
                  <span>{toolStatus || '🧠 Ruhi is reasoning and preparing response...'}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contextual Follow-up Suggestions Pills */}
        {messages.length > 0 && !isStreaming && messages[messages.length - 1].role === 'assistant' && (
          <div className="max-w-3xl mx-auto pt-2 space-y-1.5 animate-fade-in">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Suggested Follow-ups
            </span>
            <div className="flex flex-wrap gap-2">
              {getFollowUpSuggestions(messages[messages.length - 1].content).map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(suggestion, [], webSearchEnabled, selectedModelId)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900/70 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/40 text-xs text-slate-300 hover:text-purple-200 transition-all flex items-center gap-1.5 group"
                >
                  <Sparkles className="w-3 h-3 text-purple-400 group-hover:scale-110 transition-transform" />
                  <span>{suggestion}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Composer Input Area */}
      <div className="p-4 md:px-12 bg-gradient-to-t from-[#070a13] via-[#070a13] to-transparent z-10 flex-shrink-0">
        <div className="max-w-3xl mx-auto relative">
          {/* Attachment Chips */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 p-2 bg-slate-900/60 border border-slate-800 rounded-2xl">
              {attachments.map((att, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs"
                >
                  {att.type === 'image' ? (
                    <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                  <span className="truncate max-w-[120px]">{att.name}</span>
                  <button
                    onClick={() => removeAttachment(idx)}
                    className="hover:text-red-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Main Input Box */}
          <div className="relative rounded-3xl bg-slate-900/85 border border-slate-800 focus-within:border-purple-500/60 shadow-xl transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask Ruhi anything, upload documents, calculate, or code..."
              rows={1}
              className="w-full bg-transparent px-5 py-4 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none resize-none max-h-44"
            />

            {/* Bottom Actions Row */}
            <div className="flex items-center justify-between px-4 pb-3">
              <div className="flex items-center gap-1.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Upload images or documents (RAG)"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                  className={`p-2 rounded-xl transition-colors ${
                    webSearchEnabled
                      ? 'text-cyan-400 bg-cyan-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Toggle Web Search"
                >
                  <Globe className="w-4 h-4" />
                </button>

                <button
                  onClick={onOpenVoice}
                  className="p-2 rounded-xl text-slate-400 hover:text-purple-300 hover:bg-slate-800 transition-colors"
                  title="Voice Conversation"
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                {isStreaming ? (
                  <button
                    onClick={onStopStreaming}
                    className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all shadow-md"
                    title="Stop generation"
                  >
                    <Square className="w-4 h-4 fill-current text-purple-400" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={!input.trim() && attachments.length === 0}
                    className="p-2.5 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white transition-all shadow-md shadow-purple-600/20"
                    title="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="text-center mt-2">
            <span className="text-[11px] text-slate-500">
              Ruhi AI can make mistakes. Verify important facts, code, and citations.
            </span>
          </div>
        </div>
      </div>

      {/* Citation Details Sheet */}
      {selectedCitation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#0e1322] border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Source Verification</h3>
              </div>
              <button
                onClick={() => setSelectedCitation(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-4 space-y-3">
              <h4 className="text-base font-semibold text-white">{selectedCitation.title}</h4>
              <p className="text-xs text-slate-300 bg-slate-900 p-3 rounded-xl leading-relaxed">
                {selectedCitation.snippet}
              </p>
              {selectedCitation.url && (
                <a
                  href={selectedCitation.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:underline pt-2"
                >
                  <span>Visit verified source website</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Message Feedback Modal */}
      <FeedbackModal
        isOpen={Boolean(feedbackModalMsgId)}
        onClose={() => setFeedbackModalMsgId(null)}
        messageId={feedbackModalMsgId}
        onSubmitFeedback={async (msgId, reason, comment) => {
          await onFeedback?.(msgId, 'dislike', reason, comment);
        }}
      />
    </div>
  );
}
