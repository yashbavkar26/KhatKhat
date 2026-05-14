import { useEffect, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import { getAuth } from 'firebase/auth';
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
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;

        const token = await user.getIdToken();

        if (active && !socketInstance) {
          socketInstance = io(BASE_URL, {
            auth: { token },
            transports: ['websocket'],
          });

          socketInstance.on('connect', () => {
            setIsConnected(true);
            console.log('Socket connected');
          });

          socketInstance.on('disconnect', () => {
            setIsConnected(false);
            console.log('Socket disconnected');
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
      // We generally want to keep the socket alive during app usage,
      // but clean up listeners if specific to a component.
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
