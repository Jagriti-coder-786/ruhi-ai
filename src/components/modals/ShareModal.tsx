'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Share2, Copy, Check, Trash2, X, ExternalLink, ShieldAlert } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string | null;
  conversationTitle?: string;
}

export function ShareModal({
  isOpen,
  onClose,
  conversationId,
  conversationTitle = 'Conversation',
}: ShareModalProps) {
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && conversationId) {
      handleCreateShare();
    } else {
      setShareUrl(null);
      setError(null);
      setCopied(false);
    }
  }, [isOpen, conversationId]);

  const handleCreateShare = async () => {
    if (!conversationId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/conversations/${conversationId}/share`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate share link');
      setShareUrl(data.shareUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRevoke = async () => {
    if (!conversationId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/share`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setShareUrl(null);
        onClose();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0e1322] border border-slate-800 rounded-3xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Share Conversation</h3>
              <p className="text-xs text-slate-400 line-clamp-1">{conversationTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
              {error}
            </div>
          )}

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
            <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Public Privacy Notice: </span>
              Anyone with this link will be able to view this chat. Your personal account email, password, and private memory are never shared.
            </div>
          </div>

          {shareUrl ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-black/50 border border-slate-800">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="bg-transparent flex-1 text-xs text-slate-300 px-2 outline-none font-mono"
                />
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-sm"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between pt-2">
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1.5 transition-colors"
                >
                  <span>Preview shared link</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  onClick={handleRevoke}
                  disabled={loading}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Revoke Access</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="inline-block w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs text-slate-400">Generating secure public link...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
