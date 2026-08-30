# Worklog: SDK root cache-provider isolation

## Run Metadata

| Field          | Value                                     |
| -------------- | ----------------------------------------- |
| Run ID         | `fix-sdk-root-cache-provider-leak--0.0.7` |
| Branch         | `fix/sdk-root-cache-provider-leak`        |
| Archetype      | `2 — Integration`                         |
| Scope overlays | none                                      |

## Design

### Public surface

- `@netscript/sdk` — remains the high-level entry with `defineServices`, but no cache engine or
  provider exports and no import-time registration.
- `@netscript/sdk/presets` — new focused browser-safe entry for `defineServices` and its
  package-owned dependent types.
- `@netscript/sdk/cache` — remains the server-only cache engine/provider entry, now load-time pure.
- `@netscript/sdk/query` — remains the provider registry/query entry used to observe registration.
- `@netscript/fresh/server` `defineFreshApp()` — server composition root that explicitly installs
  the default `cacheQuery` provider.

### Domain vocabulary

- `CacheProvider` — existing package-owned port used by query factories.
- `cacheQuery` — existing default server adapter instance.
- `defineServices` — existing composition preset; no new definition shape.
- “browser/shared import safety” — an intact-runtime fresh-child provider assertion plus a committed
  `deno info --json` graph assertion; it is not represented as a production browser/Vite run.

No new domain type is introduced.

### Ports, adapters, and composition root

- Port: existing `CacheProvider`; unchanged.
- Adapter: existing `cacheQuery` / `KvCacheStore`; unchanged behavior.
- Composition root: `defineFreshApp()` calls `setCacheProvider(cacheQuery)` before cache
  invalidation/routes are configured.
- Custom server composition roots call the same existing seam explicitly.

### Constants

No finite domain value is added. The test does not introduce named rollout, runtime, or provider
variant constants.

### Commit slices

| #  | Slice                                                                                                 | Gate                                                        | Files                                          |
| -- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------- |
| S1 | Lock research/design/scope/gates and hand off                                                         | Separate PLAN-EVAL                                          | Run directory only                             |
| S2 | Commit the failing intact-runtime root-import test and dormant final graph assertion alone            | Structured test: exit 1, 0 pass / 1 fail on observed `true` | New SDK regression test + run evidence only    |
| S3 | Make SDK surfaces pure and Fresh bootstrap explicit; update migration/reference/generated derivatives | Focused green tests + static/JSR/publish/generated gates    | Authorized product/docs/generated ceiling only |
| S4 | Reconcile final gate evidence without product changes                                                 | Full gate table + lock proof                                | Run artifacts only                             |

### Deferred scope

- CLI redundant bare cache import cleanup — not required for generated Fresh correctness and would
  require prohibited scaffold E2E.
- Existing SDK doc-lint/cardinality/slow-type findings — baseline-only, no regression.
- Real Vite/browser chunk execution — prohibited on this lane/host; coordinator/evaluator evidence.
- Cache algorithm, KV backend, provider contract, package version, and release baseline changes.
- PLAN-EVAL cycle 1 F9's neighbouring Fresh-root reachability edge — coordinator follow-up only; no
  additional Fresh source path is authorized.

### Contributor path

A server author imports `cacheQuery` and `setCacheProvider` from the documented SDK cache/query
entries and registers at their server composition root. A Fresh author calls `defineFreshApp()` and
gets the same explicit default. A browser/shared author imports `defineServices` from
`@netscript/sdk/presets`; a root import remains safe for compatibility.

## Progress log

