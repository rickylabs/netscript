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

| Axiom                            | Why it matters                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------- |
| A1 — public types first          | Lock the key/invalidation and generator result contracts before their implementations.      |
| A2 — simple over easy            | One router-derived identity must drive client, query, and invalidation code.                |
| A6 — helpers justified           | `clientKey()` already supplies the typed path; an identity-wrapper overload adds no policy. |
| A8 — one reason per file         | Keep service discovery/planning, writes, and CLI presentation separate.                     |
| A14 — tests/publish are doctrine | Semantic, consumer, browser, JSR, and publish proof are required.                           |

## Goal

Generate deterministic per-service app client/query modules whose cache identities never collide,
whose invalidation prefixes are derived from the same typed query procedure, and whose canonical
Fresh islands preserve the server snapshot's real age across hydration.

## Scope

- Preserve all six already-derived per-service export names.
- Derive each query factory's resource from the manifest service/router identity.
- Emit the invalidation filter directly from the typed query factory's `clientKey()` and make both
  showcase call sites consume it.
- Introduce an all-service client generator with content comparison, deterministic results,
  `--dry-run`, `--force`, and no-partial-write failure when a contract is absent.
- Route both `service generate` and `service add --with-client` through the same generator seam.
- Pass `props.cachedAt` as `initialDataUpdatedAt` in both canonical island variants.
- Add semantic, type-negative, generated-output, real-browser, and runtime-E2E regression coverage.
- Document the generator verb, whole-command flags, L1/L2 dialect, and regeneration migration in
  `packages/cli/README.md`; document hydration age in `packages/fresh/README.md`.
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
- Lock generator ownership to `apps/<app>/lib/<service>.ts` for every manifest service. The
  init-owned `apps/<app>/routes/examples/service/(_lib)/service-query.ts` remains separate but is
  rendered from the same canonical template.
- Apply `service generate --dry-run` and `--force` to the complete command, including Aspire helper
  output: dry-run performs no writes; default writes changed/missing and skips identical output;
  force rewrites identical output.
- Bind PLAN-EVAL cycle-2 C1: rendered output defines the literal direct invalidation after
  `<svc>Queries` and its complete `@netscript/sdk/*` import set is allowlisted to
  `createServiceClient` from `@netscript/sdk/client` and `createQueryFactories` from
  `@netscript/sdk/query`; no `query-client` import remains.
- Bind PLAN-EVAL cycle-2 C2: a missing `contracts/versions/v1/<service>.contract.ts` or
  `<PascalService>ContractV1` export fails the command before any client or Aspire write, with an
  error naming the service and expected path. Every manifest service, including `Enabled: false`,
  receives an owned module; `Enabled` controls runtime registration, not source generation.
- Extend `packages/fresh` browser coverage and its `test:browser` task so the contracted
  `fresh-browser` gate actually covers hydration age rather than only form navigation.
- Preserve the deliberate evidence-class boundary: `scaffold.runtime` produces suite-owned
  exact-head release-gate output plus the central lease/cleanup record, never a catalog/run-gate
  receipt. `fresh-browser` remains catalog-backed.
- Keep receipt sufficiency to exactly one receipt per receipt-producing contracted gate; JSR member
  reports and the separate `scaffold.runtime` release-gate evidence remain supplemental to that
  receipt set while still required for merge-readiness.

## Locked Decisions

| ID | Decision                                                                                                                                                                                | Rationale                                                                                                |
| -- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| D1 | The manifest's service key, transformed exactly as the router name, is the sole resource identity.                                                                                      | It already owns service discovery and routing and prevents cross-service collision by construction.      |
| D2 | Server and client full keys remain tier-specific; only their `[resource, action]` prefix converges.                                                                                     | The SDK intentionally represents server input as serialized text and TanStack input as `{ input }`.      |
| D3 | All service modules are planned and validated before writes, in resolver-sorted order.                                                                                                  | Deterministic output and no partial mutation on a missing contract.                                      |
| D4 | Across client modules and Aspire helpers, changed/missing files are written, identical files skipped, dry-run reports without writes, and force rewrites identical files.               | Gives the existing composite verb one coherent whole-command contract.                                   |
| D5 | Both canonical islands pass `initialDataUpdatedAt: props.cachedAt`.                                                                                                                     | The loader already exposes the timestamp and Fresh already owns the public option.                       |
| D6 | Package upgrades alone do not edit apps; `service add --with-client` creates one owned module and `service generate` explicitly reconciles all owned client modules and Aspire helpers. | Direct emit still compiles in SDK-0.0.6-pinned apps; invoking the verb is the source-migration boundary. |
| D7 | No expensive gate runs before a coordinator release and recorded singleton lease.                                                                                                       | Required by the leaf contract and AGENTS.md.                                                             |
| D8 | Define `<svc>ListInvalidation` after `<svc>Queries` as `{ queryKey: <svc>Queries.list.clientKey() } as const`; add no SDK overload.                                                     | `clientKey()` is the existing typed seam; an identity wrapper violates A6 and would require SDK 0.0.7.   |
| D9 | Generate owned modules for enabled and disabled manifest services; validate every V1 contract before client or Aspire writes.                                                           | Client source follows declared contracts, while `Enabled` is a runtime-registration concern.             |

## Open-Decision Sweep

| Decision                             | Status                        | Notes                                                                                                                |
| ------------------------------------ | ----------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Invalidation construction            | Resolved by PLAN-EVAL cycle 1 | Direct emit from `<svc>Queries.list.clientKey()`; no SDK overload.                                                   |
| Migration-note locations             | Resolved by PLAN-EVAL cycle 1 | CLI contract/migration in `packages/cli/README.md`; hydration age in `packages/fresh/README.md`; never `docs/**`.    |
| Generator-owned app output           | Resolved by PLAN-EVAL cycle 1 | Own exactly `apps/<app>/lib/<service>.ts`; the route-example `(_lib)/service-query.ts` remains init-owned.           |
| `service generate` flag scope        | Resolved by PLAN-EVAL cycle 1 | `--dry-run` and `--force` govern client modules and Aspire helpers as one command.                                   |
| Installed plugin contributions       | Safe to defer                 | #1348-gated; generate first-party manifest services only.                                                            |
| L1/L2 vs L3 `defineServices` dialect | Safe to defer for this leaf   | Emit and document the current query-factory (L1/L2) dialect; changing to L3 is unnecessary for identity correctness. |

## Proposed Public Contracts

### SDK

Keep the SDK type/export surface unchanged. Correct the stale module example in
`packages/sdk/src/query-client/key-bridge.ts:4-7`, which still claims server keys begin with
`cache_query`, and add JSDoc pointing factory consumers to `factory.<action>.clientKey()` as the
factory-consistent invalidation prefix. Add semantic tests showing that
`bridgeInvalidation(resource, 'list').queryKey` prefix-matches a factory only when the resource
matches, and does not match when it differs. A named safe helper, if still wanted later, belongs in
a separate issue together with a deprecation path for the string form; do not add it here.

### CLI

Introduce a use-case-level request/result describing planned service-client files plus deterministic
`written` and `skipped` collections. The generator owns exactly `apps/<app>/lib/<service>.ts`, reads
sorted services from `ServiceWorkspaceResolver`, validates a corresponding contract for every
service, renders the canonical L1/L2 query-factory module, compares content, and writes only after
the full plan succeeds. The init-owned route-example
`apps/<app>/routes/examples/service/(_lib)/service-query.ts` uses the same template but is not
rewritten by `service generate`. The add and generate commands delegate to the client generator; the
generate command applies dry-run/force consistently to its client and Aspire-helper halves and
presentation only reports results. `packages/cli/README.md` documents this contract, the L1/L2
dialect, the literal `service` → per-router namespace migration, and all six pre-#1424 renames:
`exampleService{Name,RouterName,Contract,ListInvalidation,Client,Queries}` to their corresponding
`<camelService>*` symbols.

### Fresh

Do not add a new public type. Exercise the existing `IslandQueryOptions.initialDataUpdatedAt`
contract through the public Fresh `useQuery` wrapper in a real browser and document hydration-age
behavior in `packages/fresh/README.md`.

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

