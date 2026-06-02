import { useEffect, useRef, useState, useCallback } from 'react';
import type { Snapshot } from '../types';

export function useWebSocket() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return; // SSR guard

    const backendHost = window.location.hostname + ":6040";
    const wsUrl = `ws://${backendHost}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      setTimeout(() => {
        if (wsRef.current === ws) {
          wsRef.current = null;
        }
      }, 2000);
    };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'crud_result') return;
        const snap: Snapshot = data;
        setSnapshot(snap);
        setHistory(prev => {
          const next = [...prev, snap];
          return next.length > 120 ? next.slice(-120) : next;
        });
      } catch {}
    };

    return () => { ws.close(); };
  }, []);

  const send = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const setScenario = useCallback((scenario: string) => {
    send({ type: 'set_scenario', scenario });
    setHistory([]);
  }, [send]);

  const addBattery = useCallback((data: object) => {
    send({ type: 'add_battery', data });
  }, [send]);

  const removeBattery = useCallback((id: number) => {
    send({ type: 'remove_battery', id });
  }, [send]);

  const editBattery = useCallback((id: number, data: object) => {
    send({ type: 'edit_battery', id, data });
  }, [send]);

  const addLoad = useCallback((data: object) => {
    send({ type: 'add_load', data });
  }, [send]);

  const removeLoad = useCallback((id: number) => {
    send({ type: 'remove_load', id });
  }, [send]);

  const editLoad = useCallback((id: number, data: object) => {
    send({ type: 'edit_load', id, data });
  }, [send]);

  const exportLogs = useCallback(async () => {
    if (typeof document === 'undefined') return; // SSR guard
    try {
      const resp = await fetch('/api/logs/export');
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system_logs_${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  }, []);

  return {
    snapshot, history, connected, setScenario,
    addBattery, removeBattery, editBattery,
    addLoad, removeLoad, editLoad,
    exportLogs,
  };
}
