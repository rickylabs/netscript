# Plan: make the cached-entry loader honor its stale policy

## Run Metadata

| Field          | Value                                                                                                             |
| -------------- | ----------------------------------------------------------------------------------------------------------------- |
| Run ID         | `fix-sdk-cached-entry-swr--0.0.7-wave5`                                                                           |
| Branch         | `fix/sdk-cached-entry-swr`                                                                                        |
| Phase          | `plan` — hard stop pending external PLAN-EVAL PASS                                                                |
| Target         | `packages/sdk` runtime behavior plus published SDK site guidance                                                  |
| Archetype      | `3 — Runtime/Behavior` for this cache lifecycle slice; package-wide doctrine assignment remains `2 — Integration` |
| Scope overlays | `docs`                                                                                                            |

## Archetype

The owner selected Archetype 3 because the defect is runtime behavior: cache state, freshness time,
concurrent execution ownership, and background refresh lifecycle. The current doctrine table assigns
`packages/sdk` as a whole to Archetype 2 (Integration). This plan does not reorganize the package or
override that package-wide verdict; it applies the stricter Archetype-3 behavioral gates to the
cache slice while preserving the SDK's adapter boundaries.

## Current Doctrine Verdict

`packages/sdk` is **Keep**: “Preserve discovery/client/cache adapter boundaries.” This change stays
inside the existing cache engine, its tests, and the current docs source. It adds no port, adapter,
entrypoint, or export.

## Axioms in Play

| Axiom | Why it matters                                                                                                            |
| ----- | ------------------------------------------------------------------------------------------------------------------------- |
| A1    | The contract decision is locked before implementation: compose existing published methods; add no new export.             |
| A2    | One cache policy remains authoritative instead of adding a parallel revalidating-entry abstraction.                       |
| A8    | The runtime change remains in `cache-query.ts`; engine and factory regressions stay in their existing focused test files. |
| A9    | Archetype-3 runtime rigor is applied to this lifecycle slice without reshaping the Archetype-2 package.                   |
| A13   | PR #1665's fail-safe write/telemetry boundaries remain intact while shared refresh ownership is fixed.                    |
| A14   | Concurrent behavior, published guidance, JSR dry-run, docs accuracy, and derived-asset freshness are executable gates.    |

## Goal

Make the published loader guidance truthful without adding API surface, and make stale SWR refresh
ownership exact: fresh cache hits make no upstream call, misses fetch once, stale reads follow their
chosen blocking/SWR policy, overlapping stale readers schedule exactly one refresh, and refreshed
metadata carries the persisted refresh timestamp.

## Scope

- Make the in-flight lifecycle policy-aware in `CacheQuery`: background SWR refreshes participate in
  dedupe without forcing other SWR readers to block, while missing/expired/blocking readers join the
  same persistence-complete operation.
- Preserve every PR #1665 request-local admission, telemetry, cache-write fail-safe, and telemetry
  evidence fail-safe behavior.
- Add deterministic concurrent engine and factory-loader regressions mapped to all six acceptance
  bullets.
- Replace the false `services-sdk/sdk.md` loader example with the existing callable action in
  `preferFreshOnStale` mode followed by `getCachedEntry()` metadata retrieval.
- Regenerate and commit the four declared derived assets in the mandated order.

## Non-Scope

- No `queryEntry()` or other published method; no changes to `CacheProvider`, `ActionMethod`,
  `CompositeQuery`, export maps, or package entrypoints.
