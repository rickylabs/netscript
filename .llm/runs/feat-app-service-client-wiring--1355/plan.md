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

## Drift Watch

- Any change to `origin/main`, query key shapes, service manifest identity, command topology,
  canonical template paths, package export maps/pins, browser task scope, or gate catalog after this
  plan must be re-baselined and appended to `drift.md`.
- Any implementation departure from direct `clientKey()` emission, the locked generator-owned paths,
  the whole-command overwrite/dry-run/force contract, the two package README locations, the
  SDK-0.0.6 import allowlist, pre-write contract failure/disabled-service policy, the five-file
  receipt set, or separate scaffold release-gate evidence requires an explicit plan amendment and
  evaluator visibility.