| Entry                                              | Action            | Notes                                                              |
| -------------------------------------------------- | ----------------- | ------------------------------------------------------------------ |
| Existing doctrine debt ledger                      | None              | No entry owns this seam and the plan does not accept new debt.     |
| Missing `.claude/05-frontend.md` overlay reference | Record drift only | Docs changes are prohibited and not needed for the implementation. |

## Commit Slices and Tier-A Stops

| Slice                         | Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Files                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Stop and evidence                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| S0 — Phase 1                  | Research, design ledger, plan, context, drift; draft PR and PLAN-EVAL cycles before code.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `.llm/runs/feat-app-service-client-wiring--1355/{research.md,plan.md,plan-eval.md,worklog.md,context-pack.md,drift.md,supervisor.md}`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Stop for formal PLAN-EVAL PASS; structured phase comments.                                           |
| S1 — SDK semantics/docs       | Keep the SDK type surface unchanged; correct stale key-shape docs, point factory consumers to `clientKey()`, and lock matching/mismatching resource semantics.                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | `packages/sdk/src/query-client/key-bridge.ts`; new `packages/sdk/src/query-client/key-bridge_test.ts`; run artifacts.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Commit; focused SDK check/test/doc-lint; slice comment; Tier-A stop.                                 |
| S2 — CLI generator contract   | Add the exported request/result and atomic plan/write use case; own only `apps/<app>/lib/<service>.ts` for all manifest entries including `Enabled: false`; validate every expected V1 contract before any client/Aspire write; apply whole-command dry-run/force; route add/generate through one seam; emit direct `clientKey()` invalidation after queries; add two-service, SDK-0.0.6 import-allowlist/literal-order, procedure-rename type-negative, idempotency, and atomic negatives. The import assertion allows exactly `createServiceClient` from `@netscript/sdk/client` and `createQueryFactories` from `@netscript/sdk/query`. | `packages/cli/mod.ts`; `packages/cli/src/public/features/services/services-group.ts`; `packages/cli/src/public/features/services/generate/{generate-service-command.ts,generate-service-clients.ts,generate-service-clients_test.ts,generated-service-client_type_test.ts}`; `packages/cli/src/public/features/services/add/{add-service.ts,add-service_test.ts}`; `packages/cli/src/public/features/generate/aspire/generate-aspire.ts`; new `packages/cli/src/public/features/generate/aspire/generate-aspire_test.ts`; `packages/cli/src/kernel/adapters/service/{client-scaffolder.ts,client-scaffolder_test.ts,workspace-mutator.ts,scaffolder_test.ts}`; `packages/cli/src/kernel/assets/app/routes/examples/service/(_lib)/service-query.ts.template`; `packages/cli/src/kernel/assets/embedded.generated.ts`; `packages/cli/e2e/suites/scaffold/capability-suites.ts`; run artifacts. | Commit; focused CLI check/tests/generated-asset freshness; slice comment; Tier-A stop.               |
| S3 — canonical hydration/docs | Pass cache age in both islands, add generated-output omission coverage and public-wrapper browser fixture/task, and write both ruled package README notes. The CLI README includes the exact six-symbol/namespace migration, L1/L2 dialect, whole-command flags, pre-write contract failure (Aspire included), expected contract path/export, and `Enabled: false` module policy.                                                                                                                                                                                                                                                          | `packages/cli/src/kernel/assets/app/routes/examples/(_islands)/{ServiceShowcaseLab.tsx.template,ServiceShowcaseLab.memory.tsx.template}`; `packages/cli/src/kernel/assets/embedded.generated.ts`; `packages/cli/src/kernel/templates/app/route-templates_test.ts`; `packages/cli/README.md`; `packages/fresh/tests/query-hydration-age_browser.ts`; new `packages/fresh/tests/fixtures/query-hydration-age-browser/{main.ts,app.tsx,vite.config.ts}`; `packages/fresh/deno.json`; `packages/fresh/README.md`; run artifacts.                                                                                                                                                                                                                                                                                                                                                                  | Commit; focused CLI/Fresh checks/tests/doc-lint; slice comment; Tier-A stop.                         |
| S4 — cheap convergence        | Run formatting/lint/asset checks, exact-pin/export/doc audits, three per-member isolated-declaration publish dry-runs, then the four cheap contracted gates at the committed candidate head.                                                                                                                                                                                                                                                                                                                                                                                                                                               | `.llm/runs/feat-app-service-client-wiring--1355/{receipts,reports,worklog.md,context-pack.md}` only, unless a gate finds a separately reviewed scoped repair.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Commit any evidence-only artifacts; recompute exact receipt sufficiency; comment; Tier-A stop.       |
| S4-F2 — executable runtime precondition | Repair Expensive-Gate Release Condition 3 without running an expensive gate: register the two-service add/generate commands, a static idempotency/type/key probe, and a live settled-refetch browser probe; unit-test the probe assertions and exact suite order; then replace the cheap binding evidence at the new immutable content head. | `packages/cli/e2e/src/domain/cli-surface.ts`; `packages/cli/e2e/src/application/gates/scaffold/scaffold-gates.ts`; new `packages/cli/e2e/src/application/gates/scaffold/service-client-runtime-probe.ts`; new internal transport dependency `packages/cli/e2e/src/application/gates/scaffold/service-client-browser-probe.ts`; new `packages/cli/e2e/tests/application/gates/service-client-runtime-probe_test.ts`; `packages/cli/e2e/suites/scaffold/capability-suites.ts`; `packages/cli/e2e/tests/presentation/suite-registry_test.ts`; `.llm/runs/feat-app-service-client-wiring--1355/{plan.md,worklog.md,context-pack.md,receipts}`. | Commit and push this plan amendment before E2E code; after implementation run focused cheap tests and four fresh binding receipts; comment; Tier-A stop. No lease or expensive execution. |
| S4-F3 — real-contract static probe | Repair the failed leased runtime probe without rerunning it: make the already-owned database codegen gate an explicit prerequisite, fail fast when its real Zod output is absent, derive separate list inputs from each generated helper's actual contract schema, and assert resource-prefix isolation plus each service's own key/input behavior without a byte-equal-tail premise. | `packages/cli/e2e/suites/scaffold/capability-suites.ts`; `packages/cli/e2e/src/application/gates/scaffold/service-client-runtime-probe.ts`; new dependency-free `packages/cli/e2e/src/application/gates/scaffold/service-client-input-probe.ts`; `packages/cli/e2e/tests/application/gates/service-client-runtime-probe_test.ts`; `packages/cli/e2e/tests/presentation/suite-registry_test.ts`; `.llm/runs/feat-app-service-client-wiring--1355/{plan.md,worklog.md,context-pack.md,leak-report.md,receipts}`. | Commit and explicitly push this amendment before product edits; then implement, run affected cheap tests and four fresh binding receipts, comment, and stop for Tier-A. No lease or expensive execution. |
| S5 — leased runtime proof     | After explicit coordinator release and singleton lease only: leak-check, run the exact `scaffold.runtime --cleanup --format pretty` command, then catalog-backed `fresh-browser`; verify cleanup and immutable head.                                                                                                                                                                                                                                                                                                                                                                                                                       | Suite-owned scaffold output/cleanup record; `.llm/runs/feat-app-service-client-wiring--1355/receipts/s5-fresh-browser.json`; `worklog.md`; `context-pack.md`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Suite-owned scaffold output + lease/cleanup record; one fresh-browser receipt; comment; Tier-A stop. |
| S6 — IMPL-EVAL                | Fresh opposite-family evaluator inspects code, acceptance, receipts, PR threads, and compatibility; implementation session repairs any findings in new bounded slices.                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | `.llm/runs/feat-app-service-client-wiring--1355/evaluate.md`; any repair files must be named in a new amended slice before editing.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Tier-A verdict comment per cycle; never flip ready or merge.                                         |

No implementation slice starts until S0 receives the owner/orchestrator determination and, if
required as proposed, PLAN-EVAL PASS.

## Validation Plan

All **receipt-producing** binding gates are invoked through `.llm/tools/gates/run-gate.ts` with
distinct invocation IDs, the explicit committed `--git-head`, `gitHead == actualGitHead`, and no
`--allow-git-head-mismatch`. Receipt directories are created before invocation; receipts are never
edited by hand. `scaffold.runtime` is deliberately outside that catalog: its authority is the
suite-owned exact-head output from the canonical one-pass command, plus the central expensive-gate
lease and cleanup record defined by `.llm/harness/gates/release-gates.md`.

