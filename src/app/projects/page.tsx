'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Folder,
  Plus,
  ArrowLeft,
  Sparkles,
  Trash2,
  FileText,
  MessageSquare,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ProjectItem {
  _id: string;
  name: string;
  description?: string;
  customInstructions?: string;
  documentCount: number;
  createdAt: string;
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');

  const loadProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, customInstructions }),
      });
      if (res.ok) {
        setName('');
        setDescription('');
        setCustomInstructions('');
        setCreateModalOpen(false);
        loadProjects();
      }
    } catch (err) {
      console.error('Create project error:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/projects?id=${id}`, { method: 'DELETE' });
      loadProjects();
    } catch (err) {
      console.error('Delete project error:', err);
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
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-600 to-purple-600 flex items-center justify-center text-white">
              <Folder className="w-4 h-4" />
            </div>
            <span className="font-bold text-base text-white">Projects & Knowledge Hub</span>
          </div>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </nav>

      {/* Projects Grid */}
      <div className="max-w-5xl mx-auto px-6 pt-10">
        <div className="mb-8">
          <h2 className="text-2xl font-extrabold text-white mb-1">Your Workspaces</h2>
          <p className="text-xs text-slate-400">
            Organize specialized projects with dedicated instructions, documents, and conversation memory.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => (
            <div
              key={p._id}
              className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between group shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
                    <Folder className="w-5 h-5" />
                  </div>
                  <button
                    onClick={() => handleDelete(p._id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Delete project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-base font-bold text-white mb-1.5 group-hover:text-purple-300 transition-colors">
                  {p.name}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                  {p.description || 'No description provided.'}
                </p>

                {p.customInstructions && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 italic line-clamp-2 mb-4">
                    &quot;{p.customInstructions}&quot;
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{p.documentCount} docs</span>
                </div>
                <Link
                  href="/chat"
                  className="font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  <span>Chat in Project</span>
                  <MessageSquare className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-20 text-slate-500 text-sm">
            No projects created yet. Click &quot;New Project&quot; to begin.
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg p-6 rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white mb-2">Create New Project</h3>
            <p className="text-xs text-slate-400 mb-6">
              Ruhi will apply customized context and knowledge to this workspace.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Next.js SaaS Platform"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Architecture and API integrations for client"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Custom AI Instructions
                </label>
                <textarea
                  rows={3}
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g. Always write clean TypeScript code with comments and follow Next.js App Router conventions..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <button
                onClick={handleCreate}
                className="w-full py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-600/30 transition-all"
              >
                Create Workspace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
