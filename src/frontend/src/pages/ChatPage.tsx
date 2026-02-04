import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Users } from 'lucide-react';
import SignInPrompt from '../components/SignInPrompt';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

export default function ChatPage() {
  const { identity } = useInternetIdentity();
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);

  const isAuthenticated = !!identity;

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Sign in to Chat</h2>
            <p className="text-muted-foreground mb-6">
              Connect with others on their weight loss journey through direct messages and group chats
            </p>
            <Button onClick={() => setShowSignInPrompt(true)}>
              Sign In
            </Button>
          </CardContent>
        </Card>
        <SignInPrompt
          open={showSignInPrompt}
          onOpenChange={setShowSignInPrompt}
          action="access chat features"
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Tabs defaultValue="direct" className="w-full">
        <TabsList className="w-full grid grid-cols-2 mb-6">
          <TabsTrigger value="direct">
            <MessageSquare className="h-4 w-4 mr-2" />
            Direct Messages
          </TabsTrigger>
          <TabsTrigger value="groups">
            <Users className="h-4 w-4 mr-2" />
            Group Chats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="direct">
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                No conversations yet. Start chatting with other users!
              </p>
              <Button variant="outline">Find People to Chat With</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups">
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                You haven't joined any group chats yet
              </p>
              <Button variant="outline">Browse Group Chats</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