| Order | Gate                 | Command/check                                                                                                            | Binding receipt or report                                                                                                                     |
| ----- | -------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Focused checks/tests | Structured Deno wrappers over touched roots/tests, including `--unstable-kv` for checks.                                 | Supplemental slice reports.                                                                                                                   |
| 2     | JSR audits           | `audit-jsr-package.ts`, full export-map doc-lint, exact-pin audit, and per-member publish dry-run for CLI/Fresh/SDK.     | Supplemental `jsr-audit-{cli,fresh,sdk}.json`, `doc-lint-{cli,fresh,sdk}.json`, `publish-dry-run-{cli,fresh,sdk}.json`, and exact-pin report. |
| 3     | `check`              | `run-gate.ts --gate check --id app-service-client-wiring-s4-check ...`                                                   | `receipts/s4-check.json`                                                                                                                      |
| 4     | `test`               | `run-gate.ts --gate test --id app-service-client-wiring-s4-test ...`                                                     | `receipts/s4-test.json`                                                                                                                       |
| 5     | `publish-dry-run`    | `run-gate.ts --gate publish-dry-run --id app-service-client-wiring-s4-publish-dry-run ...`                               | `receipts/s4-publish-dry-run.json`                                                                                                            |
| 6     | `arch-check`         | `run-gate.ts --gate arch-check --id app-service-client-wiring-s4-arch-check ...`                                         | `receipts/s4-arch-check.json`                                                                                                                 |
| 7     | `scaffold.runtime`   | After lease: `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`.                                         | Suite-owned exact-head output with raw exit code/failing suite names, plus central lease and cleanup record; no run-gate receipt.             |
| 8     | `fresh-browser`      | After lease: `run-gate.ts --gate fresh-browser --id app-service-client-wiring-s5-fresh-browser --cwd packages/fresh ...` | `receipts/s5-fresh-browser.json`                                                                                                              |

The exact binding receipt set is only these five files:

1. `receipts/s4-check.json`
2. `receipts/s4-test.json`
3. `receipts/s4-publish-dry-run.json`
4. `receipts/s4-arch-check.json`
5. `receipts/s5-fresh-browser.json`

Receipt sufficiency is recomputed from their immutable metadata and child reports at the final
content head; supplemental JSR/member reports do not substitute for or duplicate the binding gate
IDs. Merge-readiness additionally requires the separately classified `scaffold.runtime` suite-owned
output, exact-head proof, central lease, and cleanup record. It is not represented as a sixth
receipt.

## Expensive-Gate Release Conditions

Request the lease only when all of the following are true:

1. S1-S3 are committed and the draft PR head matches the local content head.
2. All targeted tests, JSR audits, docs/public surface checks, exact-pin checks, and the four cheap
   contracted receipts are green at that same head.
3. The scaffold suite contains the exact second-service and invalidation scenarios below.
4. The Fresh browser command contains the exact old-versus-fresh hydration scenarios below.
5. Leak-check shows no unexplained owner and no other leaf holds the singleton lease.
6. The topic orchestrator explicitly releases this leaf to run both named gates.

### S4-F2 executable proof design for Release Condition 3

The documented scenarios below become executable before any lease through four new catalog-owned
CLI E2E gates. `scaffold.service` and `scaffold.runtime` both select the first three in this exact
order immediately after `scaffold.init`; only `scaffold.runtime` selects the fourth, after the app,
users service, and database are live:

1. `scaffold.service-client-add` invokes the CLI under test as
   `service add --name payments --with-client --project-root <generated-project>`.
2. `scaffold.service-client-generate` invokes `service generate --project-root
   <generated-project>` once, producing/reconciling the owned `users.ts` and `payments.ts` modules
   and Aspire helpers.
3. `generated.service-client-contract` runs the checked-in static probe. The probe snapshots the two
   owned modules plus every current Aspire `.mts` output, invokes `service generate` a second time,
   requires the command to report zero client and Aspire writes, and compares the before/after path
   set and bytes. It writes a temporary consumer beside the owned modules, imports `usersQueries`
   and `paymentsQueries` without aliases, checks and executes that consumer, and feeds its actual
   server/client keys into the checked-in assertions. Those assertions require each users/payments
   pair to be identical after index 0, require TanStack prefix matching for each factory's own
   `[resource, 'list']` filter, and reject the users filter against the payments key. The temporary
   consumer is removed in `finally`.
4. `behavior.service-client-refetch` runs the checked-in probe in browser mode against the live
   generated `/examples/users?preview=success` route. Chrome DevTools network evidence identifies
   the `users.list` and `users.update` RPC requests. Because cache-age hydration may correctly
   suppress an automatic client refetch, the probe explicitly clicks the showcase Refresh control,
   then accepts a baseline only after `listRequestIds.size > 0` and every observed list request is
   completed for a 500 ms confirmation window. A late initial request invalidates the candidate
   baseline and restarts that window. The probe then clicks the first Rename control, pauses the
   successful update response long enough to prove the optimistic row already contains
   `renamedName`, resumes that response with `Fetch.continueResponse`, waits for
   `Network.loadingFinished` on its `networkId`, and requires the list count to be exactly baseline
   + 1 and the final row to contain that same persisted `renamedName`. An `invalidateQueries` spy is
   not evidence.

The new unit test imports the checked-in probe logic directly and proves fail-capable positive and
negative cases for byte identity, index-0-only key isolation, own/cross prefix matching, and the
settled `baseline + 1` plus persisted-DOM contract. Its late-initial-request case presents a
completed one-request candidate, then a second incomplete request, and proves the one-request
candidate is rejected until both requests complete and remain stable. A source-wiring assertion
prevents the browser adapter from reverting that helper to a fixed sleep and locks the response-stage
resume to `Fetch.continueResponse`. The test also asserts all four command definitions and the two
suites' order without starting Aspire, Docker, Chrome, `scaffold.runtime`, or `fresh-browser`. The
suite/probe code is therefore ready for the eventual leased command, while this slice remains
cheap-only. The probe delegates only Chrome discovery and DevTools protocol transport to
`service-client-browser-probe.ts`; this named internal dependency keeps the executable contract
module below the doctrine F-1 500-line review threshold and does not add a public surface or scenario.

The S4-FIX1 receipts under `receipts/s4-{check,test,publish-dry-run,arch-check}.json` remain durable
superseded evidence for content head `32ea23f50`. The interrupted `s4-f2-check.json` and
`s4-f2-test.json` attest the unsound `787cfa928` head and are also superseded-only; neither set is
ever presented as current after the browser-probe repair. At the corrected committed content head,
`run-gate.ts` creates a distinct exact set with fresh invocation IDs and filenames:

1. `receipts/s4-f2-fix1-check.json`
2. `receipts/s4-f2-fix1-test.json`
3. `receipts/s4-f2-fix1-publish-dry-run.json`
4. `receipts/s4-f2-fix1-arch-check.json`

Sufficiency is recomputed only over those four new files. Receipt generation still precedes neither
the lease nor either expensive command.

### S4-F3 executable repair after the first leased scaffold failure

The first leased `scaffold.runtime` run at evidence head `b14975af7` stopped with six gates passed
and one failed. Both real generator gates passed; `generated.service-client-contract` failed with
one missing generated-Zod import (TS2307) and two invalid shared-input calls (TS2345). Cleanup ran,
the leak report records no surviving Aspire resources, and the lease was released before repair.

The missing schema is a lifecycle prerequisite, not probe-owned output. `GATE.DATABASE_CODEGEN` is
already the canonical standalone/no-Aspire schema generator (`deno task db:generate` under the
selected `database/<engine>` workspace), but both service and runtime suites currently select the
service-client contract probe before it. S4-F3 preserves database codegen at its existing canonical
position—after the runtime suite's plugin/setup contributors—and moves
`GATE.GENERATED_SERVICE_CLIENT_CONTRACT` immediately after it in both suites. It does not duplicate
or prematurely trigger the command inside the probe and does not create a fake Zod module. The
probe additionally calls exported
`assertGeneratedServiceSchemaReady(projectRoot)` before importing helpers or writing the temporary
consumer. It requires a real `database/<engine>/schema/.generated/zod/crud.ts` and emits the expected
pattern when absent. The order-sensitive registry/probe tests require `database.codegen` before the
contract probe, and a temporary-directory unit test exercises that same exported readiness
primitive in the missing state.

