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

## 2026-08-30 — post-evaluation main integration refresh

- Severity: required integration refresh; no product rescope.
- `origin/main` advanced from the locked research base to `f8b4f804` after #1746 changed shared
  generated assets. The feature branch merged that commit without rebasing so existing gate
  evidence remains attached to its original commits.
- The merge conflicted only in the two authorized agent-docs outputs and the authorized MCP publish
  asset. Each conflict stayed inside the ceiling; the combined outputs were produced by
  `gen:agent-docs-prose` and `gen:publish-assets`, not by hand.
- The refreshed agent-docs and publish-assets prechecks were stale as expected. The MCP export
  corpus precheck was already fresh (exit 0) on the merged tree; its generator and final check kept
  the same corpus hash. This measured pass replaces the expected-negative outcome for this
  integration refresh without changing the locked derivative ownership.
- The separate close-gate red was coordinator-diagnosed as a label-timing race. The acceptance
  mapping, issue boxes, labels, and PR state were deliberately left untouched by this lane.

## 2026-08-30 — assets-barrel ceiling addition and #1748 ordering hold

- Severity: coordinator-authorized bookkeeping correction; no design rescope.
- Add exactly `packages/cli/src/kernel/assets/agent-docs.generated.ts` to the ceiling as a
  mechanical generated output. It may be produced solely by `deno task gen:assets-barrel`, may
  contain only generator-produced content, and must never be hand-edited. Any additional generated
  path forced by that refresh remains rescope-and-stop.
- Reason: publishing the new SDK `./presets` subpath changes the CLI's embedded agent-docs export
  inventory. The coordinator's base-vs-head measurement has `check:assets-barrel` passing at main
  `f8b4f804` and failing at merged leaf head `d1f8afe9`, with this file gaining `./presets` and a
  regenerated SHA/prose payload.
- #1748 is the active corpus landing and must merge before the final derivative refresh. No asset
  is regenerated or pushed in this checkpoint; the single post-#1748 refresh will run the complete
  cascade once against the coordinator-supplied merge SHA.

## 2026-08-30 — final post-#1748 derivative refresh

- Severity: required integration refresh inside the expanded ceiling; no design or product rescope.
- The branch merged #1748 at `952cc106aafea61570d24247695ac23f5d810026` without rebasing. Its
  conflicts were limited to the already-authorized agent-docs pair and MCP publish asset. Incoming
  #1748 versions were used as the regeneration baseline, preserving the Aspire terminology change;
  this leaf's cache-provider migration text remains present on all four owned SDK guidance pages.
- The complete dependency-ordered cascade ran once. Agent-docs, assets-barrel, and publish-assets
  prechecks were stale and their final checks passed. MCP export-corpus was already fresh at its
  precheck; its generator and final check reproduced the same hash, so the worklog records a measured
  PASS instead of inventing an expected negative.
- `gen:assets-barrel` changed only the authorized
  `packages/cli/src/kernel/assets/agent-docs.generated.ts`, including the SDK `./presets` inventory
  entry. No additional generated path was forced, so the rescope-and-stop condition did not fire.

## 2026-08-30 — final post-#1755 derivative refresh

- Severity: required final integration refresh inside the expanded ceiling; no design or product
  rescope.
- The branch merged #1755 at `a5520e70b43fa792c36451270742240e0f2aa889` without rebasing. The
  four conflicts were exactly the shared generated outputs named by the coordinator. Incoming-main
  versions were used as generator inputs, preserving #1755's quickstart skills tree and #1748's
  Aspire terminology while the owned SDK migration pages remained intact.
- Agent-docs, assets-barrel, and publish-assets prechecks were stale and passed after their named
  generators. MCP export-corpus was already fresh; its generator and final check reproduced the
  same hash. No additional output path was forced.
- The prior `MECHANICAL_PASS` receipt `ca46f565`, evaluated at `f1ff5557`, is superseded by this
  integration and is intentionally not treated as currency for the new head.

## 2026-08-30 — SDK runtime-closure manifest consumer amendment

- Severity: coordinator-authorized semantic ceiling amendment; no broader CLI/runtime rescope.
- The coordinator amendment named
  `packages/cli/src/kernel/domain/dependency-closures/netscript-web-runtime-closure_test.ts`, but
  that file contains only the live-manifest parity assertion and no editable expected export list.
  The expectation actually lives in `NETSCRIPT_WEB_RUNTIME_EXPORTS` in the sibling source module,
  `netscript-web-runtime-closure.ts`. Based on the supervisor's source reading, this slice
  substitutes that source path pending coordinator confirmation and deliberately leaves the test
  untouched.
- Adding `./presets` is semantic rather than bookkeeping: the constant defines the published SDK
  subpaths that must share the web runtime's exact release/origin closure. The browser-safe preset
  entry belongs in that closure while its graph remains incapable of instantiating the cache-provider
  singleton.
- This leaf caused the propagation by adding a published SDK subpath. The closure constant is the
  third export-map consumer found, after the CLI embedded agent-docs inventory and the MCP export
  corpus. No other closure, topology, CLI, or runtime path was changed.

## 2026-08-30 — post-#1731/#1761 main integration refresh

- Severity: coordinator-required final-base integration; no product rescope.
- The branch merged `origin/main` `3e5cbabfcd0a8c1aea5383fa7e1c4f111386dc3c` with `--no-ff` at
  merge commit `435c6f69`. The five conflicts were exactly the shared generated carriers named by
  the coordinator. Each took main's version to complete the merge, then was regenerated solely by
  its named task; no generated file was hand-merged.
- `packages/sdk/README.md` auto-merged without conflict. Artifact comparison confirms both intents:
  #1731's declaration-safe procedure-metadata/contract typing prose and this leaf's browser-safe
  preset plus explicit cache-provider migration all remain. No manual rewrite was necessary.
- D4 did not drift after #1731 changed ports/query types. The decidable baseline comparison still
  finds 69 baseline port types, a required/actual 68-type preset closure after excluding only
  `QueryClientPort`, `CreateServiceClientOptions` present, no missing or unexpected closure name,
  no wildcard, no ports runtime export, and no widening to post-baseline procedure-meta names.
- The earlier supervisor mismatch is now coordinator-confirmed: the closure source module is the
  authorized expectation owner and its parity test remains unchanged.
- The supervisor-produced `leak-report.md` is committed as run evidence. It contains no thread,
  session, rollout, or daemon handle and reports no surviving Aspire resources.
