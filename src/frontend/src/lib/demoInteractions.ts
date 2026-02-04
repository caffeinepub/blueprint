// Demo Interaction Mode - Local-only interactions for demo content
// All interactions are stored in session storage and do not affect backend

const DEMO_LIKES_KEY = 'blueprint_demo_likes';
const DEMO_COMMENTS_KEY = 'blueprint_demo_comments';
const DEMO_PURCHASES_KEY = 'blueprint_demo_purchases';

export interface DemoLike {
  postId: string;
  userId: string;
  timestamp: number;
}

export interface DemoComment {
  postId: string;
  author: string;
  content: string;
  createdAt: number;
}

export interface DemoPurchase {
  blueprintId: string;
  userId: string;
  timestamp: number;
}

// Check if a post is demo content
export function isDemoPost(postId: string): boolean {
  return postId.startsWith('post-');
}

// Check if a blueprint is demo content
export function isDemoBlueprint(blueprintId: string): boolean {
  return blueprintId.startsWith('blueprint-');
}

// Demo Likes Management
export function getDemoLikes(): DemoLike[] {
  const stored = sessionStorage.getItem(DEMO_LIKES_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveDemoLikes(likes: DemoLike[]): void {
  sessionStorage.setItem(DEMO_LIKES_KEY, JSON.stringify(likes));
}

export function hasUserLikedDemoPost(postId: string, userId: string): boolean {
  const likes = getDemoLikes();
  return likes.some(like => like.postId === postId && like.userId === userId);
}

export function toggleDemoLike(postId: string, userId: string): boolean {
  const likes = getDemoLikes();
  const existingIndex = likes.findIndex(like => like.postId === postId && like.userId === userId);
  
  if (existingIndex >= 0) {
    // Unlike
    likes.splice(existingIndex, 1);
    saveDemoLikes(likes);
    return false;
  } else {
    // Like
    likes.push({
      postId,
      userId,
      timestamp: Date.now(),
    });
    saveDemoLikes(likes);
    return true;
  }
}

export function getDemoLikeCount(postId: string): number {
  const likes = getDemoLikes();
  return likes.filter(like => like.postId === postId).length;
}

// Demo Comments Management
export function getDemoComments(): DemoComment[] {
  const stored = sessionStorage.getItem(DEMO_COMMENTS_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveDemoComments(comments: DemoComment[]): void {
  sessionStorage.setItem(DEMO_COMMENTS_KEY, JSON.stringify(comments));
}

export function getDemoCommentsForPost(postId: string): DemoComment[] {
  const comments = getDemoComments();
  return comments.filter(comment => comment.postId === postId);
}

export function addDemoComment(postId: string, author: string, content: string): DemoComment {
  const comments = getDemoComments();
  const newComment: DemoComment = {
    postId,
    author,
    content,
    createdAt: Date.now(),
  };
  comments.push(newComment);
  saveDemoComments(comments);
  return newComment;
}

export function getDemoCommentCount(postId: string): number {
  const comments = getDemoComments();
  return comments.filter(comment => comment.postId === postId).length;
}

// Demo Purchases Management
export function getDemoPurchases(): DemoPurchase[] {
  const stored = sessionStorage.getItem(DEMO_PURCHASES_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveDemoPurchases(purchases: DemoPurchase[]): void {
  sessionStorage.setItem(DEMO_PURCHASES_KEY, JSON.stringify(purchases));
}

export function hasUserPurchasedDemoBlueprint(blueprintId: string, userId: string): boolean {
  const purchases = getDemoPurchases();
  return purchases.some(purchase => purchase.blueprintId === blueprintId && purchase.userId === userId);
}

export function addDemoPurchase(blueprintId: string, userId: string): void {
  const purchases = getDemoPurchases();
  
  // Check if already purchased
  if (hasUserPurchasedDemoBlueprint(blueprintId, userId)) {
    return;
  }
  
  purchases.push({
    blueprintId,
    userId,
    timestamp: Date.now(),
  });
  saveDemoPurchases(purchases);
}

// Clear all demo interactions (useful for testing)
export function clearAllDemoInteractions(): void {
  sessionStorage.removeItem(DEMO_LIKES_KEY);
  sessionStorage.removeItem(DEMO_COMMENTS_KEY);
  sessionStorage.removeItem(DEMO_PURCHASES_KEY);
}