| Time (UTC) | Slice | Step              | Notes                                                                                                                                                                             |
| ---------- | ----- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-30 | S1    | Bootstrap         | Verified branch/base/no-upstream and read required harness, doctrine, Deno/JSR, tools, PR, and RTK instructions. RTK is unavailable on this host, so focused raw reads were used. |
| 2026-08-30 | S1    | Research          | Used `deno doc` before focused source reads; verified issue/source chain and direct consumers.                                                                                    |
| 2026-08-30 | S1    | Baseline gates    | Full SDK doc-lint exit 1 (three unique private-ref files); direct preset file doc-lint exit 1 (10 private refs); JSR audit exit 0 with two existing warnings.                     |
| 2026-08-30 | S1    | Design checkpoint | Locked all three issue moves, compatibility migration, product/proof ceiling, commit slices, and generated cascade.                                                               |
| 2026-08-30 | S1    | Handoff           | PLAN-EVAL selected as mandatory hard stop; S2/S3 not started.                                                                                                                     |
| 2026-08-30 | S1    | PLAN-EVAL cycle 1 | `FAIL_PLAN` at `1bf9c567`; evaluator accepted structure/doctrine/design and returned six measurement repairs (F1-F7). No implementation started.                                  |
| 2026-08-30 | S1    | Lume capability   | `deno task check:agent-docs-prose` exit 0; Lume built 638 files, rendered output was OK, and corpus freshness was `true` with no stale paths.                                     |
| 2026-08-30 | S1    | Plan revision     | Re-locked intact-runtime red, committed graph proof, finite preset type closure, order-independent Fresh proof, four-page prose ownership, and the complete derivative cascade.   |
| 2026-08-30 | S1    | PLAN-EVAL cycle 2 | `PASS_PLAN` at `9a0f5876`; evaluator measured every cycle-1 repair sufficient on this host and authorized implementation beginning at S2.                                         |
| 2026-08-30 | S2    | RED               | Added the regression test alone. With the Deno runtime intact, the fresh child reached the target assertion and observed root import -> `hasCacheProvider() === true`.            |
| 2026-08-30 | S2    | Graph proof       | Committed the later graph phase. The S2 behavioral assertion stopped the test before this phase ran; a separate supervisor measurement found 19 unsafe base edges, including two `node:` edges and five logger modules. |
| 2026-08-30 | S3    | SDK surfaces      | Removed the root cache barrel edge, made `./cache` load-time pure, added the curated `./presets` entry, and retained only the root cache types required by existing Fresh consumers. |
| 2026-08-30 | S3    | Fresh composition | Moved default registration into `defineFreshApp()` and proved in a fresh child that module import is inert while calling the composition root installs the provider.              |
| 2026-08-30 | S3    | GREEN             | Whole focused suite passed 82/82. The S2 graph phase ran for the first time and proved root/presets exclude KV, logger, raw `@netscript/kv`, and all resolved/raw `node:` edges.       |
| 2026-08-30 | S3    | Public derivatives | Regenerated the MCP export corpus, agent-docs prose/provenance, then publish assets in tooling dependency order; each pre-generation stale check was recorded before the final pass. |
| 2026-08-30 | S3    | Compatibility     | Updated the SDK README and all four owned published pages with the root/cache migration, focused presets import, explicit custom-server registration, and Fresh coverage.          |
| 2026-08-30 | S3    | Checkpoint        | Committed and pushed `1dd64dae`; posted the structured S3 implementation comment on draft PR #1758.                                                          |
| 2026-08-30 | S4    | Reconciliation    | Reconciled the pushed S3 SHA, final gate table, compatibility handoff, and pending independent IMPL-EVAL without changing product code.                       |
| 2026-08-30 | Review | Tier-A sign-off   | Supervisor sign-off `83b7109c` independently reproduced the graph, test, doc, surface, publish, quality, and lock claims at author head `bfad0c15`.             |
| 2026-08-30 | Review | IMPL-EVAL cycle 1 | Separate opposite-family evaluator returned `PASS_IMPL` at `83b7109c`; four low findings, zero blocking. F-1/F-3 are reconciled here and in the PR body; F-2/F-4 remain coordinator follow-ups. |

## Decisions

| Decision                   | Reason                                                                                               | Source                                     |
| -------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Archetype 2 / Keep         | Explicit current doctrine assignment and verdict                                                     | Doctrine 06/10                             |
| All three expected moves   | No individual move dominates the combined acceptance-preserving design                               | `research.md` design matrix                |
| Curated presets entry      | Direct entry is measured doc-lint red with 10 private refs                                           | Baseline `deno doc --lint` artifact output |
| Curated type closure       | Explicit type-only `ports/mod.ts` enumeration minus `QueryClientPort`; no wildcard/runtime re-export | PLAN-EVAL cycle 1 F5 measurement           |
| README/site migration note | Import-only registration removal changes behavior for custom servers                                 | Source/issue compatibility analysis        |
| No CLI source edits        | `defineFreshApp` covers generated apps; CLI edit expands into prohibited E2E                         | Consumer census + leaf boundary            |

