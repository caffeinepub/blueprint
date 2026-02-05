import { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Star, ShoppingCart, Loader2 } from 'lucide-react';
import { useGetMarketplaceBlueprints, usePurchaseBlueprint, useGetReviews } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useActor } from '../hooks/useActor';
import { toast } from 'sonner';
import SignInPrompt from '../components/SignInPrompt';
import OfflineModeNotice from '../components/OfflineModeNotice';
import { getAverageRating } from '../lib/demoData';
import { isDemoBlueprint, hasUserPurchasedDemoBlueprint, addDemoPurchase } from '../lib/demoInteractions';

export default function MarketplacePage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { actor } = useActor();
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [signInAction, setSignInAction] = useState('purchase blueprints');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');

  const isAuthenticated = !!identity;
  const isBackendReady = !!actor;
  const currentUserId = identity?.getPrincipal().toString() || 'guest';

  const { data: blueprints = [], isLoading } = useGetMarketplaceBlueprints();
  const purchaseBlueprint = usePurchaseBlueprint();

  const handlePurchase = async (blueprintId: string, isFree: boolean) => {
    // Check if this is a demo blueprint
    if (isDemoBlueprint(blueprintId)) {
      // Handle demo purchase locally
      if (hasUserPurchasedDemoBlueprint(blueprintId, currentUserId)) {
        toast.error('You already own this blueprint', {
          description: 'Demo interaction saved for this session',
        });
        return;
      }
      
      addDemoPurchase(blueprintId, currentUserId);
      toast.success('Blueprint added to your library!', {
        description: 'Demo interaction saved for this session',
        duration: 3000,
      });
      return;
    }

    // Handle real blueprint purchase
    if (!isAuthenticated) {
      setSignInAction('purchase blueprints');
      setShowSignInPrompt(true);
      return;
    }

    try {
      await purchaseBlueprint.mutateAsync(blueprintId);
      toast.success(isFree ? 'Blueprint acquired successfully!' : 'Blueprint purchased successfully!');
    } catch (error: any) {
      if (error.message?.includes('already owned')) {
        toast.error('You already own this blueprint');
      } else {
        toast.error('Failed to purchase blueprint');
      }
    }
  };

  const handleViewDetails = (blueprintId: string) => {
    navigate({ to: `/marketplace/${blueprintId}` });
  };

  // Filter and sort blueprints
  const filteredAndSortedBlueprints = useMemo(() => {
    let result = [...blueprints];

    // Filter by search query (search in description, id, and tags)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(bp => 
        bp.description.toLowerCase().includes(query) ||
        bp.id.toLowerCase().includes(query) ||
        bp.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort
    switch (sortBy) {
      case 'recent':
        result.sort((a, b) => Number(b.createdAt - a.createdAt));
        break;
      case 'price-low':
        result.sort((a, b) => Number(a.price - b.price));
        break;
      case 'price-high':
        result.sort((a, b) => Number(b.price - a.price));
        break;
      case 'popular':
      default:
        // Keep default order
        break;
    }

    return result;
  }, [blueprints, searchQuery, sortBy]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Offline Mode Notice */}
      {!isBackendReady && (
        <OfflineModeNotice />
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold">Blueprint Marketplace</h1>
        <div className="flex gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search blueprints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading blueprints...</p>
          </CardContent>
        </Card>
      ) : filteredAndSortedBlueprints.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery ? 'No blueprints found matching your search' : 'No blueprints available yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedBlueprints.map((blueprint) => (
            <BlueprintCard
              key={blueprint.id}
              blueprint={blueprint}
              currentUserId={currentUserId}
              onPurchase={handlePurchase}
              onViewDetails={handleViewDetails}
              isPurchasing={purchaseBlueprint.isPending}
            />
          ))}
        </div>
      )}

      <SignInPrompt
        open={showSignInPrompt}
        onOpenChange={setShowSignInPrompt}
        action={signInAction}
      />
    </div>
  );
}

function BlueprintCard({ blueprint, currentUserId, onPurchase, onViewDetails, isPurchasing }: any) {
  const { data: reviews = [] } = useGetReviews(blueprint.id);
  
  // Check if user owns this demo blueprint
  const isDemoOwned = isDemoBlueprint(blueprint.id) && hasUserPurchasedDemoBlueprint(blueprint.id, currentUserId);
  
  // Check if this is a local blueprint
  const isLocal = blueprint.id.startsWith('local-blueprint-');
  
  // Calculate average rating
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return getAverageRating(blueprint.id);
    const sum = reviews.reduce((acc: number, review: any) => acc + Number(review.rating), 0);
    return sum / reviews.length;
  }, [reviews, blueprint.id]);

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onViewDetails(blueprint.id)}>
      <CardHeader>
        <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
          {blueprint.image ? (
            <img 
              src={blueprint.image.getDirectURL()} 
              alt={blueprint.id}
              className="w-full h-full object-cover"
            />
          ) : (
            <img 
              src="/assets/generated/blueprint-placeholder.dim_400x300.png" 
              alt={blueprint.id}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <CardTitle className="text-lg flex items-center gap-2">
          {blueprint.id}
          {isLocal && (
            <Badge variant="outline" className="text-xs">Local</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {blueprint.description}
        </p>
        
        {/* Tags Display */}
        {blueprint.tags && blueprint.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {blueprint.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {blueprint.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{blueprint.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
        
        {averageRating > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= averageRating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {averageRating.toFixed(1)} ({reviews.length})
            </span>
          </div>
        )}
        <div className="flex items-center justify-between pt-2 border-t">
          <div>
            <p className="text-lg font-bold text-primary">
              {blueprint.isFree ? 'Free' : `$${(Number(blueprint.price) / 100).toFixed(2)}`}
            </p>
          </div>
          {isDemoOwned ? (
            <Button size="sm" disabled>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Owned
            </Button>
          ) : (
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                onPurchase(blueprint.id, blueprint.isFree);
              }} 
              size="sm"
              disabled={isPurchasing}
            >
              {isPurchasing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {blueprint.isFree ? 'Get' : 'Buy'}
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
