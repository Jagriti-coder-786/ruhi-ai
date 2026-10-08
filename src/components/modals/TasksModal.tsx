'use client';

import React, { useState, useEffect } from 'react';
import { X, CalendarClock, Plus, Trash2, Bell, Check, RefreshCw, Power } from 'lucide-react';

interface ScheduledTaskItem {
  _id: string;
  title: string;
  prompt: string;
  scheduleType: 'once' | 'daily' | 'weekly' | 'monthly';
  scheduledTime?: string;
  isActive: boolean;
  notifyVia: 'in_app' | 'email';
  lastRunAt?: string;
  nextRunAt?: string;
}

interface TasksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TasksModal({ isOpen, onClose }: TasksModalProps) {
  const [tasks, setTasks] = useState<ScheduledTaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newPrompt, setNewPrompt] = useState('');
  const [newScheduleType, setNewScheduleType] = useState<'daily' | 'weekly' | 'monthly' | 'once'>('daily');
  const [newTime, setNewTime] = useState('09:00');
  const [newNotifyVia, setNewNotifyVia] = useState<'in_app' | 'email'>('in_app');

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error('Failed to load tasks', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTasks();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleTask = async (task: ScheduledTaskItem) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: task._id,
          isActive: !task.isActive,
        }),
      });
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t._id === task._id ? { ...t, isActive: !t.isActive } : t))
        );
      }
    } catch (err) {
      console.error('Failed to toggle task', err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t._id !== id));
      }
    } catch (err) {
      console.error('Failed to delete task', err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrompt.trim()) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          prompt: newPrompt,
          scheduleType: newScheduleType,
          scheduledTime: newTime,
          notifyVia: newNotifyVia,
        }),
      });

      if (res.ok) {
        setNewTitle('');
        setNewPrompt('');
        setIsCreating(false);
        await fetchTasks();
      }
    } catch (err) {
      console.error('Failed to create task', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#0d121f] border border-slate-800 rounded-3xl p-6 shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Automations & Scheduled Tasks</h3>
              <p className="text-xs text-slate-400">
                Schedule recurring briefings, web monitoring, or daily research summaries
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between py-3 border-b border-slate-800/50">
          <span className="text-xs text-slate-400 font-medium">
            Active automations: {tasks.filter((t) => t.isActive).length} / {tasks.length}
          </span>
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 transition-colors shadow-lg shadow-purple-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            {isCreating ? 'Cancel' : 'New Automation'}
          </button>
        </div>

        {/* Creation Form */}
        {isCreating && (
          <form
            onSubmit={handleCreateTask}
            className="p-4 my-2 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-3 animate-fade-in"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300">Automation Title</label>
                <input
                  type="text"
                  placeholder="e.g. Daily AI Market Briefing"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs font-medium text-slate-300">Frequency</label>
                  <select
                    value={newScheduleType}
                    onChange={(e: any) => setNewScheduleType(e.target.value)}
                    className="w-full mt-1 px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="once">Once</option>
                  </select>
                </div>
                <div className="w-24">
                  <label className="text-xs font-medium text-slate-300">Time</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full mt-1 px-2 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300">Instruction / Query</label>
              <textarea
                placeholder="e.g. Search latest developments in generative AI models and summarize key breakthroughs."
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                rows={2}
                className="w-full mt-1 px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
                required
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Bell className="w-3.5 h-3.5 text-purple-400" />
                <span>Channel:</span>
                <button
                  type="button"
                  onClick={() => setNewNotifyVia(newNotifyVia === 'in_app' ? 'email' : 'in_app')}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white capitalize"
                >
                  {newNotifyVia === 'in_app' ? 'In-App Notification' : 'Email'}
                </button>
              </div>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1 transition-colors"
              >
                <Check className="w-3.5 h-3.5" /> Save Automation
              </button>
            </div>
          </form>
        )}

        {/* Task List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 py-1 custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-400 text-sm">
              <RefreshCw className="w-5 h-5 animate-spin mr-2 text-purple-400" />
              Loading automations...
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No automations configured yet. Create one above to run recurring briefs!
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task._id}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  task.isActive
                    ? 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                    : 'bg-slate-950/40 border-slate-900 opacity-60'
                }`}
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white truncate">{task.title}</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/20">
                      {task.scheduleType} @ {task.scheduledTime || '09:00'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1">{task.prompt}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleTask(task)}
                    title={task.isActive ? 'Pause' : 'Activate'}
                    className={`p-1.5 rounded-xl border transition-colors ${
                      task.isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task._id)}
                    title="Delete"
                    className="p-1.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
