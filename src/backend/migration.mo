import Map "mo:core/Map";

module {
  type MarketplaceBlueprint = {
    id : Text;
    image : ?Blob;
    description : Text;
    creator : Principal;
    price : Nat;
    isFree : Bool;
    createdAt : Int;
    theme : BlueprintTheme;
    tags : [Text];
  };

  type BlueprintTheme = {
    primaryColor : Text;
    secondaryColor : Text;
    accentColor : Text;
    bannerImage : ?Blob;
  };

  type OldMarketplaceBlueprint = {
    id : Text;
    image : ?Blob;
    description : Text;
    creator : Principal;
    price : Nat;
    isFree : Bool;
    createdAt : Int;
    theme : BlueprintTheme;
  };

  type OldActor = {
    marketplace : Map.Map<Text, OldMarketplaceBlueprint>;
  };

  type NewActor = {
    marketplace : Map.Map<Text, MarketplaceBlueprint>;
  };

  public func run(old : OldActor) : NewActor {
    let newMarketplace = old.marketplace.map<Text, OldMarketplaceBlueprint, MarketplaceBlueprint>(
      func(_id, oldBlueprint) {
        { oldBlueprint with tags = [] };
      }
    );
    { marketplace = newMarketplace };
  };
};
