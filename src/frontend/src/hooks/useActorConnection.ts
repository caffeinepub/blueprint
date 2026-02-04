import { useActor } from './useActor';
import { useState, useEffect } from 'react';

export interface UseActorConnectionReturn {
    actor: any | null;
    isFetching: boolean;
    isConnected: boolean;
    isRetrying: boolean;
    retryCount: number;
    isError: boolean;
    connectionError: string | null;
}

export function useActorConnection(): UseActorConnectionReturn {
    const { actor, isFetching } = useActor();
    const [retryCount, setRetryCount] = useState(0);
    const [isRetrying, setIsRetrying] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [previousFetchingState, setPreviousFetchingState] = useState(false);

    // Track connection state
    const isConnected = !!actor;
    const isError = !actor && !isFetching && retryCount > 0;

    // Monitor fetching state changes to track retries
    useEffect(() => {
        if (isFetching && !previousFetchingState) {
            // Started fetching
            setIsRetrying(true);
            if (!isConnected) {
                setRetryCount(prev => prev + 1);
            }
        } else if (!isFetching && previousFetchingState) {
            // Finished fetching
            setIsRetrying(false);
            if (isConnected) {
                // Successfully connected
                setRetryCount(0);
                setConnectionError(null);
            } else if (retryCount >= 5) {
                // Max retries reached
                setConnectionError('Server Unavailable - Maximum retry attempts reached');
            }
        }
        setPreviousFetchingState(isFetching);
    }, [isFetching, isConnected, retryCount, previousFetchingState]);

    // Reset on successful connection
    useEffect(() => {
        if (isConnected && !isFetching) {
            setRetryCount(0);
            setConnectionError(null);
            setIsRetrying(false);
        }
    }, [isConnected, isFetching]);

    return {
        actor,
        isFetching,
        isConnected,
        isRetrying: isRetrying || (isFetching && !isConnected),
        retryCount,
        isError,
        connectionError,
    };
}
