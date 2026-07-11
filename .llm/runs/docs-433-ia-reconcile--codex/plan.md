# Plan

## Locked decisions

1. Move the 13 one-to-one capability pages byte-for-byte to the proposal targets.
2. Treat the two fold mappings as redirects to existing pillar indexes; do not merge or rewrite prose in S0.
3. Generate static HTML redirect documents at all 15 old leaf URLs plus the retired capabilities index URL, using a dedicated Vento layout with canonical, meta-refresh, and JavaScript replacement targets.
4. Retarget `cap:*`, the three landing cards, and hard-coded internal capability links to canonical pillar URLs while leaving tutorial nav anchors unchanged.
5. Add minimal titled stubs for CLI/scaffold and MCP and expose them in their pillar nav sections.

## Open decisions

- HTTP 301 at GitHub Pages hosting: safe to defer; the static host cannot emit per-page status codes. Redirect documents preserve URLs client-side and canonical metadata.

## Slices and gates

1. IA + redirects + nav/xrefs/stubs — `deno task verify`, built redirect inspection, grep/nav assertions; docs-site files and run artifacts only.

## Risks

- Stale hard-coded links: mitigate with site verify and a full `/capabilities/` scan.
- Base-path mistakes: redirect layout uses Lume's `url` filter.
- Prose churn: verify moved blobs with git rename detection/diff review.
- Lock churn: compare `deno.lock` before commit.

## Deferred scope

- All prose rewriting/merging, tutorial chapter anchors, framework code, and deployment authoring.
- JSR audit: N/A, docs-only and no package/plugin public surface changes.

