# Worklog

## Design

- Public surface: canonical pillar URLs, legacy redirect URLs, sidebar navigation, and stable `cap:*` xrefs.
- Domain vocabulary: 15 legacy capability slugs mapped to canonical pillar paths; nine ordered pillars; two navigable stubs.
- Ports: Lume page rendering and the existing `url` filter/base-path behavior.
- Constants: the mapping is locked by proposal §2.2 and represented by redirect frontmatter + xref entries.
- Commit slices: one structural docs slice, proven by `deno task verify`, redirect inspection, grep, nav/stub assertions, and scope/lock checks.
- Deferred: prose rewrites/merges, tutorial nav anchors, framework/package/plugin changes.
- Contributor path: add concepts inside the owning pillar, register stable xrefs in `_data/xref.ts`, and add nav leaves in `_data.ts`.

## Plan gate

- PLAN-EVAL owner-waived; recorded as drift D1 before implementation.

## Evidence

- `deno task verify` in `docs/site`: exit 0; 23,016 internal links across 162 pages resolve; 27 caveat markers across 22 pages resolve.
- Built redirect inspection: all 15 `/capabilities/<slug>/` documents exist and contain their mapped `/netscript/<pillar>/` canonical/refresh target (`redirects=15 PASS`).
- `rg 'capabilities/' docs/site/_data.ts docs/site/_data/xref.ts`: no matches.
- Nine pillar headings remain in the original order; exact `_data.ts` heading lines verified.
- Stub nav: `/ai/mcp/` and `/orchestration-runtime/cli-scaffold/` both present in `_data.ts`; built pages exist.
- Scope/lock check: no path under `packages/` or `plugins/`, and no `deno.lock`, appears in the diff (`scope-lock=PASS`).

## Reconcile

- Issue #433 remains open with the expected docs/refactor taxonomy and beta.7 milestone. No PR was opened per owner instruction.
