# Specification

## Summary
**Goal:** Add free-form tags to blueprint publishing and use those tags in marketplace search and display.

**Planned changes:**
- Add a “Tags” section to the Step-Based Blueprint Studio publish flow that lets creators add/remove multiple free-form text tags and review the current list before publishing.
- Extend the backend `MarketplaceBlueprint` model to persist and return `tags : [Text]` end-to-end through `createMarketplaceBlueprint`, `getMarketplaceBlueprint`, and `getMarketplaceBlueprints` (defaulting to an empty array when absent).
- Update frontend shared types and demo marketplace data to include `tags: string[]`.
- Ensure Studio publishing also creates/updates a marketplace blueprint record that includes the submitted tags (using the existing `createMarketplaceBlueprint` flow in addition to existing project-blueprint creation).
- Update marketplace search filtering to match against `blueprint.tags` (case-insensitive) and render blueprint tags on marketplace cards as readable badges/chips when present.

**User-visible outcome:** Creators can add free-form tags when publishing a blueprint, and users can search marketplace blueprints by those tags and see tags displayed on blueprint cards.
