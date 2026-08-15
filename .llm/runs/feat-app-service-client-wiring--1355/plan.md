# Plan: app-side service client/query wiring and canonical cache age

## Run Metadata

| Field          | Value                                                               |
| -------------- | ------------------------------------------------------------------- |
| Run ID         | `feat-app-service-client-wiring--1355`                              |
| Branch         | `feat/app-service-client-wiring`                                    |
| Phase          | `plan`                                                              |
| Target         | `packages/sdk`, `packages/cli`, `packages/fresh`                    |
| Archetype      | `2 — Integration` (SDK target seam; CLI remains 6, Fresh remains 4) |
| Scope overlays | `frontend`                                                          |

## Archetype

The cross-tier query/client seam is an SDK-owned integration boundary: the public query factory is
the port-like contract, its server cache and TanStack representations are adapters, and key
translation must stay explicit. The SDK is measured as Archetype 2 in the current doctrine verdict.
The CLI is a generator consumer and remains Archetype 6; Fresh consumes the timestamp contract and
remains Archetype 4. The frontend overlay adds real route/browser and loading-state proof.

## Current Doctrine Verdict

`@netscript/cli`, `@netscript/fresh`, and `@netscript/sdk` are all **Keep**. Preserve their current
kernel/surface, per-concern builder/query, and discovery/client/cache boundaries rather than
restructuring them.

## Axioms in Play

| Axiom                            | Why it matters                                                                            |
| -------------------------------- | ----------------------------------------------------------------------------------------- |
| A1 — public types first          | Lock the key/invalidation and generator result contracts before their implementations.    |
| A2 — simple over easy            | One router-derived identity must drive client, query, and invalidation code.              |
| A6 — helpers justified           | A bridge overload is justified only if it makes a typed cross-tier contract discoverable. |
| A8 — one reason per file         | Keep service discovery/planning, writes, and CLI presentation separate.                   |
| A14 — tests/publish are doctrine | Semantic, consumer, browser, JSR, and publish proof are required.                         |

## Goal

Generate deterministic per-service app client/query modules whose cache identities never collide,
whose invalidation prefixes are derived from the same typed query procedure, and whose canonical
Fresh islands preserve the server snapshot's real age across hydration.

## Scope

- Preserve all six already-derived per-service export names.
- Derive each query factory's resource from the manifest service/router identity.
- Provide a typed/key-derived invalidation path and make both showcase call sites consume it.
- Introduce an all-service client generator with content comparison, deterministic results,
  `--dry-run`, `--force`, and no-partial-write failure when a contract is absent.
- Route both `service generate` and `service add --with-client` through the same generator seam.
- Pass `props.cachedAt` as `initialDataUpdatedAt` in both canonical island variants.
- Add semantic, type-negative, generated-output, real-browser, and runtime-E2E regression coverage.
- Add one migration note in `packages/fresh/README.md`, subject to PLAN-EVAL confirmation.
- Audit all exports, exact internal pins, isolated declarations/no-slow-types, and publish file
  lists for CLI, Fresh, and SDK.

## Non-Scope

- No `SdkClientContribution` or #1348 work, nested-router factory redesign, `AbortSignal`, timeout,
  port, or typed-error work.
- No remaining #1245 island-query type work and no #1354/#1357 generator redesign.
- No changes under `docs/**`.
- No release, publish, merge, ready-for-review transition, issue mutation, central cluster mutation,
  or expensive-gate execution without release.
- No lockfile/cache deletion, `deno cache --reload`, version bump, or dependency change.
- No sibling worktree or lane branch changes.

## Hidden Scope

- Update both memory and non-memory canonical assets and the generated-asset manifest if the repo's
  asset freshness gate requires it.
- Test server-key and TanStack-key isolation separately; their third segments intentionally differ.
- Add a type-checking negative fixture proving a renamed procedure breaks the generated invalidation
  expression.
- Preserve atomicity by planning/validating every service and contract before the first write.
- Extend `packages/fresh` browser coverage and its `test:browser` task so the contracted
  `fresh-browser` gate actually covers hydration age rather than only form navigation.
- Resolve the missing durable `scaffold.runtime` catalog entry before claiming a `run-gate.ts`
  receipt; do not silently hand-author the receipt.
