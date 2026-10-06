'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  ArrowLeft,
  Users,
  DollarSign,
  MessageSquare,
  Cpu,
  Activity,
  UserCheck,
  UserX,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function AdminPage() {
  const { user, loginDemo } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [metricsRes, usersRes] = await Promise.all([
        fetch('/api/admin/metrics'),
        fetch('/api/admin/users'),
      ]);

      if (metricsRes.ok) {
        const m = await metricsRes.json();
        setMetrics(m);
      }
      if (usersRes.ok) {
        const u = await usersRes.json();
        setUsersList(u.users || []);
      }
    } catch (err) {
      console.error('Admin load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleUpdateUser = async (userId: string, updates: Record<string, unknown>) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...updates }),
      });
      if (res.ok) {
        loadAdminData();
      }
    } catch (err) {
      console.error('Update user error:', err);
    }
  };

  const handleSwitchToAdminDemo = async () => {
    await loginDemo('admin', 'team');
    loadAdminData();
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
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-yellow-500 to-amber-600 flex items-center justify-center text-white">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-bold text-base text-white">Ruhi AI Admin Console</span>
          </div>
        </div>

        {user?.role !== 'admin' && (
          <button
            onClick={handleSwitchToAdminDemo}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-md flex items-center gap-1.5"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Switch to Admin Role (Demo)</span>
          </button>
        )}
      </nav>

      <div className="max-w-6xl mx-auto px-6 pt-10">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Users
              </span>
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">
              {metrics?.metrics?.totalUsers ?? '...'}
            </div>
            <p className="text-[11px] text-emerald-400 mt-1 font-medium">
              {metrics?.metrics?.activeUsers ?? 0} Active accounts
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Monthly ARR (Est.)
              </span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">
              ₹{(metrics?.metrics?.estimatedMonthlyRevenue ?? 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-purple-400 mt-1 font-medium">
              {(metrics?.metrics?.proUsers ?? 0) + (metrics?.metrics?.teamUsers ?? 0)} Paid Subscribers
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Conversations
              </span>
              <MessageSquare className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">
              {metrics?.metrics?.totalConversations ?? '...'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Across all user accounts
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Messages
              </span>
              <Activity className="w-4 h-4 text-pink-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">
              {metrics?.metrics?.totalMessages ?? '...'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Indexed in MongoDB
            </p>
          </div>
        </div>

        {/* Model Status Section */}
        <div className="mb-10 p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-white">AI Provider Infrastructure</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {metrics?.modelsStatus?.map((m: any) => (
              <div
                key={m.id}
                className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white">{m.name}</div>
                  <div className="text-[10px] text-slate-400 uppercase">{m.provider}</div>
                </div>
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    m.isAvailable ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-slate-600'
                  }`}
                  title={m.isAvailable ? 'Ready' : 'Not configured'}
                />
              </div>
            ))}
          </div>
        </div>

        {/* User Management Table */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-lg">
          <h3 className="text-base font-bold text-white mb-4">User Management & Moderation</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 rounded-r-xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {usersList.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-white">
                      <div>{u.name}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md font-bold uppercase text-[10px] bg-slate-800 text-slate-300">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={u.plan}
                        onChange={(e) => handleUpdateUser(u._id, { plan: e.target.value })}
                        className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-purple-300 font-bold uppercase focus:outline-none"
                      >
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="team">Team</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          u.isActive
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleUpdateUser(u._id, { isActive: !u.isActive })}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          u.isActive
                            ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                        }`}
                      >
                        {u.isActive ? 'Suspend' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
