'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { ChatArea } from '@/components/chat/ChatArea';
import { VoiceModal } from '@/components/voice/VoiceModal';
import { UpgradeModal } from '@/components/modals/UpgradeModal';
import { SearchModal } from '@/components/modals/SearchModal';
import { ShareModal } from '@/components/modals/ShareModal';
import { ExportModal } from '@/components/modals/ExportModal';
import { CommandPalette } from '@/components/modals/CommandPalette';
import { WorkspacePanel, WorkspaceTab } from '@/components/workspace/WorkspacePanel';
import { ConnectorsModal } from '@/components/modals/ConnectorsModal';
import { TasksModal } from '@/components/modals/TasksModal';
import { useAuth } from '@/hooks/useAuth';
import { IConversation, IMessage, ModelCapability, ICitation, IAttachment } from '@/types';
import { RotateCcw } from 'lucide-react';

export default function ChatPage() {
  const { user, loading: authLoading, loginDemo } = useAuth();
  const [conversations, setConversations] = useState<IConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [availableModels, setAvailableModels] = useState<ModelCapability[]>([]);
  const [selectedModelId, setSelectedModelId] = useState('ruhi-balanced');

  const [currentStreamingText, setCurrentStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentCitations, setCurrentCitations] = useState<ICitation[]>([]);
  const [toolStatus, setToolStatus] = useState<string | null>(null);

  // Temporary chat mode
  const [isTemporaryChat, setIsTemporaryChat] = useState(false);

  // Modals state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [workspaceInitialType, setWorkspaceInitialType] = useState<WorkspaceTab>('document');
  const [connectorsOpen, setConnectorsOpen] = useState(false);
  const [tasksOpen, setTasksOpen] = useState(false);

  // Undo Delete state
  const [deletedConvoBackup, setDeletedConvoBackup] = useState<{
    id: string;
    conversation: IConversation;
  } | null>(null);
  const [undoToastVisible, setUndoToastVisible] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-login to demo if not authenticated on first load
  useEffect(() => {
    if (!authLoading && !user) {
      loginDemo('user', 'pro');
    }
  }, [authLoading, user, loginDemo]);

  // Load models from registry
  useEffect(() => {
    const loadModels = async () => {
      try {
        const res = await fetch('/api/models');
        if (res.ok) {
          const data = await res.json();
          setAvailableModels(data.models || []);
        }
      } catch (err) {
        console.error('Failed to load models:', err);
      }
    };
    loadModels();
  }, []);

  // Fetch conversations (excluding temporary chats from normal list)
  const loadConversations = async () => {
    try {
      const res = await fetch('/api/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(
          (data.conversations || []).filter((c: IConversation) => !c.isTemporary)
        );
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      try {
        const res = await fetch(`/api/messages?conversationId=${activeConversationId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    };
    loadMessages();
  }, [activeConversationId]);

  // Keyboard Shortcuts: Ctrl+K, Ctrl+Shift+O, Esc
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+O -> New Chat
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        handleNewChat();
      }
      // Esc -> Stop streaming
      if (e.key === 'Escape' && isStreaming) {
        e.preventDefault();
        handleStopStreaming();
      }
      // Ctrl+K -> Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isStreaming]);

  // Handle Send Message with Streaming SSE
  const handleSendMessage = async (
    content: string,
    attachments: IAttachment[] = [],
    webSearch: boolean = false,
    modelId: string = selectedModelId,
    regenerateMessageId?: string
  ) => {
    if (isStreaming) return;

    // Optimistically add user message if this is not an in-place regeneration
    if (!regenerateMessageId) {
      const tempUserMsg: IMessage = {
        _id: `temp_user_${Date.now()}`,
        conversationId: activeConversationId || '',
        userId: user?._id || '',
        role: 'user',
        content,
        attachments,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempUserMsg]);
    }

    setIsStreaming(true);
    setCurrentStreamingText('');
    setCurrentCitations([]);
    setToolStatus(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConversationId,
          content,
          modelId,
          attachments,
          webSearchEnabled: webSearch,
          isTemporary: isTemporaryChat,
          regenerateMessageId,
          responseStyle: user?.preferences?.responseStyle || 'balanced',
          responseLength: user?.preferences?.responseLength || 'standard',
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Chat request failed');
      }

      if (!res.body) throw new Error('ReadableStream not supported');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let serverConvoId = activeConversationId;
      let streamedAssistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.slice(6);

          try {
            const data = JSON.parse(jsonStr);

            if (data.type === 'status') {
              setToolStatus(data.status);
            } else if (data.type === 'start') {
              serverConvoId = data.conversationId;
              if (!activeConversationId) {
                setActiveConversationId(data.conversationId);
                if (!isTemporaryChat) loadConversations();
              }
              if (data.citations) {
                setCurrentCitations(data.citations);
              }
            } else if (data.type === 'chunk') {
              setToolStatus(null);
              streamedAssistantContent += data.text;
              setCurrentStreamingText(streamedAssistantContent);
            } else if (data.type === 'done') {
              setToolStatus(null);
              // Refresh messages list to pick up multi-version structures
              if (serverConvoId) {
                const msgRes = await fetch(`/api/messages?conversationId=${serverConvoId}`);
                if (msgRes.ok) {
                  const msgData = await msgRes.json();
                  setMessages(msgData.messages || []);
                }
              }
              setCurrentStreamingText('');
              setIsStreaming(false);
              if (!isTemporaryChat) loadConversations();
            } else if (data.type === 'error') {
              throw new Error(data.error);
            }
          } catch (e: any) {
            console.warn('Stream parse error:', e.message);
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        const errorMsg: IMessage = {
          _id: `err_${Date.now()}`,
          conversationId: activeConversationId || '',
          userId: user?._id || '',
          role: 'assistant',
          content: `⚠️ **Ruhi AI Notice**: ${err.message}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      if (currentStreamingText) {
        const partialMsg: IMessage = {
          _id: `partial_${Date.now()}`,
          conversationId: activeConversationId || '',
          userId: user?._id || '',
          role: 'assistant',
          content: currentStreamingText + ' *(generation stopped)*',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, partialMsg]);
        setCurrentStreamingText('');
      }
    }
  };

  // Regenerate Response
  const handleRegenerate = () => {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant');

    if (lastUserMessage) {
      handleSendMessage(
        lastUserMessage.content,
        lastUserMessage.attachments,
        false,
        selectedModelId,
        lastAssistantMessage?._id
      );
    }
  };

  // Switch response version (‹ 2 / 3 ›)
  const handleSwitchVersion = async (messageId: string, versionIndex: number) => {
    try {
      const res = await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, activeVersionIndex: versionIndex }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) =>
          prev.map((m) => (m._id === messageId ? data.message : m))
        );
      }
    } catch (err) {
      console.error('Failed to switch version:', err);
    }
  };

  // Edit user message and re-prompt from that turn
  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, content: newContent }),
      });

      // Update in UI and trigger new response for edited prompt
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, content: newContent } : m))
      );

      handleSendMessage(newContent, [], false, selectedModelId);
    } catch (err) {
      console.error('Failed to edit message:', err);
    }
  };

  // Message Feedback (thumbs up / thumbs down with reason)
  const handleFeedback = async (
    messageId: string,
    type: 'like' | 'dislike',
    reason?: string,
    comment?: string
  ) => {
    try {
      await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          feedback: type,
          feedbackReason: reason,
          feedbackComment: comment,
        }),
      });

      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, feedback: type, feedbackReason: reason } : m))
      );
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  };

  const handleNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setCurrentStreamingText('');
  };

  // Delete Conversation with Undo support
  const handleDeleteConversation = async (id: string) => {
    const convoToDelete = conversations.find((c) => c._id === id);
    if (!convoToDelete) return;

    // Backup for undo
    setDeletedConvoBackup({ id, conversation: convoToDelete });
    setUndoToastVisible(true);

    try {
      const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (activeConversationId === id) {
          handleNewChat();
        }
        loadConversations();
      }
    } catch (err) {
      console.error('Delete conversation error:', err);
    }

    // Auto-hide undo toast after 6 seconds
    setTimeout(() => {
      setUndoToastVisible(false);
    }, 6000);
  };

  const handleUndoDelete = async () => {
    if (!deletedConvoBackup) return;
    try {
      // Re-create conversation
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: deletedConvoBackup.conversation.title,
          model: deletedConvoBackup.conversation.modelId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveConversationId(data.conversation._id);
        loadConversations();
      }
    } catch (err) {
      console.error('Undo delete failed:', err);
    } finally {
      setUndoToastVisible(false);
      setDeletedConvoBackup(null);
    }
  };

  const handlePinConversation = async (id: string, pinned: boolean) => {
    try {
      await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned }),
      });
      loadConversations();
    } catch (err) {
      console.error('Pin conversation error:', err);
    }
  };

  const handleToggleTemporaryChat = () => {
    setIsTemporaryChat((prev) => !prev);
    handleNewChat();
  };

  const activeConversation = conversations.find((c) => c._id === activeConversationId);
  const lastAssistantText = [...messages]
    .reverse()
    .find((m) => m.role === 'assistant')?.content;

  return (
    <div className="flex h-screen bg-[#090d16] text-slate-100 overflow-hidden font-sans relative">
      {/* Left Sidebar */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => {
          setIsTemporaryChat(false);
          setActiveConversationId(id);
        }}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onPinConversation={handlePinConversation}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenUpgrade={() => setUpgradeOpen(true)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onOpenWorkspace={() => setWorkspaceOpen(true)}
        onOpenConnectors={() => setConnectorsOpen(true)}
        onOpenTasks={() => setTasksOpen(true)}
      />

      {/* Main Chat Workspace */}
      <ChatArea
        messages={messages}
        currentStreamingText={currentStreamingText}
        isStreaming={isStreaming}
        onSendMessage={handleSendMessage}
        onStopStreaming={handleStopStreaming}
        onRegenerate={handleRegenerate}
        onOpenVoice={() => setVoiceOpen(true)}
        onOpenUpgrade={() => setUpgradeOpen(true)}
        selectedModelId={selectedModelId}
        onSelectModel={setSelectedModelId}
        availableModels={availableModels}
        currentCitations={currentCitations}
        toolStatus={toolStatus}
        onEditMessage={handleEditMessage}
        onSwitchVersion={handleSwitchVersion}
        onOpenShare={() => setShareOpen(true)}
        onOpenExport={() => setExportOpen(true)}
        isTemporaryChat={isTemporaryChat}
        onToggleTemporaryChat={handleToggleTemporaryChat}
        onFeedback={handleFeedback}
        onOpenWorkspace={(tab) => {
          setWorkspaceInitialType(tab || 'document');
          setWorkspaceOpen(true);
        }}
        onOpenConnectors={() => setConnectorsOpen(true)}
        onOpenTasks={() => setTasksOpen(true)}
      />

      {/* Voice Assistant Modal */}
      <VoiceModal
        isOpen={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        onSendMessage={(spokenText) => {
          handleSendMessage(spokenText, [], false, selectedModelId);
          setVoiceOpen(false);
        }}
        lastAssistantResponse={lastAssistantText}
      />

      {/* Upgrade / Pricing Modal */}
      <UpgradeModal
        isOpen={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
      />

      {/* Search Conversations Modal */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectConversation={(id) => setActiveConversationId(id)}
      />

      {/* Public Share Modal */}
      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        conversationId={activeConversationId}
        conversationTitle={activeConversation?.title || 'Current Conversation'}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        conversationId={activeConversationId}
        conversationTitle={activeConversation?.title || 'Conversation'}
      />

      {/* Workspace Panel (Side Docked / Overlay) */}
      <WorkspacePanel
        isOpen={workspaceOpen}
        onClose={() => setWorkspaceOpen(false)}
        conversationId={activeConversationId}
        initialType={workspaceInitialType}
      />

      {/* Workspace Connectors Modal */}
      <ConnectorsModal
        isOpen={connectorsOpen}
        onClose={() => setConnectorsOpen(false)}
      />

      {/* Automations & Scheduled Tasks Modal */}
      <TasksModal
        isOpen={tasksOpen}
        onClose={() => setTasksOpen(false)}
      />

      {/* Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNewChat={handleNewChat}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenShare={() => setShareOpen(true)}
        onOpenExport={() => setExportOpen(true)}
        onToggleTemporaryChat={handleToggleTemporaryChat}
        isTemporaryChat={isTemporaryChat}
        availableModels={availableModels}
        selectedModelId={selectedModelId}
        onSelectModel={setSelectedModelId}
        onOpenWorkspace={() => setWorkspaceOpen(true)}
        onOpenConnectors={() => setConnectorsOpen(true)}
        onOpenTasks={() => setTasksOpen(true)}
      />

      {/* Undo Delete Toast */}
      {undoToastVisible && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#0f172a] border border-slate-700 text-xs text-white shadow-2xl animate-fade-in">
          <span>Conversation deleted.</span>
          <button
            onClick={handleUndoDelete}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 font-semibold text-white transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Undo</span>
          </button>
        </div>
      )}
    </div>
  );
}