- Keep binding receipt sufficiency to exactly one receipt per contracted gate; JSR member reports
  remain supplemental.

## Locked Decisions

| ID | Decision                                                                                                                        | Rationale                                                                                           |
| -- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| D1 | The manifest's service key, transformed exactly as the router name, is the sole resource identity.                              | It already owns service discovery and routing and prevents cross-service collision by construction. |
| D2 | Server and client full keys remain tier-specific; only their `[resource, action]` prefix converges.                             | The SDK intentionally represents server input as serialized text and TanStack input as `{ input }`. |
| D3 | All service modules are planned and validated before writes, in resolver-sorted order.                                          | Deterministic output and no partial mutation on a missing contract.                                 |
| D4 | Changed/missing files are written, identical files skipped, dry-run reports without writes, and force rewrites identical files. | Matches the established runtime-schema generator contract cited by #1355.                           |
| D5 | Both canonical islands pass `initialDataUpdatedAt: props.cachedAt`.                                                             | The loader already exposes the timestamp and Fresh already owns the public option.                  |
| D6 | Existing apps change only when newly generated or explicitly regenerated.                                                       | Package upgrades do not mutate consumer source.                                                     |
| D7 | No expensive gate runs before a coordinator release and recorded singleton lease.                                               | Required by the leaf contract and AGENTS.md.                                                        |

## Open-Decision Sweep

| Decision                                                                | Status                                       | Notes                                                                                                                      |
| ----------------------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Add key-array overload to `bridgeInvalidation` vs direct object literal | Must resolve in PLAN-EVAL                    | Recommend additive overload, retaining the legacy string signature.                                                        |
| Durable `scaffold.runtime` runner route                                 | Must resolve before implementation gate work | Recommend an allowlisted exact catalog entry with tests, unless the orchestrator explicitly approves suite-owned evidence. |
| Migration note location                                                 | Must resolve in PLAN-EVAL                    | Recommend published `packages/fresh/README.md`; `docs/**` remains prohibited.                                              |
| Installed plugin contributions                                          | Safe to defer                                | #1348-gated; generate first-party manifest services only.                                                                  |
| L1/L2 vs L3 `defineServices` dialect                                    | Safe to defer for this leaf                  | Preserve the current query-factory dialect; changing it is not needed to repair identity.                                  |

## Proposed Public Contracts

### SDK

Keep the existing function and add a source-key form:

```ts
bridgeInvalidation(resource: string, action?: string): QueryInvalidationFilter;
bridgeInvalidation(queryKey: readonly unknown[]): QueryInvalidationFilter;
```

The generated module defines its query factory first, then derives the invalidation filter from
`<service>Queries.list.clientKey()`. The `list` property is therefore contract-checked. Explicit
public aliases/return types and JSDoc are required for isolated declarations and `deno doc --lint`.

### CLI

Introduce a use-case-level request/result describing planned service-client files plus deterministic
`written` and `skipped` collections. The generator reads sorted services from
`ServiceWorkspaceResolver`, validates a corresponding contract for every service, renders the
canonical module, compares content, and writes only after the full plan succeeds. The add and
generate commands delegate to it; presentation only reports results.

### Fresh

Do not add a new public type. Exercise the existing `IslandQueryOptions.initialDataUpdatedAt`
contract in a real browser and document the beta-era migration in the published package README.

## Risk Register

| Risk                                                         | Mitigation                                                                                 |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Existing generated imports break on regeneration             | Preserve current derived names; state the pre-#1424 migration explicitly.                  |
| Persisted old cache entries linger                           | Treat namespace replacement as intentional; prove new keys and refetch behavior.           |
| Direct string invalidation drifts again                      | Derive from `clientKey()` and add type/semantic negative tests.                            |
| Two services collide after a transform                       | Validate unique derived router/resource names before writes and cover collision rejection. |
| Missing contract leaves partial output                       | Plan and validate the complete set before filesystem mutation.                             |
| CLI's `isolatedDeclarations: false` hides a public slow type | Use explicit exported annotations and per-member JSR/no-slow-type dry-run.                 |
| Browser gate remains unrelated to the feature                | Add hydration-age coverage to the command the `fresh-browser` catalog entry invokes.       |
| Expensive E2E leaks resources                                | Run only with lease, `--cleanup`, pre/post leak checks, and run-owned roots.               |
| Generated asset barrel becomes stale                         | Run asset freshness and update generated assets only through the repo tool.                |

