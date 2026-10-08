'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Search,
  Plus,
  Shield,
  Sliders,
  Folder,
  Download,
  Share2,
  Cpu,
  Moon,
  X,
  Clock,
  LayoutGrid,
  Plug,
  CalendarClock,
} from 'lucide-react';
import { ModelCapability } from '@/types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onOpenSearch: () => void;
  onOpenShare: () => void;
  onOpenExport: () => void;
  onToggleTemporaryChat: () => void;
  isTemporaryChat: boolean;
  availableModels: ModelCapability[];
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  onOpenWorkspace?: () => void;
  onOpenConnectors?: () => void;
  onOpenTasks?: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onNewChat,
  onOpenSearch,
  onOpenShare,
  onOpenExport,
  onToggleTemporaryChat,
  isTemporaryChat,
  availableModels,
  selectedModelId,
  onSelectModel,
  onOpenWorkspace,
  onOpenConnectors,
  onOpenTasks,
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  // Handle global shortcut Ctrl/Cmd + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onOpenSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onOpenSearch]);

  if (!isOpen) return null;

  const actions = [
    {
      id: 'new_chat',
      title: 'New Chat',
      shortcut: 'Ctrl+Shift+O',
      icon: <Plus className="w-4 h-4 text-purple-400" />,
      run: () => {
        onNewChat();
        onClose();
      },
    },
    {
      id: 'workspace',
      title: 'Open Artifact Workspace (Docs, Code Sandbox, Sheets, Slides)',
      shortcut: '',
      icon: <LayoutGrid className="w-4 h-4 text-purple-400" />,
      run: () => {
        onClose();
        if (onOpenWorkspace) onOpenWorkspace();
      },
    },
    {
      id: 'connectors',
      title: 'Manage Workspace Connectors (Drive, GitHub, Slack, Notion)',
      shortcut: '',
      icon: <Plug className="w-4 h-4 text-cyan-400" />,
      run: () => {
        onClose();
        if (onOpenConnectors) onOpenConnectors();
      },
    },
    {
      id: 'tasks',
      title: 'Automations & Scheduled Recurring Tasks',
      shortcut: '',
      icon: <CalendarClock className="w-4 h-4 text-emerald-400" />,
      run: () => {
        onClose();
        if (onOpenTasks) onOpenTasks();
      },
    },
    {
      id: 'search',
      title: 'Search Conversations & Messages',
      shortcut: 'Ctrl+K',
      icon: <Search className="w-4 h-4 text-cyan-400" />,
      run: () => {
        onClose();
        onOpenSearch();
      },
    },
    {
      id: 'temp_chat',
      title: isTemporaryChat ? 'Disable Temporary Chat' : 'Enable Temporary Chat',
      shortcut: '',
      icon: <Clock className="w-4 h-4 text-amber-400" />,
      run: () => {
        onToggleTemporaryChat();
        onClose();
      },
    },
    {
      id: 'share',
      title: 'Share Current Conversation',
      shortcut: '',
      icon: <Share2 className="w-4 h-4 text-indigo-400" />,
      run: () => {
        onClose();
        onOpenShare();
      },
    },
    {
      id: 'export',
      title: 'Export Conversation (MD, TXT, JSON)',
      shortcut: '',
      icon: <Download className="w-4 h-4 text-emerald-400" />,
      run: () => {
        onClose();
        onOpenExport();
      },
    },
    {
      id: 'projects',
      title: 'Open Projects Workspace',
      shortcut: '',
      icon: <Folder className="w-4 h-4 text-pink-400" />,
      run: () => {
        router.push('/projects');
        onClose();
      },
    },
    {
      id: 'settings',
      title: 'Open Preferences & AI Settings',
      shortcut: '',
      icon: <Sliders className="w-4 h-4 text-blue-400" />,
      run: () => {
        router.push('/settings');
        onClose();
      },
    },
  ];

  const filteredActions = actions.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0e1322] border border-slate-800 rounded-3xl p-4 shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-3 py-2 border-b border-slate-800">
          <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search actions..."
            className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action list */}
        <div className="py-2 max-h-80 overflow-y-auto space-y-1">
          <div className="px-3 py-1 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
            Commands & Navigation
          </div>
          {filteredActions.map((action) => (
            <button
              key={action.id}
              onClick={action.run}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-800/80 text-left transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 group-hover:border-purple-500/40">
                  {action.icon}
                </div>
                <span className="text-xs font-medium text-slate-200 group-hover:text-white">
                  {action.title}
                </span>
              </div>
              {action.shortcut && (
                <span className="text-[10px] text-slate-500 font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                  {action.shortcut}
                </span>
              )}
            </button>
          ))}

          {/* AI Models quick switch */}
          {availableModels.length > 0 && (
            <div className="pt-2">
              <div className="px-3 py-1 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                Switch AI Model
              </div>
              <div className="space-y-0.5">
                {availableModels.slice(0, 4).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      onSelectModel(m.id);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                      selectedModelId === m.id
                        ? 'bg-purple-600/20 text-purple-300 font-semibold'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Cpu className="w-3.5 h-3.5 text-purple-400" />
                      <span>{m.displayName}</span>
                    </div>
                    {selectedModelId === m.id && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                        Active
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
