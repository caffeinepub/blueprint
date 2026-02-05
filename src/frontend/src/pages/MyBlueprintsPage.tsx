import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FileText, ShoppingBag, Loader2 } from 'lucide-react';
import SignInPrompt from '../components/SignInPrompt';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useNavigate } from '@tanstack/react-router';
import { useGetCreatedBlueprints, useGetMarketplaceBlueprints, useGetOwnedBlueprints } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import OfflineModeNotice from '../components/OfflineModeNotice';

export default function MyBlueprintsPage() {
  const { identity } = useInternetIdentity();
  const { actor } = useActor();
  const navigate = useNavigate();
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);

  const isAuthenticated = !!identity;
  const isBackendReady = !!actor;

  const { data: createdBlueprintIds = [], isLoading: loadingCreated } = useGetCreatedBlueprints();
  const { data: allMarketplaceBlueprints = [], isLoading: loadingMarketplace } = useGetMarketplaceBlueprints();
  const { data: ownedRecords = [], isLoading: loadingOwned } = useGetOwnedBlueprints();

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

  // Filter marketplace blueprints to only show created ones
  const createdBlueprints = allMarketplaceBlueprints.filter(bp => 
    createdBlueprintIds.includes(bp.id)
  );

  // Get owned blueprint IDs from ownership records
  const ownedBlueprintIds = ownedRecords.map(record => record.blueprintId);

  // Filter marketplace blueprints to show purchased ones (excluding created ones)
  const purchasedBlueprints = allMarketplaceBlueprints.filter(bp => 
    ownedBlueprintIds.includes(bp.id) && !createdBlueprintIds.includes(bp.id)
  );

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Offline Mode Notice */}
      {!isBackendReady && (
        <OfflineModeNotice />
      )}

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
          {loadingCreated || loadingMarketplace ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Loader2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-spin" />
                <p className="text-muted-foreground">Loading your blueprints...</p>
              </CardContent>
            </Card>
          ) : createdBlueprints.length === 0 ? (
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
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {createdBlueprints.map((blueprint) => (
                <Card 
                  key={blueprint.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate({ to: `/marketplace/${blueprint.id}` })}
                >
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-2 flex items-center gap-2">
                      {blueprint.description}
                      {blueprint.id.startsWith('local-blueprint-') && (
                        <Badge variant="outline" className="text-xs">Local</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      {blueprint.isFree ? (
                        <Badge variant="secondary">Free</Badge>
                      ) : (
                        <Badge variant="default">
                          ${(Number(blueprint.price) / 100).toFixed(2)}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(Number(blueprint.createdAt) / 1000000).toLocaleDateString()}
                      </span>
                    </div>
                    {blueprint.tags && blueprint.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {blueprint.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {blueprint.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{blueprint.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="purchased">
          {loadingOwned || loadingMarketplace ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Loader2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-spin" />
                <p className="text-muted-foreground">Loading purchased blueprints...</p>
              </CardContent>
            </Card>
          ) : !isBackendReady ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  Connect to view your purchased blueprints
                </p>
                <p className="text-sm text-muted-foreground">
                  Your purchases are stored on the network and will appear when you're back online.
                </p>
              </CardContent>
            </Card>
          ) : purchasedBlueprints.length === 0 ? (
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
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {purchasedBlueprints.map((blueprint) => (
                <Card 
                  key={blueprint.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate({ to: `/marketplace/${blueprint.id}` })}
                >
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-2">
                      {blueprint.description}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      {blueprint.isFree ? (
                        <Badge variant="secondary">Free</Badge>
                      ) : (
                        <Badge variant="default">
                          ${(Number(blueprint.price) / 100).toFixed(2)}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        Purchased
                      </span>
                    </div>
                    {blueprint.tags && blueprint.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {blueprint.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {blueprint.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{blueprint.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