## Anti-Patterns to Resolve or Avoid

| AP                              | Status                             | Plan                                                                                         |
| ------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------- |
| AP-9 premature abstraction      | Existing risk                      | One generator seam shared by add/generate, without generalizing beyond service-client files. |
| AP-12 clock in handlers         | Existing generated loader behavior | Reuse the existing `cachedAt`; do not add package-handler clocks.                            |
| AP-18 giant generated snapshots | Risk                               | Assert parsed/semantic key, symbol, option, and command outcomes.                            |
| AP-23 inline command body       | Risk                               | Keep Cliffy handlers as parse/delegate/report edges.                                         |
| AP-25 side effect outside edge  | Risk                               | Keep writes behind the injected filesystem port and use case.                                |

## Fitness Gates

| Gate                    | Required           | Expected evidence                                                   |
| ----------------------- | ------------------ | ------------------------------------------------------------------- |
| F-1 file size           | Yes                | Structured lint/quality and review of new files.                    |
| F-3 layering            | Yes                | `arch-check` receipt and focused import review.                     |
| F-5 public surface      | Yes                | Full export-map `deno doc --lint` reports for all three members.    |
| F-6 JSR publishability  | Yes                | Root binding publish receipt plus three per-member audits/dry-runs. |
| F-8 workspace lib       | Yes                | Root check/arch gates; no compiler-lib change expected.             |
| F-10 test shape         | Yes                | Targeted semantic tests with bounded fixtures.                      |
| F-11/F-12 folder/naming | Yes                | Architecture/quality gates.                                         |
| Frontend route/browser  | Yes, lease-blocked | `fresh-browser` plus `scaffold.runtime` after release.              |

## Arch-Debt Implications

| Entry                                              | Action               | Notes                                                                                |
| -------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------ |
| Existing doctrine debt ledger                      | None                 | No entry owns this seam and the plan does not accept new debt.                       |
| Missing `.claude/05-frontend.md` overlay reference | Record drift only    | Docs changes are prohibited and not needed for the implementation.                   |
| Missing `scaffold.runtime` run-gate catalog entry  | Resolve in PLAN-EVAL | If added, it is a minimal evidence-path prerequisite, not product architecture debt. |

## Commit Slices and Tier-A Stops

| Slice                       | Content                                                                                                                                                                                                                                           | Stop and evidence                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| S0 — Phase 1                | Research, design ledger, plan, context, drift; open draft PR before code.                                                                                                                                                                         | Stop for orchestrator's PLAN-EVAL determination; RESEARCH and PLAN PR comments.                |
| S1 — SDK key contract       | Add the accepted key-derived invalidation contract, explicit public types/JSDoc, semantic mismatch/non-collision tests, and type-negative fixture.                                                                                                | Commit; focused SDK check/test/doc-lint; slice comment; Tier-A stop.                           |
| S2 — CLI generator contract | Contract-first request/result and plan/write use case; manifest enumeration, contract validation, content comparison, dry-run/force; route add/generate through one seam; per-router template key/invalidation; two-service and atomic negatives. | Commit; focused CLI check/tests/generated-asset freshness; slice comment; Tier-A stop.         |
| S3 — canonical hydration    | Pass cache age in both islands, add generated-output positive/negative tests, Fresh real-browser hydration fixture/task, and approved package migration note.                                                                                     | Commit; focused CLI/Fresh checks/tests/doc-lint; slice comment; Tier-A stop.                   |
| S4 — cheap convergence      | Run formatting/lint/asset checks, exact-pin/export/doc audits, three per-member isolated-declaration publish dry-runs, then the four cheap contracted gates at the committed candidate head.                                                      | Commit any evidence-only artifacts; recompute exact receipt sufficiency; comment; Tier-A stop. |
| S5 — leased runtime proof   | After explicit coordinator release and singleton lease only: leak-check, `scaffold.runtime --cleanup`, then `fresh-browser`; verify cleanup and immutable head.                                                                                   | Exact two expensive receipts; comment; Tier-A stop.                                            |
| S6 — IMPL-EVAL              | Fresh opposite-family evaluator inspects code, acceptance, receipts, PR threads, and compatibility; implementation session repairs any findings in new bounded slices.                                                                            | Tier-A verdict comment per cycle; never flip ready or merge.                                   |

