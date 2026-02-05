# Specification

## Summary
**Goal:** Ensure real marketplace blueprint purchases are handled via backend ownership so they appear immediately in My Blueprints → Purchased after buying.

**Planned changes:**
- Update demo-vs-real blueprint detection so real, user-created marketplace blueprints are not treated as demo items based on an ID prefix.
- Ensure buying a real marketplace blueprint calls the backend `purchaseBlueprint(blueprintId)` mutation (instead of sessionStorage demo purchase tracking).
- Ensure ownership checks for real marketplace blueprints use backend ownership (`checkBlueprintOwnership`) rather than session-based demo ownership.
- After a successful backend purchase, refresh/invalidate the owned-blueprints query state so My Blueprints → Purchased reflects the new purchase without a hard refresh.

**User-visible outcome:** After buying a real marketplace blueprint, it shows up right away under My Blueprints → Purchased, and purchase/ownership status is correctly tracked via the backend.
