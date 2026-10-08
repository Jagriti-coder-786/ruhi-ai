'use client';

import React, { useState } from 'react';
import { ThumbsDown, X, Check, MessageSquare } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: string | null;
  onSubmitFeedback: (messageId: string, reason: string, comment?: string) => Promise<void>;
}

const FEEDBACK_REASONS = [
  { id: 'incorrect', label: 'Factually Incorrect' },
  { id: 'outdated', label: 'Outdated Information' },
  { id: 'not_relevant', label: "Didn't Follow Instructions / Irrelevant" },
  { id: 'too_verbose', label: 'Too Verbose / Long-winded' },
  { id: 'too_short', label: 'Too Short / Incomplete' },
  { id: 'poor_formatting', label: 'Poor Code / Markdown Formatting' },
  { id: 'other', label: 'Other' },
];

export function FeedbackModal({
  isOpen,
  onClose,
  messageId,
  onSubmitFeedback,
}: FeedbackModalProps) {
  const [selectedReason, setSelectedReason] = useState('incorrect');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !messageId) return null;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmitFeedback(messageId, selectedReason, comment);
      onClose();
      setComment('');
      setSelectedReason('incorrect');
    } catch (err) {
      console.error('Feedback submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#0e1322] border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400">
              <ThumbsDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Provide Feedback</h3>
              <p className="text-xs text-slate-400">Help Ruhi AI improve</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-5 space-y-4">
          <label className="block text-xs font-semibold text-slate-300">
            What went wrong with this response?
          </label>

          <div className="grid grid-cols-1 gap-2">
            {FEEDBACK_REASONS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedReason(r.id)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium border text-left transition-all ${
                  selectedReason === r.id
                    ? 'bg-purple-600/20 border-purple-500 text-purple-200 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <span>{r.label}</span>
                {selectedReason === r.id && <Check className="w-3.5 h-3.5 text-purple-400" />}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Additional Details (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What would have made this response better?"
              rows={3}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/20 transition-all disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
