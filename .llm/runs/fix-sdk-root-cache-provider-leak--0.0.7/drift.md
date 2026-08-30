# Drift Log: SDK root cache-provider isolation

Drift is append-only. Record facts that diverge from the locked plan, doctrine, or current-state
documentation.

No material drift is recorded in S1.

Tool availability note (non-scope): the requested `rtk` executable is unavailable on this host, so
focused raw `rg`/Git reads were used. This does not change product scope or the structured gate
requirements.

## 2026-08-30 — PLAN-EVAL cycle 1 measurement repair

- Severity: plan evidence correction; no product rescope and no implementation started.
- The locked S2 deletion of `globalThis.Deno` was not executable: Deno's Node-compat layer crashed
  before `hasCacheProvider()` could be read. The revision keeps Deno intact and makes the observed
  `true` boolean the only acceptable base red.
- The generated derivative plan skipped the Lume-owned agent-docs pair. The ceiling now explicitly
  owns `.llm/assets/agent-docs/prose.json.gz` and `provenance.json`, plus the three additional
  public prose pages that teach the removed behavior. The cascade is locked in tool dependency
  order.
- The accepted three-move design and Archetype-2 doctrine verdict are unchanged. F9's neighbouring
  Fresh-root reachability remains an out-of-scope coordinator follow-up reference.

## 2026-08-30 — S3 compatibility closure measured by workspace publish

- Severity: implementation correction inside the locked ceiling; no product rescope.
- The first workspace publish dry-run failed six Fresh checks because existing Fresh sources import
  `CachedEntry` and `CacheEntry` from the SDK root. The coarse claim “root cache exports are removed”
  would have hidden this consumer-level regression.
- `packages/sdk/mod.ts` now preserves those two package-owned types as explicit type-only exports.
  It does not restore the cache barrel, runtime values, module-load registration, or KV/logger edge.
  The final workspace publish dry-run and committed graph assertion pass.

## 2026-08-30 — S3 Markdown formatter recovery

- Severity: tooling correction inside already-owned documentation paths; no scope change.
- A generic Deno Markdown format pass rewrote quoted Vento expressions into invalid source. The four
  affected pages were restored to their S2 content and the intended compatibility edits were
  reapplied narrowly.
- `deno task --cwd docs/site check:source-format` and the full Lume-backed
  `check:agent-docs-prose` now pass. No generic formatter was rerun on those site pages.

## 2026-08-30 — S3 derivative measurement

- `check:publish-assets` named only `packages/mcp/src/publish-assets.generated.ts` stale after the
  agent-docs bundle changed; the authorized CLI generated asset did not change. The implementation
  records the tool's artifact-derived result rather than repeating the plan's broader expectation.
- Repo-wide `surface:diff` remains a measured negative with 559 undeclared major changes spanning
  many packages. The SDK claim is therefore proved at finer granularity by decoding the regenerated
  MCP export corpus: `./presets` is new, its curated closure excludes `QueryClientPort`, and the root
  no longer exposes server cache values while preserving the two required cache-entry types.
