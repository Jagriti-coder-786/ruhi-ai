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
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import MarkdownRenderer from './MarkdownRenderer';
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
}: ChatAreaProps) {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [attachments, setAttachments] = useState<IAttachment[]>([]);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [selectedCitation, setSelectedCitation] = useState<ICitation | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll when messages update or streaming text arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentStreamingText]);

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
        // Document upload to RAG pipeline
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
                mimeType: file.type,
                size: file.size,
                documentId: data.document?.id,
              },
            ]);
          }
        } catch (err) {
          console.error('File upload error:', err);
        }
      }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCopyMessage = async (msgId: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const selectedModel = availableModels.find((m) => m.id === selectedModelId) || {
    id: 'ruhi-balanced',
    displayName: 'Ruhi Balanced',
    speed: 'balanced',
    isPremiumOnly: false,
  };

  const starterPrompts = [
    {
      title: 'Deep Quantum Reasoning',
      prompt: 'Explain the core principles of quantum computing and how quantum supremacy is achieved.',
      icon: <Sparkles className="w-4 h-4 text-purple-400" />,
    },
    {
      title: 'Full-Stack Architecture',
      prompt: 'Design a scalable multi-tenant RAG architecture with vector chunking and MongoDB.',
      icon: <Cpu className="w-4 h-4 text-cyan-400" />,
    },
    {
      title: 'Analyze Financial Plan',
      prompt: 'Calculate compound interest on ₹50,000 at 12% annual rate over 10 years with formula breakdown.',
      icon: <Calculator className="w-4 h-4 text-emerald-400" />,
    },
    {
      title: 'Generate Neural Visual',
      prompt: 'Create a hyperrealistic digital artwork of a cosmic library with floating constellations.',
      icon: <ImageIcon className="w-4 h-4 text-pink-400" />,
    },
  ];

  return (
    <div className="relative flex-1 h-screen flex flex-col bg-[#090d16] overflow-hidden">
      {/* Top Header Bar */}
      <header className="h-16 border-b border-slate-800/80 px-6 flex items-center justify-between bg-[#080c16]/80 backdrop-blur-md z-20">
        <div className="relative">
          {/* Model Selector Dropdown Button */}
          <button
            onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 text-slate-200 text-xs font-semibold transition-all shadow-sm"
          >
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>{selectedModel.displayName}</span>
            {selectedModel.isPremiumOnly && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 font-bold uppercase">
                PRO
              </span>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Model Menu */}
          {modelDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-80 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                Active Intelligence Models
              </div>
              <div className="space-y-1 mt-1 max-h-80 overflow-y-auto">
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
                      className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between ${
                        selectedModelId === m.id
                          ? 'bg-purple-600/20 border border-purple-500/40 text-white'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold">{m.displayName}</span>
                          {m.isPremiumOnly && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-purple-500/20 text-purple-300 font-semibold uppercase">
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

        {/* Right Tools (Web Search Toggle, Voice Mode) */}
        <div className="flex items-center gap-3">
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
            <span>Web Search {webSearchEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={onOpenVoice}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 border border-purple-500/40 text-purple-300 transition-all shadow-sm"
            title="Launch Voice Conversation"
          >
            <Mic className="w-3.5 h-3.5 text-pink-400" />
            <span>Voice</span>
          </button>
        </div>
      </header>

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

            {/* Prompt Cards */}
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

        {/* Render Conversation Messages */}
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={`max-w-3xl mx-auto flex gap-4 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {/* Assistant Icon */}
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
              {/* Attachments preview if present */}
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

              {/* Tool Calls badge */}
              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {msg.toolCalls.map((tc, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20"
                    >
                      <Globe className="w-3 h-3 text-cyan-400" />
                      <span>Used tool: {tc.toolName}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Message Content */}
              {msg.role === 'user' ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
              ) : (
                <MarkdownRenderer content={msg.content} />
              )}

              {/* Citations block */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <div className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider mb-2">
                    Verified Citations & Sources ({msg.citations.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {msg.citations.map((c, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedCitation(c)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3 text-cyan-400" />
                        <span className="truncate max-w-[180px]">{c.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message action bar for assistant */}
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-3 mt-3 pt-2 text-slate-500 text-xs">
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
                  <button
                    onClick={onRegenerate}
                    className="hover:text-slate-300 transition-colors"
                    title="Regenerate"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                  <button className="hover:text-slate-300 transition-colors" title="Helpful">
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  <button className="hover:text-slate-300 transition-colors" title="Unhelpful">
                    <ThumbsDown className="w-3.5 h-3.5" />
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
                <div className="flex items-center gap-2 text-xs text-purple-400 font-medium">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Ruhi is reasoning...</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Citation Details Modal */}
      {selectedCitation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-lg p-6 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl">
            <button
              onClick={() => setSelectedCitation(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <h4 className="text-base font-bold text-white mb-2">{selectedCitation.title}</h4>
            {selectedCitation.url && (
              <a
                href={selectedCitation.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-purple-400 hover:underline flex items-center gap-1 mb-4"
              >
                <span>{selectedCitation.url}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <div className="p-4 rounded-xl bg-slate-950 text-xs text-slate-300 leading-relaxed max-h-60 overflow-y-auto">
              {selectedCitation.snippet}
            </div>
          </div>
        </div>
      )}

      {/* Composer Area */}
      <div className="p-4 md:px-12 bg-gradient-to-t from-[#090d16] via-[#090d16]/90 to-transparent">
        <div className="max-w-3xl mx-auto relative rounded-2xl border border-slate-700/80 bg-slate-900/90 shadow-2xl backdrop-blur-md p-3">
          {/* Attachments Chips Bar */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-2 mb-2 border-b border-slate-800">
              {attachments.map((att, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 text-xs text-slate-200 border border-slate-700"
                >
                  {att.type === 'image' ? (
                    <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                  <span className="truncate max-w-[160px]">{att.name}</span>
                  <button
                    onClick={() => removeAttachment(idx)}
                    className="p-0.5 hover:text-rose-400 transition-colors ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask Ruhi anything, upload documents, calculate, or code..."
            className="w-full bg-transparent resize-none text-sm text-white placeholder-slate-500 focus:outline-none max-h-44 leading-relaxed"
          />

          {/* Bottom Bar: Attachments, Web Search, Send/Stop */}
          <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-800/60">
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.docx,.txt,.md,.csv,.json,image/*"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Attach files or images"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <button
                type="button"
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
                type="button"
                onClick={onOpenVoice}
                className="p-2 rounded-xl text-slate-400 hover:text-purple-300 hover:bg-slate-800 transition-colors"
                title="Voice input"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {isStreaming ? (
                <button
                  type="button"
                  onClick={onStopStreaming}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-semibold transition-all"
                >
                  <Square className="w-3.5 h-3.5 fill-rose-300" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!input.trim() && attachments.length === 0}
                  className={`p-2.5 rounded-xl transition-all shadow-md ${
                    input.trim() || attachments.length > 0
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-purple-600/30'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="text-center mt-2">
          <span className="text-[11px] text-slate-400">
            Ruhi AI can make mistakes. Verify important facts and citations.
          </span>
        </div>
      </div>
    </div>
  );
}

export default ChatArea;
