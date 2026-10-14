'use client';

import React, { useEffect, useState, useRef, useId, useCallback } from 'react';
import {
  Workflow,
  Copy,
  Check,
  Code2,
  Eye,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  AlertCircle,
  Maximize2,
  Minimize2,
  Loader2,
} from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import {
  cleanMermaidSource,
  detectDiagramType,
  getMermaidThemeConfig,
} from './mermaidUtils';

interface MermaidBlockProps {
  code: string;
  isStreaming?: boolean;
}

export function MermaidBlock({ code, isStreaming = false }: MermaidBlockProps) {
  const { theme } = useTheme();
  const reactId = useId().replace(/:/g, '');
  const renderCounter = useRef(0);

  const [isMounted, setIsMounted] = useState(false);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [viewMode, setViewMode] = useState<'diagram' | 'code'>('diagram');
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [fitToWidth, setFitToWidth] = useState(true);

  // Cached last successfully rendered code to avoid re-rendering identical content
  const lastRenderedKey = useRef<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

  const cleanedCode = cleanMermaidSource(code);
  const diagramInfo = detectDiagramType(cleanedCode);
  const displayLabel = diagramInfo ? diagramInfo.label : 'Mermaid Diagram';

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const renderDiagram = useCallback(async () => {
    if (!cleanedCode) {
      if (isStreaming) {
        setIsPending(true);
      }
      return;
    }

    const renderKey = `${cleanedCode}___${theme}`;
    if (renderKey === lastRenderedKey.current && svgContent) {
      // Content and theme haven't changed, retain existing SVG
      return;
    }

    try {
      const mermaidModule = await import('mermaid');
      const mermaid = mermaidModule.default || mermaidModule;

      // Configure Mermaid with Emerald theme and strict security
      mermaid.initialize(getMermaidThemeConfig(theme));
      if (typeof mermaid.setParseErrorHandler === 'function') {
        mermaid.setParseErrorHandler(() => {});
      }

      // Pre-flight syntax parse check
      try {
        await mermaid.parse(cleanedCode);
      } catch (parseErr: any) {
        if (isStreaming) {
          // While streaming, syntax can be incomplete; show unobtrusive pending state
          setIsPending(true);
          return;
        }
        throw parseErr;
      }

      // Syntax is valid, generate unique container id
      const uniqueId = `mermaid-${reactId}-${++renderCounter.current}`;
      const { svg } = await mermaid.render(uniqueId, cleanedCode);

      // Clean up any stray temporary elements created by Mermaid
      const tempEl = document.getElementById(uniqueId);
      if (tempEl) tempEl.remove();
      const tempParent = document.getElementById(`d${uniqueId}`);
      if (tempParent) tempParent.remove();

      setSvgContent(svg);
      setRenderError(null);
      setIsPending(false);
      lastRenderedKey.current = renderKey;
    } catch (err: any) {
      if (isStreaming) {
        // While streaming, incomplete syntax is expected; buffer gracefully
        setIsPending(true);
      } else {
        setIsPending(false);
        setRenderError(err?.message || 'Invalid or unsupported Mermaid syntax');
      }
    }
  }, [cleanedCode, theme, isStreaming, reactId, svgContent]);

  useEffect(() => {
    if (!isMounted) return;
    renderDiagram();
  }, [renderDiagram, isMounted]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cleanedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownloadSvg = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(diagramInfo?.label || 'diagram').toLowerCase().replace(/\s+/g, '_')}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setFitToWidth(true);
  };

  // SSR or unmounted fallback
  if (!isMounted) {
    return (
      <div className="my-4 rounded-2xl border border-emerald-500/20 bg-slate-900/60 p-4">
        <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
          <Workflow className="w-4 h-4 animate-pulse" />
          <span>Loading {displayLabel}...</span>
        </div>
      </div>
    );
  }

  // Streaming and incomplete state: small, unobtrusive pending badge
  if (isPending && !svgContent) {
    return (
      <div className="my-3 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/5 text-emerald-400 text-xs font-medium">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
        <span>Generating {displayLabel}...</span>
      </div>
    );
  }

  const isDark = theme === 'dark';

  return (
    <div
      className={`relative my-4 rounded-2xl overflow-hidden border shadow-xl transition-all ${
        isDark
          ? 'border-emerald-500/25 bg-[#080d19] shadow-emerald-950/20'
          : 'border-slate-200 bg-white shadow-slate-200/50'
      }`}
    >
      {/* Header Bar */}
      <div
        className={`flex items-center justify-between px-3.5 py-2.5 border-b text-xs font-sans ${
          isDark
            ? 'bg-slate-900/90 border-emerald-500/20 text-slate-300'
            : 'bg-slate-100/90 border-slate-200 text-slate-700'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${
              isDark
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-emerald-50 border-emerald-300 text-emerald-700'
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
          </div>
          <span
            className={`font-semibold truncate text-xs ${
              isDark ? 'text-emerald-400' : 'text-emerald-800'
            }`}
          >
            {displayLabel}
          </span>
          <span
            className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full border hidden sm:inline ${
              isDark
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            Visual Diagram
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {viewMode === 'diagram' && svgContent && (
            <>
              {/* Zoom Controls */}
              <div
                className={`hidden sm:flex items-center gap-0.5 mr-1 border-r pr-1 ${
                  isDark ? 'border-slate-700/60' : 'border-slate-300'
                }`}
              >
                <button
                  onClick={handleZoomOut}
                  className={`p-1 rounded-md transition-colors ${
                    isDark
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleResetZoom}
                  className={`px-1.5 py-0.5 rounded-md text-[11px] font-mono transition-colors ${
                    isDark
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                  title="Reset Zoom / Fit"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  onClick={handleZoomIn}
                  className={`p-1 rounded-md transition-colors ${
                    isDark
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setFitToWidth(!fitToWidth)}
                  className={`p-1 rounded-md transition-colors ${
                    fitToWidth
                      ? isDark
                        ? 'text-emerald-400 bg-emerald-500/10'
                        : 'text-emerald-700 bg-emerald-100'
                      : isDark
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                  title={fitToWidth ? 'Free Scroll' : 'Fit to Container'}
                >
                  {fitToWidth ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Download SVG */}
              <button
                onClick={handleDownloadSvg}
                className={`p-1.5 rounded-md transition-colors ${
                  isDark
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
                title="Download SVG Diagram"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {/* View Mode Toggle */}
          <button
            onClick={() => setViewMode(viewMode === 'diagram' ? 'code' : 'diagram')}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all ${
              isDark
                ? 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-700 hover:text-slate-900'
            }`}
            title={viewMode === 'diagram' ? 'View Mermaid Source' : 'View Visual Diagram'}
          >
            {viewMode === 'diagram' ? (
              <>
                <Code2 className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Source</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden xs:inline">Diagram</span>
              </>
            )}
          </button>

          {/* Copy Source */}
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all ${
              isDark
                ? 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-700 hover:text-slate-900'
            }`}
            title="Copy Mermaid Code"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Body */}
      {renderError && viewMode === 'diagram' ? (
        /* Graceful Contained Error State */
        <div className="p-4 bg-amber-500/5 border-b border-amber-500/20 text-slate-300 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <div className="font-semibold text-amber-300">Unable to render visual diagram</div>
              <div className="text-slate-400 text-[11px] leading-relaxed">
                The diagram syntax contains an unsupported format or syntax error. You can view or copy the original source below.
              </div>
              <button
                onClick={() => setViewMode('code')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 mt-1 rounded-md bg-slate-800 hover:bg-slate-700 text-emerald-400 font-medium text-xs transition-colors"
              >
                <Code2 className="w-3 h-3" />
                View Mermaid Source Code
              </button>
            </div>
          </div>
        </div>
      ) : viewMode === 'diagram' && svgContent ? (
        /* Visual SVG Diagram */
        <div
          ref={containerRef}
          className={`p-4 overflow-x-auto max-w-full flex justify-center items-center custom-scrollbar select-none ${
            isDark ? 'bg-[#070b14]' : 'bg-white'
          }`}
          style={{ minHeight: '140px' }}
        >
          <div
            className="transition-transform duration-150 origin-center flex justify-center items-center w-full"
            style={{
              transform: zoom !== 1 ? `scale(${zoom})` : undefined,
              maxWidth: fitToWidth ? '100%' : 'none',
            }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        </div>
      ) : (
        /* Raw Source Code Panel */
        <div
          className={`p-4 overflow-x-auto font-mono text-xs leading-relaxed custom-scrollbar ${
            isDark ? 'bg-[#070b14] text-slate-200' : 'bg-slate-900 text-slate-100'
          }`}
        >
          <pre className="!bg-transparent !m-0 !p-0">
            <code>{cleanedCode}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

export default MermaidBlock;
