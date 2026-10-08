'use client';

import React, { useState, useEffect } from 'react';
import { X, Plug, CheckCircle2, RefreshCw, Unlink, ExternalLink, ShieldCheck } from 'lucide-react';

interface ConnectorItem {
  provider: 'google_drive' | 'github' | 'slack' | 'notion' | 'dropbox';
  name: string;
  description: string;
  status: 'connected' | 'disconnected';
  accountEmail?: string;
  scopes: string[];
  lastSyncedAt?: string;
}

interface ConnectorsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectorsModal({ isOpen, onClose }: ConnectorsModalProps) {
  const [connectors, setConnectors] = useState<ConnectorItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actingProvider, setActingProvider] = useState<string | null>(null);

  const fetchConnectors = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/connectors');
      if (res.ok) {
        const data = await res.json();
        setConnectors(data.connectors || []);
      }
    } catch (err) {
      console.error('Failed to load connectors', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchConnectors();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleConnect = async (c: ConnectorItem) => {
    try {
      setActingProvider(c.provider);
      const isCurrentlyConnected = c.status === 'connected';
      const action = isCurrentlyConnected ? 'disconnect' : 'connect';

      const res = await fetch('/api/connectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: c.provider,
          action,
          accountEmail: !isCurrentlyConnected ? `user@${c.provider}.workspace` : undefined,
        }),
      });

      if (res.ok) {
        await fetchConnectors();
      }
    } catch (err) {
      console.error('Connector action error', err);
    } finally {
      setActingProvider(null);
    }
  };

  const handleSync = async (provider: string) => {
    try {
      setActingProvider(provider);
      const res = await fetch('/api/connectors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      if (res.ok) {
        await fetchConnectors();
      }
    } catch (err) {
      console.error('Sync failed', err);
    } finally {
      setActingProvider(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#0d121f] border border-slate-800 rounded-3xl p-6 shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Plug className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Workspace Connectors & Integrations
              </h3>
              <p className="text-xs text-slate-400">
                Grant permission to ground Ruhi AI queries in your external repositories & files
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

        {/* Info Banner */}
        <div className="my-4 p-3 rounded-2xl bg-slate-900/80 border border-slate-800/60 flex items-start gap-2.5 text-xs text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Connectors run with read-only sandbox permissions. Your credentials are encrypted and
            external data is labeled untrusted to prevent prompt injection.
          </span>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1 custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-400 text-sm">
              <RefreshCw className="w-5 h-5 animate-spin mr-2 text-cyan-400" />
              Loading connectors...
            </div>
          ) : (
            connectors.map((c) => {
              const isConnected = c.status === 'connected';
              const isBusy = actingProvider === c.provider;

              return (
                <div
                  key={c.provider}
                  className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/70 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-semibold text-white">{c.name}</span>
                      {isConnected ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Connected
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                          Disconnected
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{c.description}</p>
                    {isConnected && c.accountEmail && (
                      <p className="text-[11px] text-cyan-400/90 font-mono">
                        Account: {c.accountEmail}{' '}
                        {c.lastSyncedAt && `• Synced ${new Date(c.lastSyncedAt).toLocaleTimeString()}`}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isConnected ? (
                      <>
                        <button
                          onClick={() => handleSync(c.provider)}
                          disabled={isBusy}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700/60 transition-colors flex items-center gap-1.5"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isBusy ? 'animate-spin' : ''}`} />
                          Sync
                        </button>
                        <button
                          onClick={() => handleToggleConnect(c)}
                          disabled={isBusy}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-colors flex items-center gap-1.5"
                        >
                          <Unlink className="w-3.5 h-3.5" />
                          Disconnect
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleToggleConnect(c)}
                        disabled={isBusy}
                        className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-lg shadow-cyan-500/10"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
