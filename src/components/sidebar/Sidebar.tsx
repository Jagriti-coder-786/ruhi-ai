'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Plus,
  Search,
  Pin,
  Folder,
  Settings,
  Shield,
  Zap,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Bookmark,
  MessageSquare,
  LayoutGrid,
  Plug,
  CalendarClock,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { IConversation } from '@/types';

interface SidebarProps {
  conversations: IConversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onPinConversation: (id: string, pinned: boolean) => void;
  onOpenSearch: () => void;
  onOpenUpgrade: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenWorkspace?: () => void;
  onOpenConnectors?: () => void;
  onOpenTasks?: () => void;
}

export function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onPinConversation,
  onOpenSearch,
  onOpenUpgrade,
  isCollapsed,
  onToggleCollapse,
  onOpenWorkspace,
  onOpenConnectors,
  onOpenTasks,
}: SidebarProps) {
  const { user, logout } = useAuth();

  const pinnedChats = conversations.filter((c) => c.pinned);
  const recentChats = conversations.filter((c) => !c.pinned && !c.archived);

  return (
    <aside
      className={`relative h-screen bg-[#080c16] border-r border-slate-800/80 flex flex-col transition-all duration-300 z-30 select-none ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/60">
        <Link href="/" className="flex items-center gap-2.5 overflow-hidden group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-600/30 group-hover:scale-105 transition-transform flex-shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-wide bg-gradient-to-r from-white via-purple-100 to-purple-300 bg-clip-text text-transparent">
                RUHI AI
              </span>
              <span className="text-[10px] text-purple-400 font-medium tracking-wider uppercase">
                Intelligence Core
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Action Buttons */}
      <div className="p-3 space-y-2">
        <button
          onClick={onNewChat}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/20 transition-all ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
          title="New Chat"
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span>New Chat</span>}
        </button>

        <button
          onClick={onOpenSearch}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 border border-slate-800/80 transition-colors ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
          title="Search Chats (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
          {!isCollapsed && <span>Search conversations</span>}
        </button>

        {onOpenWorkspace && (
          <button
            onClick={onOpenWorkspace}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 border border-slate-800/80 transition-colors ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title="Artifact Workspace"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
            {!isCollapsed && <span>Artifact Workspace</span>}
          </button>
        )}

        {onOpenConnectors && (
          <button
            onClick={onOpenConnectors}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 border border-slate-800/80 transition-colors ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title="Workspace Connectors"
          >
            <Plug className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            {!isCollapsed && <span>Connectors</span>}
          </button>
        )}

        {onOpenTasks && (
          <button
            onClick={onOpenTasks}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 border border-slate-800/80 transition-colors ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title="Scheduled Automations"
          >
            <CalendarClock className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            {!isCollapsed && <span>Automations</span>}
          </button>
        )}
      </div>

      {/* Navigation & Conversations List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
        {/* Pinned Section */}
        {pinnedChats.length > 0 && !isCollapsed && (
          <div>
            <div className="flex items-center gap-1.5 px-3 mb-1 text-[11px] font-semibold tracking-wider text-purple-400 uppercase">
              <Bookmark className="w-3 h-3" />
              <span>Pinned</span>
            </div>
            <div className="space-y-0.5">
              {pinnedChats.map((c) => (
                <div
                  key={c._id}
                  onClick={() => onSelectConversation(c._id)}
                  className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                    activeConversationId === c._id
                      ? 'bg-purple-600/20 text-white font-medium border border-purple-500/30'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Pin className="w-3 h-3 text-purple-400 flex-shrink-0 fill-purple-400/40" />
                    <span className="truncate">{c.title}</span>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPinConversation(c._id, false);
                      }}
                      className="p-1 hover:text-purple-300"
                      title="Unpin"
                    >
                      <Pin className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(c._id);
                      }}
                      className="p-1 hover:text-rose-400"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Conversations */}
        <div>
          {!isCollapsed && (
            <div className="px-3 mb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Recent Chats
            </div>
          )}
          <div className="space-y-0.5">
            {recentChats.map((c) => (
              <div
                key={c._id}
                onClick={() => onSelectConversation(c._id)}
                className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                  activeConversationId === c._id
                    ? 'bg-purple-600/20 text-white font-medium border border-purple-500/30'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
                title={c.title}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-400 flex-shrink-0" />
                  {!isCollapsed && <span className="truncate">{c.title}</span>}
                </div>
                {!isCollapsed && (
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPinConversation(c._id, true);
                      }}
                      className="p-1 hover:text-purple-400"
                      title="Pin chat"
                    >
                      <Pin className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(c._id);
                      }}
                      className="p-1 hover:text-rose-400"
                      title="Delete chat"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {recentChats.length === 0 && !isCollapsed && (
              <div className="px-3 py-4 text-xs text-slate-400 text-center">
                No recent conversations yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade Banner for Free Users */}
      {user?.plan === 'free' && !isCollapsed && (
        <div className="mx-3 mb-3 p-3.5 rounded-2xl bg-gradient-to-br from-purple-900/40 via-indigo-900/30 to-slate-900 border border-purple-500/30 shadow-lg">
          <div className="flex items-center gap-2 mb-1.5">
            <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-bold text-white">Unlock Ruhi Pro</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-snug mb-2.5">
            Gemini 2.5 Pro Reasoner, 1GB vector memory & unlimited intelligence.
          </p>
          <button
            onClick={onOpenUpgrade}
            className="w-full py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white shadow-md transition-all"
          >
            Upgrade for ₹499
          </button>
        </div>
      )}

      {/* Footer Profile & Links */}
      <div className="p-3 border-t border-slate-800/80 space-y-1">
        <Link
          href="/projects"
          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
          title="Projects"
        >
          <Folder className="w-4 h-4 text-pink-400 flex-shrink-0" />
          {!isCollapsed && <span>Projects</span>}
        </Link>

        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
          title="Settings"
        >
          <Settings className="w-4 h-4 text-purple-400 flex-shrink-0" />
          {!isCollapsed && <span>Settings</span>}
        </Link>

        {user?.role === 'admin' && (
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-yellow-400 hover:bg-yellow-500/10 transition-colors ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title="Admin Dashboard"
          >
            <Shield className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>Admin Dashboard</span>}
          </Link>
        )}

        {/* User Card */}
        {user && !isCollapsed && (
          <div className="flex items-center justify-between pt-2 px-2 mt-1 border-t border-slate-800/60">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-7 h-7 rounded-lg bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-xs font-bold text-purple-300">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-white truncate">{user.name}</div>
                <div className="text-[10px] text-purple-400 font-medium uppercase">
                  {user.plan} plan
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
