'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Sparkles, MessageSquare, ArrowRight, Copy, Check, ExternalLink } from 'lucide-react';
import MarkdownRenderer from '@/components/chat/MarkdownRenderer';

interface SharedPageProps {
  params: Promise<{ token: string }>;
}

export default function SharedChatPage({ params }: SharedPageProps) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    conversation: { title: string; createdAt: string; model: string };
    messages: Array<{
      _id: string;
      role: 'user' | 'assistant';
      content: string;
      citations?: any[];
      createdAt: string;
    }>;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchShared = async () => {
      try {
        const res = await fetch(`/api/share/${token}`);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to load shared chat');
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchShared();
  }, [token]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a13] text-white flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-500 to-indigo-500 flex items-center justify-center animate-pulse mb-4 shadow-xl shadow-purple-600/30">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <p className="text-sm text-slate-400">Loading shared conversation...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#070a13] text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold mb-2">Conversation Unavailable</h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            {error || 'This conversation may have been deleted or the public link was revoked by the author.'}
          </p>
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/20 transition-all"
          >
            <span>Start your own chat</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const { conversation, messages } = data;

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#070a13]/85 backdrop-blur-md border-b border-slate-800/80 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-600/30 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm tracking-wide bg-gradient-to-r from-white via-purple-100 to-purple-300 bg-clip-text text-transparent">
              RUHI AI
            </span>
            <span className="text-[9px] text-purple-400 font-medium uppercase tracking-wider">
              Shared Conversation
            </span>
          </div>
        </Link>

        <Link
          href="/chat"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/20 transition-all"
        >
          <span>Chat with Ruhi</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* Main Shared Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 md:px-8 py-8 space-y-6">
        {/* Title Card */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-xl">
          <div className="flex items-center gap-2 text-xs text-purple-400 font-semibold uppercase tracking-wider mb-2">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Shared Read-Only View</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2">
            {conversation.title}
          </h1>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>Created {new Date(conversation.createdAt).toLocaleDateString()}</span>
            <span>•</span>
            <span className="capitalize">{conversation.model.replace('ruhi-', 'Ruhi ')}</span>
          </div>
        </div>

        {/* Message Thread */}
        <div className="space-y-6">
          {messages.map((msg) => (
            <div
              key={msg._id}
              className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
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
                <MarkdownRenderer content={msg.content} />

                {/* Citations if available */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Sources
                    </span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {msg.citations.map((c, i) => (
                        <a
                          key={i}
                          href={c.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-[11px] text-cyan-300 border border-slate-700/60 transition-colors"
                        >
                          <span className="truncate max-w-[180px]">{c.title}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Copy button */}
                <div className="flex items-center justify-end gap-2 mt-2 pt-2 text-xs text-slate-500">
                  <button
                    onClick={() => handleCopy(msg._id, msg.content)}
                    className="hover:text-slate-300 transition-colors flex items-center gap-1"
                    title="Copy text"
                  >
                    {copiedId === msg._id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="pt-8 pb-12 text-center">
          <div className="p-8 rounded-3xl bg-gradient-to-b from-purple-900/20 to-slate-900/40 border border-purple-500/20 max-w-xl mx-auto shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Explore Ruhi AI</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Experience intelligent multi-provider reasoning, live web research, math calculations, and personal companion memory.
            </p>
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xl shadow-purple-600/30 transition-all hover:scale-[1.02]"
            >
              <span>Start Your Own Conversation</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
