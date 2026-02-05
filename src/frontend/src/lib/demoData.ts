import { Principal } from '@dfinity/principal';
import type { Post, Comment, MarketplaceBlueprint, Review, UserProfile } from '../types';

// Demo mode flag - only use demo data when backend is not available
export function isDemoModeEnabled(): boolean {
  return false; // Demo data is now a fallback, not the default
}

// Demo user profiles
export const demoUsers: Record<string, UserProfile> = {
  'sarah_learns': {
    username: 'sarah_learns',
    bio: 'Learning Spanish in 90 days! Sharing my language learning journey 🌍',
    followers: BigInt(1250),
    following: BigInt(340),
    hasCompletedSetup: true,
    completedTasks: [],
  },
  'mike_builds': {
    username: 'mike_builds',
    bio: 'Startup founder | Sharing blueprints for launching MVPs and building products 🚀',
    followers: BigInt(3400),
    following: BigInt(890),
    hasCompletedSetup: true,
    completedTasks: [],
  },
  'emma_cooks': {
    username: 'emma_cooks',
    bio: 'Home chef | Meal prep master | Sharing weekly cooking blueprints 🍳',
    followers: BigInt(2100),
    following: BigInt(560),
    hasCompletedSetup: true,
    completedTasks: [],
  },
  'jake_codes': {
    username: 'jake_codes',
    bio: 'Self-taught developer | Documenting my coding journey from zero to hero 💻',
    followers: BigInt(890),
    following: BigInt(210),
    hasCompletedSetup: true,
    completedTasks: [],
  },
  'lisa_organizes': {
    username: 'lisa_organizes',
    bio: 'Productivity coach | Helping you organize your life one blueprint at a time 📋',
    followers: BigInt(5600),
    following: BigInt(1200),
    hasCompletedSetup: true,
    completedTasks: [],
  },
  'alex_runs': {
    username: 'alex_runs',
    bio: 'Marathon runner | Training plans and running blueprints for all levels 🏃',
    followers: BigInt(670),
    following: BigInt(180),
    hasCompletedSetup: true,
    completedTasks: [],
  },
};

// Demo posts with blueprint attachments
export const demoPosts: Post[] = [
  {
    id: 'post-1',
    author: 'sarah_learns',
    content: 'Day 30 of my Spanish learning blueprint! Already having basic conversations. Consistency is everything! 🎉🇪🇸',
    createdAt: BigInt(Date.now() * 1000000 - 3600000 * 1000000),
    likes: BigInt(234),
    comments: BigInt(18),
    attachedBlueprintId: 'blueprint-language-001',
    likedBy: [],
  },
  {
    id: 'post-2',
    author: 'mike_builds',
    content: 'New blueprint alert! 🚨 My complete startup launch checklist is now live. From idea validation to first customer - everything you need to know.',
    createdAt: BigInt(Date.now() * 1000000 - 7200000 * 1000000),
    likes: BigInt(567),
    comments: BigInt(42),
    attachedBlueprintId: 'blueprint-startup-001',
    likedBy: [],
  },
  {
    id: 'post-3',
    author: 'emma_cooks',
    content: 'Meal prep Sunday! 🥗 Following my weekly meal prep blueprint. Saves so much time and money during the week.',
    createdAt: BigInt(Date.now() * 1000000 - 10800000 * 1000000),
    likes: BigInt(189),
    comments: BigInt(23),
    attachedBlueprintId: 'blueprint-meal-prep-001',
    likedBy: [],
  },
  {
    id: 'post-4',
    author: 'jake_codes',
    content: 'Progress update: Built my first full-stack app! The coding bootcamp blueprint really works. From zero to deployed in 12 weeks! 💪',
    createdAt: BigInt(Date.now() * 1000000 - 14400000 * 1000000),
    likes: BigInt(412),
    comments: BigInt(31),
    attachedBlueprintId: 'blueprint-coding-001',
    likedBy: [],
  },
  {
    id: 'post-5',
    author: 'lisa_organizes',
    content: 'Remember: progress over perfection. Small steps every day lead to big transformations. You got this! 💚',
    createdAt: BigInt(Date.now() * 1000000 - 18000000 * 1000000),
    likes: BigInt(891),
    comments: BigInt(67),
    likedBy: [],
  },
  {
    id: 'post-6',
    author: 'alex_runs',
    content: 'Just finished week 8 of the marathon training blueprint! First 20-mile run complete. Race day here I come! 🏃‍♂️🔥',
    createdAt: BigInt(Date.now() * 1000000 - 21600000 * 1000000),
    likes: BigInt(156),
    comments: BigInt(12),
    attachedBlueprintId: 'blueprint-marathon-001',
    likedBy: [],
  },
  {
    id: 'post-7',
    author: 'sarah_learns',
    content: 'Non-scale victory: Had my first full conversation in Spanish today! 🎉 This is what it\'s all about.',
    createdAt: BigInt(Date.now() * 1000000 - 25200000 * 1000000),
    likes: BigInt(678),
    comments: BigInt(45),
    likedBy: [],
  },
  {
    id: 'post-8',
    author: 'mike_builds',
    content: 'Founder tip: Don\'t skip market research! Understanding your customers is the foundation of everything. 💯',
    createdAt: BigInt(Date.now() * 1000000 - 28800000 * 1000000),
    likes: BigInt(445),
    comments: BigInt(28),
    likedBy: [],
  },
];