- No edit under `docs/site/_site/` and no invented `docs/sdk` replacement.
- No fix to the adjacent out-of-contract tutorial claim without a coordinator ruling.
- No repair of `check:mcp-export-corpus` (#1668), `surface:diff`, JSR `F-DOCT-5`, or queue flake
  #1667.
- No Aspire, Docker, or `e2e:cli`; they are prohibited leased singletons and are not needed to prove
  an in-memory cache lifecycle plus docs/asset generation.
- No evaluator launch, OpenHands trigger, ready-for-review transition, merge, canary, or release.

## Hidden Scope

- A map entry must represent the full fetch-plus-persist lifecycle. Otherwise a joined blocking
  loader can resolve and read metadata before the winning caller has written the refreshed entry.
- The early unconditional in-flight join must become policy-aware. A second SWR reader should return
  stale data while sharing the one background refresh, not unexpectedly block for fresh data.
- The site-source edit necessarily changes four checked-in generated files and requires all three
  freshness gates on the same content head.
- `packages/fresh` and `packages/cli` consume the runtime behavior, so root `check` and `test`
  remain merge-readiness gates even though no consumer source is planned.

## Locked Decisions

| ID | Decision                                                                               | Rationale                                                                                                                                                          |
| -- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D1 | Choose issue remedy 1: cache-aware callable action, then metadata read.                | Existing `ActionMethod` already expresses every accepted stale policy. Blocking mode guarantees refresh before metadata without duplicating execution policy.      |
| D2 | Add no published surface.                                                              | Acceptance requires behavior, not a new spelling. A new method would duplicate contracts across four public layers and require a scope-boundary ruling.            |
| D3 | Keep `getCachedEntry()` a pure store read.                                             | Its name, signature, `deno doc`, and accurate query-bridge docs all promise a read, not hidden fetching.                                                           |
| D4 | Make in-flight ownership cover fetch and persistence, with policy-aware join behavior. | This simultaneously proves exactly-one execution and ensures a caller that waits for fresh data can immediately observe the matching persisted timestamp.          |
| D5 | Prove concurrency with two overlapping readers and a manually blocked fetcher.         | A sequential or single-reader test cannot establish exactly one refresh.                                                                                           |
| D6 | Preserve PR #1665 fail-safe behavior.                                                  | Cache persistence and telemetry evidence failures must remain non-fatal for data reads, and background failures must remain detached after telemetry records them. |
| D7 | Touch the contracted site page and accept the four-file generated cascade.             | The offending exact snippet is on that page; generated mirrors are checked-in consumers, not optional cleanup.                                                     |

## Open-Decision Sweep

| Decision                                                          | Status                                 | Notes                                                                                                                                                                                   |
| ----------------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Whether to correct the adjacent tutorial's false prose in this PR | Safe to defer                          | It is outside the frozen contract and not the exact cited snippet. Adding it later only extends the already-planned docs/cascade slice.                                                 |
| Exact command behind the supplied six-diagnostic doc-lint pin     | Safe to defer to PLAN-EVAL/coordinator | Current explicit full-export raw invocation finds three unique named diagnostics. Preserve the observed set and never claim a pass; command reconciliation does not change code design. |
| API remedy (`queryEntry`)                                         | Resolved now: rejected                 | Existing callable action plus metadata read satisfies every acceptance item without a parallel public policy surface.                                                                   |

## Risk Register

| Risk                                                                    | Mitigation                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Registering background work in the map makes a second SWR caller block. | Move join decisions behind cache-state/policy evaluation; stale SWR callers return cached data while reusing the registered refresh. Test both overlapping returns before releasing the refresh.                                                                  |
| A joined foreground caller reads metadata before persistence finishes.  | Store the full fetch-plus-write operation in the map and resolve joiners only after write completion (or the existing fail-safe write handling completes).                                                                                                        |
| Dedupe refactor drops telemetry or PR #1665 fail-safe behavior.         | Keep request-local admission and read-span prologue unchanged; keep captured-parent background write span, error recording, detached failure handling, and non-fatal foreground cache-write behavior. Run focused telemetry/cache tests plus full SDK/root tests. |
| Timing-based tests flake.                                               | Seed explicit old/current timestamps and use controlled promises; no sleep-based concurrency approximation. Bound only the missing-entry timestamp with before/after values.                                                                                      |
| Docs edit leaves generated mirrors inconsistent.                        | Generate prose → CLI barrel → publish assets, then run all three freshness checks on one unchanged head.                                                                                                                                                          |
| New export or slow type slips in.                                       | No public type files planned; compare `deno doc`, run package/root publish dry-run, and hold doc-lint to the observed red no-regression set.                                                                                                                      |
| Root queue flake appears.                                               | Report `expected 1, got 2` as #1667 exactly and do not rerun solely for green.                                                                                                                                                                                    |

## Anti-Patterns to Resolve or Avoid

| AP                               | Status                          | Plan                                                                                                                                                                                      |
| -------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AP-9 premature abstraction       | Risk                            | Reuse the current map/policy methods; do not create a second revalidating-entry API or speculative coordinator class.                                                                     |
| AP-10 swallowed runtime failures | Existing intentional boundary   | Preserve PR #1665's explicit fail-safe write policy and telemetry recording; do not broaden catches beyond that owned boundary.                                                           |
| AP-11 hidden globals             | Avoid                           | Tests use one explicitly constructed `CacheQuery`, store, map, and provider lifecycle.                                                                                                    |
| AP-12 direct time                | Existing behavior, no deepening | Do not add runtime clock reads beyond the existing timestamp points; tests inject raw timestamps and bracket observed writes. A clock-port refactor is not required for this focused fix. |
| AP-25 side effects outside edges | Avoid                           | No new external side effect or timer; controlled test promises provide concurrency.                                                                                                       |

## Fitness Gates

| Gate                    | Required                      | Expected evidence                                                                                                            |
| ----------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| F-1 through F-5         | Yes                           | `quality:gate`, targeted review, no new/exported surface; existing file remains below hard failure threshold.                |
| F-6 JSR publishability  | Yes                           | Package raw dry-run and root `publish:dry-run`; no actual slow-type warning.                                                 |
| F-7 doc score/doc lint  | Yes, pinned red no-regression | Raw full-export `deno doc --lint` remains exit 1 with the reconciled named baseline; never reported green.                   |
| F-8 through F-12        | Yes                           | `quality:gate`, scoped check/lint/fmt, no config/folder/name change.                                                         |
| F-13 runtime invariants | Yes                           | Focused fresh/missing/stale/overlap tests; no long-running handle or cancellation surface is added.                          |
| F-14 through F-19       | Yes                           | `quality:gate`, scoped wrappers, no console/re-export/folder/barrel change.                                                  |
| JSR package audit       | Yes                           | Audit helper output recorded; known `F-DOCT-5` remains unchanged and raw dry-run adjudicates false slow-type banner warning. |

## Arch-Debt Implications

| Entry                           | Action        | Notes                                                                                            |
| ------------------------------- | ------------- | ------------------------------------------------------------------------------------------------ |
| `packages/sdk` doctrine verdict | None          | Keep verdict and adapter boundaries preserved.                                                   |
| JSR `F-DOCT-5` 13-child finding | None          | Known red, explicitly out of scope and not deepened.                                             |
| New debt                        | None expected | Any new/deepened violation is a PLAN-EVAL/IMPL-EVAL blocker rather than an automatic debt entry. |

## Commit Slices

| #  | Slice                                                              | What it proves                                                                                                                                                                                                                                          | Gates                                                                                                                                                                           | Files                                                                                                                                                                                                                                                                                                             |
| -- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1 | Make refresh ownership policy-aware and persistence-complete       | Fresh/missing/blocking/SWR behavior is preserved; two overlapping stale SWR readers return stale and issue exactly one refresh; refreshed cache data/timestamp eventually land; PR #1665 fail-safe/telemetry behavior remains.                          | Focused structured SDK cache tests; targeted check/lint/fmt; `quality:gate`                                                                                                     | `packages/sdk/src/cache/cache-query.ts`; `packages/sdk/tests/cache/cache-query_test.ts`; run `worklog.md`/`context-pack.md`                                                                                                                                                                                       |
| S2 | Publish the truthful loader contract and its executable regression | Corrected action-then-metadata loader makes zero/fetch-once/blocking-stale decisions correctly, overlapping blocking loaders share one refresh and see the refreshed timestamp, docs match code, and all four generated mirrors share one content head. | Focused query-factory test; `docs-source-format`; `docs-accuracy`; `check:agent-docs-prose`; `check:assets-barrel`; `check:publish-assets`; scoped/root/publish/JSR merge gates | `packages/sdk/tests/query/query-factory_test.ts`; `docs/site/services-sdk/sdk.md`; `.llm/assets/agent-docs/prose.json.gz`; `.llm/assets/agent-docs/provenance.json`; `packages/cli/src/kernel/assets/agent-docs.generated.ts`; `packages/mcp/src/publish-assets.generated.ts`; run `worklog.md`/`context-pack.md` |

No implementation slice may begin until the topic orchestrator confirms PLAN-EVAL `PASS`.

## Validation Plan

| Order | Gate                         | Command or check                                                                                                                                                                         | Expected result                                                                                                                |
| ----- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 1     | Focused cache behavior       | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/sdk/tests/cache/cache-query_test.ts packages/sdk/tests/query/query-factory_test.ts` | PASS; deterministic overlapping-reader assertions include call count exactly `1`.                                              |
| 2     | Targeted SDK check           | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/sdk --ext ts,tsx --pretty`                                                                               | PASS; wrapper supplies `--unstable-kv`.                                                                                        |
| 3     | Targeted SDK lint            | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/sdk --ext ts,tsx --pretty`                                                                                | PASS.                                                                                                                          |
| 4     | Targeted SDK format          | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/sdk --ext ts,tsx --pretty`                                                                                 | PASS without mutating root format.                                                                                             |
| 5     | Framework quality/doctrine   | `rtk proxy deno task quality:gate`                                                                                                                                                       | PASS or only explicitly named unchanged baseline; no new scanner allowance/cast/ignore.                                        |
| 6     | Docs source format           | Durable gate runner with `--gate docs-source-format --cwd docs/site`                                                                                                                     | PASS receipt.                                                                                                                  |
| 7     | Docs accuracy                | Durable gate runner with `--gate docs-accuracy`                                                                                                                                          | PASS receipt; source matches callable-action and pure-read contracts.                                                          |
| 8     | Generate derived assets      | `deno task gen:agent-docs-prose`; `deno task gen:assets-barrel`; `deno task gen:publish-assets`                                                                                          | Only the four declared cascade files change. Any additional path is drift requiring review.                                    |
| 9     | Agent-docs freshness         | Durable gate runner with `--gate agent-docs-prose`                                                                                                                                       | PASS on the same content head.                                                                                                 |
| 10    | CLI asset barrel freshness   | Durable gate runner with `--gate assets-barrel`                                                                                                                                          | PASS on the same content head.                                                                                                 |
| 11    | MCP publish-assets freshness | Durable gate runner with `--gate publish-assets`                                                                                                                                         | PASS on the same content head.                                                                                                 |
| 12    | Package JSR audit            | `deno run --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/sdk --text`                                                                       | Exit 0; known 13-child warning unchanged; raw dry-run adjudicates banner-only slow-type warning.                               |
| 13    | Package raw publish dry-run  | `(cd packages/sdk && deno publish --dry-run --allow-dirty)`                                                                                                                              | PASS, no actual slow-type diagnostics, intended source-only file list.                                                         |
| 14    | Raw full-export doc lint     | Explicit `deno doc --lint` over the 12 `packages/sdk/deno.json` export targets                                                                                                           | Expected exit 1; named private-type-ref baseline unchanged after coordinator reconciles supplied count. Never call this green. |
| 15    | Root publish dry-run         | Durable gate runner with `--gate publish-dry-run`                                                                                                                                        | PASS except no known-red gate may be silently reclassified.                                                                    |
| 16    | Root tests                   | `rtk proxy deno task test`                                                                                                                                                               | PASS, or report queue #1667 once with exact `expected 1, got 2` and no green-seeking rerun.                                    |
| 17    | Root check                   | `rtk proxy deno task check`                                                                                                                                                              | PASS.                                                                                                                          |
| 18    | Raw Git/diff review          | Direct Git status/diff against `3e8e146a4...`                                                                                                                                            | Only declared source/test/docs/generated/run paths; no lock/cache churn.                                                       |

The plan intentionally does **not** run `check:mcp-export-corpus`, `surface:diff`, Aspire, Docker,
or `e2e:cli`, and will not describe any of them as green.

## Dependencies

- Existing `CacheStore`, `CacheTelemetry`, `ActionMethod`, `QueryParams`, and `MemoryCacheStore`
  contracts only.
- Root docs generation tasks and their checked-in outputs.
- Topic-orchestrator confirmation that a separate PLAN-EVAL session returned `PASS`.

## Deferred Scope

- Adjacent tutorial claim at `docs/site/tutorials/live-dashboard/03-sdk-cache-first-query.md:100`,
  pending coordinator surface expansion.
- Any one-call `queryEntry()` convenience. Reconsider only with a separate published-surface
  acceptance need and scope ruling.
- Existing SDK folder-cardinality and doc-lint debt.

## Drift Watch

- Any implementation need to touch a provider/port/factory/export file is a published-surface
  expansion and must stop for a ruling.
- Any docs source outside `docs/site/services-sdk/sdk.md` is a frozen-contract expansion and must be
  reported before edit.
- Any generated path beyond the four declared files must be inspected and recorded before commit.
- Any change to PR #1665 admission, telemetry, or fail-safe semantics is significant drift.
- Any lockfile/cache change is unowned and must not be committed.