## Drift

PLAN-EVAL cycle 1 found two evidence-design mismatches: deleting `globalThis.Deno` crashed before
the intended assertion, and the generated-doc cascade omitted the Lume-derived prose/provenance
pair. The revised S1 plan corrects both without changing the accepted product design. Tool
availability note: the requested `rtk` executable is absent (`command not found`); this affects
output filtering only, not evidence selection. S3 stayed inside the locked ceiling. Two
implementation-time corrections are recorded in `drift.md`: a workspace publish dry-run exposed two
root cache-entry types still required by Fresh, and generic Markdown formatting damaged Vento source
syntax before the owned pages were restored and edited narrowly. IMPL-EVAL F-1 additionally found
that the committed graph test substituted a stricter workspace-resolved predicate for the plan's
two named SDK files; both forms measure 0 at head, and the substitution plus F-2/F-4 coordinator
follow-ups are now recorded in `drift.md`.

## Gate Results

### S1 research gates

| Gate                            | Command/check                                                 | Result                        | Notes                                                                         |
| ------------------------------- | ------------------------------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------- |
| Base/branch                     | Raw Git SHA/status/upstream probes                            | PASS                          | HEAD equals supplied `origin/main` baseline; clean at bootstrap; no upstream. |
| Public API inspection           | `deno doc --filter ...` on root/query/cache                   | PASS                          | Confirms real exported entry and cache/provider surface.                      |
| Full SDK doc lint               | `deno task doc:lint --root packages/sdk --pretty`             | MEASURED NEGATIVE (exit 1)    | Three unique private-type-ref source files; zero missing JSDoc.               |
| Proposed direct preset doc lint | `deno doc --lint packages/sdk/src/presets/define-services.ts` | MEASURED NEGATIVE (exit 1)    | 10 private-type-ref diagnostics; plan changed to curated entry.               |
| JSR audit                       | `audit-jsr-package.ts --root packages/sdk --text`             | PASS WITH 2 WARNINGS (exit 0) | Existing F-DOCT-5 cardinality and slow-types warnings; dry-run reported OK.   |
| Agent-docs host capability      | `deno task check:agent-docs-prose`                            | PASS (exit 0)                 | Lume built 638 files; rendered output OK; `fresh: true`, no stale paths.      |
| PLAN-EVAL cycle 1               | Separate opposite-family evaluator                            | FAIL_PLAN                     | Measurement findings F1-F7; no implementation authorized.                     |
| PLAN-EVAL cycle 2               | Separate opposite-family evaluator                            | PASS_PLAN                     | Plan commit `9a0f5876`; implementation authorized from S2.                    |
| S2 RED                          | Focused structured test                                       | EXPECTED RED (exit 1)         | 0 passed / 1 failed; observed provider `true`, with no unrelated child crash. |

### S3 implementation gates

