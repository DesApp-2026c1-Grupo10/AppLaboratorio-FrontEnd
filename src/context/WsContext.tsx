import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react';

interface WsMessage {
  event: string;
  data: any;
  timestamp: string;
}

interface WsContextType {
  connected: boolean;
  on: (event: string, handler: (data: any) => void) => () => void;
}

const WsContext = createContext<WsContextType>({ connected: false, on: () => () => {} });

export function useWs() {
  return useContext(WsContext);
}

export function WsProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout>>();

  const connect = useCallback(() => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3005/api';
    const port = new URL(apiBase).port || '3005';
    const url = `ws://${window.location.hostname}:${port}/ws`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

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
      reconnectTimeout.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {};
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimeout.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const on = useCallback((event: string, handler: (data: any) => void) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(handler);
    return () => {
      listenersRef.current.get(event)?.delete(handler);
    };
  }, []);

  return (
    <WsContext.Provider value={{ connected, on }}>
      {children}
    </WsContext.Provider>
  );
}
