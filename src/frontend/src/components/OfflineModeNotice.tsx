import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff } from 'lucide-react';

interface OfflineModeNoticeProps {
  className?: string;
}

export default function OfflineModeNotice({ className = '' }: OfflineModeNoticeProps) {
  return (
    <Alert className={`border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 ${className}`}>
      <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-500" />
      <AlertDescription className="text-amber-800 dark:text-amber-300">
        <strong>Offline Mode:</strong> You're working locally. Blueprints will be saved on this device. 
        Online publishing and sync will be available when the connection is restored.
      </AlertDescription>
    </Alert>
  );
}
