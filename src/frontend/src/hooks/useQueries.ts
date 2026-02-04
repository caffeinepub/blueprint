import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { UserProfile, Post, Comment, MarketplaceBlueprint, Review } from '../types';
import { Principal } from '@dfinity/principal';
import { isDemoModeEnabled, demoPosts, demoBlueprints, demoComments, demoReviews } from '../lib/demoData';
import { toast } from 'sonner';
import { ExternalBlob } from '../backend';

// Helper function to check if backend is ready
function checkBackendReady(actor: any, identity: any, requireAuth: boolean = false): void {
  if (!actor) {
    throw new Error('BACKEND_NOT_READY');
  }
  if (requireAuth && !identity) {
    throw new Error('AUTHENTICATION_REQUIRED');
  }
}

// User Profile Hooks
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const isConnected = !!actor;

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      checkBackendReady(actor, null, false);
      const actorAny = actor as any;
      if (typeof actorAny.getCallerUserProfile !== 'function') {
        return null;
      }
      return actorAny.getCallerUserProfile();
    },
    enabled: isConnected && !actorFetching,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 10000),
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: isConnected && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      checkBackendReady(actor, null, false);
      const actorAny = actor as any;
      if (typeof actorAny.saveCallerUserProfile !== 'function') {
        throw new Error('Profile save functionality not yet available');
      }
      return actorAny.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
    retry: 2,
  });
}

export function useGetUserProfile(userPrincipal: Principal | null) {
  const { actor, isFetching } = useActor();
  const isConnected = !!actor;

  return useQuery<UserProfile | null>({
    queryKey: ['userProfile', userPrincipal?.toString()],
    queryFn: async () => {
      if (!userPrincipal) return null;
      checkBackendReady(actor, null, false);
      const actorAny = actor as any;
      if (typeof actorAny.getUserProfile !== 'function') return null;
      return actorAny.getUserProfile(userPrincipal);
    },
    enabled: isConnected && !isFetching && !!userPrincipal,
    retry: 3,
  });
}

// Post Hooks with Demo Data Support
export function useGetPosts(startIndex: number = 0, count: number = 20) {
  const { actor, isFetching } = useActor();
  const isConnected = !!actor;

  return useQuery<Post[]>({
    queryKey: ['posts', startIndex, count],
    queryFn: async () => {
      // Return demo posts in demo mode or when actor is not available
      if (isDemoModeEnabled() || !isConnected) {
        return demoPosts;
      }
      
      try {
        const actorAny = actor as any;
        if (typeof actorAny.getPosts !== 'function') {
          return demoPosts;
        }
        
        // Try to get real posts from backend
        const realPosts = await actorAny.getPosts();
        
        // If no real posts exist, return demo posts
        if (realPosts.length === 0) {
          return demoPosts;
        }
        
        return realPosts;
      } catch (error) {
        // If backend method doesn't exist, return demo posts
        console.log('Backend getPosts not available, using demo data');
        return demoPosts;
      }
    },
    enabled: true, // Always enabled to show demo data
    retry: 3,
  });
}

export function useCreatePost() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ content, image, attachedBlueprintId }: { 
      content: string; 
      image?: any; 
      attachedBlueprintId?: string 
    }) => {
      checkBackendReady(actor, identity, true);
      
      const actorAny = actor as any;
      
      // Check if backend method exists
      if (typeof actorAny.createPost !== 'function') {
        throw new Error('Post creation is not yet available. This feature is coming soon!');
      }
      
      return actorAny.createPost({
        id: `post-${Date.now()}`,
        author: identity?.getPrincipal().toString() || 'anonymous',
        content,
        image: image || null,
        attachedBlueprintId: attachedBlueprintId || null,
        createdAt: BigInt(Date.now() * 1000000),
        likes: BigInt(0),
        comments: BigInt(0),
        likedBy: [],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    retry: 1,
  });
}

