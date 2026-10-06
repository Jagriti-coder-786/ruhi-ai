'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { ChatArea } from '@/components/chat/ChatArea';
import { VoiceModal } from '@/components/voice/VoiceModal';
import { UpgradeModal } from '@/components/modals/UpgradeModal';
import { SearchModal } from '@/components/modals/SearchModal';
import { useAuth } from '@/hooks/useAuth';
import { IConversation, IMessage, ModelCapability, ICitation, IAttachment } from '@/types';

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

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

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

  // Fetch conversations
  const loadConversations = async () => {
    try {
      const res = await fetch('/api/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
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

  // Handle Send Message with Streaming SSE
  const handleSendMessage = async (
    content: string,
    attachments: IAttachment[] = [],
    webSearch: boolean = false,
    modelId: string = selectedModelId
  ) => {
    if (isStreaming) return;

    // Optimistically add user message to UI
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
    setIsStreaming(true);
    setCurrentStreamingText('');
    setCurrentCitations([]);

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

            if (data.type === 'start') {
              serverConvoId = data.conversationId;
              if (!activeConversationId) {
                setActiveConversationId(data.conversationId);
                loadConversations();
              }
              if (data.citations) {
                setCurrentCitations(data.citations);
              }
            } else if (data.type === 'chunk') {
              streamedAssistantContent += data.text;
              setCurrentStreamingText(streamedAssistantContent);
            } else if (data.type === 'done') {
              // Final assistant message
              const finalAssistantMsg: IMessage = {
                _id: data.messageId || `msg_${Date.now()}`,
                conversationId: serverConvoId || '',
                userId: user?._id || '',
                role: 'assistant',
                content: streamedAssistantContent,
                modelId,
                citations: currentCitations,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              setMessages((prev) => [...prev, finalAssistantMsg]);
              setCurrentStreamingText('');
              setIsStreaming(false);
              loadConversations();
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
          content: currentStreamingText + ' *(generation paused)*',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, partialMsg]);
        setCurrentStreamingText('');
      }
    }
  };

  const handleRegenerate = () => {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMessage) {
      handleSendMessage(
        lastUserMessage.content,
        lastUserMessage.attachments,
        false,
        selectedModelId
      );
    }
  };

  const handleNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setCurrentStreamingText('');
  };

  const handleDeleteConversation = async (id: string) => {
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

  const lastAssistantText = [...messages]
    .reverse()
    .find((m) => m.role === 'assistant')?.content;

  return (
    <div className="flex h-screen bg-[#090d16] text-slate-100 overflow-hidden font-sans">
      {/* Left Sidebar */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => setActiveConversationId(id)}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onPinConversation={handlePinConversation}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenUpgrade={() => setUpgradeOpen(true)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
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

      {/* Razorpay Subscription Modal */}
      <UpgradeModal
        isOpen={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
      />

      {/* Deep Search Modal */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectConversation={(id) => setActiveConversationId(id)}
      />
    </div>
  );
}
