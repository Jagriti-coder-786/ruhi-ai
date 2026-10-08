'use client';

import React, { useState, useEffect } from 'react';
import { Play, Square, Terminal as TerminalIcon, FileCode2, Layout, GitBranch, Settings, Loader2 } from 'lucide-react';
import { useWebContainer } from '@/hooks/useWebContainer';

interface CodebaseWorkspaceProps {
  projectId: string;
  projectName: string;
  framework: string;
  onClose: () => void;
}

// Sample minimal React app to inject into WebContainer
const sampleFiles = {
  'package.json': {
    file: {
      contents: `
{
  "name": "ruhi-agent-app",
  "type": "module",
  "dependencies": {
    "express": "latest",
    "nodemon": "latest"
  },
  "scripts": {
    "start": "nodemon index.js",
    "dev": "nodemon index.js"
  }
}
      `.trim()
    }
  },
  'index.js': {
    file: {
      contents: `
import express from 'express';
const app = express();
const port = 3111;

app.get('/', (req, res) => {
  res.send('Hello World from Ruhi Agent Builder (WebContainer)!');
});

app.listen(port, () => {
  console.log(\`App is live at http://localhost:\${port}\`);
});
      `.trim()
    }
  }
};

export function CodebaseWorkspace({ projectId, projectName, framework, onClose }: CodebaseWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  
  const { isBooted, isReady, url, logs, iframeRef, startDevServer } = useWebContainer();
  const [isRunning, setIsRunning] = useState(false);

  const handleToggleApp = async () => {
    if (isRunning) {
      // For a real app, we would kill the process using WebContainer process API
      setIsRunning(false);
      return;
    }
    
    setIsRunning(true);
    setActiveTab('preview');
    await startDevServer(sampleFiles);
  };


  return (
    <div className="fixed inset-0 z-50 bg-[#0e1322] flex flex-col">
      {/* Top Header */}
      <div className="h-14 border-b border-slate-800 bg-[#090d18] flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            ← Back to Chat
          </button>
          <div className="h-4 w-px bg-slate-700" />
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-purple-400" />
            {projectName}
            <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
              {framework}
            </span>
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
              isRunning ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
            } ${!isBooted ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleToggleApp}
            disabled={!isBooted}
          >
            {isRunning ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" /> Stop App
              </>
            ) : !isBooted ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Booting Engine...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" /> Start App
              </>
            )}
          </button>
          <button className="px-3 py-1.5 rounded-md text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white transition-colors">
            Deploy
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-slate-800 bg-[#0c101d] flex flex-col">
          <div className="flex items-center gap-2 p-3 text-xs font-medium text-slate-400 uppercase tracking-wider border-b border-slate-800/50">
            Explorer
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {/* Virtual File Tree placeholder */}
            <div className="text-sm text-slate-400 px-2 py-1 flex items-center gap-2 hover:bg-slate-800/50 rounded cursor-pointer">
              <span className="text-slate-500">📁</span> src
            </div>
            <div className="text-sm text-slate-400 px-2 py-1 pl-6 flex items-center gap-2 hover:bg-slate-800/50 rounded cursor-pointer bg-slate-800/30 text-white">
              <span className="text-slate-500">📄</span> page.tsx
            </div>
            <div className="text-sm text-slate-400 px-2 py-1 pl-6 flex items-center gap-2 hover:bg-slate-800/50 rounded cursor-pointer">
              <span className="text-slate-500">📄</span> layout.tsx
            </div>
            <div className="text-sm text-slate-400 px-2 py-1 flex items-center gap-2 hover:bg-slate-800/50 rounded cursor-pointer">
              <span className="text-slate-500">📄</span> package.json
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Editor/Preview Toggle */}
          <div className="flex border-b border-slate-800 bg-[#090d18]">
            <button 
              className={`px-4 py-2 text-xs font-medium border-b-2 flex items-center gap-2 ${
                activeTab === 'editor' ? 'border-purple-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => setActiveTab('editor')}
            >
              <FileCode2 className="w-3.5 h-3.5" /> Editor
            </button>
            <button 
              className={`px-4 py-2 text-xs font-medium border-b-2 flex items-center gap-2 ${
                activeTab === 'preview' ? 'border-purple-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => setActiveTab('preview')}
            >
              <Layout className="w-3.5 h-3.5" /> Live Preview
            </button>
          </div>

          <div className="flex-1 relative bg-[#1e1e1e]">
            {activeTab === 'editor' ? (
              <div className="absolute inset-0 p-4 text-slate-300 font-mono text-sm overflow-auto">
                {/* Monaco Editor Placeholder */}
                <div className="text-purple-400">export default function</div> <div className="text-blue-400">Page</div>() {'{\n'}
                {'  '}return (\n
                {'    '}<div className="text-emerald-400">&lt;div&gt;</div>\n
                {'      '}Hello World from Ruhi Agent Builder\n
                {'    '}<div className="text-emerald-400">&lt;/div&gt;</div>\n
                {'  '})\n
                {'}'}
              </div>
            ) : (
              <div className="absolute inset-0 bg-white flex flex-col">
                {/* Preview Browser Chrome */}
                <div className="h-10 bg-slate-100 border-b flex items-center px-4">
                  <div className="flex gap-1.5 mr-4">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex-1 bg-white rounded text-xs px-3 py-1.5 text-slate-500 border shadow-sm">
                    {url ? url : isRunning ? 'Booting sandbox server...' : 'Sandbox is stopped'}
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-center bg-slate-50 relative">
                  {isRunning ? (
                    <iframe 
                      ref={iframeRef} 
                      className="absolute inset-0 w-full h-full border-none"
                      allow="cross-origin-isolated"
                    />
                  ) : (
                    <div className="text-slate-400 text-sm">Click "Start App" to view preview</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Terminal / Logs Bottom Panel */}
          <div className="h-48 border-t border-slate-800 bg-[#090d18] flex flex-col">
            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-slate-800/50">
              <TerminalIcon className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Terminal</span>
            </div>
            <div className="flex-1 p-3 font-mono text-xs text-slate-300 overflow-y-auto">
              {logs.length > 0 ? (
                logs.map((log, idx) => (
                  <div key={idx} className={log.includes('[ERROR]') ? 'text-red-400' : 'text-slate-300'}>
                    {log}
                  </div>
                ))
              ) : isRunning ? (
                <div className="text-slate-500 flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" /> Starting terminal...
                </div>
              ) : (
                <div className="text-slate-500">Terminal offline. Sandbox stopped.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