| Gate | Command/check | Result | Artifact-derived evidence |
| ---- | ------------- | ------ | ------------------------- |
| Regression + full owned suite | Structured test wrapper over `packages/sdk/tests/`, provider test, and Fresh bootstrap test | PASS (exit 0) | 82 passed / 0 failed / 0 ignored. The graph phase executed for the first time here and found no forbidden edge. |
| Scoped check | Structured check wrapper on the nine owned product/test TS files | PASS (exit 0) | 9 selected; zero diagnostics or failed batches. |
| Scoped lint | Structured lint wrapper on the same nine files | PASS (exit 0) | 9 selected/processed; zero findings or coverage refusals. |
| Scoped format | Structured format wrapper on the same nine files | PASS (exit 0) | 9 selected/processed; zero findings or coverage refusals. |
| Site source format | `deno task --cwd docs/site check:source-format` | PASS (exit 0) | `Docs source format: OK`. |
| Code quality | `deno task quality:scan` | PASS (exit 0) | No leaf finding. |
| Doctrine | `deno task arch:check` | PASS WITH EXISTING WARNINGS (exit 0) | No new SDK/Fresh failure; existing repository warnings remained separate. |
| Targeted preset docs | `deno doc --lint packages/sdk/src/presets/mod.ts` | PASS (exit 0) | Checked one file with zero diagnostics. |
| Full SDK doc lint | SDK doc-lint task | MEASURED NEGATIVE (exit 1) | Same three unique private-ref files as base, zero missing JSDoc; no new unique diagnostic. |
| JSR audit | SDK JSR audit wrapper | PASS WITH 2 WARNINGS (exit 0) | 13 entries including `./presets`; only the existing source-cardinality and slow-type warnings; package dry-run OK. |
| SDK publish dry-run | `deno publish --dry-run --allow-dirty` from `packages/sdk` | PASS (exit 0) | Package accepted the 13-entry surface. |
| Workspace publish dry-run | `deno task publish:dry-run` | PASS after correction (exit 0) | First run exposed six Fresh checks caused by removed root `CachedEntry`/`CacheEntry` types; type-only compatibility exports resolved them without restoring a server edge. Final dry run completed successfully. |
| Export/reference drift | `deno task docs:exports-drift` | PASS (exit 0) | SDK entrypoint coverage includes `./presets`; zero omitted entrypoint groups. |
| MCP corpus precheck | `deno task check:mcp-export-corpus` before generation | EXPECTED STALE (exit 1) | Generator named `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts` stale. |
| MCP corpus final | Generate, inspect decoded SDK delta, then recheck | PASS (exit 0) | 35 packages, 271 subpaths, 7,668 symbols; SDK gained `./presets`, root lost server cache values, and root `defineServices` remained. |
| Agent-docs precheck | `deno task check:agent-docs-prose` before generation | EXPECTED STALE (exit 1) | Lume built 638 files and rendered 227 HTML files, then reported stale `prose.json.gz` and `provenance.json`. |
| Agent-docs final | Generate, then `deno task check:agent-docs-prose` | PASS (exit 0) | Lume built 638 files; rendered output OK; `fresh: true`, no stale paths; bundle SHA `6a71e9f57e459f18ce74eafa4d69757aa764dc284598da1f1464ee2746865134`. |
| Publish-assets precheck | `deno task check:publish-assets` after prose regeneration | EXPECTED STALE (exit 1) | Tool named only the MCP publish asset stale; the CLI asset was unchanged, which is recorded rather than inferred otherwise. |
| Publish-assets final | Generate, inspect changed output, then recheck | PASS (exit 0) | Only `packages/mcp/src/publish-assets.generated.ts` changed; final freshness check passed. |
| Public surface | `deno task surface:diff` plus decoded SDK corpus comparison | MEASURED NEGATIVE (exit 1) | The repo baseline is 542 undeclared major changes at `13878a80`; head `1ccddd6e` has 552. The +10 delta is entirely SDK-scoped (45 -> 55) and is the intended surface change: `./presets` added, 21 root cache exports removed, `QueryClientPort` absent, and `CachedEntry`/`CacheEntry` retained type-only. |
| Lock hygiene | Raw `git diff --exit-code -- deno.lock`; raw `git diff --check` | PASS (exit 0) | `deno.lock` byte-unchanged and no whitespace errors. |

### Gates not applicable/run in S1

- Product check/test/lint/fmt, generated freshness, publish dry-run, and surface diff: not run
  because S1 changes only harness plan artifacts; they are locked for S2/S3.
- E2E CLI, Aspire, Docker, real browser/Vite, and release/canary gates: prohibited or N/A exactly as
  recorded in `plan.md`.

## Handoff notes

S3 implementation, compatibility prose, generated derivatives, and gate evidence are pushed at
`1dd64dae`. S4 and later evidence corrections contain run-artifact reconciliation only. Separate
opposite-family IMPL-EVAL returned `PASS_IMPL` at supervisor sign-off head `83b7109c`. The PR body is
being refreshed from the accepted artifacts before readiness; draft state, labels, issue text, and
issue acceptance remain coordinator-owned.

