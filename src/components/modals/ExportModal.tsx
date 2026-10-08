'use client';

import React from 'react';
import { Download, FileText, Code2, AlignLeft, X } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string | null;
  conversationTitle?: string;
}

export function ExportModal({
  isOpen,
  onClose,
  conversationId,
  conversationTitle = 'Conversation',
}: ExportModalProps) {
  if (!isOpen || !conversationId) return null;

  const handleDownload = (format: 'markdown' | 'text' | 'json') => {
    window.open(`/api/conversations/${conversationId}/export?format=${format}`, '_blank');
    onClose();
  };

  const formats = [
    {
      format: 'markdown' as const,
      name: 'Markdown (.md)',
      desc: 'Clean GitHub-flavored markdown with code blocks and headers',
      icon: <FileText className="w-5 h-5 text-purple-400" />,
    },
    {
      format: 'text' as const,
      name: 'Plain Text (.txt)',
      desc: 'Raw human-readable dialogue format for simple viewing',
      icon: <AlignLeft className="w-5 h-5 text-cyan-400" />,
    },
    {
      format: 'json' as const,
      name: 'JSON (.json)',
      desc: 'Complete structured conversation data with timestamps and citations',
      icon: <Code2 className="w-5 h-5 text-pink-400" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#0e1322] border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Export Conversation</h3>
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

        <div className="py-5 space-y-3">
          {formats.map((f) => (
            <button
              key={f.format}
              onClick={() => handleDownload(f.format)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-purple-500/40 text-left transition-all group"
            >
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 group-hover:scale-105 transition-transform flex-shrink-0">
                {f.icon}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">
                  {f.name}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
