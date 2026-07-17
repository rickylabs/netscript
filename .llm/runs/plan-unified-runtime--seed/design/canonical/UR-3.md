<!-- seed:plan-unified-runtime slot:UR-3 -->

# UR-3 — Mount Fresh via `app.handler()` with declared route/static ownership

- **Slot:** UR-3
- **Owning pack:** D1 composition-host (draft D1-3)
- **Labels:** `type:feat`, `area:fresh`, `area:deploy`, `epic:unified-runtime`, `epic:deployment`, `priority:p1`, `wave:v1`, `status:plan`
- **Milestone:** `0.0.1-beta.13`
- **Depends on:** UR-2 (Nitro host integration)
- **Blocks:** UR-10

## Body

> Part of #823
>
> <!-- seed:plan-unified-runtime slot:UR-3 -->
>
> Mount the Fresh UI by calling `defineFreshApp()`'s `app.handler()` as an opaque Fetch delegate —
> **never `app.listen()`**. Preserve the shipped wrapper's middleware ordering and filesystem routes
> intact (`packages/fresh/src/runtime/server/define-fresh-app.ts`). Declare non-overlapping route
> spaces (RPC subtree, health/metadata, Fresh UI, static assets); Fresh is the final UI fallback only,
> mounted after Nitro matches the RPC prefix and health paths — no wildcard above the RPC prefix.
> Declare static-asset ownership per namespace (default per **F-5**: Fresh owns its island/`_fresh`
> assets; Nitro owns host public dir) and verify through the composed entry point. See proposal.md §3
> (evidence: `research/orpc-fresh.md` Route/Static ownership rows).

## Acceptance / gates

- [ ] gate: Fresh mounted via `app.handler()`; no `app.listen()` anywhere in the graph
- [ ] gate: RPC / health / Fresh-UI / static route spaces declared disjoint; no catch-all above RPC prefix
- [ ] gate: Fresh middleware chain reached for its route space through the composed entry point
- [ ] gate: static-asset ownership declared per namespace; cache headers/fallbacks/error pages verified through composed entry point

## Fork deltas

**F-5 (static-asset ownership).**
- **A (default) — Fresh-owns-islands:** Fresh owns `_fresh`/island namespace; Nitro owns host public
  dir; the two namespaces declared disjoint in the mount table. Acceptance as written above.
- **B — Nitro-owns-all:** host-level static serving assigned to Nitro wholesale (single asset
  pipeline); Fresh asset requests route through the outer host. Under B, the fourth acceptance box
  becomes "all static namespaces served by the Nitro public-asset stage; Fresh island assets
  resolved through the host pipeline," and the disjoint-namespace assertion is dropped.
