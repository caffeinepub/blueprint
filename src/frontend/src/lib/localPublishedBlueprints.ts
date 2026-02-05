import type { MarketplaceBlueprint } from '../types';
import { Principal } from '@dfinity/principal';

const LOCAL_BLUEPRINTS_KEY = 'local_published_blueprints';
const LOCAL_PUBLISH_EVENT = 'local-blueprint-published';

export interface LocalPublishedBlueprint {
  blueprint: MarketplaceBlueprint;
  publishedAt: number;
}

// Serializable version for localStorage
interface SerializableBlueprint {
  id: string;
  description: string;
  creator: string; // Principal as string
  price: string; // bigint as string
  isFree: boolean;
  createdAt: string; // bigint as string
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };
  tags: string[];
}

interface SerializableLocalBlueprint {
  blueprint: SerializableBlueprint;
  publishedAt: number;
}

// Convert MarketplaceBlueprint to serializable format
function serializeBlueprint(blueprint: MarketplaceBlueprint): SerializableBlueprint {
  return {
    id: blueprint.id,
    description: blueprint.description,
    creator: blueprint.creator.toString(),
    price: blueprint.price.toString(),
    isFree: blueprint.isFree,
    createdAt: blueprint.createdAt.toString(),
    theme: {
      primaryColor: blueprint.theme.primaryColor,
      secondaryColor: blueprint.theme.secondaryColor,
      accentColor: blueprint.theme.accentColor,
      // Note: bannerImage (ExternalBlob) is not serializable to localStorage
    },
    tags: blueprint.tags,
  };
}

// Convert serializable format back to MarketplaceBlueprint
function deserializeBlueprint(serialized: SerializableBlueprint): MarketplaceBlueprint {
  return {
    id: serialized.id,
    description: serialized.description,
    creator: Principal.fromText(serialized.creator),
    price: BigInt(serialized.price),
    isFree: serialized.isFree,
    createdAt: BigInt(serialized.createdAt),
    theme: {
      primaryColor: serialized.theme.primaryColor,
      secondaryColor: serialized.theme.secondaryColor,
      accentColor: serialized.theme.accentColor,
      bannerImage: undefined,
    },
    tags: serialized.tags,
    image: undefined,
  };
}

// Dispatch custom event when a blueprint is published locally
function dispatchLocalPublishEvent() {
  window.dispatchEvent(new CustomEvent(LOCAL_PUBLISH_EVENT));
}

// Get all locally published blueprints
export function getLocalPublishedBlueprints(): LocalPublishedBlueprint[] {
  try {
    const stored = localStorage.getItem(LOCAL_BLUEPRINTS_KEY);
    if (!stored) return [];
    
    const serialized: SerializableLocalBlueprint[] = JSON.parse(stored);
    
    // Deserialize each blueprint
    return serialized.map(item => ({
      blueprint: deserializeBlueprint(item.blueprint),
      publishedAt: item.publishedAt,
    }));
  } catch (error) {
    console.error('Failed to read local blueprints:', error);
    return [];
  }
}

// Save a blueprint locally
export function saveLocalPublishedBlueprint(blueprint: MarketplaceBlueprint): void {
  try {
    const existing = getLocalPublishedBlueprints();
    
    // Check if blueprint already exists (dedupe by ID)
    const existingIndex = existing.findIndex(item => item.blueprint.id === blueprint.id);
    
    const newItem: LocalPublishedBlueprint = {
      blueprint,
      publishedAt: Date.now(),
    };
    
    if (existingIndex >= 0) {
      // Update existing
      existing[existingIndex] = newItem;
    } else {
      // Add new
      existing.push(newItem);
    }
    
    // Serialize for storage
    const serializable: SerializableLocalBlueprint[] = existing.map(item => ({
      blueprint: serializeBlueprint(item.blueprint),
      publishedAt: item.publishedAt,
    }));
    
    localStorage.setItem(LOCAL_BLUEPRINTS_KEY, JSON.stringify(serializable));
    dispatchLocalPublishEvent();
  } catch (error: any) {
    console.error('Failed to save local blueprint:', error);
    
    // Provide actionable error messages
    if (error.name === 'QuotaExceededError') {
      throw new Error('LOCAL_STORAGE_FULL: Your device storage is full. Please free up space or delete old local blueprints.');
    } else if (error.message?.includes('localStorage')) {
      throw new Error('LOCAL_STORAGE_BLOCKED: Browser storage is disabled. Please enable cookies and site data in your browser settings.');
    } else {
      throw new Error('LOCAL_STORAGE_ERROR: Failed to save blueprint locally. Please try again or check your browser settings.');
    }
  }
}

// Get a single locally published blueprint by ID
export function getLocalPublishedBlueprint(blueprintId: string): MarketplaceBlueprint | null {
  const all = getLocalPublishedBlueprints();
  const found = all.find(item => item.blueprint.id === blueprintId);
  return found ? found.blueprint : null;
}

// Check if a blueprint is stored locally
export function isLocalBlueprint(blueprintId: string): boolean {
  return getLocalPublishedBlueprint(blueprintId) !== null;
}

// Get IDs of all locally published blueprints
export function getLocalPublishedBlueprintIds(): string[] {
  return getLocalPublishedBlueprints().map(item => item.blueprint.id);
}

// Listen for local publish events (for React Query invalidation)
export function onLocalPublish(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(LOCAL_PUBLISH_EVENT, handler);
  return () => window.removeEventListener(LOCAL_PUBLISH_EVENT, handler);
}
