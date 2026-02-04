import type { Principal } from '@dfinity/principal';
import type { ExternalBlob } from '../backend';

export interface UserProfile {
  username: string;
  avatar?: ExternalBlob;
  banner?: ExternalBlob;
  bio: string;
  followers: bigint;
  following: bigint;
  hasCompletedSetup: boolean;
  completedTasks: bigint[];
}

export interface Post {
  id: string;
  author: string;
  content: string;
  image?: ExternalBlob;
  attachedBlueprintId?: string;
  createdAt: bigint;
  likes: bigint;
  comments: bigint;
  likedBy: Principal[];
}

export interface Comment {
  author: string;
  content: string;
  createdAt: bigint;
}

export interface BlueprintTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  bannerImage?: ExternalBlob;
}

export interface MarketplaceBlueprint {
  id: string;
  image?: ExternalBlob;
  description: string;
  creator: Principal;
  price: bigint;
  isFree: boolean;
  createdAt: bigint;
  theme: BlueprintTheme;
  tags: string[];
}

export interface Review {
  author: string;
  rating: bigint;
  comment: string;
  timestamp: bigint;
}