export function useLikePost() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      checkBackendReady(actor, identity, true);
      const actorAny = actor as any;
      if (typeof actorAny.likePost !== 'function') {
        throw new Error('Like functionality coming soon!');
      }
      return actorAny.likePost(postId);
    },
    onMutate: async (postId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['posts'] });

      // Snapshot the previous value
      const previousPosts = queryClient.getQueryData<Post[]>(['posts', 0, 20]);

      // Optimistically update to the new value
      if (previousPosts && identity) {
        const userPrincipal = identity.getPrincipal();
        
        queryClient.setQueryData<Post[]>(['posts', 0, 20], (old) => {
          if (!old) return old;
          
          return old.map((post) => {
            if (post.id === postId) {
              const alreadyLiked = post.likedBy.some(
                (principal) => principal.toString() === userPrincipal.toString()
              );
              
              if (alreadyLiked) {
                // Unlike
                return {
                  ...post,
                  likes: post.likes > 0n ? post.likes - 1n : 0n,
                  likedBy: post.likedBy.filter(
                    (principal) => principal.toString() !== userPrincipal.toString()
                  ),
                };
              } else {
                // Like
                return {
                  ...post,
                  likes: post.likes + 1n,
                  likedBy: [...post.likedBy, userPrincipal],
                };
              }
            }
            return post;
          });
        });
      }

      // Return a context object with the snapshotted value
      return { previousPosts };
    },
    onError: (error: any, postId, context) => {
      // Roll back to the previous value on error
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts', 0, 20], context.previousPosts);
      }
      
      // Show error toast
      if (error.message === 'BACKEND_NOT_READY') {
        toast.error('Reconnecting to Blueprint Engine... Please try again in a moment.');
      } else if (error.message === 'AUTHENTICATION_REQUIRED') {
        toast.error('Please sign in to like posts');
      } else {
        toast.error(error.message || 'Failed to like post');
      }
    },
    onSuccess: () => {
      // Invalidate and refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    retry: 1,
  });
}

export function useAddComment() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      checkBackendReady(actor, identity, true);
      const actorAny = actor as any;
      if (typeof actorAny.addComment !== 'function') {
        throw new Error('Comment functionality coming soon!');
      }
      
      const comment = {
        author: identity?.getPrincipal().toString() || 'anonymous',
        content,
        createdAt: BigInt(Date.now() * 1000000),
      };
      
      return actorAny.addComment(postId, comment);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] });
    },
    retry: 1,
  });
}

export function useGetComments(postId: string | null) {
  const { actor, isFetching } = useActor();
  const isConnected = !!actor;

  return useQuery<Comment[]>({
    queryKey: ['comments', postId],
    queryFn: async () => {
      if (!postId) return [];
      
      // Return demo comments if available
      if (isDemoModeEnabled() || !isConnected) {
        return demoComments[postId] || [];
      }
      
      try {
        const actorAny = actor as any;
        if (typeof actorAny.getComments !== 'function') {
          return demoComments[postId] || [];
        }
        
        const realComments = await actorAny.getComments(postId);
        
        // If no real comments exist, return demo comments
        if (realComments.length === 0 && demoComments[postId]) {
          return demoComments[postId];
        }
        
        return realComments;
      } catch (error) {
        // If backend method doesn't exist, return demo comments
        return demoComments[postId] || [];
      }
    },
    enabled: !!postId,
    retry: 3,
  });
}

// Follow Hooks
export function useFollowUser() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userToFollow: Principal) => {
      checkBackendReady(actor, identity, true);
      const actorAny = actor as any;
      if (typeof actorAny.followUser !== 'function') {
        throw new Error('Follow functionality coming soon!');
      }
      return actorAny.followUser(userToFollow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
    retry: 1,
  });
}

export function useUnfollowUser() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userToUnfollow: Principal) => {
      checkBackendReady(actor, identity, true);
      const actorAny = actor as any;
      if (typeof actorAny.unfollowUser !== 'function') {
        throw new Error('Unfollow functionality coming soon!');
      }
      return actorAny.unfollowUser(userToUnfollow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
    retry: 1,
  });
}

