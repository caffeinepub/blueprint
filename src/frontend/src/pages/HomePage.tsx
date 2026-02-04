import { useState, useMemo } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetPosts, useCreatePost, useLikePost, useAddComment, useGetComments, useGetMarketplaceBlueprints } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, MessageCircle, Share2, Image as ImageIcon, Loader2, ShoppingBag } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import SignInPrompt from '../components/SignInPrompt';
import { useNavigate } from '@tanstack/react-router';
import { 
  isDemoPost, 
  hasUserLikedDemoPost, 
  toggleDemoLike, 
  getDemoLikeCount,
  getDemoCommentsForPost,
  addDemoComment,
  getDemoCommentCount
} from '../lib/demoInteractions';
import type { Post, Comment } from '../types';

export default function HomePage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [signInAction, setSignInAction] = useState('create posts');
  const [postContent, setPostContent] = useState('');
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string>('none');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const isAuthenticated = !!identity;
  const currentUserId = identity?.getPrincipal().toString() || 'guest';

  const { data: posts = [], isLoading: postsLoading } = useGetPosts();
  const { data: blueprints = [] } = useGetMarketplaceBlueprints();
  const createPost = useCreatePost();
  const likePost = useLikePost();
  const addComment = useAddComment();

  // Enhance posts with demo interaction data
  const enhancedPosts = useMemo(() => {
    return posts.map(post => {
      if (isDemoPost(post.id)) {
        // Add demo likes and comments to demo posts
        const demoLikeCount = getDemoLikeCount(post.id);
        const demoCommentCount = getDemoCommentCount(post.id);
        const hasLiked = hasUserLikedDemoPost(post.id, currentUserId);
        
        return {
          ...post,
          likes: post.likes + BigInt(demoLikeCount),
          comments: post.comments + BigInt(demoCommentCount),
          likedBy: hasLiked 
            ? [...post.likedBy, identity?.getPrincipal()].filter(Boolean)
            : post.likedBy,
        };
      }
      return post;
    });
  }, [posts, currentUserId, identity]);

  const handleRestrictedAction = (action: string) => {
    if (!isAuthenticated) {
      setSignInAction(action);
      setShowSignInPrompt(true);
    }
  };

  const handleCreatePost = async () => {
    if (!isAuthenticated) {
      handleRestrictedAction('create posts');
      return;
    }

    if (!postContent.trim()) {
      toast.error('Please enter some content');
      return;
    }

    try {
      const attachedBlueprintId = selectedBlueprintId !== 'none' ? selectedBlueprintId : undefined;
      await createPost.mutateAsync({ 
        content: postContent, 
        attachedBlueprintId 
      });
      setPostContent('');
      setSelectedBlueprintId('none');
      toast.success('Post created successfully!');
    } catch (error: any) {
      console.error('Post creation error:', error);
      
      if (error.message === 'BACKEND_NOT_READY') {
        toast.error('Reconnecting to Blueprint Engine... Please try again in a moment.');
      } else if (error.message === 'AUTHENTICATION_REQUIRED') {
        toast.error('Please sign in to create posts');
      } else {
        toast.error(error.message || 'Failed to create post');
      }
    }
  };

  const handleLike = async (postId: string) => {
    // Check if this is a demo post
    if (isDemoPost(postId)) {
      // Handle demo like locally
      const isNowLiked = toggleDemoLike(postId, currentUserId);
      
      // Force re-render by updating a dummy state
      setExpandedComments(new Set(expandedComments));
      
      toast.success(isNowLiked ? 'Liked!' : 'Unliked!', {
        description: 'Demo interaction saved for this session',
        duration: 2000,
      });
      return;
    }

    // Handle real post like
    if (!isAuthenticated) {
      handleRestrictedAction('like posts');
      return;
    }

    try {
      await likePost.mutateAsync(postId);
    } catch (error: any) {
      console.error('Like error:', error);
    }
  };

  const handleComment = async (postId: string) => {
    const content = commentInputs[postId]?.trim();
    if (!content) {
      toast.error('Please enter a comment');
      return;
    }

    // Check if this is a demo post
    if (isDemoPost(postId)) {
      // Handle demo comment locally
      const author = isAuthenticated ? identity?.getPrincipal().toString() || 'Anonymous' : 'Guest User';
      addDemoComment(postId, author, content);
      setCommentInputs({ ...commentInputs, [postId]: '' });
      
      // Force re-render
      setExpandedComments(new Set(expandedComments));
      
      toast.success('Comment added!', {
        description: 'Demo interaction saved for this session',
        duration: 2000,
      });
      return;
    }

    // Handle real post comment
    if (!isAuthenticated) {
      handleRestrictedAction('comment on posts');
      return;
    }

    try {
      await addComment.mutateAsync({ postId, content });
      setCommentInputs({ ...commentInputs, [postId]: '' });
      toast.success('Comment added!');
    } catch (error: any) {
      if (error.message === 'BACKEND_NOT_READY') {
        toast.error('Reconnecting to Blueprint Engine... Please try again in a moment.');
      } else if (error.message === 'AUTHENTICATION_REQUIRED') {
        toast.error('Please sign in to comment');
      } else {
        toast.error(error.message || 'Failed to add comment');
      }
    }
  };

  const handleShare = (postId: string) => {
    if (!isAuthenticated) {
      handleRestrictedAction('share posts');
      return;
    }
    toast.success('Share functionality coming soon!');
  };

  const toggleComments = (postId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
    }
    setExpandedComments(newExpanded);
  };

  const handleViewBlueprint = (blueprintId: string) => {
    navigate({ to: `/marketplace/${blueprintId}` });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Tabs defaultValue="for-you" className="w-full">
        <TabsList className="w-full grid grid-cols-2 mb-6">
          <TabsTrigger value="for-you">For You</TabsTrigger>
          <TabsTrigger 
            value="following"
            onClick={(e) => {
              if (!isAuthenticated) {
                e.preventDefault();
                handleRestrictedAction('view posts from people you follow');
              }
            }}
          >
            Following
          </TabsTrigger>
        </TabsList>

        <TabsContent value="for-you" className="space-y-6">
          {/* Create Post Section */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold">
                    {isAuthenticated ? 'U' : 'G'}
                  </span>
                </div>
                <div className="flex-1">
                  <Textarea
                    placeholder={isAuthenticated ? "Share your progress, plans, and learnings..." : "Sign in to share your journey..."}
                    className="min-h-[100px] resize-none"
                    disabled={!isAuthenticated || createPost.isPending}
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    onClick={() => !isAuthenticated && handleRestrictedAction('create posts')}
                  />
                  <div className="flex items-center justify-between mt-3 gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!isAuthenticated}
                        onClick={() => handleRestrictedAction('add images to posts')}
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Image
                      </Button>
                      {isAuthenticated && (
                        <Select
                          value={selectedBlueprintId}
                          onValueChange={setSelectedBlueprintId}
                          disabled={createPost.isPending}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Attach Blueprint" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Blueprint</SelectItem>
                            {blueprints.map((bp) => (
                              <SelectItem key={bp.id} value={bp.id}>
                                {bp.description.substring(0, 30)}...
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <Button
                      disabled={!isAuthenticated || createPost.isPending || !postContent.trim()}
                      onClick={handleCreatePost}
                    >
                      {createPost.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Post
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Posts Feed */}
          {postsLoading ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Loading posts...</p>
              </CardContent>
            </Card>
          ) : enhancedPosts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <p className="text-muted-foreground mb-4">
                  No posts yet. Be the first to share your journey!
                </p>
                {isAuthenticated && (
                  <Button onClick={() => document.querySelector('textarea')?.focus()}>
                    Create First Post
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {enhancedPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  blueprints={blueprints}
                  isAuthenticated={isAuthenticated}
                  currentUserPrincipal={identity?.getPrincipal()}
                  currentUserId={currentUserId}
                  onLike={handleLike}
                  onComment={handleComment}
                  onShare={handleShare}
                  onToggleComments={toggleComments}
                  onViewBlueprint={handleViewBlueprint}
                  isCommentsExpanded={expandedComments.has(post.id)}
                  commentInput={commentInputs[post.id] || ''}
                  onCommentInputChange={(value) => setCommentInputs({ ...commentInputs, [post.id]: value })}
                  isCommenting={addComment.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="following" className="space-y-6">
          {isAuthenticated ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <p className="text-muted-foreground mb-4">
                  Follow users to see their posts here
                </p>
                <Button variant="outline">Discover People</Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <p className="text-muted-foreground mb-4">
                  Sign in to see posts from people you follow
                </p>
                <Button onClick={() => handleRestrictedAction('view following feed')}>
                  Sign In
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <SignInPrompt
        open={showSignInPrompt}
        onOpenChange={setShowSignInPrompt}
        action={signInAction}
      />
    </div>
  );
}

function PostCard({ 
  post, 
  blueprints,
  isAuthenticated,
  currentUserPrincipal,
  currentUserId,
  onLike, 
  onComment, 
  onShare, 
  onToggleComments,
  onViewBlueprint,
  isCommentsExpanded,
  commentInput,
  onCommentInputChange,
  isCommenting
}: any) {
  const { data: backendComments = [] } = useGetComments(isCommentsExpanded && !isDemoPost(post.id) ? post.id : null);
  
  // Get demo comments if this is a demo post
  const demoComments = isDemoPost(post.id) ? getDemoCommentsForPost(post.id) : [];
  
  // Combine backend and demo comments
  const allComments = isDemoPost(post.id) 
    ? demoComments.map(dc => ({
        author: dc.author,
        content: dc.content,
        createdAt: BigInt(dc.createdAt * 1000000),
      }))
    : backendComments;
  
  // Find attached blueprint if exists
  const attachedBlueprint = post.attachedBlueprintId 
    ? blueprints.find((bp: any) => bp.id === post.attachedBlueprintId)
    : null;

  // Check if current user has liked this post
  const hasLiked = currentUserPrincipal 
    ? post.likedBy.some((principal: any) => principal.toString() === currentUserPrincipal.toString())
    : false;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-sm">
              {post.author.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold">{post.author}</span>
              <span className="text-sm text-muted-foreground">
                · {new Date(Number(post.createdAt) / 1000000).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm mb-4 whitespace-pre-wrap">
              {post.content}
            </p>

            {/* Attached Blueprint Preview */}
            {attachedBlueprint && (
              <Card className="mb-4 border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm mb-1">
                        {attachedBlueprint.description.substring(0, 60)}...
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        {attachedBlueprint.isFree ? 'FREE' : `$${(Number(attachedBlueprint.price) / 100).toFixed(2)}`}
                      </p>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onViewBlueprint(attachedBlueprint.id)}
                      >
                        {attachedBlueprint.isFree ? 'Get Blueprint' : 'View Blueprint'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex items-center gap-6 text-muted-foreground">
              <button
                className={`flex items-center gap-2 transition-colors group ${
                  hasLiked ? 'text-red-500' : 'hover:text-red-500'
                }`}
                onClick={() => onLike(post.id)}
              >
                <Heart 
                  className={`h-4 w-4 transition-all ${
                    hasLiked ? 'fill-red-500' : 'group-hover:fill-red-500'
                  }`}
                />
                <span className="text-sm">{Number(post.likes)}</span>
              </button>
              <button
                className="flex items-center gap-2 hover:text-primary transition-colors"
                onClick={() => onToggleComments(post.id)}
              >
                <MessageCircle className="h-4 w-4" />
                <span className="text-sm">{Number(post.comments)}</span>
              </button>
              <button
                className="flex items-center gap-2 hover:text-primary transition-colors disabled:opacity-50"
                onClick={() => onShare(post.id)}
                disabled={!isAuthenticated}
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>

            {/* Comments Section */}
            {isCommentsExpanded && (
              <div className="mt-4 pt-4 border-t space-y-3">
                {allComments.map((comment: any, idx: number) => (
                  <div key={idx} className="flex gap-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/60 to-primary/40 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-xs">
                        {comment.author.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="bg-accent/50 rounded-lg p-2">
                        <p className="font-semibold text-sm">{comment.author}</p>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(Number(comment.createdAt) / 1000000).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}

                <div className="flex gap-2 mt-3">
                  <Textarea
                    placeholder="Write a comment..."
                    className="min-h-[60px] resize-none"
                    value={commentInput}
                    onChange={(e) => onCommentInputChange(e.target.value)}
                    disabled={isCommenting}
                  />
                  <Button 
                    size="sm" 
                    onClick={() => onComment(post.id)}
                    disabled={isCommenting || !commentInput.trim()}
                  >
                    {isCommenting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
