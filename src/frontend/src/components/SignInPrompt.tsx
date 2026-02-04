import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { LogIn, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface SignInPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action?: string;
}

export default function SignInPrompt({ open, onOpenChange, action = 'perform this action' }: SignInPromptProps) {
  const { login, loginStatus } = useInternetIdentity();

  const handleLogin = async () => {
    try {
      await login();
      onOpenChange(false);
      toast.success('Sign in successful!', {
        description: 'Welcome to Blueprint. You can now access all features.',
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.message?.includes('User is already authenticated')) {
        toast.error('Already signed in', {
          description: 'You are already authenticated. Please refresh the page.',
        });
      } else if (error.message?.includes('User interrupted')) {
        toast.info('Sign in cancelled', {
          description: 'You cancelled the sign in process.',
        });
      } else {
        toast.error('Sign in failed', {
          description: error.message || 'Please try again or check your Internet Identity.',
        });
      }
      onOpenChange(false);
    }
  };

  const isLoggingIn = loginStatus === 'logging-in';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Welcome to Blueprint
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            Sign in to {action} and unlock your weight loss journey
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 space-y-4">
          <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-5 space-y-3">
            <h4 className="font-semibold text-base flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                ✓
              </span>
              What you'll get:
            </h4>
            <ul className="text-sm space-y-2 ml-8">
              <li className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-primary flex-shrink-0" />
                <span>Create and share posts with the community</span>
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-primary flex-shrink-0" />
                <span>Build custom weight loss blueprints</span>
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-primary flex-shrink-0" />
                <span>Purchase and access premium blueprints</span>
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-primary flex-shrink-0" />
                <span>Connect with others on similar journeys</span>
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-primary flex-shrink-0" />
                <span>Track your progress and achievements</span>
              </li>
            </ul>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoggingIn}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full sm:w-auto order-1 sm:order-2 bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/95 hover:via-primary/90 hover:to-primary/85 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 h-11"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Signing In...
              </>
            ) : (
              <>
                Continue with Internet Identity
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
