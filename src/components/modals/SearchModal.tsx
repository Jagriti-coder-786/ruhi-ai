'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, MessageSquare, Folder, Loader2 } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (convoId: string) => void;
}

export function SearchModal({
  isOpen,
  onClose,
  onSelectConversation,
}: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    conversations: Array<{ id: string; title: string }>;
    messages: Array<{ id: string; conversationId: string; conversationTitle: string; contentSnippet: string }>;
    projects: Array<{ id: string; name: string }>;
  }>({ conversations: [], messages: [], projects: [] });

  useEffect(() => {
    if (!query.trim()) {
      setResults({ conversations: [], messages: [], projects: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <Search className="w-5 h-5 text-purple-400 mr-3 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations, message text, and projects..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          {loading && <Loader2 className="w-4 h-4 text-purple-400 animate-spin mr-2" />}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Container */}
        <div className="overflow-y-auto p-4 space-y-4">
          {!query.trim() && (
            <div className="text-center py-8 text-xs text-slate-500">
              Type keywords to search across your chat history and knowledge bases.
            </div>
          )}

          {/* Conversations */}
          {results.conversations.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-2">
                Conversations
              </div>
              <div className="space-y-1">
                {results.conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSelectConversation(c.id);
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-sm text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span className="truncate">{c.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message snippets */}
          {results.messages.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-2">
                Message Matches
              </div>
              <div className="space-y-1">
                {results.messages.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      onSelectConversation(m.conversationId);
                      onClose();
                    }}
                    className="w-full flex flex-col gap-1 px-3 py-2.5 rounded-xl text-left text-sm hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-2 text-xs font-medium text-purple-400">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{m.conversationTitle}</span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {m.contentSnippet}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {results.projects.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-2">
                Projects
              </div>
              <div className="space-y-1">
                {results.projects.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-200 bg-slate-800/40"
                  >
                    <Folder className="w-4 h-4 text-pink-400 flex-shrink-0" />
                    <span>{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {query.trim() &&
            !loading &&
            results.conversations.length === 0 &&
            results.messages.length === 0 &&
            results.projects.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-500">
                No matching conversations found for &quot;{query}&quot;.
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default SearchModal;