// Marketplace Hooks with Demo Data Support
export function useGetMarketplaceBlueprints() {
  const { actor, isFetching } = useActor();
  const isConnected = !!actor;

  return useQuery<MarketplaceBlueprint[]>({
    queryKey: ['marketplaceBlueprints'],
    queryFn: async () => {
      // Return demo blueprints in demo mode or when actor is not available
      if (isDemoModeEnabled() || !isConnected) {
        return demoBlueprints;
      }
      
      try {
        const actorAny = actor as any;
        if (typeof actorAny.getMarketplaceBlueprints !== 'function') {
          return demoBlueprints;
        }
        
        const realBlueprints = await actorAny.getMarketplaceBlueprints();
        
        // If no real blueprints exist, return demo blueprints
        if (realBlueprints.length === 0) {
          return demoBlueprints;
        }
        
        return realBlueprints;
      } catch (error) {
        // If backend method doesn't exist, return demo blueprints
        return demoBlueprints;
      }
    },
    enabled: true, // Always enabled to show demo data
    retry: 3,
  });
}

export function usePurchaseBlueprint() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blueprintId: string) => {
      checkBackendReady(actor, identity, true);
      const actorAny = actor as any;
      if (typeof actorAny.purchaseBlueprint !== 'function') {
        throw new Error('Purchase functionality coming soon!');
      }
      return actorAny.purchaseBlueprint(blueprintId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blueprintOwnership'] });
      queryClient.invalidateQueries({ queryKey: ['ownedBlueprints'] });
      toast.success('Blueprint purchased successfully!', {
        description: 'You can now access this blueprint in your collection.',
      });
    },
    retry: 1,
  });
}

export function useCheckBlueprintOwnership(userPrincipal: Principal | null, blueprintId: string | null) {
  const { actor, isFetching } = useActor();
  const isConnected = !!actor;

  return useQuery<boolean>({
    queryKey: ['blueprintOwnership', userPrincipal?.toString(), blueprintId],
    queryFn: async () => {
      if (!userPrincipal || !blueprintId) return false;
      
      checkBackendReady(actor, null, false);
      const actorAny = actor as any;
      if (typeof actorAny.checkBlueprintOwnership !== 'function') return false;
      return actorAny.checkBlueprintOwnership(userPrincipal, blueprintId);
    },
    enabled: isConnected && !isFetching && !!userPrincipal && !!blueprintId,
    retry: 3,
  });
}

// Review Hooks with Demo Data Support
export function useSubmitReview() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ blueprintId, rating, comment }: { 
      blueprintId: string; 
      rating: number; 
      comment: string 
    }) => {
      checkBackendReady(actor, identity, true);
      const actorAny = actor as any;
      if (typeof actorAny.addReview !== 'function') {
        throw new Error('Review functionality coming soon!');
      }
      
      const review = {
        author: identity?.getPrincipal().toString() || 'anonymous',
        rating: BigInt(rating),
        comment,
        timestamp: BigInt(Date.now() * 1000000),
      };
      
      return actorAny.addReview(blueprintId, review);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.blueprintId] });
      toast.success('Review submitted successfully!');
    },
    retry: 1,
  });
}

export function useGetReviews(blueprintId: string | null) {
  const { actor, isFetching } = useActor();
  const isConnected = !!actor;

  return useQuery<Review[]>({
    queryKey: ['reviews', blueprintId],
    queryFn: async () => {
      if (!blueprintId) return [];
      
      // Return demo reviews if available
      if (isDemoModeEnabled() || !isConnected) {
        return demoReviews[blueprintId] || [];
      }
      
      try {
        const actorAny = actor as any;
        if (typeof actorAny.getReviews !== 'function') {
          return demoReviews[blueprintId] || [];
        }
        
        const realReviews = await actorAny.getReviews(blueprintId);
        
        // If no real reviews exist, return demo reviews
        if (realReviews.length === 0 && demoReviews[blueprintId]) {
          return demoReviews[blueprintId];
        }
        
        return realReviews;
      } catch (error) {
        // If backend method doesn't exist, return demo reviews
        return demoReviews[blueprintId] || [];
      }
    },
    enabled: !!blueprintId,
    retry: 3,
  });
}

