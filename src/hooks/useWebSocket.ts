import { useEffect, useRef, useState, useCallback } from 'react';

interface WsMessage {
  event: string;
  data: any;
  timestamp: string;
}

export function useWebSocket(url: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const listenersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      setConnected(true);
      console.log('WebSocket conectado');
    };

    ws.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data);
        const handlers = listenersRef.current.get(msg.event);
        if (handlers) {
          handlers.forEach((handler) => handler(msg.data));
        }
      } catch (e) {
        console.error('Error parseando mensaje WS:', e);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      console.log('WebSocket desconectado, reconectando en 3s...');
      setTimeout(() => {
        wsRef.current = new WebSocket(url);
      }, 3000);
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [url]);

  const on = useCallback((event: string, handler: (data: any) => void) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(handler);

    return () => {
      listenersRef.current.get(event)?.delete(handler);
    };
  }, []);

  return { connected, on };
}