The shared `LIST_INPUT` and `assertIndexZeroOnly` premise are removed. After schema readiness, the
temporary consumer imports the actual generated `users.ts` and `payments.ts` helpers under the
generated app's own Deno config. It reads each exported contract's
`list['~orpc'].inputSchema` and passes each schema to exported `deriveProcedureInput`, parameterized
by that helper's own `Parameters<typeof queries.list.key>[0]` type. The primitive converts the real
Zod input schema to input-mode JSON Schema, constructs only its required/defaulted witness values,
then validates the witness through the same contract schema before returning it. The consumer emits
two separately typed calls; its `deno check` therefore proves each value against its own real
generated query helper rather than against plan prose.

`assertServiceKeyIsolation` now proves only the owed contract: users/payments server and client keys
carry their own `[resource, 'list']` prefixes; every own filter matches its own key under TanStack's
real `partialMatchKey`; neither resource filter matches the other service's key; and each key's
input component equals that service's independently derived and contract-validated input. It does
not compare the users and payments input tails.

The negative divergent-contract unit case invokes `deriveProcedureInput` with a users-style schema
and an offset-based payments schema, proves the old shared literal is rejected by the latter, and
proves the generated consumer contains distinct derived inputs. Reverting to the old hardcoded
single input therefore breaks the same primitive/wiring test before an expensive run. The schema
precondition test invokes the same exported readiness function used by the live probe; no parallel
copy or source-only promise substitutes for either behavior.

The first cheap replay against the preserved failed generated project proved that invoking the
derivation in the parent probe cannot resolve generated-app aliases, while importing the whole
parent probe from the temporary consumer drags parent-package import-map dependencies into the app
check. The named internal dependency `service-client-input-probe.ts` therefore owns only
`deriveProcedureInput` and its JSON-Schema witness walk. It has no imports: it calls the real schema
instance's `toJSONSchema({ io: 'input' })` and `parse()` methods. Both the generated consumer and the
unit negative import that exact primitive. The orchestration probe retains filesystem, command,
key, and browser concerns; no package dependency or public surface is added.

The four `s4-f2-fix1-*` receipts at content head `2c8219968` remain durable but become superseded
after S4-F3 moves the content head. The replacement exact set uses fresh invocation IDs and files:

1. `receipts/s4-f3-check.json`
2. `receipts/s4-f3-test.json`
3. `receipts/s4-f3-publish-dry-run.json`
4. `receipts/s4-f3-arch-check.json`

Sufficiency is recomputed over only those four replacement files. No `scaffold.runtime`,
`fresh-browser`, Aspire, Docker, evaluator, or lease action is part of S4-F3.

### Exact `scaffold.runtime` scenarios required before the lease

1. Start from the suite's canonical generated project, whose initial service is `users`. Through the
   same local CLI binary under test, run:

   ```text
   netscript service add --name payments --with-client --project-root <generated-project>
   netscript service generate --project-root <generated-project>
   ```

   The add command creates the generator-owned `apps/<app>/lib/payments.ts`; generate reconciles
   that file and creates `apps/<app>/lib/users.ts`. Then run `service generate` a second time and
   assert zero writes and byte-identical client/Aspire output. A generated consumer imports
   `usersQueries` from the owned users module and `paymentsQueries` from the owned payments module
   and type-checks both without aliases. The init-owned route-example `(_lib)/service-query.ts` is
   not rewritten.
2. After the suite-owned database codegen prerequisite, derive `usersInput` from
   `usersContract.list['~orpc'].inputSchema` and `paymentsInput` independently from
   `paymentsContract.list['~orpc'].inputSchema`. Type both through their own generated query
   helper parameter and require these server keys:

   ```ts
   const usersServerKey = ['users', 'list', JSON.stringify(usersInput)] as const;
   const paymentsServerKey = ['payments', 'list', JSON.stringify(paymentsInput)] as const;
   ```

   and these client keys:

   ```ts
   const usersClientKey = ['users', 'list', { input: usersInput }] as const;
   const paymentsClientKey = ['payments', 'list', { input: paymentsInput }] as const;
   ```

   Each input must have been accepted by its own real contract schema. Each server/client filter
   must equal its own factory's `[resource, 'list']` prefix and TanStack-prefix-match its own key;
   neither users filter may match a payments key and neither payments filter may match a users key.
   No equality is required between the two input tails.
3. In the live generated app, load the successful users showcase, which imports the init-owned
   `apps/<app>/routes/examples/service/(_lib)/service-query.ts` rendered from the same corrected
   template. Wait for hydration/refetch activity to settle, record the current `users.list` request
   count, and click the first row's **Rename** control. The issued mutation is
   `users.update({ id: representativeId, data: { name: renamedName } })`. Assert the optimistic row
   appears and the mutation response succeeds; only after that response settles, require the
   `users.list` request count to equal the recorded count **plus exactly one**. The final DOM row
   must contain the persisted `renamedName` returned by that refetch. The post-settle count delta
   plus server-confirmed DOM value is the observable invalidation proof; merely spying on
   `invalidateQueries` is insufficient.

### Exact `fresh-browser` hydration scenarios required before the lease

Under one controlled browser clock, capture `hydrationNow` and render the same server snapshot with
`staleTime: 15_000` twice:

1. **Old snapshot:** `initialDataUpdatedAt = hydrationNow - 60_000`. Assert the server snapshot is
   the first paint, its initial cache `dataUpdatedAt` is the old timestamp, the query enters
   fetching/refetching, and the query function count becomes `1`.
2. **Fresh snapshot:** `initialDataUpdatedAt = hydrationNow`. Assert the same server snapshot is the
   first paint, cache `dataUpdatedAt` equals `hydrationNow`, fetching/refetching remain false, and
   the query function count remains `0` during the bounded first-paint observation.

The comparison is therefore `hydrationNow - 60_000` versus `hydrationNow`, not two uncontrolled
wall-clock samples.

## Dependencies

- Topic orchestrator `topic-features-0.0.7` owns the PLAN-EVAL decision and expensive-gate lease
  request to coordinator `codex-root-0.0.7`.
- #1348 is an optional future contribution source, not a blocker.
- Current SDK query factory/client-key contract and Fresh query option are prerequisites already on
  the baseline.

## F4 amendment — convergence before same-input idempotency

Coordinator disposition at lease-release checkpoint `dbf87e379` rules the S5 failure as a probe
sequence defect, not a product defect. Against the preserved generated project, after the failed
probe's first post-plugin invocation had reconciled three changed Aspire helpers, the coordinator
ran two more immediately consecutive identical `service generate` commands. Both exited 0 with
zero client writes, two current client skips, and zero Aspire-helper writes. SHA-256 manifests for
every `aspire/.helpers` file were identical before and after both commands. The first post-plugin
invocation was therefore convergence after intervening plugin, runtime-schema, and database gates
changed generator inputs; true same-input idempotency holds after that convergence.

The corrected executable contract supersedes only the zero-Aspire-write assertion in the earlier
runtime scenario:

1. Run the first post-plugin `service generate`. It may reconcile Aspire helpers, but it must still
   report zero service-client modules written and two current service-client modules skipped.
2. After that command succeeds, snapshot all generator-owned client and Aspire-helper paths and
   bytes. This is the converged baseline.
3. Immediately run the identical `service generate` again, with no intervening mutation. Require
   zero client modules written, two current client modules skipped, zero Aspire-helper files
   written, and exact path/byte identity against the converged snapshot.

The focused sequence regression must use the same exported probe primitive and fail if the second
identical command reports an Aspire-helper write or if the post-command owned-output snapshot
differs. The byte comparison is binding independently of the printed counts.

F4 implementation scope is bounded to:

- `packages/cli/e2e/src/application/gates/scaffold/service-client-runtime-probe.ts`
- `packages/cli/e2e/tests/application/gates/service-client-runtime-probe_test.ts`
- this run's plan/worklog/context and generated evidence only

