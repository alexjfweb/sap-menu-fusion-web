
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';

const ConnectionStatusIndicator = () => {
  const { isOnline, isConnecting, lastError, retryCount } = useConnectionStatus();

  const handleRefresh = () => {
    window.location.reload();
  };

  if (isOnline && !lastError) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      {!isOnline && (
        <Alert variant="destructive" className="mb-2">
          <WifiOff className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Sin conexión a internet</span>
            <Wifi className="h-4 w-4 ml-2" />
          </AlertDescription>
        </Alert>
      )}

      {lastError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Error de conexión</p>
                <p className="text-sm">{lastError}</p>
                {retryCount > 0 && (
                  <p className="text-xs mt-1">Intentos: {retryCount}/20</p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isConnecting}
                className="ml-4"
              >
                {isConnecting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ConnectionStatusIndicator;
