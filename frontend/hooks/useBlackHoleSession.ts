'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { SessionData, FileDelivery, WebSocketMessage, UploadResponse } from '../types';

const BLACK_HOLE_API_BASE = 'http://localhost:8000';
const BLACK_HOLE_WS_BASE = 'ws://localhost:8000';

export function useBlackHoleSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [onFileReceived, setOnFileReceived] = useState<((filename: string, fileContent: string) => void) | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Create session with the black hole backend
  const createSession = useCallback(async () => {
    const response = await fetch(`${BLACK_HOLE_API_BASE}/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    const data: SessionData = await response.json();
    setSessionId(data.session_id);
    return data.session_id;
  }, []);

  // Connect to WebSocket
  const connectWebSocket = useCallback((sessionId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const ws = new WebSocket(`${BLACK_HOLE_WS_BASE}/ws/${sessionId}`);
    
    ws.onmessage = (event) => {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      if (message.type === 'file_delivery') {
        const fileDelivery = message as FileDelivery;
        if (onFileReceived) {
          onFileReceived(fileDelivery.filename, fileDelivery.file_content);
        }
        
        // Send acknowledgment
        ws.send(JSON.stringify({
          type: 'file_received_ack',
          file_id: fileDelivery.file_id
        }));
      } else if (message.type === 'heartbeat') {
        // Respond to heartbeat
        ws.send(JSON.stringify({ type: 'heartbeat_ack' }));
      }
    };

    wsRef.current = ws;
  }, [onFileReceived]);

  // Upload file to black hole
  const uploadFile = useCallback(async (file: File) => {
    if (!sessionId) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('session_id', sessionId);

    const response = await fetch(`${BLACK_HOLE_API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });

    const result: UploadResponse = await response.json();
    return result;
  }, [sessionId]);

  // Initialize session and WebSocket connection
  useEffect(() => {
    const initializeSession = async () => {
      const newSessionId = await createSession();
      connectWebSocket(newSessionId);
    };

    initializeSession();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [createSession, connectWebSocket]);

  // Set file received callback
  const setFileReceivedCallback = useCallback((callback: (filename: string, fileContent: string) => void) => {
    setOnFileReceived(() => callback);
  }, []);

  return {
    sessionId,
    uploadFile,
    setFileReceivedCallback,
  };
}
