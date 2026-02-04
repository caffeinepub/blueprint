import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, ShoppingBag } from 'lucide-react';
import SignInPrompt from '../components/SignInPrompt';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useNavigate } from '@tanstack/react-router';

export default function MyBlueprintsPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);

  const isAuthenticated = !!identity;

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <img 
              src="/assets/generated/blueprints-icon-transparent.dim_24x24.png" 
              alt="Blueprint" 
              className="h-12 w-12 mx-auto mb-4 opacity-50"
            />
            <h2 className="text-2xl font-bold mb-2">Sign in to View Your Blueprints</h2>
            <p className="text-muted-foreground mb-6">
              Access your created blueprints and purchased plans
            </p>
            <Button onClick={() => setShowSignInPrompt(true)}>
              Sign In
            </Button>
          </CardContent>
        </Card>
        <SignInPrompt
          open={showSignInPrompt}
          onOpenChange={setShowSignInPrompt}
          action="view your blueprints"
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Tabs defaultValue="created" className="w-full">
        <TabsList className="w-full grid grid-cols-2 mb-6">
          <TabsTrigger value="created">
            <FileText className="h-4 w-4 mr-2" />
            My Creations
          </TabsTrigger>
          <TabsTrigger value="purchased">
            <ShoppingBag className="h-4 w-4 mr-2" />
            Purchased
          </TabsTrigger>
        </TabsList>

        <TabsContent value="created">
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                You haven't created any blueprints yet
              </p>
              <Button onClick={() => navigate({ to: '/studio' })}>
                Create Your First Blueprint
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchased">
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                You haven't purchased any blueprints yet
              </p>
              <Button onClick={() => navigate({ to: '/marketplace' })} variant="outline">
                Browse Marketplace
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
