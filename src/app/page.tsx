'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  Cpu,
  FileText,
  Brain,
  Globe,
  ImageIcon,
  Mic,
  Check,
  ChevronDown,
  Layers,
  Star,
  Users,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { UpgradeModal } from '@/components/modals/UpgradeModal';

export default function LandingPage() {
  const { user, loginDemo } = useAuth();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setFaqOpen(faqOpen === index ? null : index);
  };

  const handleStartChatting = async () => {
    if (!user) {
      await loginDemo('user', 'pro');
    }
    window.location.href = '/chat';
  };

  const features = [
    {
      icon: <Cpu className="w-6 h-6 text-purple-400" />,
      title: 'Multi-AI Provider Engine',
      description:
        'Seamlessly orchestrates Google Gemini 2.5 Flash & Pro alongside GPT-4o, Claude 3.5 Sonnet, and Grok with automatic fallback protection.',
    },
    {
      icon: <FileText className="w-6 h-6 text-cyan-400" />,
      title: 'Deep Document RAG',
      description:
        'Upload PDFs, Word documents, CSVs, and codebases. Ruhi generates semantic embeddings and provides factual answers with exact citations.',
    },
    {
      icon: <Brain className="w-6 h-6 text-pink-400" />,
      title: 'Persistent Adaptive Memory',
      description:
        'Ruhi remembers your working style, technical preferences, and project guidelines while ensuring full privacy and user data isolation.',
    },
    {
      icon: <Globe className="w-6 h-6 text-emerald-400" />,
      title: 'Live Web Research',
      description:
        'Autonomous web search verifies breaking news, documentation, and real-time facts with clickable citations. Never hallucinates sources.',
    },
    {
      icon: <ImageIcon className="w-6 h-6 text-amber-400" />,
      title: 'Multimodal Vision & Studio',
      description:
        'Analyze complex charts, code screenshots, and diagrams, or generate high-fidelity photorealistic artwork directly in the chat.',
    },
    {
      icon: <Mic className="w-6 h-6 text-rose-400" />,
      title: 'Hands-Free Voice Assistant',
      description:
        'Zero-latency speech recognition and natural auditory voice playback allow you to brainstorm and converse completely hands-free.',
    },
  ];

  const faqs = [
    {
      q: 'What makes Ruhi AI different from standard chatbots?',
      a: 'Ruhi AI is an enterprise-grade AI assistant platform built with a multi-model architecture, persistent MongoDB memory, private RAG vector intelligence, live verified web search, and secure Razorpay payment tiers. It adapts to you over time rather than resetting every conversation.',
    },
    {
      q: 'Which AI providers are supported?',
      a: 'Ruhi AI is powered natively by Google Gemini 2.5 (Flash and Pro models) and is architected to seamlessly route across OpenAI, Anthropic Claude, xAI Grok, and OpenRouter with automatic failover.',
    },
    {
      q: 'How does document privacy and RAG work?',
      a: 'Your documents are strictly isolated in MongoDB by user ID. During retrieval, queries are matched against only your authenticated chunks using vector cosine similarity. Document contents are wrapped in strict prompt injection defense guards.',
    },
    {
      q: 'What payments does Ruhi AI accept?',
      a: 'Ruhi AI is integrated with Razorpay, supporting UPI, Net Banking, credit/debit cards, and corporate payment methods across India with automated recurring subscriptions.',
    },
    {
      q: 'Can I use Ruhi AI for team projects?',
      a: 'Yes! The Projects feature allows you to define shared instructions, upload documentation vaults, and maintain organized conversations for distinct work streams.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 selection:bg-purple-500/30 font-sans">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-[#090d16]/80 backdrop-blur-xl border-b border-slate-800/80 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-purple-100 to-purple-300 bg-clip-text text-transparent">
              RUHI AI
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#features" className="hover:text-purple-400 transition-colors">
            Capabilities
          </a>
          <a href="#models" className="hover:text-purple-400 transition-colors">
            AI Models
          </a>
          <a href="#pricing" className="hover:text-purple-400 transition-colors">
            Pricing
          </a>
          <a href="#faq" className="hover:text-purple-400 transition-colors">
            FAQ
          </a>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleStartChatting}
            className="px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-600/25 transition-all flex items-center gap-2"
          >
            <span>Start Chatting</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-36 pb-20 px-6 max-w-6xl mx-auto flex flex-col items-center text-center">
        {/* Glowing cosmic backdrop */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-600/20 blur-[130px] rounded-full pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/30 mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span>Next-Generation Intelligent Companion</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.1] mb-6">
          Meet <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">Ruhi AI</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-300 max-w-2xl leading-relaxed mb-10">
          Think, create, learn, and get things done with your intelligent AI companion. Built for deep reasoning, private document intelligence, and multi-model agility.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button
            onClick={handleStartChatting}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-2xl shadow-purple-600/30 hover:scale-105 transition-all flex items-center justify-center gap-2.5"
          >
            <span>Start chatting</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <Link
            href="/chat"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-base bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 transition-all flex items-center justify-center gap-2"
          >
            <Layers className="w-5 h-5 text-purple-400" />
            <span>Explore Ruhi AI</span>
          </Link>
        </div>

        {/* Interactive Workspace Teaser Preview */}
        <div className="mt-16 w-full max-w-4xl rounded-3xl p-3 bg-slate-900/60 border border-purple-500/30 shadow-2xl backdrop-blur-md">
          <div className="rounded-2xl bg-[#070a12] p-6 border border-slate-800 text-left">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs text-slate-400 font-mono ml-2">Ruhi AI Workspace • Active</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-500/20 text-purple-300">
                  Gemini 2.5 Pro
                </span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-cyan-500/20 text-cyan-300">
                  RAG Vector Active
                </span>
              </div>
            </div>

            <div className="space-y-4 font-mono text-xs md:text-sm">
              <div className="flex items-start gap-3">
                <div className="px-2 py-1 rounded bg-purple-600 text-white font-bold text-[10px]">USER</div>
                <div className="text-slate-200">
                  Analyze the attached financial whitepaper and calculate the projected 5-year ROI.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="px-2 py-1 rounded bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-[10px]">RUHI</div>
                <div className="text-slate-300 space-y-2 leading-relaxed">
                  <p>
                    Retrieved 4 relevant vector chunks from <span className="text-cyan-400 font-semibold">&quot;Q3_Financial_Forecast.pdf&quot;</span>:
                  </p>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-sans text-xs">
                    📊 **Projected 5-Year Net ROI**: <strong>+342.8%</strong><br />
                    • Year 1-2: Capital equipment amortization ($120k)<br />
                    • Year 3-5: Recurring ARR scaling to $412k at 84% margin.<br />
                    <em>Verified Citations: [Whitepaper Section 4.2, Table 3]</em>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
            Engineered for Serious Intelligence
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Not just another basic chatbot wrapper. Ruhi AI delivers persistent memory, document embeddings, and multi-model autonomy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-purple-500/40 hover:bg-slate-900/90 transition-all group shadow-md"
            >
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 w-fit mb-5 group-hover:scale-110 transition-transform">
                {f.icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                {f.title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/30 mb-3">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span>Transparent Pricing</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
            Choose Your Intelligence Tier
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Start for free, or unlock Deep Reasoner models and gigabytes of document memory with Indian UPI & card support via Razorpay.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Free Tier */}
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Starter</h3>
              <p className="text-xs text-slate-400 mb-6">For daily questions and quick exploration.</p>
              <div className="text-4xl font-extrabold text-white mb-6">
                ₹0 <span className="text-xs font-normal text-slate-400">/ forever</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-300 mb-8">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>Ruhi Balanced (Gemini 2.5 Flash)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>50 messages per day</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>25 MB document storage</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>Live Web Research tool</span>
                </li>
              </ul>
            </div>
            <button
              onClick={handleStartChatting}
              className="w-full py-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white transition-all"
            >
              Get Started Free
            </button>
          </div>

          {/* Pro Tier (Featured) */}
          <div className="p-8 rounded-3xl bg-gradient-to-b from-purple-900/30 via-slate-900 to-slate-900 border-2 border-purple-500/80 shadow-2xl shadow-purple-600/20 flex flex-col justify-between relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md uppercase tracking-wider">
              Most Popular
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Ruhi Pro</h3>
              <p className="text-xs text-slate-300 mb-6">For engineers, researchers, and creators.</p>
              <div className="text-4xl font-extrabold text-white mb-6">
                ₹499 <span className="text-xs font-normal text-slate-400">/ month</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-200 mb-8">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span><strong>Ruhi Deep Reasoner (Gemini 2.5 Pro)</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>1,000 daily messages</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>1 GB document vaults & RAG chunking</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>Neural Image Studio & Voice Mode</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>Custom Projects & Lifelong Memory</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => setUpgradeOpen(true)}
              className="w-full py-3.5 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Upgrade to Pro</span>
            </button>
          </div>

          {/* Team Tier */}
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Ruhi Team</h3>
              <p className="text-xs text-slate-400 mb-6">For teams requiring high throughput and vaults.</p>
              <div className="text-4xl font-extrabold text-white mb-6">
                ₹1,499 <span className="text-xs font-normal text-slate-400">/ month</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-300 mb-8">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-pink-400 flex-shrink-0" />
                  <span>5,000 messages per day</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-pink-400 flex-shrink-0" />
                  <span>10 GB team document storage</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-pink-400 flex-shrink-0" />
                  <span>Priority model routing & low latency</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-pink-400 flex-shrink-0" />
                  <span>Admin metrics & usage dashboards</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => setUpgradeOpen(true)}
              className="w-full py-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white transition-all"
            >
              Subscribe to Team
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-400 text-sm">
            Everything you need to know about Ruhi AI&apos;s capabilities and security.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((f, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden transition-all"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-5 text-left flex items-center justify-between text-sm font-bold text-white hover:text-purple-300 transition-colors"
              >
                <span>{f.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    faqOpen === idx ? 'rotate-180 text-purple-400' : ''
                  }`}
                />
              </button>
              {faqOpen === idx && (
                <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-12 px-6 max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-300 text-sm">RUHI AI</span>
          <span>© 2026 Ruhi AI Platform. All rights reserved.</span>
        </div>

        <div className="flex items-center gap-6">
          <a href="#features" className="hover:text-slate-300 transition-colors">
            Capabilities
          </a>
          <a href="#pricing" className="hover:text-slate-300 transition-colors">
            Pricing
          </a>
          <Link href="/chat" className="hover:text-purple-400 transition-colors">
            Chat App
          </Link>
          <Link href="/settings" className="hover:text-purple-400 transition-colors">
            Settings
          </Link>
        </div>
      </footer>

      {/* Upgrade Modal */}
      <UpgradeModal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  );
}
