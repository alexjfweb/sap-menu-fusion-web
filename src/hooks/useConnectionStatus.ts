
import { useState, useEffect } from 'react';

interface ConnectionStatus {
  isOnline: boolean;
  isConnecting: boolean;
  lastError: string | null;
  retryCount: number;
}

export const useConnectionStatus = () => {
  const [status, setStatus] = useState<ConnectionStatus>({
    isOnline: navigator.onLine,
    isConnecting: false,
    lastError: null,
    retryCount: 0,
  });

  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Connection restored');
      setStatus(prev => ({
        ...prev,
        isOnline: true,
        isConnecting: false,
        lastError: null,
        retryCount: 0,
      }));
    };

    const handleOffline = () => {
      console.log('🔌 Connection lost');
      setStatus(prev => ({
        ...prev,
        isOnline: false,
        lastError: 'Conexión perdida',
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const setConnecting = (connecting: boolean) => {
    setStatus(prev => ({ ...prev, isConnecting: connecting }));
  };

  const setError = (error: string) => {
    setStatus(prev => ({
      ...prev,
      lastError: error,
      retryCount: prev.retryCount + 1,
    }));
  };

  const resetError = () => {
    setStatus(prev => ({
      ...prev,
      lastError: null,
      retryCount: 0,
    }));
  };

  return {
    ...status,
    setConnecting,
    setError,
    resetError,
  };
};
