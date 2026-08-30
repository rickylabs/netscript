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
- Repo-wide `surface:diff` remains a measured negative: base `13878a80` has 542 undeclared major
  changes and measured head `1ccddd6e` has 552. The +10 delta is entirely SDK-scoped (45 -> 55).
  The SDK claim is proved at finer granularity by decoding the regenerated MCP export corpus:
  `./presets` is new, its curated closure excludes `QueryClientPort`, and the root no longer exposes
  server cache values while preserving the two required cache-entry types.

## 2026-08-30 — IMPL-EVAL cycle 1 predicate substitution and follow-ups

- Severity: evidence bookkeeping plus coordinator follow-ups; no product rescope. Separate
  IMPL-EVAL returned `PASS_IMPL` at evaluated head `83b7109c`.
- The locked S2 plan predicate named `cache-query.ts`, `kv-cache-store.ts`, and `@netscript/kv`.
  During PLAN-EVAL M1 the committed test substituted a workspace-resolved predicate that rejects
  `/packages/kv/`, `jsr:@netscript/kv`, every `node:` specifier, and `/packages/logger/` modules,
  plus raw `@netscript/kv` and `node:` dependency edges. This is stricter for transitive server
  edges and measures 0 for both root and presets at head; the evaluator separately confirmed the
  original named-file predicate also measures 0. The substitution is recorded rather than hidden.
- Coordinator follow-up F-2: `defineFreshApp()` unconditionally installs `cacheQuery`, so a custom
  provider registered before that call is overwritten. Plan D5 explicitly locked and PLAN-EVAL
  accepted this shape. A follow-up should either document that custom providers register after
  `defineFreshApp()` or guard default registration with `hasCacheProvider()`; this leaf does neither.
- Coordinator follow-up F-4: the CLI scaffold still emits the now-inert
  `import '@netscript/sdk/cache';` and tests that emitted line. Generated apps still cache through
  `defineFreshApp()`. Dropping the dead import and assertion requires a separate follow-up issue and
  remains outside this leaf's ceiling; no CLI file or issue was changed here.
