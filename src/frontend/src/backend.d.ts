import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type OwnerId = Principal;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export type PostId = string;
export interface Blueprint {
    id: string;
    theme: BlueprintTheme;
    active: boolean;
    createdAt: Time;
    calorieGoal: number;
    weeks: bigint;
    poundsToLose: number;
}
export interface BlueprintTheme {
    primaryColor: string;
    accentColor: string;
    bannerImage?: ExternalBlob;
    secondaryColor: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface StepView {
    id: string;
    order: bigint;
    name: string;
    blocks: Array<Block>;
}
export interface Post {
    id: PostId;
    content: string;
    createdAt: Time;
    likedBy: Array<Principal>;
    author: string;
    likes: bigint;
    image?: ExternalBlob;
    comments: bigint;
    attachedBlueprintId?: string;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface ProjectBlueprintView {
    id: string;
    title: string;
    createdBy: Principal;
    steps: Array<StepView>;
}
export interface Review {
    author: string;
    comment: string;
    timestamp: Time;
    rating: bigint;
}
export interface OwnershipRecord {
    purchaseTime: Time;
    owner: OwnerId;
    blueprintId: string;
}
export interface Comment {
    content: string;
    createdAt: Time;
    author: string;
}
export interface MarketplaceBlueprint {
    id: string;
    theme: BlueprintTheme;
    creator: CreatorId;
    createdAt: Time;
    tags: Array<string>;
    description: string;
    isFree: boolean;
    image?: ExternalBlob;
    price: bigint;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type CreatorId = Principal;
export type UserId = Principal;
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface Progress {
    streak: bigint;
    goalWeight: number;
    currentWeight: number;
    checkpointsCompleted: bigint;
}
export interface Message {
    content: string;
    sender: string;
    timestamp: Time;
}
export interface DailyTask {
    waterIntake: boolean;
    date: Time;
    caloriesLogged: boolean;
    weighIn: boolean;
    stepsCompleted: boolean;
    workoutComplete: boolean;
}
export interface Block {
    id: string;
    content: string;
    order: bigint;
    blockType: string;
    options: Array<string>;
}
export interface WeightEntry {
    weight: number;
    date: Time;
}
export interface UserProfile {
    bio: string;
    username: string;
    completedTasks: Array<Time>;
    banner?: ExternalBlob;
    followers: bigint;
    following: bigint;
    hasCompletedSetup: boolean;
    avatar?: ExternalBlob;
}
export interface Reaction {
    userId: UserId;
    reactionType: Variant_sad_wow_angry_haha_like_love;
    timestamp: Time;
    postId: PostId;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_sad_wow_angry_haha_like_love {
    sad = "sad",
    wow = "wow",
    angry = "angry",
    haha = "haha",
    like = "like",
    love = "love"
}
export interface backendInterface {
    addComment(postId: PostId, comment: Comment): Promise<void>;
    addReaction(postId: PostId, reactionType: Variant_sad_wow_angry_haha_like_love): Promise<void>;
    addReview(blueprintId: string, review: Review): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    checkBlueprintOwnership(user: Principal, blueprintId: string): Promise<boolean>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createMarketplaceBlueprint(blueprint: MarketplaceBlueprint): Promise<void>;
    createPost(post: Post): Promise<void>;
    createProjectBlueprint(blueprint: ProjectBlueprintView): Promise<void>;
    deletePost(postId: PostId): Promise<void>;
    followUser(targetUser: Principal): Promise<void>;
    getBlueprint(): Promise<Blueprint | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getComments(postId: PostId): Promise<Array<Comment>>;
    getCreatedBlueprints(): Promise<Array<string>>;
    getDailyTasks(): Promise<Array<[Time, DailyTask]>>;
    getFollowers(user: Principal): Promise<bigint>;
    getMarketplaceBlueprint(blueprintId: string): Promise<MarketplaceBlueprint | null>;
    getMarketplaceBlueprints(): Promise<Array<MarketplaceBlueprint>>;
    getMessages(conversationId: string): Promise<Array<Message>>;
    getOwnedBlueprints(): Promise<Array<OwnershipRecord>>;
    getPost(postId: PostId): Promise<Post | null>;
    getPosts(): Promise<Array<Post>>;
    getProgress(): Promise<Progress | null>;
    getProjectBlueprints(): Promise<Array<ProjectBlueprintView>>;
    getReactions(postId: PostId): Promise<Array<Reaction>>;
    getReviews(blueprintId: string): Promise<Array<Review>>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWeightEntries(): Promise<Array<[Time, WeightEntry]>>;
    initializeLikedBy(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    likePost(postId: PostId): Promise<void>;
    purchaseBlueprint(blueprintId: string): Promise<void>;
    saveBlueprint(blueprint: Blueprint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveDailyTask(date: Time, task: DailyTask): Promise<void>;
    saveProgress(userProgress: Progress): Promise<void>;
    saveWeightEntry(entry: WeightEntry): Promise<void>;
    sendMessage(conversationId: string, message: Message): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    unfollowUser(targetUser: Principal): Promise<void>;
}
