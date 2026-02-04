import { useState } from 'react';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileSetupModalProps {
  open: boolean;
}

export default function ProfileSetupModal({ open }: ProfileSetupModalProps) {
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const saveProfile = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (username.trim().length < 3) {
      toast.error('Username must be at least 3 characters long');
      return;
    }

    try {
      await saveProfile.mutateAsync({
        username: username.trim(),
        bio: bio.trim(),
        followers: BigInt(0),
        following: BigInt(0),
        hasCompletedSetup: true,
        completedTasks: [],
      });

      toast.success('Profile created successfully!', {
        description: 'Welcome to Blueprint! Start exploring weight loss plans.',
      });
    } catch (error: any) {
      toast.error('Failed to create profile', {
        description: error.message || 'Please try again',
      });
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Create Your Profile</DialogTitle>
          <DialogDescription>
            Welcome! Let's set up your profile to get started with your weight loss journey.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              minLength={3}
              required
              disabled={saveProfile.isPending}
            />
            <p className="text-xs text-muted-foreground">
              Minimum 3 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio (Optional)</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself and your fitness goals..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              disabled={saveProfile.isPending}
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              {bio.length}/500 characters
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={saveProfile.isPending || username.trim().length < 3}
          >
            {saveProfile.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Profile...
              </>
            ) : (
              'Create Profile'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
