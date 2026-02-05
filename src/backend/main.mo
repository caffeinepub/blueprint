import Map "mo:core/Map";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";
import Stripe "stripe/stripe";
import MixinAuthorization "authorization/MixinAuthorization";
import OutCall "http-outcalls/outcall";
import Runtime "mo:core/Runtime";

actor {
  include MixinStorage();

  var stripeConfiguration : ?Stripe.StripeConfiguration = null;

  public type UserId = Principal;
  public type CreatorId = Principal;
  public type OwnerId = Principal;
  public type PostId = Text;

  public type MarketplaceBlueprint = {
    id : Text;
    image : ?Storage.ExternalBlob;
    description : Text;
    creator : CreatorId;
    price : Nat;
    isFree : Bool;
    createdAt : Time.Time;
    theme : BlueprintTheme;
    tags : [Text];
  };

  public type OwnershipRecord = {
    blueprintId : Text;
    owner : OwnerId;
    purchaseTime : Time.Time;
  };

  public type Review = {
    author : Text;
    rating : Nat;
    comment : Text;
    timestamp : Time.Time;
  };

  public type Post = {
    id : PostId;
    author : Text;
    content : Text;
    image : ?Storage.ExternalBlob;
    attachedBlueprintId : ?Text;
    createdAt : Time.Time;
    likes : Nat;
    comments : Nat;
    likedBy : [Principal];
  };

  public type Comment = {
    author : Text;
    content : Text;
    createdAt : Time.Time;
  };

  public type Message = {
    sender : Text;
    content : Text;
    timestamp : Time.Time;
  };

  public type UserProfile = {
    username : Text;
    avatar : ?Storage.ExternalBlob;
    banner : ?Storage.ExternalBlob;
    bio : Text;
    followers : Nat;
    following : Nat;
    hasCompletedSetup : Bool;
    completedTasks : [Time.Time];
  };

  public type BlueprintTheme = {
    primaryColor : Text;
    secondaryColor : Text;
    accentColor : Text;
    bannerImage : ?Storage.ExternalBlob;
  };

  public type Blueprint = {
    id : Text;
    poundsToLose : Float;
    weeks : Nat;
    calorieGoal : Float;
    createdAt : Time.Time;
    active : Bool;
    theme : BlueprintTheme;
  };

  public type DailyTask = {
    date : Time.Time;
    caloriesLogged : Bool;
    waterIntake : Bool;
    workoutComplete : Bool;
    weighIn : Bool;
    stepsCompleted : Bool;
  };

  public type WeightEntry = {
    date : Time.Time;
    weight : Float;
  };

  public type Progress = {
    streak : Nat;
    checkpointsCompleted : Nat;
    currentWeight : Float;
    goalWeight : Float;
  };

  public type BlockchainTransaction = {
    from : Text;
    to : Text;
    amount : Float;
    description : Text;
    timestamp : Int;
  };

  public type BlueprintTemplateType = {
    #weightLoss;
    #strength;
    #custom;
  };

  public type BlueprintMilestone = {
    description : Text;
    week : Nat;
    calories : Float;
    steps : Nat;
    workouts : Nat;
    goalWeight : Float;
  };

  public type CustomBlueprint = {
    title : Text;
    description : Text;
    image : ?Storage.ExternalBlob;
    milestones : [CustomMilestone];
    categories : [Text];
  };

  public type CustomMilestone = {
    title : Text;
    description : Text;
    week : Nat;
  };

  public type Step = {
    id : Text;
    name : Text;
    order : Nat;
    blocks : Map.Map<Text, Block>;
  };

  public type StepView = {
    id : Text;
    name : Text;
    order : Nat;
    blocks : [Block];
  };

  public type ProjectBlueprintView = {
    id : Text;
    title : Text;
    steps : [StepView];
    createdBy : Principal;
  };

  public type ProjectBlueprint = {
    id : Text;
    title : Text;
    steps : Map.Map<Text, Step>;
    createdBy : Principal;
  };

  public type Block = {
    id : Text;
    blockType : Text;
    content : Text;
    options : [Text];
    order : Nat;
  };

  public type Reaction = {
    postId : PostId;
    userId : UserId;
    reactionType : {
      #like;
      #love;
      #haha;
      #wow;
      #sad;
      #angry;
    };
    timestamp : Time.Time;
  };

  let reactions = Map.empty<Text, Reaction>();
  let projectBlueprints = Map.empty<Text, ProjectBlueprint>();
  let posts = Map.empty<Text, Post>();
  let comments = Map.empty<Text, Map.Map<Text, Comment>>();
  let messages = Map.empty<Text, Map.Map<Text, Message>>();
  let conversationParticipants = Map.empty<Text, (Principal, Principal)>();
  let blueprints = Map.empty<Principal, Blueprint>();
  let dailyTasks = Map.empty<Principal, Map.Map<Time.Time, DailyTask>>();
  let weightEntries = Map.empty<Principal, Map.Map<Time.Time, WeightEntry>>();
  let progress = Map.empty<Principal, Progress>();
  let followers = Map.empty<Principal, Map.Map<Principal, Bool>>();
  let marketplace = Map.empty<Text, MarketplaceBlueprint>();
  let blockchain = Map.empty<Text, BlockchainTransaction>();
  let ownershipRecords = Map.empty<Text, OwnershipRecord>();
  let ownedBlueprints = Map.empty<Principal, Map.Map<Text, OwnershipRecord>>();
  let reviews = Map.empty<Text, Map.Map<Text, Review>>();
  let customBlueprints = Map.empty<Principal, CustomBlueprint>();
  let createdBlueprints = Map.empty<Principal, Map.Map<Text, Bool>>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let userProfiles = Map.empty<Principal, UserProfile>();

  // Blueprint Ownership Check
  public query ({ caller }) func checkBlueprintOwnership(user : Principal, blueprintId : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check blueprint ownership");
    };
    if (caller != user) {
      Runtime.trap("Unauthorized: Can only check your own blueprint ownership");
    };
    switch (ownedBlueprints.get(user)) {
      case (null) { false };
      case (?owned) {
        owned.get(blueprintId) != null;
      };
    };
  };

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Stripe Configuration (Admin Only)
  public query func isStripeConfigured() : async Bool {
    stripeConfiguration != null;
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    stripeConfiguration := ?config;
  };

  func getStripeConfiguration() : Stripe.StripeConfiguration {
    switch (stripeConfiguration) {
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?value) { value };
    };
  };

  // Stripe Session Management (User Only)
  public shared ({ caller }) func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check session status");
    };
    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create checkout sessions");
    };
    await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // Post Management
  public query func getPosts() : async [Post] {
    posts.values().toArray();
  };

  public query func getPost(postId : PostId) : async ?Post {
    posts.get(postId);
  };

  public shared ({ caller }) func createPost(post : Post) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create posts");
    };
    posts.add(post.id, post);
  };

  public shared ({ caller }) func deletePost(postId : PostId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete posts");
    };
    switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post not found") };
      case (?post) {
        switch (userProfiles.get(caller)) {
          case (null) { Runtime.trap("User profile not found") };
          case (?profile) {
            if (post.author != profile.username and not AccessControl.isAdmin(accessControlState, caller)) {
              Runtime.trap("Unauthorized: Can only delete your own posts");
            };
            posts.remove(postId);
          };
        };
      };
    };
  };

  public shared ({ caller }) func likePost(postId : PostId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can like posts");
    };
    switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post not found") };
      case (?post) {
        let alreadyLiked = post.likedBy.find(func(userId) { userId == caller }) != null;
        let newLikedBy = if (alreadyLiked) {
          post.likedBy.filter(func(userId) { userId != caller });
        } else {
          post.likedBy.concat([caller]);
        };
        let updatedPost = {
          id = post.id;
          author = post.author;
          content = post.content;
          image = post.image;
          attachedBlueprintId = post.attachedBlueprintId;
          createdAt = post.createdAt;
          likes = if (alreadyLiked) { post.likes - 1 } else { post.likes + 1 };
          comments = post.comments;
          likedBy = newLikedBy;
        };
        posts.add(postId, updatedPost);
      };
    };
  };

  // Comment Management
  public query func getComments(postId : PostId) : async [Comment] {
    switch (comments.get(postId)) {
      case (null) { [] };
      case (?postComments) { postComments.values().toArray() };
    };
  };

  public shared ({ caller }) func addComment(postId : PostId, comment : Comment) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add comments");
    };
    let commentId = postId.concat("-").concat(Time.now().toText());
    switch (comments.get(postId)) {
      case (null) {
        let newComments = Map.empty<Text, Comment>();
        newComments.add(commentId, comment);
        comments.add(postId, newComments);
      };
      case (?postComments) {
        postComments.add(commentId, comment);
      };
    };
    // Update comment count on post
    switch (posts.get(postId)) {
      case (null) {};
      case (?post) {
        let updatedPost = {
          id = post.id;
          author = post.author;
          content = post.content;
          image = post.image;
          attachedBlueprintId = post.attachedBlueprintId;
          createdAt = post.createdAt;
          likes = post.likes;
          comments = post.comments + 1;
          likedBy = post.likedBy;
        };
        posts.add(postId, updatedPost);
      };
    };
  };

  // Follower Management
  public shared ({ caller }) func followUser(targetUser : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can follow others");
    };
    if (caller == targetUser) {
      Runtime.trap("Cannot follow yourself");
    };
    switch (followers.get(caller)) {
      case (null) {
        let newFollowing = Map.empty<Principal, Bool>();
        newFollowing.add(targetUser, true);
        followers.add(caller, newFollowing);
      };
      case (?following) {
        following.add(targetUser, true);
      };
    };
  };

  public shared ({ caller }) func unfollowUser(targetUser : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can unfollow others");
    };
    switch (followers.get(caller)) {
      case (null) {};
      case (?following) {
        following.remove(targetUser);
      };
    };
  };

  public query func getFollowers(user : Principal) : async Nat {
    var count = 0;
    for ((follower, following) in followers.entries()) {
      switch (following.get(user)) {
        case (null) {};
        case (?_) { count += 1 };
      };
    };
    count;
  };

  // Blueprint Management
  public query func getMarketplaceBlueprints() : async [MarketplaceBlueprint] {
    marketplace.values().toArray();
  };

  public query func getMarketplaceBlueprint(blueprintId : Text) : async ?MarketplaceBlueprint {
    marketplace.get(blueprintId);
  };

  public query ({ caller }) func getCreatedBlueprints() : async [Text] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their created blueprints");
    };
    switch (createdBlueprints.get(caller)) {
      case (null) { [] };
      case (?created) { created.keys().toArray() };
    };
  };

  public shared ({ caller }) func createMarketplaceBlueprint(blueprint : MarketplaceBlueprint) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create blueprints");
    };
    if (blueprint.creator != caller) {
      Runtime.trap("Unauthorized: Creator must match caller");
    };
    marketplace.add(blueprint.id, blueprint);
    // Track created blueprints
    switch (createdBlueprints.get(caller)) {
      case (null) {
        let newCreated = Map.empty<Text, Bool>();
        newCreated.add(blueprint.id, true);
        createdBlueprints.add(caller, newCreated);
      };
      case (?created) {
        created.add(blueprint.id, true);
      };
    };
  };

  public shared ({ caller }) func purchaseBlueprint(blueprintId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can purchase blueprints");
    };
    switch (marketplace.get(blueprintId)) {
      case (null) { Runtime.trap("Blueprint not found") };
      case (?blueprint) {
        let ownership = {
          blueprintId = blueprintId;
          owner = caller;
          purchaseTime = Time.now();
        };
        ownershipRecords.add(blueprintId, ownership);
        switch (ownedBlueprints.get(caller)) {
          case (null) {
            let newOwned = Map.empty<Text, OwnershipRecord>();
            newOwned.add(blueprintId, ownership);
            ownedBlueprints.add(caller, newOwned);
          };
          case (?owned) {
            owned.add(blueprintId, ownership);
          };
        };
      };
    };
  };

  public query ({ caller }) func getOwnedBlueprints() : async [OwnershipRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view owned blueprints");
    };
    switch (ownedBlueprints.get(caller)) {
      case (null) { [] };
      case (?owned) { owned.values().toArray() };
    };
  };

  // Review Management
  public query func getReviews(blueprintId : Text) : async [Review] {
    switch (reviews.get(blueprintId)) {
      case (null) { [] };
      case (?blueprintReviews) { blueprintReviews.values().toArray() };
    };
  };

  public shared ({ caller }) func addReview(blueprintId : Text, review : Review) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add reviews");
    };
    // Verify ownership
    switch (ownedBlueprints.get(caller)) {
      case (null) { Runtime.trap("Must own blueprint to review") };
      case (?owned) {
        switch (owned.get(blueprintId)) {
          case (null) { Runtime.trap("Must own blueprint to review") };
          case (?_) {
            let reviewId = blueprintId.concat("-").concat(Time.now().toText());
            switch (reviews.get(blueprintId)) {
              case (null) {
                let newReviews = Map.empty<Text, Review>();
                newReviews.add(reviewId, review);
                reviews.add(blueprintId, newReviews);
              };
              case (?blueprintReviews) {
                blueprintReviews.add(reviewId, review);
              };
            };
          };
        };
      };
    };
  };

  // Message Management
  public query ({ caller }) func getMessages(conversationId : Text) : async [Message] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view messages");
    };
    // Verify caller is participant
    switch (conversationParticipants.get(conversationId)) {
      case (null) { Runtime.trap("Conversation not found") };
      case (?(user1, user2)) {
        if (caller != user1 and caller != user2) {
          Runtime.trap("Unauthorized: Not a participant in this conversation");
        };
        switch (messages.get(conversationId)) {
          case (null) { [] };
          case (?conversationMessages) { conversationMessages.values().toArray() };
        };
      };
    };
  };

  public shared ({ caller }) func sendMessage(conversationId : Text, message : Message) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };
    // Verify caller is participant
    switch (conversationParticipants.get(conversationId)) {
      case (null) { Runtime.trap("Conversation not found") };
      case (?(user1, user2)) {
        if (caller != user1 and caller != user2) {
          Runtime.trap("Unauthorized: Not a participant in this conversation");
        };
        let messageId = conversationId.concat("-").concat(Time.now().toText());
        switch (messages.get(conversationId)) {
          case (null) {
            let newMessages = Map.empty<Text, Message>();
            newMessages.add(messageId, message);
            messages.add(conversationId, newMessages);
          };
          case (?conversationMessages) {
            conversationMessages.add(messageId, message);
          };
        };
      };
    };
  };

  // Project Blueprint Management
  public query func getProjectBlueprints() : async [ProjectBlueprintView] {
    let blueprintArray = projectBlueprints.values().toArray();
    blueprintArray.map<ProjectBlueprint, ProjectBlueprintView>(
      func(pb : ProjectBlueprint) : ProjectBlueprintView {
        let stepsArray = pb.steps.values().toArray();
        let stepsView = stepsArray.map(
          func(step : Step) : StepView {
            {
              id = step.id;
              name = step.name;
              order = step.order;
              blocks = step.blocks.values().toArray();
            };
          },
        );
        {
          id = pb.id;
          title = pb.title;
          steps = stepsView;
          createdBy = pb.createdBy;
        };
      },
    );
  };

  public shared ({ caller }) func createProjectBlueprint(blueprint : ProjectBlueprintView) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create project blueprints");
    };
    if (blueprint.createdBy != caller) {
      Runtime.trap("Unauthorized: Creator must match caller");
    };
    let stepsMap = Map.empty<Text, Step>();
    for (stepView in blueprint.steps.values()) {
      let blocksMap = Map.empty<Text, Block>();
      for (block in stepView.blocks.values()) {
        blocksMap.add(block.id, block);
      };
      let step : Step = {
        id = stepView.id;
        name = stepView.name;
        order = stepView.order;
        blocks = blocksMap;
      };
      stepsMap.add(step.id, step);
    };
    let projectBlueprint : ProjectBlueprint = {
      id = blueprint.id;
      title = blueprint.title;
      steps = stepsMap;
      createdBy = caller;
    };
    projectBlueprints.add(blueprint.id, projectBlueprint);
  };

  // Personal Blueprint Management
  public query ({ caller }) func getBlueprint() : async ?Blueprint {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their blueprint");
    };
    blueprints.get(caller);
  };

  public shared ({ caller }) func saveBlueprint(blueprint : Blueprint) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save blueprints");
    };
    blueprints.add(caller, blueprint);
  };

  // Daily Task Management
  public query ({ caller }) func getDailyTasks() : async [(Time.Time, DailyTask)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their tasks");
    };
    switch (dailyTasks.get(caller)) {
      case (null) { [] };
      case (?tasks) { tasks.entries().toArray() };
    };
  };

  public shared ({ caller }) func saveDailyTask(date : Time.Time, task : DailyTask) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save tasks");
    };
    switch (dailyTasks.get(caller)) {
      case (null) {
        let newTasks = Map.empty<Time.Time, DailyTask>();
        newTasks.add(date, task);
        dailyTasks.add(caller, newTasks);
      };
      case (?tasks) {
        tasks.add(date, task);
      };
    };
  };

  // Weight Entry Management
  public query ({ caller }) func getWeightEntries() : async [(Time.Time, WeightEntry)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their weight entries");
    };
    switch (weightEntries.get(caller)) {
      case (null) { [] };
      case (?entries) { entries.entries().toArray() };
    };
  };

  public shared ({ caller }) func saveWeightEntry(entry : WeightEntry) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save weight entries");
    };
    switch (weightEntries.get(caller)) {
      case (null) {
        let newEntries = Map.empty<Time.Time, WeightEntry>();
        newEntries.add(entry.date, entry);
        weightEntries.add(caller, newEntries);
      };
      case (?entries) {
        entries.add(entry.date, entry);
      };
    };
  };

  // Progress Management
  public query ({ caller }) func getProgress() : async ?Progress {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their progress");
    };
    progress.get(caller);
  };

  public shared ({ caller }) func saveProgress(userProgress : Progress) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save progress");
    };
    progress.add(caller, userProgress);
  };

  // Reaction Management
  public shared ({ caller }) func addReaction(postId : PostId, reactionType : { #like; #love; #haha; #wow; #sad; #angry }) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add reactions");
    };
    let reactionId = postId.concat(caller.toText());
    let reaction : Reaction = {
      postId = postId;
      userId = caller;
      reactionType = reactionType;
      timestamp = Time.now();
    };
    reactions.add(reactionId, reaction);
  };

  public query func getReactions(postId : PostId) : async [Reaction] {
    let allReactions = reactions.values().toArray();
    allReactions.filter<Reaction>(func(r : Reaction) : Bool { r.postId == postId });
  };

  // Helper function to initialize likedBy for legacy posts
  public shared ({ caller }) func initializeLikedBy() : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can initialize likedBy");
    };
    for ((postId, post) in posts.entries()) {
      let updatedPost = {
        id = post.id;
        author = post.author;
        content = post.content;
        image = post.image;
        attachedBlueprintId = post.attachedBlueprintId;
        createdAt = post.createdAt;
        likes = post.likes;
        comments = post.comments;
        likedBy = [];
      };
      posts.add(postId, updatedPost);
    };
  };
};