// Step-Based Blueprint Hook
export function useCreateStepBasedBlueprint() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      title, 
      description, 
      steps, 
      price, 
      isFree, 
      image, 
      bannerImage, 
      theme,
      tags
    }: { 
      title: string; 
      description: string; 
      steps: Array<{ id: string; name: string; blocks: any[]; isOpen: boolean }>; 
      price: bigint; 
      isFree: boolean; 
      image?: File;
      bannerImage?: File;
      theme?: {
        name: string;
        primaryColor: string;
        secondaryColor: string;
        accentColor: string;
      };
      tags: string[];
    }) => {
      checkBackendReady(actor, identity, true);
      const actorAny = actor as any;
      if (typeof actorAny.createProjectBlueprint !== 'function') {
        throw new Error('Blueprint creation coming soon!');
      }
      
      // Convert steps to the format expected by backend
      const stepsView = steps.map((step, index) => ({
        id: step.id,
        name: step.name,
        order: BigInt(index),
        blocks: step.blocks.map((block, blockIndex) => ({
          id: block.id,
          blockType: block.type,
          content: block.content || '',
          options: block.options || [],
          order: BigInt(blockIndex),
        })),
      }));
      
      const blueprintId = `blueprint-${Date.now()}`;
      
      const blueprintView = {
        id: blueprintId,
        title,
        steps: stepsView,
        createdBy: identity?.getPrincipal() || Principal.anonymous(),
      };
      
      await actorAny.createProjectBlueprint(blueprintView);
      
      // Create marketplace blueprint
      if (typeof actorAny.createMarketplaceBlueprint === 'function') {
        let imageBlob: ExternalBlob | undefined = undefined;
        if (image) {
          const imageBytes = new Uint8Array(await image.arrayBuffer());
          imageBlob = ExternalBlob.fromBytes(imageBytes);
        }
        
        let bannerImageBlob: ExternalBlob | undefined = undefined;
        if (bannerImage) {
          const bannerBytes = new Uint8Array(await bannerImage.arrayBuffer());
          bannerImageBlob = ExternalBlob.fromBytes(bannerBytes);
        }
        
        const marketplaceBlueprint: MarketplaceBlueprint = {
          id: blueprintId,
          description,
          creator: identity?.getPrincipal() || Principal.anonymous(),
          price,
          isFree,
          createdAt: BigInt(Date.now() * 1000000),
          image: imageBlob,
          theme: {
            primaryColor: theme?.primaryColor || '#007AFF',
            secondaryColor: theme?.secondaryColor || '#4A90E2',
            accentColor: theme?.accentColor || '#376BB2',
            bannerImage: bannerImageBlob,
          },
          tags,
        };
        
        await actorAny.createMarketplaceBlueprint(marketplaceBlueprint);
      }
      
      return blueprintId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectBlueprints'] });
      queryClient.invalidateQueries({ queryKey: ['marketplaceBlueprints'] });
      toast.success('Blueprint created successfully!', {
        description: 'Your blueprint has been added to the marketplace.',
      });
    },
    retry: 1,
  });
}

export function useGetProjectBlueprints() {
  const { actor, isFetching } = useActor();
  const isConnected = !!actor;

  return useQuery({
    queryKey: ['projectBlueprints'],
    queryFn: async () => {
      if (!isConnected) return [];
      try {
        const actorAny = actor as any;
        if (typeof actorAny.getProjectBlueprints !== 'function') return [];
        return await actorAny.getProjectBlueprints();
      } catch (error) {
        return [];
      }
    },
    enabled: isConnected && !isFetching,
    retry: 3,
  });
}

export function useGetProjectBlueprint(blueprintId: string | undefined) {
  const { actor, isFetching } = useActor();
  const isConnected = !!actor;

  return useQuery({
    queryKey: ['projectBlueprint', blueprintId],
    queryFn: async () => {
      if (!blueprintId) return null;
      checkBackendReady(actor, null, false);
      try {
        const actorAny = actor as any;
        if (typeof actorAny.getProjectBlueprint !== 'function') return null;
        return await actorAny.getProjectBlueprint(blueprintId);
      } catch (error) {
        return null;
      }
    },
    enabled: isConnected && !isFetching && !!blueprintId,
    retry: 3,
  });
}
