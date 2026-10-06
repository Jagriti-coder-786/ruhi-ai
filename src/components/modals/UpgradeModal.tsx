'use client';

import React, { useState } from 'react';
import { X, Check, Zap, Shield, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const { user, refreshUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'team'>('pro');
  const [loading, setLoading] = useState(false);
  const [successNotice, setSuccessNotice] = useState('');
  const [errorNotice, setErrorNotice] = useState('');

  if (!isOpen) return null;

  const handleCheckout = async () => {
    try {
      setLoading(true);
      setErrorNotice('');
      setSuccessNotice('');

      // 1. Create order
      const orderRes = await fetch('/api/subscriptions/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.error || 'Failed to initialize plan checkout');
      }

      const orderData = await orderRes.json();

      // 2. If running with real Razorpay credentials in browser
      if (!orderData.isSandboxMock && typeof window !== 'undefined' && (window as any).Razorpay) {
        const rzp = new (window as any).Razorpay({
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'Ruhi AI',
          description: orderData.planDetails?.description || 'AI Subscription',
          order_id: orderData.orderId,
          handler: async (response: any) => {
            const verifyRes = await fetch('/api/subscriptions/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                plan: selectedPlan,
              }),
            });

            if (verifyRes.ok) {
              await refreshUser();
              setSuccessNotice(`🎉 Successfully activated ${selectedPlan.toUpperCase()} membership!`);
              setTimeout(() => onClose(), 2000);
            }
          },
          prefill: {
            name: user?.name,
            email: user?.email,
          },
          theme: { color: '#8b5cf6' },
        });

        rzp.open();
        setLoading(false);
        return;
      }

      // 3. Sandbox Simulation Flow (Instant upgrade for testing)
      const mockPaymentId = `pay_mock_${Date.now()}`;
      const verifyRes = await fetch('/api/subscriptions/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderData.orderId,
          paymentId: mockPaymentId,
          signature: 'sandbox_simulation_signature',
          plan: selectedPlan,
        }),
      });

      if (verifyRes.ok) {
        await refreshUser();
        setSuccessNotice(`🎉 Sandbox Activated: You are now upgraded to ${selectedPlan.toUpperCase()}!`);
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        throw new Error('Payment simulation verification failed');
      }
    } catch (err: any) {
      setErrorNotice(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl p-8 rounded-3xl bg-slate-900 border border-purple-500/30 shadow-2xl flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">Upgrade Ruhi AI</h3>
            <p className="text-xs text-purple-400 font-medium">Secured with Razorpay payments</p>
          </div>
        </div>

        <p className="text-sm text-slate-400 mt-2 mb-6">
          Unleash deep reasoning, multi-gigabyte vector intelligence, neural voice, and unlimited creative tools.
        </p>

        {successNotice && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium">
            {successNotice}
          </div>
        )}

        {errorNotice && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-medium">
            {errorNotice}
          </div>
        )}

        {/* Plan Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            type="button"
            onClick={() => setSelectedPlan('pro')}
            className={`p-5 rounded-2xl border text-left transition-all relative ${
              selectedPlan === 'pro'
                ? 'bg-purple-600/15 border-purple-500 ring-2 ring-purple-500/40 shadow-lg shadow-purple-500/10'
                : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-white">Ruhi Pro</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold">
                Popular
              </span>
            </div>
            <div className="text-2xl font-extrabold text-white mb-1">
              ₹499 <span className="text-xs text-slate-400 font-normal">/ month</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              For professionals needing deep reasoning, larger context, and RAG document search.
            </p>
            <ul className="text-xs space-y-1.5 text-slate-300">
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                <span>Ruhi Deep Reasoner (Gemini 2.5 Pro)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                <span>1,000 daily messages</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                <span>1 GB document storage & RAG</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                <span>Neural Image Studio & Voice</span>
              </li>
            </ul>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPlan('team')}
            className={`p-5 rounded-2xl border text-left transition-all relative ${
              selectedPlan === 'team'
                ? 'bg-purple-600/15 border-purple-500 ring-2 ring-purple-500/40 shadow-lg shadow-purple-500/10'
                : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-white">Ruhi Team</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-semibold">
                Scale
              </span>
            </div>
            <div className="text-2xl font-extrabold text-white mb-1">
              ₹1,499 <span className="text-xs text-slate-400 font-normal">/ month</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              For high-throughput teams, multi-project knowledge bases, and API integrations.
            </p>
            <ul className="text-xs space-y-1.5 text-slate-300">
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
                <span>Highest speed & zero rate limits</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
                <span>5,000 daily messages</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
                <span>10 GB shared knowledge vaults</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
                <span>Dedicated support & admin control</span>
              </li>
            </ul>
          </button>
        </div>

        {/* Checkout Button */}
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full py-4 rounded-xl font-bold text-base bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Connecting Secure Payment Gateway...</span>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 fill-white" />
              <span>Upgrade to {selectedPlan === 'pro' ? 'Ruhi Pro (₹499)' : 'Ruhi Team (₹1,499)'}</span>
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            256-Bit SSL Encryption
          </span>
          <span>•</span>
          <span>Cancel anytime with 1 click</span>
        </div>
      </div>
    </div>
  );
}

export default UpgradeModal;