No generator, template, SDK, Fresh, manifest, suite ordering, or public API change is authorized.
The four replacement binding receipts will be generated serially at the committed immutable content
head with fresh IDs and without overwriting any earlier evidence:

1. `receipts/s5-f4-check.json` — `app-service-client-wiring-s5-f4-check`
2. `receipts/s5-f4-test.json` — `app-service-client-wiring-s5-f4-test`
3. `receipts/s5-f4-publish-dry-run.json` — `app-service-client-wiring-s5-f4-publish-dry-run`
4. `receipts/s5-f4-arch-check.json` — `app-service-client-wiring-s5-f4-arch-check`

Sufficiency is recomputed over exactly those four files. No expensive gate, browser, Aspire, Docker,
lease request, or evaluator is part of F4.

Lease-head discipline is amended from S5: every preflight artifact must be committed and explicitly
pushed before readiness is reported. The head named in a lease request is final and immutable; no
preflight evidence commit may move it after a grant.

## F5 amendment — canonical post-init generated content

### Disposition and attribution

S5 attempt 3 reached `generated.deno-fmt-check` after the repaired F4 probe passed and reported 12
unformatted files. The earlier S5 report remains append-only, but its attribution is corrected here:
the formatting omission predates this leaf, while the failing post-init service-generation state is
inside this leaf's generated-output contract and cannot be carried as a merge baseline. At both
pre-implementation `c53726c69` and the current head,
`packages/cli/src/kernel/application/scaffold/support/post-scripts-init.ts:7` defines the only init
formatter, and `packages/cli/src/kernel/application/scaffold/init-pipeline.ts:80` is its only caller.
`init` output is formatted after its write phases; `service add`, `service generate`, and the four
post-init writer paths have no equivalent pre-write canonicalization.

The generated quality runner's current exact-set report reproduces the accepted 12-path arithmetic:

| Generated path | Owner / write decision |
| --- | --- |
| `apps/<app>/lib/users.ts` | `ServiceClientScaffolder.plan` / `needsWrite` / `write` |
| `apps/<app>/lib/payments.ts` | `ServiceClientScaffolder.plan` / `needsWrite` / `write` |
| `contracts/versions/v1/payments.contract.ts` | `createContractScaffolder.writeServiceContract` / `writeTracked` |
| `contracts/versions/v1/mod.ts` | `ContractVersionRegistry.regenerate` direct filesystem write |
| `services/payments/src/routers/v1.ts` | `ServiceScaffolder.writeRendered` / `writeGenerated` |
| `aspire/.helpers/register-apps.mts` | `regenerateAspireHelpers` generated-file equality/write loop |
| `aspire/.helpers/index.mts` | `regenerateAspireHelpers` generated-file equality/write loop |
| `aspire/.helpers/db-cli-mode.mts` | `regenerateAspireHelpers` generated-file equality/write loop |
| `aspire/.helpers/register-tools.mts` | `regenerateAspireHelpers` generated-file equality/write loop |
| `aspire/.helpers/register-infrastructure.mts` | `regenerateAspireHelpers` generated-file equality/write loop |
| `aspire/.helpers/register-background.mts` | `regenerateAspireHelpers` generated-file equality/write loop |
| `aspire/.helpers/register-plugins.mts` | `regenerateAspireHelpers` generated-file equality/write loop |

The three payments-derived non-client paths are the new contract, its regenerated v1 aggregate,
and the generated v1 service router. The seven helpers and three payments paths do not pass through
the client scaffolder, so a client-only formatter would repair only two of 12.

### Locked abstraction

Add one internal `GeneratedSourceFormatterPort` with two deliberately different operations:

1. a content-in/content-out operation that accepts the target path plus rendered source and invokes
   Deno's formatter over stdin (`deno fmt --ext <target-extension> -`); and
2. a bulk path operation for the existing init/post-script caller.

One `DenoGeneratedSourceFormatter` adapter owns both command shapes. It is a transport around the
sanctioned Deno formatter, not a local formatting algorithm. The content operation reuses the
existing generated-file policy from `format-generated-files.ts` (`--no-config`, line width 100,
single quotes, and target-derived extension). The bulk operation lets `formatOutput` retain its
current project-config discovery and warning semantics. The existing path-based
`formatGeneratedFiles` helper delegates to the same adapter, so its plugin callers retain their
current exact-file behavior.

The smallest required API adjustment is optional text stdin on `ProcessPort.exec`; `DenoProcess`
writes the complete encoded input, closes the writer, and only then awaits child output. The timeout
is armed across the write/close/output sequence; if it fires, the adapter kills the child, closes
the writer in `finally`, awaits termination, and returns the timed-out result rather than leaving an
open pipe. No new public package export is added. Post-init writers receive the formatter port
through the existing public command composition root. They canonicalize rendered content
**before** their equality or `willWrite` decision and write that exact canonical string. No
post-write `deno fmt` call is added to either service command.

The content contract resolves and allowlists the target extension before inspecting content. A
missing or unsupported extension fails closed with a target-named error before spawning Deno; there
is no default dialect. For a supported target whose rendered content is exactly empty, the adapter
returns `''` without spawning a formatter. This explicit formatted-empty passthrough preserves an
empty generated file without manufacturing whitespace while still refusing `empty` plus an unknown
target dialect.

This design is idempotent by construction. For a renderer `R` and canonicalizer `F`, both the
comparison and write use `F(R(input))`. A same-input repeat computes the same canonical bytes and
compares them to those same bytes on disk. The rejected design compared `R(input)` to previously
post-formatted `F(R(input))`, which would force a rewrite forever whenever formatting changed the
rendered source.

### Exact product and focused-test ceiling

F5 implementation may modify only these product paths:

- new `packages/cli/src/kernel/ports/generated-source-formatter-port.ts`
- `packages/cli/src/kernel/ports/process-port.ts`
- new
  `packages/cli/src/kernel/adapters/runtime/process/deno-generated-source-formatter.ts`
- `packages/cli/src/kernel/adapters/runtime/process/deno-process.ts`
- `packages/cli/src/kernel/application/scaffold/support/format-generated-files.ts`
- `packages/cli/src/kernel/application/scaffold/support/post-scripts-init.ts`
- `packages/cli/src/kernel/adapters/service/client-scaffolder.ts`
- `packages/cli/src/kernel/adapters/service/workspace-mutator.ts`
- `packages/cli/src/kernel/adapters/contracts/contract-scaffolder.ts`
- `packages/cli/src/kernel/adapters/contracts/version-registry.ts`
- `packages/cli/src/kernel/adapters/service/scaffolder.ts`
- `packages/cli/src/public/features/generate/aspire/generate-aspire.ts`
- `packages/cli/src/public/features/services/add/add-service.ts`
- `packages/cli/src/public/features/services/services-group.ts` — the root constructs the formatter,
  while this group assembles `GenerateAspireDependencies` for `service generate`; it must project
  that formatter into the Aspire-helper half so all seven helper owners canonicalize before compare.
- `packages/cli/src/public/features/root/public-command-dependencies.ts`

F5 focused-test mutations are bounded to:

- new
  `packages/cli/src/kernel/adapters/runtime/process/deno-generated-source-formatter_test.ts`
- `packages/cli/src/kernel/adapters/runtime/process/deno-process_test.ts`
- `packages/cli/src/kernel/application/scaffold/support/format-generated-files_test.ts`
- new `packages/cli/src/kernel/application/scaffold/support/post-scripts-init_test.ts`
- `packages/cli/src/kernel/adapters/service/client-scaffolder_test.ts`
- new `packages/cli/src/kernel/adapters/service/workspace-mutator_test.ts`
- `packages/cli/src/kernel/adapters/service/scaffolder_test.ts`
- new `packages/cli/src/kernel/adapters/contracts/version-registry_test.ts`
- `packages/cli/src/public/features/generate/aspire/generate-aspire_test.ts`
- `packages/cli/src/public/features/services/add/add-service_test.ts`
- `packages/cli/src/public/features/services/generate/generate-service-clients_test.ts`
- new
  `packages/cli/e2e/tests/application/gates/service-client-generated-format_test.ts`

The following named paths are explicitly excluded:

- `packages/cli/src/public/features/services/add/render-service.ts` remains an orchestration-only
  delegate; its contract and service scaffolders own canonical content.
