import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { UserProfile, Post, Comment, MarketplaceBlueprint, Review } from '../types';
import { Principal } from '@dfinity/principal';
import { isDemoModeEnabled, demoPosts, demoBlueprints, demoComments, demoReviews } from '../lib/demoData';
import { toast } from 'sonner';
import { ExternalBlob, OwnershipRecord } from '../backend';
import { 
  saveLocalPublishedBlueprint, 
  getLocalPublishedBlueprints, 
  getLocalPublishedBlueprintIds,
  onLocalPublish 
} from '../lib/localPublishedBlueprints';
import { useEffect } from 'react';

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
      // Use demo posts when actor is not available
      if (!isConnected) {
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
      
      // Return demo comments if backend not available
      if (!isConnected) {
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

// Marketplace Hooks with Demo Data Support and Local Blueprints
export function useGetMarketplaceBlueprints() {
  const { actor, isFetching } = useActor();
  const isConnected = !!actor;
  const queryClient = useQueryClient();

  // Listen for local publish events and invalidate query
  useEffect(() => {
    const unsubscribe = onLocalPublish(() => {
      queryClient.invalidateQueries({ queryKey: ['marketplaceBlueprints'] });
    });
    return unsubscribe;
  }, [queryClient]);

  return useQuery<MarketplaceBlueprint[]>({
    queryKey: ['marketplaceBlueprints'],
    queryFn: async () => {
      // Get locally published blueprints
      const localBlueprints = getLocalPublishedBlueprints().map(item => item.blueprint);
      
      // Use demo + local blueprints when actor is not available
      if (!isConnected) {
        return [...demoBlueprints, ...localBlueprints];
      }
      
      try {
        const actorAny = actor as any;
        if (typeof actorAny.getMarketplaceBlueprints !== 'function') {
          return [...demoBlueprints, ...localBlueprints];
        }
        
        const realBlueprints = await actorAny.getMarketplaceBlueprints();
        
        // Merge real blueprints with local ones (dedupe by ID)
        const allBlueprints = [...realBlueprints];
        for (const localBp of localBlueprints) {
          if (!allBlueprints.find(bp => bp.id === localBp.id)) {
            allBlueprints.push(localBp);
          }
        }
        
        // If no real blueprints exist, include demo blueprints
        if (realBlueprints.length === 0) {
          return [...demoBlueprints, ...localBlueprints];
        }
        
        return allBlueprints;
      } catch (error) {
        // If backend method doesn't exist, return demo + local blueprints
        return [...demoBlueprints, ...localBlueprints];
      }
    },
    enabled: true, // Always enabled to show demo + local data
    retry: 3,
  });
}

export function useGetCreatedBlueprints() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isConnected = !!actor;
  const isAuthenticated = !!identity;
  const queryClient = useQueryClient();

  // Listen for local publish events and invalidate query
  useEffect(() => {
    const unsubscribe = onLocalPublish(() => {
      queryClient.invalidateQueries({ queryKey: ['createdBlueprints'] });
    });
    return unsubscribe;
  }, [queryClient]);

  return useQuery<string[]>({
    queryKey: ['createdBlueprints'],
    queryFn: async () => {
      // Always include local blueprint IDs
      const localIds = getLocalPublishedBlueprintIds();
      
      // If backend not available, return only local IDs
      if (!isConnected) {
        return localIds;
      }
      
      try {
        checkBackendReady(actor, identity, true);
        const actorAny = actor as any;
        if (typeof actorAny.getCreatedBlueprints !== 'function') {
          return localIds;
        }
        
        const backendIds = await actorAny.getCreatedBlueprints();
        
        // Merge backend and local IDs (dedupe)
        const allIds = [...new Set([...backendIds, ...localIds])];
        return allIds;
      } catch (error) {
        // Return local IDs if backend call fails
        return localIds;
      }
    },
    enabled: isAuthenticated, // Only fetch when authenticated
    retry: 3,
  });
}

export function useGetOwnedBlueprints() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isConnected = !!actor;
  const isAuthenticated = !!identity;

  return useQuery<OwnershipRecord[]>({
    queryKey: ['ownedBlueprints'],
    queryFn: async () => {
      // Return empty array when backend not available
      if (!isConnected) {
        return [];
      }
      
      try {
        checkBackendReady(actor, identity, true);
        const actorAny = actor as any;
        if (typeof actorAny.getOwnedBlueprints !== 'function') {
          return [];
        }
        
        return await actorAny.getOwnedBlueprints();
      } catch (error) {
        // Return empty array if backend call fails
        return [];
      }
    },
    enabled: isAuthenticated && isConnected && !isFetching,
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
      // Aggressively invalidate and refetch all ownership-related queries
      queryClient.invalidateQueries({ queryKey: ['blueprintOwnership'] });
      queryClient.invalidateQueries({ queryKey: ['ownedBlueprints'] });
      
      // Force immediate refetch of owned blueprints
      queryClient.refetchQueries({ queryKey: ['ownedBlueprints'] });
      
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
      
      // Return demo reviews if backend not available
      if (!isConnected) {
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

// Step-Based Blueprint Hook with Offline Support
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
      // Check if backend is ready
      const isBackendReady = !!actor;
      
      if (!isBackendReady) {
        // Offline mode: save locally
        const blueprintId = `local-blueprint-${Date.now()}`;
        
        // Create marketplace blueprint for local storage
        // IMPORTANT: Use description field correctly (not title)
        const marketplaceBlueprint: MarketplaceBlueprint = {
          id: blueprintId,
          description: description, // Use the description from publish step
          creator: identity?.getPrincipal() || Principal.anonymous(),
          price,
          isFree,
          createdAt: BigInt(Date.now() * 1000000),
          image: undefined, // Note: File objects can't be stored in localStorage
          theme: {
            primaryColor: theme?.primaryColor || '#007AFF',
            secondaryColor: theme?.secondaryColor || '#4A90E2',
            accentColor: theme?.accentColor || '#376BB2',
            bannerImage: undefined,
          },
          tags,
        };
        
        // This will now safely serialize BigInt and Principal
        saveLocalPublishedBlueprint(marketplaceBlueprint);
        
        return blueprintId;
      }
      
      // Online mode: publish to backend
      checkBackendReady(actor, identity, true);
      const actorAny = actor as any;
      
      // Ensure createMarketplaceBlueprint exists
      if (typeof actorAny.createMarketplaceBlueprint !== 'function') {
        throw new Error('Blueprint publishing is not available. Please ensure the backend is ready and try again.');
      }
      
      if (typeof actorAny.createProjectBlueprint !== 'function') {
        throw new Error('Blueprint creation is not available. Please ensure the backend is ready and try again.');
      }
      
      // Convert steps to the format expected by backend
      // IMPORTANT: Serialize block data as JSON for calendar task derivation
      const stepsView = steps.map((step, index) => ({
        id: step.id,
        name: step.name,
        order: BigInt(index),
        blocks: step.blocks.map((block, blockIndex) => {
          let content = block.content || '';
          let options = block.options || [];
          
          // For dailyStep and checklist blocks, serialize as JSON in content
          if (block.type === 'dailyStep') {
            content = JSON.stringify({
              day: block.day,
              title: block.title,
              description: block.description,
            });
          } else if (block.type === 'checklist') {
            content = JSON.stringify({
              title: block.title,
              items: block.items,
            });
          }
          
          return {
            id: block.id,
            blockType: block.type,
            content,
            options,
            order: BigInt(blockIndex),
          };
        }),
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
      
      return blueprintId;
    },
    onError: (error: any) => {
      console.error('Blueprint publish error:', error);
      
      // Handle specific local storage errors
      if (error.message?.startsWith('LOCAL_STORAGE_FULL:')) {
        toast.error('Device storage is full', {
          description: 'Please free up space or delete old local blueprints to continue.',
          duration: 6000,
        });
      } else if (error.message?.startsWith('LOCAL_STORAGE_BLOCKED:')) {
        toast.error('Browser storage is disabled', {
          description: 'Please enable cookies and site data in your browser settings.',
          duration: 6000,
        });
      } else if (error.message?.startsWith('LOCAL_STORAGE_ERROR:')) {
        toast.error('Failed to save locally', {
          description: 'Please check your browser settings and try again.',
          duration: 6000,
        });
      } else if (error.message === 'BACKEND_NOT_READY') {
        toast.error('Blueprint Engine is reconnecting...', {
          description: 'Please wait a moment and try publishing again.',
        });
      } else if (error.message === 'AUTHENTICATION_REQUIRED') {
        toast.error('Please sign in to publish blueprints');
      } else {
        toast.error(error.message || 'Failed to publish blueprint');
      }
    },
    onSuccess: (blueprintId, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projectBlueprints'] });
      queryClient.invalidateQueries({ queryKey: ['marketplaceBlueprints'] });
      queryClient.invalidateQueries({ queryKey: ['createdBlueprints'] });
      queryClient.invalidateQueries({ queryKey: ['callerProjectBlueprints'] });
      
      // Check if this was a local save
      if (blueprintId.startsWith('local-blueprint-')) {
        toast.success('Blueprint saved locally!', {
          description: 'Your blueprint is saved on this device. It will sync when you\'re back online.',
          duration: 5000,
        });
      } else {
        toast.success('Blueprint published successfully!', {
          description: 'Your blueprint is now live in the marketplace.',
        });
      }
    },
    retry: 0, // Don't retry, handle offline mode instead
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