## Supervisor Tier-A sign-off — `bfad0c15`

Reviewer is the fixes topic supervisor: not the author, not the plan evaluator. Every check below was
re-derived independently — by re-running the command or by measuring against a pristine base worktree
— never read out of the author's receipts.

**Tier-A PASSES at this head.** A fresh, separate, opposite-family IMPL-EVAL remains mandatory before
readiness.

### The fix is proven structurally, not only behaviourally

| Graph | Base `13878a80a` | Head `bfad0c15` |
| --- | --- | --- |
| `packages/sdk/mod.ts` | **19** browser-unsafe edges — KV modules, 2 `node:` edges, 5 logger modules | **0** |
| `packages/sdk/src/presets/mod.ts` | — (entry did not exist) | **0** |

Measured by re-implementing the leaf's own predicate over `deno info --json`. The SDK root no longer
reaches `@netscript/kv`, `node:`, or the logger **at all**, so issue AC "production client chunks
contain no server KV adapter" is demonstrated at graph level rather than asserted.

### Exact-head gates, re-run

| Gate | Result |
| --- | --- |
| Head identity | local == `origin` == PR #1758 `headRefOid` == `bfad0c15`; tree clean |
| Ceiling containment | no path outside the locked ceiling |
| `deno.lock` | byte-unchanged vs `origin/main` |
| `packages/sdk/tests/` (whole suite, per M3) | exit 0 · **70 passed / 0 failed** |
| `define-fresh-app.test.ts` | exit 0 · **11 passed / 0 failed** |
| S2 regression at S3 head | exit 0 · 1 passed / 0 failed — **including the graph phase's first execution** |

### The red-before holds in both directions, with one honest asymmetry

| Head | State | Focused suite |
| --- | --- | --- |
| `ddf66a6f` | regression only, no product change | exit 1 · **0 passed / 1 failed** — `observed true`, no Deno-global crash |
| `1dd64dae` | product change landed | exit 0 · 1 passed / 0 failed |

The asymmetry, stated rather than glossed: the test throws on the child assertion at base, so **the
graph half never executed there**. Its red-before rests on the supervisor's direct measurement (19
edges at base), not on the committed test run, and its first execution is the green above. The author
recorded this correctly in its own evidence.

### Two declined reds, both re-derived against a pristine base worktree

| Claim | Verdict |
| --- | --- |
| Full SDK `doc:lint` is baseline | **Confirmed.** exit 1 · 3 errors / 3 private-type refs / 0 missing JSDoc at **both** base and head — no new unique diagnostic. |
| `surface:diff` is a measured negative | **Confirmed after correction (T-1).** Base **542** undeclared major; head **552**; the **+10** is entirely SDK-scoped (45 → 55) and is the intended surface change. |

**T-1 was a real finding and is fixed.** The original row read "Repo baseline reports 559 undeclared
major change(s)", which neither reproduced (552) nor distinguished baseline from head — it folded the
leaf's own +10 into the baseline it was measured against. That is the same overstated-attribution
class this leaf's brief carried forward from #1673's T-2, which is why it was held rather than waived.
The corrected row now names base, head, delta, scope, and the head measured at.

### Contract review

- **Root is side-effect-free**: importing `defineServices` from the root leaves
  `hasCacheProvider() === false`; the server provider is registered only by explicit bootstrap.
- **Explicit server registration** lands in `defineFreshApp()`, with its own test proving the module
  import is inert and the bootstrap call registers.
- **Compatibility handled honestly**: the workspace publish dry-run initially failed six Fresh checks
  caused by removing root `CachedEntry`/`CacheEntry`; resolved with **type-only** exports. The graph
  measurement above confirms no server edge returned.
- **Generated cascade executed in the corrected order** — precheck (expected stale) → generate →
  recheck PASS, for MCP corpus, agent-docs prose, and publish-assets alike.

### Not done here, by design

No readiness flip, merge, relabel beyond phase truth, issue edit, or acceptance-box tick. No
`e2e:cli`/Aspire/Docker/browser gate ran and no runtime lease was requested — this leaf's ceiling
touches none of that surface.