- `packages/cli/src/public/features/services/generate/generate-service-clients.ts` keeps its current
  full-plan-before-write and `willWrite` flow; `ServiceClientScaffolder.plan` supplies canonical
  content before that flow compares anything.
- `packages/cli/src/public/features/services/generate/generate-service-command.ts` keeps the current
  flag propagation and reporting contract; formatter wiring belongs to its dependencies.
- `packages/cli/src/public/features/services/add/add-service-command.ts` keeps parsing/reporting
  only. `add-service.ts` is included solely to pass the injected formatter into Aspire planning.
- `packages/cli/src/kernel/application/scaffold/workspace-init.ts` remains unchanged: init keeps one
  bulk `formatOutput` phase after all init writes, now routed through the shared formatter adapter.
- All baseline templates, `embedded.generated.ts`, browser fixtures, SDK/Fresh files, `docs/**`, and
  `deno.lock` are excluded. No template or fixture is hand-formatted to satisfy the gate.

This is the hard path ceiling. A compiler-proven need outside it requires another explicit
amendment and Tier-A review before that path is touched.

### Preserved contracts

- **Dry run:** rendering and in-memory canonicalization may execute, but the existing dry-run branch
  still performs zero target writes for clients and helpers. The exact-path snapshot must remain
  byte-identical.
- **Force:** canonicalization precedes the decision, but `force` remains the first write condition;
  identical canonical output is still rewritten and reported as written.
- **Atomic prevalidation:** `addService` still invokes `validateServiceClientContracts` before
  `renderService`, appsettings/workspace mutation, client writes, or Aspire writes. Client planning
  canonicalizes in memory during that validation-only pass, so all manifest contracts and client
  render/format work complete before the first target write. No try/rollback path is introduced.
- **Errors:** missing-contract and missing-export types, wording, service name, and expected path are
  unchanged. New formatter failures name the target and preserve Deno stderr; init continues to
  convert formatter failure to its existing warning rather than changing init's error contract.
- **Formatter inputs:** supported-extension empty content is an explicit zero-byte passthrough;
  missing or unsupported extensions fail before process execution. Extension validation precedes
  the empty-content branch, so an empty file cannot bypass dialect validation.
- **F4:** the first post-plugin generate may converge changed inputs. Its canonical output is the
  snapshot. The immediately consecutive same-input generate computes the same canonical bytes,
  reports zero client/helper writes, and remains path/byte-identical.
- **Counts/ownership:** service-add and service-generate result paths and written/skipped counts
  remain owned by the current writers. Formatting creates no extra logical output or hidden target
  write.

### Cheap proof matrix

| Proof | Executable assertion | Bound test/evidence |
| --- | --- | --- |
| Formatter transport | Unformatted TS/MTS passed as stdin returns Deno-formatted stdout; target extension and existing generated style flags are exact; a second canonicalization is byte-identical; supported-extension empty content returns `''` without spawning; missing/unsupported extensions (including empty content) fail before spawn. A timeout test sends stdin to a child that prints only after EOF and then hangs: stdout must prove EOF was observed, timeout must kill and return, and elapsed time must stay bounded, pinning write → close → await-output and writer closure on kill. Non-zero formatter exit names the target. | `deno-generated-source-formatter_test.ts`; `deno-process_test.ts`; `format-generated-files_test.ts`; `post-scripts-init_test.ts` |
| Four writer owners | Client plans, the two contract paths (including version aggregate), service router output, and Aspire helper plans all compare/write the injected canonical string rather than raw render output. | `client-scaffolder_test.ts`; `version-registry_test.ts`; `scaffolder_test.ts`; `workspace-mutator_test.ts` |
| Exact 12-path generated output | In a temporary real scaffold, run `init` for database-backed `users`, then `service add --name payments --with-client`, then `service generate`. Assert the exact 12 paths listed above exist and `deno fmt --check` passes for that exact set; also require the generated project's full `deno task fmt:check` to exit 0. No Aspire restore/start or Docker is involved. | new `service-client-generated-format_test.ts` in the ordinary cheap test gate |
| Dry-run/force | Snapshot owned paths, run `service generate --dry-run`, and require zero byte changes; run `--force` and require identical canonical content to be reported/written rather than skipped. | existing generator/Aspire flag tests plus focused writer assertions |
| C2 atomic failure | With an unrelated manifest service missing its V1 contract, `service add --with-client` retains byte-identical appsettings/workspace state and never invokes helper writing; message still names the service and full expected path. | existing `add-service_test.ts`, rerun unchanged except formatter dependency fixture wiring |
| F4 same-input idempotency | After any allowed convergence, snapshot canonical client/helper output, run the immediately identical generate, require zero clients/helpers written, two client skips, and exact SHA-256 path/byte identity. The focused negative still fails on a second identical helper write or byte drift. | existing `assertServiceGenerationSequence` and `service-client-runtime-probe_test.ts`, plus the temporary real-scaffold sequence |

Only focused cheap tests and the four binding catalog gates are eligible after Tier-A releases this
repair. No runtime/browser lease, `scaffold.runtime`, `fresh-browser`, Aspire, Docker, or evaluator
is part of the amendment or its implementation slice.

## F6 amendment — precise browser-child termination

### Disposition and preserved evidence

S5 attempt 4 is a leaf-caused probe teardown failure, not a refetch-behavior verdict. The suite
reached `passed=69 failed=1 skipped=0`; `generated.deno-fmt-check` passed in 343 ms against the real
generated project, confirming F5 beyond the cheap 12-path proof, and
`generated.service-client-contract` remained green, preserving F4. The only failure was
`behavior.service-client-refetch`: its `finally` block called `child.kill('SIGTERM')` after the
browser child had already exited, and that cleanup exception prevented the collected evidence from
returning. The refetch scenario is therefore still **unknown**, not pass or fail.

The attempt progression remains append-only evidence: 20 passed in attempt 1, 32 passed in attempt
3, and 69 passed in attempt 4. The attempt-4 report and raw output remain unchanged at
`reports/s5-attempt4-runtime-failure.md` and
`reports/s5-attempt4-scaffold-runtime-20260815-2037.log`; the raw log SHA-256 remains
`b476da4ce039d03785e46669d51919b48c41fbae80ca41ca9188bcbb53e97f23`. All earlier S5 attempts,
S4/F4/F5 reports and receipts, the Fresh 45 and SDK 3 `PRE_EXISTING_FAIL` baselines, and the
separately named plugin-streams diagnostic remain preserved.

### Locked helper contract

Add the small named internal helper below to
`service-client-browser-probe.ts`, immediately after `collectBrowserRefetchEvidence` and before
`waitForCompletedStableBaseline`:

```ts
export async function terminateBrowserProcess(
  child: Pick<Deno.ChildProcess, 'kill' | 'status'>,
  drain: Promise<void>,
): Promise<Deno.CommandStatus>
```

The export is only a same-package E2E test seam; no package barrel or public `@netscript/cli`
surface re-exports it. This helper is justified under A6 because it encodes the probe's precise
termination policy and gives the focused test the same side-effect seam production uses. A third
helper file would add indirection without another consumer and is prohibited.

The helper calls `child.kill('SIGTERM')`. Deno's local `ChildProcess.kill` API returns `void` and
documents no typed exception, error code, or state predicate for an already-exited process. The
attempt-4 runtime exposes only `TypeError: Child process has already terminated`, so the narrowest
available discriminator is exactly:

```ts
error instanceof TypeError && error.message === 'Child process has already terminated'
```

Only that conjunction is tolerated. A different `TypeError`, a non-`TypeError` with the same
message, or any other thrown value is rethrown unchanged; no bare catch is allowed. After either a
successful signal or the one tolerated already-terminated result, the helper awaits `child.status`,
then awaits the stderr `drain`, and returns the resolved status. The pipe promise passed as `drain`
must be the raw `pipeTo(...)` promise rather than the current eagerly swallowed
`.catch(() => {})`, so unrelated drain errors also propagate. Deno documents `status` as never
rejecting, but it is still awaited explicitly to prove process reaping and sequencing.

`collectBrowserRefetchEvidence` delegates its child cleanup to this helper. Profile removal remains
in an enclosing `finally`, so an unrelated termination/drain error is preserved for the caller
while the temporary profile still receives its existing best-effort removal. The CDP client close,
refetch evidence shape, request baseline, response-stage resume, and all browser assertions remain
unchanged.

