import { useState, useEffect, useCallback, useRef } from 'react';
import { WebContainer } from '@webcontainer/api';

let webcontainerInstance: WebContainer | null = null;

export function useWebContainer() {
  const [isBooted, setIsBooted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Boot WebContainer on mount
  useEffect(() => {
    let mounted = true;
    
    async function boot() {
      if (!webcontainerInstance) {
        try {
          webcontainerInstance = await WebContainer.boot();
          
          webcontainerInstance.on('server-ready', (port, pUrl) => {
            if (mounted) {
              setUrl(pUrl);
              if (iframeRef.current) {
                iframeRef.current.src = pUrl;
              }
            }
          });
          
        } catch (error: any) {
          console.error("WebContainer boot failed", error);
          if (mounted) {
            setLogs(prev => [...prev, `[ERROR] Boot failed: ${error.message}`]);
          }
          return;
        }
      }
      if (mounted) {
        setIsBooted(true);
      }
    }
    
    boot();
    
    return () => {
      mounted = false;
    };
  }, []);

  const addLog = useCallback((log: string) => {
    setLogs(prev => [...prev, log]);
  }, []);

  const startDevServer = useCallback(async (files: Record<string, any>) => {
    if (!webcontainerInstance) {
      addLog('[ERROR] WebContainer not booted yet.');
      return;
    }
    
    setIsReady(false);
    setUrl(null);
    setLogs([]);
    addLog('[INFO] Mounting files...');
    
    try {
      await webcontainerInstance.mount(files);
      
      addLog('[INFO] Installing dependencies...');
      const installProcess = await webcontainerInstance.spawn('npm', ['install']);
      
      installProcess.output.pipeTo(new WritableStream({
        write(data) {
          addLog(data);
        }
      }));
      
      const installExitCode = await installProcess.exit;
      if (installExitCode !== 0) {
        addLog(`[ERROR] npm install failed with code ${installExitCode}`);
        return;
      }
      
      addLog('[INFO] Starting dev server...');
      const startProcess = await webcontainerInstance.spawn('npm', ['run', 'dev']);
      
      startProcess.output.pipeTo(new WritableStream({
        write(data) {
          addLog(data);
        }
      }));
      
      setIsReady(true);
      
    } catch (error: any) {
      addLog(`[ERROR] Execution failed: ${error.message}`);
    }
  }, [addLog]);

  return {
    isBooted,
    isReady,
    url,
    logs,
    iframeRef,
    startDevServer
  };
}
