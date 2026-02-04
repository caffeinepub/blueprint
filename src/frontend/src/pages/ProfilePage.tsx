import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useGetUserProfile, useFollowUser, useUnfollowUser } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Principal } from '@dfinity/principal';
import { toast } from 'sonner';
import SignInPrompt from '../components/SignInPrompt';

export default function ProfilePage() {
  const { userId } = useParams({ strict: false });
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const isAuthenticated = !!identity;
  const userPrincipal = userId ? Principal.fromText(userId) : (isAuthenticated ? identity!.getPrincipal() : null);

  const { data: profile, isLoading } = useGetUserProfile(userPrincipal);
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();

  const isOwnProfile = isAuthenticated && userPrincipal?.toString() === identity!.getPrincipal().toString();

  const handleFollow = async () => {
    if (!isAuthenticated) {
      setShowSignInPrompt(true);
      return;
    }

    if (!userPrincipal) return;

    try {
      if (isFollowing) {
        await unfollowUser.mutateAsync(userPrincipal);
        setIsFollowing(false);
        toast.success('Unfollowed user');
      } else {
        await followUser.mutateAsync(userPrincipal);
        setIsFollowing(true);
        toast.success('Following user');
      }
    } catch (error) {
      toast.error('Failed to update follow status');
    }
  };

  if (!isAuthenticated && !userId) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <p className="text-muted-foreground mb-4">
              Sign in to view your profile
            </p>
            <Button onClick={() => setShowSignInPrompt(true)}>
              Sign In
            </Button>
          </CardContent>
        </Card>
        <SignInPrompt
          open={showSignInPrompt}
          onOpenChange={setShowSignInPrompt}
          action="view your profile"
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading profile...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <p className="text-muted-foreground mb-4">Profile not found</p>
            <Button onClick={() => navigate({ to: '/' })}>
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {userId && (
        <Button variant="ghost" onClick={() => navigate({ to: '/' })}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      )}

      <Card>
        <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 rounded-t-lg overflow-hidden">
          {profile.banner && (
            <img 
              src={profile.banner.getDirectURL()} 
              alt="Profile banner"
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4 -mt-16 mb-4">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center border-4 border-background overflow-hidden">
              {profile.avatar ? (
                <img 
                  src={profile.avatar.getDirectURL()} 
                  alt={profile.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-3xl">
                  {profile.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1" />
            {!isOwnProfile && (
              <Button 
                onClick={handleFollow}
                variant={isFollowing ? 'outline' : 'default'}
                disabled={followUser.isPending || unfollowUser.isPending}
              >
                {(followUser.isPending || unfollowUser.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {isFollowing ? 'Unfollow' : 'Follow'}
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold">{profile.username}</h1>
              <p className="text-muted-foreground">{profile.bio}</p>
            </div>

            <div className="flex gap-6">
              <div>
                <span className="font-bold">{Number(profile.followers)}</span>
                <span className="text-muted-foreground ml-1">Followers</span>
              </div>
              <div>
                <span className="font-bold">{Number(profile.following)}</span>
                <span className="text-muted-foreground ml-1">Following</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 text-center py-12">
          <p className="text-muted-foreground">
            Posts and blueprints will appear here
          </p>
        </CardContent>
      </Card>

      <SignInPrompt
        open={showSignInPrompt}
        onOpenChange={setShowSignInPrompt}
        action="follow users"
      />
    </div>
  );
}