### Exact path ceiling

The later F6 repair may modify exactly these two already-owned paths:

1. `packages/cli/e2e/src/application/gates/scaffold/service-client-browser-probe.ts`
2. `packages/cli/e2e/tests/application/gates/service-client-runtime-probe_test.ts`

There is no new source, test, template, fixture, barrel, task, catalog, SDK/Fresh, `docs/**`, or
`deno.lock` path. A compiler-proven need for a third path stops the repair for another explicit
amendment and fresh Tier-A review.

### Cheap deterministic proof matrix

| Proof | Executable assertion in `service-client-runtime-probe_test.ts` |
| --- | --- |
| Already-terminated child | Spawn a short Deno child, attach its raw stderr drain, await its natural successful exit, then call `terminateBrowserProcess`. Require no throw, the same resolved successful status, and completed drain. This deterministically reproduces attempt 4 without a browser or runtime suite. |
| Active child termination | The existing allow-all E2E unit-test seam supports a real `Deno.Command`; no new harness is needed. Spawn a child that signals readiness and remains running, call the same helper, and require the returned status to show `SIGTERM`/unsuccessful termination only after the raw drain completes. This proves the helper still terminates and awaits an active child rather than merely tolerating exited ones. |
| Unrelated error propagation | Invoke the same helper through its structural `Pick` seam with a `kill` implementation that throws an unrelated `TypeError`, and require the exact error object to propagate. Also reject a non-`TypeError` carrying the terminated-child message, pinning both halves of the discriminator, and require a rejecting raw drain promise to propagate after a successful kill/status. All three cases make future broad catches fail. |
| Production delegation | Keep a focused source/delegation assertion that the browser probe calls `terminateBrowserProcess(child, drain)` and no longer contains an unguarded `child.kill('SIGTERM')` in its `finally` block. |

If Tier-A later releases F6 implementation, the focused test file runs first; only after it is green
may the existing four binding cheap gates be refreshed at the committed content head. No lease,
`scaffold.runtime`, `fresh-browser`, Aspire, Docker, evaluator, readiness change, or product repair
is authorized by this amendment.

## F7-C1 amendment — managed-browser selection and observable startup failure

### Corrected disposition and measured cause

S5 attempt 5 is an honest red and is still not a refetch-behavior verdict. The suite reached all 70
steps with 69 passed, 1 failed, and 0 skipped; F5's `generated.deno-fmt-check` and F4's
`generated.service-client-contract` remained green. F6 also worked: teardown returned control to
the probe, exposing the startup failure. No CDP connection, navigation, mutation, or request-count
assertion ran, so refetch behavior remains unknown.

The earlier F7 premise was materially stale and is superseded before review. The host does have
runnable managed Linux Chromium binaries, independently measured with successful `--version`:

```text
/home/codex/.cache/ms-playwright/chromium-1232/chrome-linux64/chrome
  -> Google Chrome for Testing 151.0.7922.10
/home/codex/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome
  -> Google Chrome for Testing 151.0.7922.34
```

The defect is executable allowlist/selection, not environmental capability. None of the probe's
four `/usr/bin/*` Linux candidates exists, while its six-entry list does not inspect or accept an
explicit managed-browser path. It therefore falls through to Windows Chrome. This WSL instance has
no `WSLInterop`/`WSLInterop-late` binfmt registration, so the exact browser argv exits 2 while
`/bin/sh` parses the PE file and writes `Syntax error: word unexpected (expecting ")")`. The probe
then compounds selection failure by draining that stderr into a discard sink, ignoring early child
status, and reporting only a DevTools timeout. The child never bound the port; path translation and
`127.0.0.1` handling remain refuted hypotheses.

Attempt-5 evidence remains append-only:

- `reports/s5-attempt5-runtime-failure.md`
- `reports/s5-attempt5-scaffold-runtime-20260815-2139.log`, SHA-256
  `ff349b40f7f70341934e170df7c67d147c0ed983173b41871421755ad55e062b`
- `reports/s5-attempt5-scaffold-runtime-20260815-2139.ndjson`, SHA-256
  `e35d6fbcbdfc0b046be3fec29fa5dee0b0369094645b75cb42fca1e0350bbc16`

All four earlier S5 attempts and their hashes, `receipts/f6-test.json` as a superseded red, every
S4/F4/F5/F6 report and receipt, Fresh's 45 and SDK's 3 `PRE_EXISTING_FAIL` diagnostics, and the
separately named plugin-streams diagnostic remain unchanged.

### Locked executable-selection boundary

The portable override is the explicitly documented environment variable
`NETSCRIPT_E2E_BROWSER_EXECUTABLE`. Versioned Playwright/Puppeteer cache paths are runtime values,
never source constants or fallback candidates; neither `chromium-1232` nor `chromium-1234` may
appear in either later code path. The name is documented in adjacent source JSDoc, selection errors,
and focused tests without adding a README or third path.

The later repair replaces the path-only resolver result with these E2E-internal, same-module seams:

```ts
export const BROWSER_EXECUTABLE_ENV = 'NETSCRIPT_E2E_BROWSER_EXECUTABLE';

export interface BrowserExecutableSelection {
  readonly path: string;
  readonly source: typeof BROWSER_EXECUTABLE_ENV | 'built-in allowlist';
  readonly version: string;
}

export async function selectBrowserExecutable(
  override: string | undefined = Deno.env.get(BROWSER_EXECUTABLE_ENV),
  probe: (path: string) => Promise<string> = probeBrowserVersion,
): Promise<BrowserExecutableSelection>
```

These exports are test seams only and are not re-exported through any CLI package barrel.
`probeBrowserVersion` validates that the path exists, is a file, and—where Unix mode bits are
available—has an execute bit before spawning `<path> --version`. The probe has a bounded timeout,
captures bounded stdout/stderr, requires exit 0, and requires a recognizable Chrome/Chromium/Edge
version string. Missing, non-file, non-executable, spawn failure, timeout, non-zero exit, and
unrecognized output are distinct reasons in the error text.

Override semantics are strict:

- If `NETSCRIPT_E2E_BROWSER_EXECUTABLE` is present, including an empty value, only that value is
  considered. Empty is invalid; a non-empty value is passed to `probeBrowserVersion`.
- Any override failure throws an error naming the exact source
  `NETSCRIPT_E2E_BROWSER_EXECUTABLE`, the supplied path (or `<empty>`), and the specific reason.
  The built-in list is never consulted after an override was supplied.
- If no override is present, the existing built-in candidates remain fallbacks, but a path is
  selected only after the same runnable/version probe succeeds. Present-but-unrunnable candidates
  are recorded in the final error rather than returned merely because `Deno.stat` found a file.
- If no built-in is runnable, the error names the attempted candidates and tells the operator to
  set `NETSCRIPT_E2E_BROWSER_EXECUTABLE`. There is no skip path.

`collectBrowserRefetchEvidence` receives `BrowserExecutableSelection`, spawns `selection.path`, and
carries `selection.source` and `selection.path` into every actual headless-startup error. Thus an
override that passes `--version` but exits under the real headless argv still fails loudly against
that override and never falls back.

### Locked bounded startup diagnostics

The correct F7 bounded-status design remains. One generic bounded capture serves both executable
version probing and browser stderr:

```ts
export interface BoundedTextCapture {
  readonly drain: Promise<void>;
  text(): string;
}

export function captureBoundedText(
  stream: ReadableStream<Uint8Array>,
  maxBytes?: number,
): BoundedTextCapture

export async function awaitBrowserStartup<TTarget>(
  selection: BrowserExecutableSelection,
  target: Promise<TTarget>,
  status: Promise<Deno.CommandStatus>,
  stderr: BoundedTextCapture,
): Promise<TTarget>
```

`captureBoundedText` immediately and continuously drains through one reader while retaining only
the final `32 * 1024` bytes by default. Truncation is explicit. The raw failure-capable drain is the
same promise passed to F6's `terminateBrowserProcess`; there is no second reader, discard sink, or
swallowed drain.

