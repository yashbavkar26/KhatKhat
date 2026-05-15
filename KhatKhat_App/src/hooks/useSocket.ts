import { useEffect, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import { getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from '../api/client';

let socketInstance: Socket | null = null;

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(socketInstance);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let active = true;

    const initSocket = async () => {
      if (socketInstance) return;

      try {
        let token: string | null = null;

        // Try to obtain a token. In some environments (Expo) SecureStore
        // may be populated just after login; retry a few times before giving up.
        const tryGetToken = async (attempts = 5, delayMs = 800) => {
          for (let i = 0; i < attempts; i++) {
            // 1. Check for demo token first (same pattern as client.ts)
            const demoToken = await SecureStore.getItemAsync('userToken');
            if (demoToken && demoToken.startsWith('DEMO_TOKEN_')) return demoToken;

            if (getApps().length > 0) {
              const auth = getAuth(getApp());
              const user = auth.currentUser;
              if (user) {
                const idTok = await user.getIdToken();
                if (idTok) return idTok;
              }
            }

            // wait before retrying
            await new Promise((r) => setTimeout(r, delayMs));
          }
          return null;
        };

        token = await tryGetToken();

        // Need a token to authenticate with the socket server
        if (!token) {
          console.log('useSocket: no auth token available after retries, skipping socket init');
          return;
        }

        if (active && !socketInstance) {
          socketInstance = io(BASE_URL, {
            auth: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
          });

          socketInstance.on('connect', () => {
            setIsConnected(true);
            console.log('Socket connected');
          });

          socketInstance.on('disconnect', () => {
            setIsConnected(false);
            console.log('Socket disconnected');
          });

          socketInstance.on('connect_error', (err) => {
            console.warn('Socket connect error:', err.message);
          });

          setSocket(socketInstance);
        }
      } catch (error) {
        console.error('Socket init error:', error);
      }
    };

    initSocket();

    return () => {
      active = false;
    };
  }, []);

  const joinParcel = useCallback((parcelId: string) => {
    if (socket) {
      socket.emit('join:parcel', { parcelId });
    }
  }, [socket]);

  const joinCarrierPool = useCallback(() => {
    if (socket) {
      socket.emit('join:carrier_pool', {});
    }
  }, [socket]);

  const pingLocation = useCallback((lat: number, lng: number) => {
    if (socket) {
      socket.emit('carrier:location_ping', { lat, lng });
    }
  }, [socket]);

  return { socket, isConnected, joinParcel, joinCarrierPool, pingLocation };
};
