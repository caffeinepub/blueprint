import { useState, useMemo } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, ShoppingCart, Loader2, ArrowLeft } from 'lucide-react';
import { useGetMarketplaceBlueprints, usePurchaseBlueprint, useCheckBlueprintOwnership, useGetReviews, useSubmitReview } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';
import SignInPrompt from '../components/SignInPrompt';
import { getAverageRating } from '../lib/demoData';
import { isDemoBlueprint, hasUserPurchasedDemoBlueprint, addDemoPurchase } from '../lib/demoInteractions';
import type { MarketplaceBlueprint } from '../backend';

export default function BlueprintDetailsPage() {
  const { blueprintId } = useParams({ from: '/marketplace/$blueprintId' });
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [signInAction, setSignInAction] = useState('purchase blueprints');
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');

  const isAuthenticated = !!identity;
  const currentUserId = identity?.getPrincipal().toString() || 'guest';

  const { data: blueprints = [] } = useGetMarketplaceBlueprints();
  const blueprint = blueprints.find(bp => bp.id === blueprintId);
  
  const { data: isOwned = false } = useCheckBlueprintOwnership(
    identity?.getPrincipal() || null,
    blueprintId || null
  );
  
  // Check if user owns this demo blueprint
  const isDemoOwned = blueprintId && isDemoBlueprint(blueprintId) 
    ? hasUserPurchasedDemoBlueprint(blueprintId, currentUserId)
    : false;
  
  const actuallyOwned = isOwned || isDemoOwned;
  
  const { data: reviews = [] } = useGetReviews(blueprintId || null);
  const purchaseBlueprint = usePurchaseBlueprint();
  const submitReview = useSubmitReview();

  const handlePurchase = async () => {
    if (!blueprint) return;

    // Check if this is a demo blueprint
    if (isDemoBlueprint(blueprint.id)) {
      // Handle demo purchase locally
      if (hasUserPurchasedDemoBlueprint(blueprint.id, currentUserId)) {
        toast.error('You already own this blueprint', {
          description: 'Demo interaction saved for this session',
        });
        return;
      }
      
      addDemoPurchase(blueprint.id, currentUserId);
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
      await purchaseBlueprint.mutateAsync(blueprint.id);
      toast.success(blueprint.isFree ? 'Blueprint acquired successfully!' : 'Blueprint purchased successfully!');
    } catch (error: any) {
      if (error.message?.includes('already owned')) {
        toast.error('You already own this blueprint');
      } else {
        toast.error('Failed to purchase blueprint');
      }
    }
  };

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      setSignInAction('submit reviews');
      setShowSignInPrompt(true);
      return;
    }

    if (!actuallyOwned) {
      toast.error('You must own this blueprint to leave a review');
      return;
    }

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!reviewComment.trim()) {
      toast.error('Please write a comment');
      return;
    }

    try {
      await submitReview.mutateAsync({
        blueprintId: blueprint!.id,
        rating,
        comment: reviewComment,
      });
      setRating(0);
      setReviewComment('');
      toast.success('Review submitted successfully!');
    } catch (error) {
      toast.error('Failed to submit review');
    }
  };

  // Calculate average rating
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return getAverageRating(blueprintId || '');
    const sum = reviews.reduce((acc, review) => acc + Number(review.rating), 0);
    return sum / reviews.length;
  }, [reviews, blueprintId]);

  if (!blueprint) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <p className="text-muted-foreground mb-4">Blueprint not found</p>
            <Button onClick={() => navigate({ to: '/marketplace' })}>
              Back to Marketplace
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get theme colors from blueprint - safely access theme property
  const blueprintTheme = (blueprint as MarketplaceBlueprint).theme;
  const theme = blueprintTheme || {
    primaryColor: '#007AFF',
    secondaryColor: '#4A90E2',
    accentColor: '#376BB2',
    bannerImage: undefined,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate({ to: '/marketplace' })}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Marketplace
      </Button>

      <Card>
        <CardHeader>
          {/* Custom Banner or Image */}
          <div 
            className="aspect-video rounded-lg mb-4 flex items-center justify-center overflow-hidden"
            style={{
              background: theme.bannerImage 
                ? 'transparent'
                : `linear-gradient(135deg, ${theme.primaryColor}30, ${theme.secondaryColor}30)`,
            }}
          >
            {theme.bannerImage ? (
              <img 
                src={theme.bannerImage.getDirectURL()} 
                alt="Blueprint Banner"
                className="w-full h-full object-cover"
              />
            ) : blueprint.image ? (
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
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{blueprint.id}</CardTitle>
              {averageRating > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-5 w-5 ${
                          star <= averageRating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {averageRating.toFixed(1)} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              )}
            </div>
            <div className="text-right">
              <p 
                className="text-3xl font-bold mb-2"
                style={{ color: theme.primaryColor }}
              >
                {blueprint.isFree ? 'Free' : `$${(Number(blueprint.price) / 100).toFixed(2)}`}
              </p>
              {actuallyOwned ? (
                <Button disabled>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Owned
                </Button>
              ) : (
                <Button 
                  onClick={handlePurchase}
                  disabled={purchaseBlueprint.isPending}
                  style={{ 
                    backgroundColor: theme.primaryColor,
                    color: 'white',
                  }}
                  className="hover:opacity-90"
                >
                  {purchaseBlueprint.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ShoppingCart className="h-4 w-4 mr-2" />
                  )}
                  {blueprint.isFree ? 'Get Blueprint' : 'Buy Blueprint'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div 
            className="p-4 rounded-lg"
            style={{
              background: `linear-gradient(135deg, ${theme.primaryColor}10, ${theme.secondaryColor}10)`,
              borderLeft: `4px solid ${theme.primaryColor}`,
            }}
          >
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground">{blueprint.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Write a Review Section */}
      {isAuthenticated && actuallyOwned && (
        <Card>
          <CardHeader>
            <CardTitle>Write a Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Your Rating</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Your Review</label>
              <Textarea
                placeholder="Share your experience with this blueprint..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <Button 
              onClick={handleSubmitReview}
              disabled={submitReview.isPending || rating === 0 || !reviewComment.trim()}
              style={{ 
                backgroundColor: theme.primaryColor,
                color: 'white',
              }}
              className="hover:opacity-90"
            >
              {submitReview.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Review
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Reviews Section */}
      <Card>
        <CardHeader>
          <CardTitle>Reviews ({reviews.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No reviews yet. Be the first to review this blueprint!
            </p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review, index) => (
                <div key={index} className="border-b last:border-b-0 pb-4 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">{review.author}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= Number(review.rating)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(Number(review.timestamp) / 1000000).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <SignInPrompt
        open={showSignInPrompt}
        onOpenChange={setShowSignInPrompt}
        action={signInAction}
      />
    </div>
  );
}