`awaitBrowserStartup` races the existing `waitForDebugTarget(port)` promise against the one
`child.status` promise captured at spawn. Target-first proceeds normally. Status-first awaits the
drain and throws with selection source/path, numeric exit code, signal, and bounded stderr (or
`<empty>`), never the generic timeout. If the target promise rejects while status remains pending,
the helper preserves that cause/text but enriches the error with selection source/path; it does not
invent an exit status. F6's termination discriminator, CDP close, stable baseline, response-stage
resume, evidence shape, and refetch assertions remain unchanged. This fixes the startup instance of
the same swallow class F6 already removed from teardown.

### Exact later path ceiling

F7 implementation may modify exactly the two already-owned F6 paths:

1. `packages/cli/e2e/src/application/gates/scaffold/service-client-browser-probe.ts`
2. `packages/cli/e2e/tests/application/gates/service-client-runtime-probe_test.ts`

There is no new module, gate, suite, task, catalog, template, fixture, package barrel, README,
SDK/Fresh, `docs/**`, or `deno.lock` path. A compiler-proven need for a third path stops for another
amendment and fresh Tier-A review.

### Cheap deterministic proof matrix

| Proof | Executable assertion/evidence |
| --- | --- |
| Managed Linux binary | Record the coordinator's two successful Chrome-for-Testing 151 `--version` measurements above. After implementation, pass one measured path as the environment value—not a source literal—and require `selectBrowserExecutable()` to report source `NETSCRIPT_E2E_BROWSER_EXECUTABLE`, the exact supplied path, and a recognizable Google Chrome version. Assert neither versioned cache directory appears in source or test. |
| Override precedence and success | Through the selector's injected probe seam, supply an override and a different would-be successful fallback. Require exactly one probe call for the override and the returned selection to retain override source/path/version. This fails if candidate search precedes or follows an explicit override. |
| Invalid override, no fallback | Exercise empty, missing, non-executable, spawn-failing, timed-out/non-zero, and unrecognized-version overrides. Each rejection must name `NETSCRIPT_E2E_BROWSER_EXECUTABLE`, the exact path or `<empty>`, and its specific reason. The injected call log must prove no built-in candidate was probed after failure. |
| Immediate headless exit | Spawn a real child that writes a unique stderr sentinel and exits 2. With override selection metadata and a never-resolving target, require an error naming the override source/path, code 2, and the sentinel, with no DevTools-timeout wording. |
| Bounded continuous drain | Emit more than 32 KiB ending in a terminal sentinel. Require the truncation marker, retained tail bound, terminal sentinel, and completed drain. |
| Live-child timeout and F6 | With status pending, require the selection-aware error to name override source/path and preserve the original target-timeout cause/text without claiming an exit code. Source wiring must use one bounded capture/status race, pass the same drain to `terminateBrowserProcess`, contain no discard sink, and keep all F6 natural-exit, active-SIGTERM, three-negative, and delegation proofs green. |

The gate must prove settled refetch; skip is not an outcome. After a later Tier-A release and cheap
convergence, a coordinator-granted lease must execute `scaffold.runtime` with the explicit managed
Linux browser override and require `behavior.service-client-refetch` to pass before the conditional
`fresh-browser` gate can run. This amendment itself authorizes no lease, expensive gate, Aspire,
Docker, evaluator, readiness/metadata change, or product repair.

## F8 amendment — bounded and attributable CDP transport waits

### Attempt-6 attribution and evidentiary limit

Attempt 6 proves F7: the selector used `NETSCRIPT_E2E_BROWSER_EXECUTABLE`, the exact configured
managed Chromium path, and `Google Chrome for Testing 151.0.7922.34`; the browser genuinely
launched. F4's service-client contract and F5's generated-format gates also passed again. The sole
red, `behavior.service-client-refetch`, exited 143 (`128 + SIGTERM`) after the suite-owned
900,030 ms boundary with empty stdout/stderr tails. That is not a refetch-behavior verdict because
the probe returned no evidence.

The preserved NDJSON has no progress marker between browser startup and the final outer kill, so it
cannot distinguish the following two measured unbounded primitives:

1. `CdpClient.connect(url)` settles only through `socket.onopen` or `socket.onerror`; a socket that
   emits neither leaves it pending forever.
2. `CdpClient.send(method, params)` settles only if `#receive` observes its id; a sent command with
   no response leaves it pending forever. Every current `Page.enable`, `Runtime.enable`,
   `Network.enable`, `Fetch.enable`, `Page.navigate`, `Fetch.continueResponse`, and helper-owned
   `Runtime.evaluate` call crosses this seam.

`waitUntil`, `CdpClient.waitFor`, browser version probing, and DevTools target startup are already
bounded. The later repair will bound both independently demonstrated primitives because the
required deterministic no-event and no-response transports each reproduce a real non-settling path;
it will not claim that the runtime ledger selected one of them. Exact evidence, hashes, and the full
proof design are in `reports/f8-plan-amendment.md`.

### Locked two-path ceiling and transport contract

F8 may later modify exactly:

1. `packages/cli/e2e/src/application/gates/scaffold/service-client-browser-probe.ts`
2. `packages/cli/e2e/tests/application/gates/service-client-runtime-probe_test.ts`

The existing source owns `CdpClient` and the timeout policy, while the existing test imports
same-module E2E-internal seams. No third path, public package export, gate/suite/task/catalog,
template/fixture, README, SDK/Fresh, `docs/**`, or `deno.lock` path is needed. A compiler-proven need
outside this ceiling stops for another amendment and Tier-A.

The later source change exposes only the minimum E2E-internal `CdpClient`/structural socket test
seam; production still creates `new WebSocket(url)`. `connect` and `send` accept injectable timeout
options for deterministic tests and use the existing `TIMEOUT_MS = 20_000` default in production.
Connection expiry names `CDP WebSocket connection`, the exact URL, and `20000 ms`. Command expiry
names `CDP response`, the exact method, and `20000 ms`. Twenty seconds is 45 times below the suite's
900,000 ms boundary, leaving time for the F6 cleanup and diagnostic return before an outer SIGTERM.

Timers clear on every normal settlement. A timed-out send deletes its id before rejection so late
responses cannot settle stale work. A connection timeout detaches settlement handlers and closes
the inert socket through the structural seam. No retry, reconnect, stage-guess, broad catch, or new
transport abstraction is introduced.

### Cheap deterministic proof matrix

| Proof | Executable assertion in `service-client-runtime-probe_test.ts` |
| --- | --- |
| Never-opening connection | An injected socket emits neither open nor error. A short production bound must reject before a much larger test watchdog, naming the connection operation, exact URL, and bound. Removing the bound makes the watchdog fail quickly rather than hanging the suite. |
| Never-returning send | An injected socket opens and records `Page.enable` but never returns its id. A short production bound must reject before the watchdog, naming the response operation, method, and bound; a late response cannot resurrect the removed pending entry. |
| Normal settlement | A matching result and a matching CDP error arriving before the bound retain the existing resolution/rejection behavior and cancel the timer. |
| Distinct diagnostics | The sentinel URL belongs only to the connection error and the sentinel method belongs only to the send error, making the two runtime-indistinguishable primitives separately attributable. |
| F6 and F7 preservation | All termination/drain negatives and delegation remain green with no discard sink; strict selection, runnable/version probing, startup status/stderr, and no-versioned-cache-literal tests also remain green unchanged. |

After a future Tier-A releases implementation, run the focused test and four fresh exact-head
binding receipts (`check`, `test`, `publish-dry-run`, `arch-check`) before a second fresh Tier-A.
Attempt 7 is prohibited until that repair/evidence review passes and a new coordinator lease is
granted. This amendment authorizes no source/test mutation, runtime/browser gate, Aspire, Docker,
lease, evaluator, readiness/merge/metadata, issue, lockfile, docs, or quarantine mutation.

## Drift Watch

- Any change to `origin/main`, query key shapes, service manifest identity, command topology,
  canonical template paths, package export maps/pins, browser task scope, or gate catalog after this
  plan must be re-baselined and appended to `drift.md`.
- Any implementation departure from direct `clientKey()` emission, the locked generator-owned paths,
  the whole-command overwrite/dry-run/force contract, the two package README locations, the
  SDK-0.0.6 import allowlist, pre-write contract failure/disabled-service policy, the five-file
  receipt set, or separate scaffold release-gate evidence requires an explicit plan amendment and
  evaluator visibility.