// Demo blueprints
export const demoBlueprints: MarketplaceBlueprint[] = [
  {
    id: 'blueprint-language-001',
    description: 'Learn Spanish in 90 Days - Complete Language Learning Blueprint',
    creator: Principal.fromText('aaaaa-aa'),
    price: BigInt(0),
    isFree: true,
    createdAt: BigInt(Date.now() * 1000000 - 86400000 * 1000000 * 30),
    theme: {
      primaryColor: '#34C759',
      secondaryColor: '#52D376',
      accentColor: '#2A9D4A',
    },
    tags: ['spanish', 'language', 'learning', 'beginner', '90-days'],
  },
  {
    id: 'blueprint-startup-001',
    description: 'Startup Launch Checklist - From Idea to First Customer',
    creator: Principal.fromText('aaaaa-aa'),
    price: BigInt(2999),
    isFree: false,
    createdAt: BigInt(Date.now() * 1000000 - 86400000 * 1000000 * 15),
    theme: {
      primaryColor: '#FF2D55',
      secondaryColor: '#FF5A7A',
      accentColor: '#CC2444',
    },
    tags: ['startup', 'business', 'entrepreneur', 'mvp', 'launch'],
  },
  {
    id: 'blueprint-meal-prep-001',
    description: 'Weekly Meal Prep Blueprint - Save Time & Eat Healthy',
    creator: Principal.fromText('aaaaa-aa'),
    price: BigInt(1999),
    isFree: false,
    createdAt: BigInt(Date.now() * 1000000 - 86400000 * 1000000 * 20),
    theme: {
      primaryColor: '#34C759',
      secondaryColor: '#52D376',
      accentColor: '#2A9D4A',
    },
    tags: ['meal-prep', 'cooking', 'healthy', 'nutrition', 'weekly'],
  },
  {
    id: 'blueprint-coding-001',
    description: 'Self-Taught Developer Blueprint - 12 Week Coding Bootcamp',
    creator: Principal.fromText('aaaaa-aa'),
    price: BigInt(0),
    isFree: true,
    createdAt: BigInt(Date.now() * 1000000 - 86400000 * 1000000 * 25),
    theme: {
      primaryColor: '#FF9500',
      secondaryColor: '#FFB340',
      accentColor: '#CC7700',
    },
    tags: ['coding', 'programming', 'developer', 'bootcamp', 'self-taught'],
  },
  {
    id: 'blueprint-marathon-001',
    description: 'Marathon Training Blueprint - 16 Week Running Plan',
    creator: Principal.fromText('aaaaa-aa'),
    price: BigInt(2499),
    isFree: false,
    createdAt: BigInt(Date.now() * 1000000 - 86400000 * 1000000 * 10),
    theme: {
      primaryColor: '#AF52DE',
      secondaryColor: '#C77EE8',
      accentColor: '#8C42B8',
    },
    tags: ['running', 'marathon', 'training', 'fitness', 'endurance'],
  },
  {
    id: 'blueprint-interview-001',
    description: 'Job Interview Prep Blueprint - Land Your Dream Role',
    creator: Principal.fromText('aaaaa-aa'),
    price: BigInt(4999),
    isFree: false,
    createdAt: BigInt(Date.now() * 1000000 - 86400000 * 1000000 * 5),
    theme: {
      primaryColor: '#007AFF',
      secondaryColor: '#4A90E2',
      accentColor: '#376BB2',
    },
    tags: ['interview', 'job', 'career', 'preparation', 'professional'],
  },
];

