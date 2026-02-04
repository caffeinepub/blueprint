import { useActorConnection } from '../hooks/useActorConnection';
import { Loader2, WifiOff, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function ConnectionStatus() {
  const { actor, isFetching, isConnected, isRetrying, retryCount, isError, connectionError } = useActorConnection();
  const [showSuccess, setShowSuccess] = useState(false);
  const [previousConnectionState, setPreviousConnectionState] = useState(false);

  // Show success message when connection is established after being disconnected
  useEffect(() => {
    if (isConnected && !isFetching && previousConnectionState === false) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 3000); // Show success for 3 seconds
      return () => clearTimeout(timer);
    }
    setPreviousConnectionState(isConnected);
  }, [isConnected, isFetching]);

  // Show "Blueprint Engine Ready" success message
  if (showSuccess && isConnected) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
        <Alert className="bg-green-500/10 border-green-500/30 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="ml-2 text-sm text-green-700 dark:text-green-300 font-medium">
            Blueprint Engine Ready
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show reconnecting message during connection attempts
  if ((isFetching && !isConnected) || isRetrying) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
        <Alert className="bg-primary/10 border-primary/30 animate-in fade-in slide-in-from-top-2 duration-300">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <AlertDescription className="ml-2 text-sm">
            {retryCount > 1
              ? `Reconnecting to Blueprint Engine... (Attempt ${retryCount})`
              : 'Connecting to Blueprint Engine...'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show error message if connection failed after all retries
  if (isError && !isFetching && connectionError) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
        <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2 duration-300">
          <WifiOff className="h-4 w-4" />
          <AlertDescription className="ml-2 text-sm flex items-center justify-between">
            <span>
              {connectionError === 'Server Unavailable - Maximum retry attempts reached'
                ? 'Server Unavailable - Please try again later'
                : 'Unable to connect to Blueprint Engine'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="ml-4 h-7 text-xs"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return null;
}
