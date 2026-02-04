import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import Header from '../components/Header';
import TabNavigation from '../components/TabNavigation';
import ProfileSetupModal from '../components/ProfileSetupModal';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, UserPlus, MessageCircle, Mail } from 'lucide-react';

// Mock notifications data - in a real app, this would come from the backend
const mockNotifications = [
  {
    id: '1',
    type: 'like',
    user: 'JohnDoe',
    content: 'liked your post',
    timestamp: Date.now() - 3600000,
    read: false,
  },
  {
    id: '2',
    type: 'follow',
    user: 'JaneSmith',
    content: 'started following you',
    timestamp: Date.now() - 7200000,
    read: false,
  },
  {
    id: '3',
    type: 'comment',
    user: 'MikeJohnson',
    content: 'commented on your post',
    timestamp: Date.now() - 10800000,
    read: true,
  },
  {
    id: '4',
    type: 'message',
    user: 'SarahWilliams',
    content: 'sent you a message',
    timestamp: Date.now() - 14400000,
    read: true,
  },
];

export default function NotificationsPage() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-5 w-5 text-destructive" />;
      case 'follow':
        return <UserPlus className="h-5 w-5 text-primary" />;
      case 'comment':
        return <MessageCircle className="h-5 w-5 text-primary" />;
      case 'message':
        return <Mail className="h-5 w-5 text-primary" />;
      default:
        return null;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <Header />
      <TabNavigation />
      <ProfileSetupModal open={showProfileSetup} />

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {!isAuthenticated ? (
          <Card className="mt-12">
            <CardContent className="py-12 text-center space-y-4">
              <h2 className="text-2xl font-bold">Please log in to view notifications</h2>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold mb-6">Notifications</h1>

            {mockNotifications.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No notifications yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {mockNotifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                      !notification.read ? 'bg-accent/20' : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src="/assets/generated/default-avatar.dim_200x200.png" />
                          <AvatarFallback>{notification.user[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-semibold">{notification.user}</span>{' '}
                            <span className="text-muted-foreground">{notification.content}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTimestamp(notification.timestamp)}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-border/40 mt-20">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            © 2025. Built with ❤️ using{' '}
            <a
              href="https://caffeine.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