// Demo comments
export const demoComments: Record<string, Comment[]> = {
  'post-1': [
    {
      author: 'mike_builds',
      content: 'Amazing progress Sarah! Keep it up! 💪',
      createdAt: BigInt(Date.now() * 1000000 - 3000000 * 1000000),
    },
    {
      author: 'emma_cooks',
      content: 'You\'re crushing it! So proud of you! 🎉',
      createdAt: BigInt(Date.now() * 1000000 - 2500000 * 1000000),
    },
  ],
  'post-2': [
    {
      author: 'alex_runs',
      content: 'Just purchased! Can\'t wait to start working on my startup idea! 🔥',
      createdAt: BigInt(Date.now() * 1000000 - 6000000 * 1000000),
    },
    {
      author: 'lisa_organizes',
      content: 'This looks comprehensive! Perfect for aspiring founders.',
      createdAt: BigInt(Date.now() * 1000000 - 5500000 * 1000000),
    },
  ],
  'post-3': [
    {
      author: 'sarah_learns',
      content: 'Love this! Meal prep is such a game changer.',
      createdAt: BigInt(Date.now() * 1000000 - 9000000 * 1000000),
    },
  ],
  'post-4': [
    {
      author: 'emma_cooks',
      content: 'Incredible achievement Jake! From zero to deployed is amazing! 🌅',
      createdAt: BigInt(Date.now() * 1000000 - 13000000 * 1000000),
    },
    {
      author: 'mike_builds',
      content: '12 weeks is solid progress. Well done! 💯',
      createdAt: BigInt(Date.now() * 1000000 - 12500000 * 1000000),
    },
  ],
};

// Demo reviews
export const demoReviews: Record<string, Review[]> = {
  'blueprint-language-001': [
    {
      author: 'sarah_learns',
      rating: BigInt(5),
      comment: 'Perfect for beginners! Easy to follow and very effective. Having conversations in just 30 days!',
      timestamp: BigInt(Date.now() * 1000000 - 86400000 * 1000000 * 20),
    },
    {
      author: 'alex_runs',
      rating: BigInt(5),
      comment: 'Great starting point for anyone new to language learning. Highly recommend!',
      timestamp: BigInt(Date.now() * 1000000 - 86400000 * 1000000 * 15),
    },
  ],
  'blueprint-startup-001': [
    {
      author: 'jake_codes',
      rating: BigInt(5),
      comment: 'Comprehensive and actionable! Helped me validate my idea and get my first customers.',
      timestamp: BigInt(Date.now() * 1000000 - 86400000 * 1000000 * 10),
    },
    {
      author: 'alex_runs',
      rating: BigInt(4),
      comment: 'Really detailed blueprint. Worth every penny for aspiring founders!',
      timestamp: BigInt(Date.now() * 1000000 - 86400000 * 1000000 * 8),
    },
  ],
  'blueprint-meal-prep-001': [
    {
      author: 'sarah_learns',
      rating: BigInt(5),
      comment: 'Love the recipes! Makes meal prep so much easier and saves tons of time.',
      timestamp: BigInt(Date.now() * 1000000 - 86400000 * 1000000 * 12),
    },
  ],
  'blueprint-marathon-001': [
    {
      author: 'alex_runs',
      rating: BigInt(5),
      comment: 'Following this plan for my first marathon! Well structured and progressive.',
      timestamp: BigInt(Date.now() * 1000000 - 86400000 * 1000000 * 5),
    },
  ],
};

// Helper function to calculate average rating from demo reviews
export function getAverageRating(blueprintId: string): number {
  const reviews = demoReviews[blueprintId];
  if (!reviews || reviews.length === 0) return 0;
  
  const sum = reviews.reduce((acc, review) => acc + Number(review.rating), 0);
  return sum / reviews.length;
}