No implementation slice starts until S0 receives the owner/orchestrator determination and, if
required as proposed, PLAN-EVAL PASS.

## Validation Plan

All binding receipts are produced by `.llm/tools/gates/run-gate.ts` with distinct invocation IDs,
the explicit committed `--git-head`, `gitHead == actualGitHead`, and no `--allow-git-head-mismatch`.
Receipt directories are created before invocation; receipts are never edited by hand.

| Order | Gate                 | Command/check                                                                                                            | Binding receipt or report                                                                                                                     |
| ----- | -------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Focused checks/tests | Structured Deno wrappers over touched roots/tests, including `--unstable-kv` for checks.                                 | Supplemental slice reports.                                                                                                                   |
| 2     | JSR audits           | `audit-jsr-package.ts`, full export-map doc-lint, exact-pin audit, and per-member publish dry-run for CLI/Fresh/SDK.     | Supplemental `jsr-audit-{cli,fresh,sdk}.json`, `doc-lint-{cli,fresh,sdk}.json`, `publish-dry-run-{cli,fresh,sdk}.json`, and exact-pin report. |
| 3     | `check`              | `run-gate.ts --gate check --id app-service-client-wiring-s4-check ...`                                                   | `receipts/s4-check.json`                                                                                                                      |
| 4     | `test`               | `run-gate.ts --gate test --id app-service-client-wiring-s4-test ...`                                                     | `receipts/s4-test.json`                                                                                                                       |
| 5     | `publish-dry-run`    | `run-gate.ts --gate publish-dry-run --id app-service-client-wiring-s4-publish-dry-run ...`                               | `receipts/s4-publish-dry-run.json`                                                                                                            |
| 6     | `arch-check`         | `run-gate.ts --gate arch-check --id app-service-client-wiring-s4-arch-check ...`                                         | `receipts/s4-arch-check.json`                                                                                                                 |
| 7     | `scaffold.runtime`   | After lease: allowlisted `run-gate.ts` command for `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`.   | `receipts/s5-scaffold-runtime.json`                                                                                                           |
| 8     | `fresh-browser`      | After lease: `run-gate.ts --gate fresh-browser --id app-service-client-wiring-s5-fresh-browser --cwd packages/fresh ...` | `receipts/s5-fresh-browser.json`                                                                                                              |

The exact binding sufficiency set is only these six files:

1. `receipts/s4-check.json`
2. `receipts/s4-test.json`
3. `receipts/s4-publish-dry-run.json`
4. `receipts/s4-arch-check.json`
5. `receipts/s5-scaffold-runtime.json`
6. `receipts/s5-fresh-browser.json`

Sufficiency is recomputed from their immutable metadata and child reports at the final content head;
supplemental JSR/member reports do not substitute for or duplicate the binding gate IDs.

## Expensive-Gate Release Conditions

Request the lease only when all of the following are true:

1. S1-S3 are committed and the draft PR head matches the local content head.
2. All targeted tests, JSR audits, docs/public surface checks, exact-pin checks, and the four cheap
   contracted receipts are green at that same head.
3. The scaffold suite has been extended to add/regenerate a second service and assert both module
   type-checking, cross-tier key isolation, and actual invalidation behavior.
4. The Fresh browser command includes old-versus-fresh server-snapshot hydration assertions.
5. Leak-check shows no unexplained owner and no other leaf holds the singleton lease.
6. The topic orchestrator explicitly releases this leaf to run both named gates.

## Dependencies

- Topic orchestrator `topic-features-0.0.7` owns the PLAN-EVAL decision and expensive-gate lease
  request to coordinator `codex-root-0.0.7`.
- #1348 is an optional future contribution source, not a blocker.
- Current SDK query factory/client-key contract and Fresh query option are prerequisites already on
  the baseline.

## Drift Watch

- Any change to `origin/main`, query key shapes, service manifest identity, command topology,
  canonical template paths, package export maps/pins, browser task scope, or gate catalog after this
  plan must be re-baselined and appended to `drift.md`.
- Any implementation departure from the additive SDK overload, generator overwrite/atomicity
  contract, README location, or six-file receipt set requires an explicit plan amendment and
  evaluator visibility.
