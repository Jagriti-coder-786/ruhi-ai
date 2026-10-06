'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowLeft,
  User,
  Sliders,
  Brain,
  CreditCard,
  Trash2,
  Save,
  Check,
  Plus,
  Zap,
  Volume2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { IMemory } from '@/types';
import { UpgradeModal } from '@/components/modals/UpgradeModal';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'ai' | 'memory' | 'billing'>('profile');

  // Form states
  const [name, setName] = useState('');
  const [defaultModel, setDefaultModel] = useState('ruhi-balanced');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const [savedNotice, setSavedNotice] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  // Memories
  const [memories, setMemories] = useState<IMemory[]>([]);
  const [newMemoryContent, setNewMemoryContent] = useState('');
  const [newMemoryCategory, setNewMemoryCategory] = useState<'preference' | 'instruction' | 'fact'>('preference');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      if (user.preferences) {
        setDefaultModel(user.preferences.defaultModel || 'ruhi-balanced');
        setSystemPrompt(user.preferences.systemPrompt || 'You are Ruhi, a highly intelligent, empathetic, thoughtful, and capable AI companion.');
        setTemperature(user.preferences.temperature ?? 0.7);
        setVoiceEnabled(user.preferences.voiceEnabled ?? true);
      }
    }
  }, [user]);

  // Load memories
  const loadMemories = async () => {
    try {
      const res = await fetch('/api/memory');
      if (res.ok) {
        const data = await res.json();
        setMemories(data.memories || []);
      }
    } catch (err) {
      console.error('Failed to load memories:', err);
    }
  };

  useEffect(() => {
    loadMemories();
  }, []);

  const handleSavePreferences = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          preferences: {
            defaultModel,
            systemPrompt,
            temperature,
            voiceEnabled,
          },
        }),
      });

      if (res.ok) {
        await refreshUser();
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 2500);
      }
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  const handleAddMemory = async () => {
    if (!newMemoryContent.trim()) return;
    try {
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newMemoryCategory,
          content: newMemoryContent.trim(),
        }),
      });
      if (res.ok) {
        setNewMemoryContent('');
        loadMemories();
      }
    } catch (err) {
      console.error('Add memory error:', err);
    }
  };

  const handleToggleMemory = async (id: string, isEnabled: boolean) => {
    try {
      await fetch('/api/memory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memoryId: id, isEnabled }),
      });
      loadMemories();
    } catch (err) {
      console.error('Toggle memory error:', err);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      await fetch(`/api/memory?id=${id}`, { method: 'DELETE' });
      loadMemories();
    } catch (err) {
      console.error('Delete memory error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 font-sans pb-16">
      {/* Top Navbar */}
      <nav className="border-b border-slate-800/80 px-8 py-4 flex items-center justify-between bg-[#080c16]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link
            href="/chat"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Back to chat"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-base text-white">Ruhi AI Settings</span>
          </div>
        </div>

        {savedNotice && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
            <Check className="w-3.5 h-3.5" />
            <span>Preferences Saved</span>
          </div>
        )}
      </nav>

      <div className="max-w-5xl mx-auto px-6 pt-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Settings Tabs Sidebar */}
          <div className="w-full md:w-64 space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-left transition-all ${
                activeTab === 'profile'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Account Profile</span>
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-left transition-all ${
                activeTab === 'ai'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>AI Personality & Models</span>
            </button>

            <button
              onClick={() => setActiveTab('memory')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-left transition-all ${
                activeTab === 'memory'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <Brain className="w-4 h-4" />
              <span>Ruhi Memory Controls</span>
            </button>

            <button
              onClick={() => setActiveTab('billing')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-left transition-all ${
                activeTab === 'billing'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Billing & Subscriptions</span>
            </button>
          </div>

          {/* Tab Content Panes */}
          <div className="flex-1 rounded-3xl bg-slate-900/60 border border-slate-800 p-8 shadow-xl">
            {/* 1. Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Account Information</h3>
                  <p className="text-xs text-slate-400">Manage your name, credentials, and plan tier.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      disabled
                      value={user?.email || ''}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60 text-sm text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleSavePreferences}
                      className="px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. AI Personality Tab */}
            {activeTab === 'ai' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">AI Personality & Parameters</h3>
                  <p className="text-xs text-slate-400">Configure how Ruhi reasons, responds, and expresses itself.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Default AI Model
                    </label>
                    <select
                      value={defaultModel}
                      onChange={(e) => setDefaultModel(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="ruhi-balanced">Ruhi Balanced (Gemini 2.5 Flash)</option>
                      <option value="ruhi-fast">Ruhi Fast (Gemini Flash Lite)</option>
                      <option value="ruhi-reasoner">Ruhi Deep Reasoner (Gemini 2.5 Pro - Pro Tier)</option>
                      <option value="ruhi-vision">Ruhi Multimodal Vision</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Custom System Instructions
                    </label>
                    <textarea
                      rows={4}
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      placeholder="e.g. Always structure explanations with clear step-by-step code samples..."
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-purple-500 leading-relaxed resize-none"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                      <span>Creativity / Temperature</span>
                      <span>{temperature}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.5"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                      <span>Focused & Exact (0.1)</span>
                      <span>Balanced (0.7)</span>
                      <span>Highly Creative (1.5)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center gap-3">
                      <Volume2 className="w-5 h-5 text-purple-400" />
                      <div>
                        <div className="text-xs font-bold text-white">Voice Audio Output</div>
                        <div className="text-[11px] text-slate-400">Play spoken answers during voice conversations</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={voiceEnabled}
                      onChange={(e) => setVoiceEnabled(e.target.checked)}
                      className="w-5 h-5 accent-purple-500 cursor-pointer"
                    />
                  </div>

                  <button
                    onClick={handleSavePreferences}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Apply Preferences</span>
                  </button>
                </div>
              </div>
            )}

            {/* 3. Memory Tab */}
            {activeTab === 'memory' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Ruhi Memory Manager</h3>
                  <p className="text-xs text-slate-400">
                    Useful preferences and facts remembered by Ruhi. You have complete control to view, add, or delete memories.
                  </p>
                </div>

                {/* Add memory form */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex gap-2">
                    <select
                      value={newMemoryCategory}
                      onChange={(e) => setNewMemoryCategory(e.target.value as any)}
                      className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="preference">Preference</option>
                      <option value="fact">Fact</option>
                      <option value="instruction">Instruction</option>
                    </select>
                    <input
                      type="text"
                      value={newMemoryContent}
                      onChange={(e) => setNewMemoryContent(e.target.value)}
                      placeholder="e.g. I work with Next.js and prefer TypeScript code samples"
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none"
                    />
                    <button
                      onClick={handleAddMemory}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                {/* Memory list */}
                <div className="space-y-2">
                  {memories.map((m) => (
                    <div
                      key={m._id}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300">
                          {m.category}
                        </span>
                        <span className="text-slate-200">{m.content}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 text-[11px]">
                          <input
                            type="checkbox"
                            checked={m.isEnabled}
                            onChange={(e) => handleToggleMemory(m._id, e.target.checked)}
                            className="accent-purple-500"
                          />
                          <span>{m.isEnabled ? 'Active' : 'Disabled'}</span>
                        </label>
                        <button
                          onClick={() => handleDeleteMemory(m._id)}
                          className="p-1 hover:text-rose-400 text-slate-500 transition-colors"
                          title="Delete memory"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {memories.length === 0 && (
                    <div className="text-center py-8 text-xs text-slate-500">
                      No memories stored yet. Ruhi will learn your preferences as you chat.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. Billing Tab */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Billing & Subscriptions</h3>
                  <p className="text-xs text-slate-400">Current subscription tier, limits, and Razorpay renewal status.</p>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-900/30 to-slate-950 border border-purple-500/40 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold tracking-wider uppercase text-purple-400">
                      Current Plan
                    </span>
                    <div className="text-2xl font-extrabold text-white uppercase mt-0.5">
                      Ruhi {user?.plan || 'Free'}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {user?.plan === 'pro'
                        ? 'Unlimited access to Gemini 2.5 Pro Reasoner and 1GB vector vaults.'
                        : 'Free tier with 50 messages/day. Upgrade to Pro for full capabilities.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setUpgradeOpen(true)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white shadow-lg flex items-center gap-1.5"
                  >
                    <Zap className="w-4 h-4 fill-white" />
                    <span>Change Plan</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <UpgradeModal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  );
}
