import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config';

/**
 * Hook React pour gérer la connexion WebSocket
 * @param {object} options - Options de configuration
 * @param {function} onConversionProgress - Callback progression
 * @param {function} onConversionComplete - Callback complétion
 * @param {function} onConversionError - Callback erreur
 * @param {function} onConversionStopped - Callback arrêt
 * @param {boolean} enabled - Activer/désactiver la connexion
 * @returns {object} - Socket instance et méthodes
 */
export function useWebSocket({
  onConversionProgress,
  onConversionComplete,
  onConversionError,
  onConversionStopped,
  enabled = true
} = {}) {
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const isConnectingRef = useRef(false);

  // Fonction de connexion
  const connect = useCallback(() => {
    if (isConnectingRef.current || socketRef.current?.connected) {
      return;
    }

    isConnectingRef.current = true;

    // Déterminer l'URL du backend WebSocket
    const wsUrl = API_BASE_URL.replace('/api', '').replace('http', 'ws');
    
    console.log(`🔌 Connexion WebSocket à ${wsUrl}...`);

    const socket = io(wsUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      transports: ['websocket', 'polling'], // Essayer WebSocket d'abord, fallback sur polling
    });

    socket.on('connect', () => {
      console.log('✓ WebSocket connecté');
      isConnectingRef.current = false;
    });

    socket.on('disconnect', (reason) => {
      console.log(`✗ WebSocket déconnecté: ${reason}`);
      isConnectingRef.current = false;
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Erreur connexion WebSocket:', error.message);
      isConnectingRef.current = false;
    });

    // Écouter les événements de conversion
    socket.on('conversion:progress', (data) => {
      if (onConversionProgress) {
        onConversionProgress(data);
      }
    });

    socket.on('conversion:complete', (data) => {
      if (onConversionComplete) {
        onConversionComplete(data);
      }
    });

    socket.on('conversion:error', (data) => {
      if (onConversionError) {
        onConversionError(data);
      }
    });

    socket.on('conversion:stopped', (data) => {
      if (onConversionStopped) {
        onConversionStopped(data);
      }
    });

    socketRef.current = socket;
  }, [onConversionProgress, onConversionComplete, onConversionError, onConversionStopped]);

  // Fonction de déconnexion
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('🔌 Déconnexion WebSocket...');
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    isConnectingRef.current = false;
  }, []);

  // Effet pour gérer la connexion/déconnexion
  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    // Cleanup à la destruction du composant
    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected || false,
    connect,
    disconnect,
  };
}

export default useWebSocket;

