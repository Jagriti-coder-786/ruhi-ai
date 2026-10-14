'use client';

import React, { useState } from 'react';
import { CheckCircle2, Circle, Loader2, XCircle, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

export interface AgentTaskPlanStep {
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  agentType: string;
}

export interface AgentTaskPlanProps {
  taskId?: string;
  title: string;
  steps: AgentTaskPlanStep[];
  status: 'queued' | 'running' | 'waiting_approval' | 'completed' | 'failed' | 'cancelled';
  onApprove?: () => void | Promise<void>;
  onReject?: () => void | Promise<void>;
  onStatusChange?: (newStatus: 'running' | 'cancelled') => void;
}

export function AgentTaskPlan({
  taskId,
  title,
  steps,
  status: initialStatus,
  onApprove,
  onReject,
  onStatusChange,
}: AgentTaskPlanProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [currentStatus, setCurrentStatus] = useState(initialStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync with prop updates if they change externally
  React.useEffect(() => {
    setCurrentStatus(initialStatus);
  }, [initialStatus]);

  const handleDecision = async (decision: 'approved' | 'rejected') => {
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      if (decision === 'approved') {
        if (onApprove) {
          await onApprove();
          setCurrentStatus('running');
          onStatusChange?.('running');
          return;
        }
      } else {
        if (onReject) {
          await onReject();
          setCurrentStatus('cancelled');
          onStatusChange?.('cancelled');
          return;
        }
      }

      if (taskId) {
        const res = await fetch(`/api/agent-tasks/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approvalDecision: decision }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to submit ${decision} decision`);
        }

        const newStatus = decision === 'approved' ? 'running' : 'cancelled';
        setCurrentStatus(newStatus);
        onStatusChange?.(newStatus);
      }
    } catch (err: any) {
      console.error('[AgentTaskPlan] Decision error:', err);
      setErrorMsg(err.message || 'Action failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (stepStatus: string) => {
    switch (stepStatus) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'in_progress':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Circle className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="bg-[#1a1f36] border border-slate-700/50 rounded-xl overflow-hidden my-4 max-w-2xl shadow-lg">
      <div 
        className="px-4 py-3 bg-[#13172b] flex items-center justify-between cursor-pointer hover:bg-[#181c33] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            {currentStatus === 'running' ? (
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            ) : currentStatus === 'completed' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : currentStatus === 'waiting_approval' ? (
              <div className="w-5 h-5 rounded-full bg-amber-500 animate-pulse" />
            ) : currentStatus === 'cancelled' ? (
              <XCircle className="w-5 h-5 text-slate-400" />
            ) : (
              <Circle className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              Autonomous Task
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-medium text-slate-300 uppercase tracking-wider">
                {currentStatus.replace('_', ' ')}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{title}</p>
          </div>
        </div>
        <button
          className="text-slate-400 hover:text-white p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          aria-label={isExpanded ? 'Collapse plan' : 'Expand plan'}
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-4 border-t border-slate-700/50">
          <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4 px-1">Implementation Plan</h4>
          <div className="space-y-4">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 relative">
                {idx !== steps.length - 1 && (
                  <div className="absolute left-2.5 top-6 bottom-[-16px] w-px bg-slate-700" />
                )}
                <div className="relative z-10 bg-[#1a1f36]">
                  {getStatusIcon(step.status)}
                </div>
                <div className={`flex flex-col pt-0.5 ${step.status === 'pending' ? 'opacity-50' : ''}`}>
                  <span className="text-sm font-medium text-slate-200">{step.name}</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">
                    {step.agentType} Agent
                  </span>
                </div>
              </div>
            ))}
          </div>

          {currentStatus === 'waiting_approval' && (
            <div className="mt-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <h5 className="text-sm font-semibold text-amber-400 mb-2">Action Requires Approval</h5>
              <p className="text-xs text-amber-400/80 mb-4">
                The agent is requesting permission to execute the plan steps.
              </p>
              {errorMsg && (
                <div className="mb-3 p-2 bg-rose-500/15 border border-rose-500/30 rounded-lg text-xs text-rose-300 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  disabled={isSubmitting}
                  onClick={() => handleDecision('approved')}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Review & Approve
                </button>
                <button
                  disabled={isSubmitting}
                  onClick={() => handleDecision('rejected')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-xs font-medium rounded-lg transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
