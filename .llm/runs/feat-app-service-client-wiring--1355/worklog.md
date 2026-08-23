# Worklog: app-side service client/query wiring

## Run Metadata

| Field          | Value                                                 |
| -------------- | ----------------------------------------------------- |
| Run ID         | `feat-app-service-client-wiring--1355`                |
| Branch         | `feat/app-service-client-wiring`                      |
| Archetype      | `2 — Integration` (SDK seam; CLI 6, Fresh 4 retained) |
| Scope overlays | `frontend`                                            |

## Design

### Public Surface

- Existing SDK surface retained; generated invalidation directly uses
  `<svc>Queries.list.clientKey()` and SDK work is JSDoc plus semantic regression coverage.
- Proposed all-service client generation request/result with planned, written, and skipped files.
- Documented public `service generate` contract in `packages/cli/README.md`, including whole-command
  dry-run/force, owned paths, L1/L2 dialect, and regeneration migration.
- Existing `IslandQueryOptions.initialDataUpdatedAt`; no new Fresh query type.

### Domain Vocabulary

- **service identity** — manifest key transformed by the canonical router-name casing.
- **resource prefix** — `[serviceIdentity]` or `[serviceIdentity, procedure]` shared across cache
  tiers for invalidation.
- **service-client generation plan** — sorted, fully validated files before mutation.
- **cache age** — server `cachedAt` preserved as TanStack `dataUpdatedAt`.

### Ports

- `FileSystemPort` — content comparison and atomic plan-then-write generation.
- `ServiceWorkspaceResolver` — sorted manifest-owned service discovery.
- `ScaffolderPort` / template renderer — current generated-file edge, to be reconciled behind one
  generator use case.

### Constants

- No new global constant group planned; service identity is derived data.

### Commit Slices

| #  | Slice                                             | Gate                                           | Files                                                                             |
| -- | ------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------- |
| S0 | Phase-1 research/plan and draft PR                | Identity + `git diff --check`; no product gate | Run artifacts only                                                                |
| S1 | SDK key docs and matching semantics               | Focused SDK check/test/doc-lint                | `key-bridge.ts`, new `key-bridge_test.ts`, run artifacts                          |
| S2 | CLI generator and per-service key contract        | Focused CLI check/tests/assets                 | Exact CLI feature/adapter/template/Aspire/E2E files listed in `plan.md` S2        |
| S3 | Canonical cache age/browser coverage/README notes | Focused CLI/Fresh check/test/doc-lint          | Exact island, browser fixture/task, CLI/Fresh README files listed in `plan.md` S3 |
| S4 | Cheap contracted and JSR convergence              | check/test/publish-dry-run/arch-check          | Receipts/reports only unless a gate finds a scoped fix                            |
| S5 | Released runtime/browser proof                    | scaffold.runtime/fresh-browser                 | Receipts/reports only unless a gate finds a scoped fix                            |
| S6 | IMPL-EVAL and bounded repairs                     | Fresh Tier-A verdict                           | Evaluation artifact plus any separately committed repair                          |

### Deferred Scope

- Installed SDK contributions — owned by #1348.
- Remaining island-query type/JSDoc work — owned by #1245.
- Broader app/route generator modernization — owned by #1333/#1354/#1357.

### Contributor Path

Add a service to the root `NetScript.Services` manifest (normally through `netscript service add`),
then run the broadened `netscript service generate`; the shared generator validates the matching
contract and deterministically creates or reconciles `apps/<app>/lib/<service>.ts`.

## Progress Log

| Time                      | Slice | Step               | Notes                                                                                                                                                                                        |
| ------------------------- | ----- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-15T12:39:58+02:00 | S0    | Identity           | Clean tree; branch/base/origin exact; no upstream/remote branch by design.                                                                                                                   |
| 2026-08-15T12:39:58+02:00 | S0    | Research           | Re-verified SDK, CLI generator/templates, Fresh hydration hook/tests, commands, package manifests, and issue acceptance at the pinned base.                                                  |
| 2026-08-15T12:39:58+02:00 | S0    | Plan               | Proposed PLAN-EVAL required and both expensive gates required only after cheap convergence and coordinator release.                                                                          |
| 2026-08-15T12:49:56+02:00 | S0    | Draft PR           | Pushed only the Phase-1 run artifacts, opened draft PR #1664 with both closing keywords, attached milestone/taxonomy, and posted RESEARCH/PLAN comments.                                     |
| 2026-08-15T12:58:24+02:00 | S0R   | Tier-A plan repair | Removed the false scaffold-runtime catalog/receipt proposal and specified exact two-service key, live invalidation, and controlled hydration scenarios; no implementation or expensive gate. |
| 2026-08-15T13:12:59+02:00 | S0E1  | PLAN-EVAL cycle 1  | Evaluator returned `FAIL_PLAN`; direct emit and package README locations ruled; amended six plan-text gaps only, with implementation still stopped.                                          |
| 2026-08-15T13:29:06+02:00 | S0E2  | PLAN-EVAL cycle 2  | Evaluator returned terminal `PASS`; verified `clientKey()` in published SDK 0.0.6 and released S1 only.                                                                                      |
| 2026-08-15T13:29:06+02:00 | S1    | Plan amendment     | Bound C1/C2 to S2/S3, chose owned-module generation for `Enabled: false` services, and marked `generate-aspire_test.ts` new (C3).                                                            |
| 2026-08-15T13:29:06+02:00 | S1    | SDK implementation | Corrected key-shape docs, pointed factory consumers to `clientKey()`, and added fail-capable resource match/mismatch regression tests without changing the SDK type/export surface.          |
| 2026-08-15T13:51:18+02:00 | S2    | CLI implementation | Added all-manifest service-client planning/reconciliation, whole-command dry-run/force, pre-write V1 contract validation, per-service resource identities, direct `clientKey()` invalidation, and regenerated the embedded asset. |
| 2026-08-15T13:51:18+02:00 | S2    | Regression proof   | Added two-service/import/literal-order, disabled-service, idempotency/force/dry-run, collision, procedure-rename, add-flow, Aspire flag, and atomic no-partial-write coverage.                 |
| 2026-08-15T14:02:38+02:00 | S2-FIX | Tier-A repair     | Tier-A found that `addService` performed its own writes before the generator's atomic validation. Hoisted a shared validation-only pass ahead of `renderService` and added an add-specific unrelated-missing-contract zero-write regression. |
| 2026-08-15T14:15:00+02:00 | S2-FIX2 | Tier-A repair    | Replaced the stale route-template assertion for removed `bridgeInvalidation` wiring with an exhaustive two-specifier SDK import allowlist, absence check, and direct-invalidation ordering assertion. |
| 2026-08-15T14:29:01+02:00 | S3    | Hydration implementation | Passed loader-owned `cachedAt` through `initialDataUpdatedAt` in both canonical island dialects, added omission guards, and canonically regenerated the shipped asset barrel. |
| 2026-08-15T14:29:01+02:00 | S3    | Browser/docs contract | Added the lease-gated public-wrapper old/fresh browser fixture and task without running it; documented service regeneration/migration and Fresh hydration age in the ruled package READMEs. |
| 2026-08-15T14:40:00+02:00 | S4    | Cheap convergence stop | The first ordered formatting-wrapper invocation exited 2 because root `fmt.exclude` rejected selected CLI batches. Exact-command measurement at pre-implementation commit `c53726c69` reproduced the same three excluded batches; stopped before every later gate. |
| 2026-08-15T14:49:51+02:00 | S4    | Configured format/lint resume | Per-member TypeScript format and lint wrappers passed; CLI used the released absolute neutral config and one 1000-file batch. Asset freshness and all three exact-pin audits passed. |
| 2026-08-15T14:49:51+02:00 | S4    | Export-map audit stop | CLI's full export-map doc audit passed. Fresh failed with 45 diagnostics and SDK with 3; exact full-command measurement at pre-implementation `c53726c69` reproduced both totals and the plugin-streams finding. Stopped before JSR, dry-run, and binding gates. |
| 2026-08-15T16:26:07+02:00 | S4    | Carried-baseline disposition | Tier-A independently confirmed unchanged diagnostic files and entrypoint sets, then ruled Fresh's 45 and SDK's 3 supplemental doc-audit diagnostics carried `PRE_EXISTING_FAIL` baselines. The plugin-streams finding stays separately named as newly exposed, not newly caused. |
| 2026-08-15T16:26:07+02:00 | S4    | Per-member publish audits | CLI, Fresh, and SDK JSR audits each exited 0 with WARN-only doctrine/banner findings; three separate checked per-member publish dry-runs passed at `e52aa44a6` with no slow-type or file-list failure. |
| 2026-08-15T16:40:03+02:00 | S4    | Binding-gate stop | `check` passed at immutable content head `35061bc80`; `test` failed 1 of 4,221 results because S2 added `generated.deno-lint` to the service suite without updating its E2E registry expectation. The focused test passes 19/19 at `c53726c69`, proving a leaf-caused red; stopped before publish/arch gates and repair. |
| 2026-08-15T16:52:21+02:00 | S4-FIX1 | Scoped test repair | Tier-A authorized the exact one-line expectation repair. Added `GENERATED_DENO_LINT` after `GENERATED_SERVICE_CHECK` without changing the suite or weakening array equality; committed as `32ea23f50`. |
| 2026-08-15T16:52:21+02:00 | S4-FIX1 | Binding convergence | Replaced both superseded receipts and produced all four fresh `s4-fix1-*` receipts at `32ea23f50`: check, test (4,202/0 with 19 ignored), workspace publish dry-run, and arch-check all PASS with exact head matches. |

## Decisions

| Decision                                          | Reason                                                                      | Source                          |
| ------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------- |
| Preserve landed derived names                     | Current base already contains the #1355 naming correction.                  | Code/history/research finding 3 |
| Router identity owns every resource prefix        | It is the manifest-derived identity shared by routing and clients.          | Plan D1                         |
| Directly emit the `clientKey()` filter            | The overload adds no policy and would couple generated output to SDK 0.0.7. | PLAN-EVAL cycle 1 ruling        |
| Generator owns only `apps/<app>/lib/<service>.ts` | Separates explicit regeneration from the init-owned route showcase.         | PLAN-EVAL sweep A               |
| Flags govern both command halves                  | `--dry-run` must mean no writes; force/default semantics stay coherent.     | PLAN-EVAL sweep B               |
| Generate modules for disabled services            | `Enabled` controls runtime registration, not manifest-owned source output.  | PLAN-EVAL cycle 2 C2            |
| Stop after S3                                     | Implementation release is expressly limited to one bounded slice.           | Coordinator dispatch            |
| Stop S4 on first red gate                         | The dispatch requires exact attribution and a stop before later audits/gates. | Coordinator dispatch            |
| Carry attributed supplemental doc baselines       | Tier-A verified identical pre-implementation failures in untouched files and an unchanged export map; binding gates remain authoritative. | Coordinator S4 stop #2 ruling |

## Drift

| Drift                                                          | Severity    | Logged in drift.md |
| -------------------------------------------------------------- | ----------- | ------------------ |
| Issue paths/line numbers moved and symbol naming already fixed | Significant | Yes                |
| `key-bridge.ts` server-key comment is stale                    | Minor       | Yes                |
| Frontend overlay references missing file                       | Minor       | Yes                |
| Initial plan misclassified `scaffold.runtime` as a catalog gap | Significant | Yes                |

## Gate Results

### Static Gates

| Gate                    | Command or check                                                                                 | Result        | Notes                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------ | ------------- | ------------------------------------------------------------------------------------------- |
| Identity                | Direct git/POSIX read-only checks                                                                | PASS          | Required base and clean start confirmed.                                                    |
| S1 focused check        | `.llm/tools/run-deno-check.ts` on both S1 SDK files                                              | PASS          | Two selected files; zero diagnostics.                                                       |
| S1 focused test         | `.llm/tools/run-deno-test.ts` on `key-bridge_test.ts`                                            | PASS          | Two tests passed; match and mismatched-resource behavior exercised.                         |
| S2 focused check        | `.llm/tools/run-deno-check.ts` on the 14 touched S2 TypeScript files                             | PASS          | Fourteen selected files; zero diagnostics.                                                  |
| S2 focused test         | `.llm/tools/run-deno-test.ts` on service, Aspire-generate, runtime-schema, and service-adapter tests | PASS       | 31 tests passed; zero failed or ignored.                                                     |
| Generated assets        | `deno task check:assets-barrel`                                                                    | PASS          | Regeneration left the committed `embedded.generated.ts` and all other generated barrels unchanged. |
| S2-FIX focused check    | `.llm/tools/run-deno-check.ts` on the 14 touched S2 TypeScript files                             | PASS          | Fourteen selected files; zero diagnostics after the ordering repair.                        |
| S2-FIX focused test     | `.llm/tools/run-deno-test.ts` on service, Aspire-generate, runtime-schema, and service-adapter tests | PASS       | 32 tests passed; zero failed or ignored, including the add-path zero-write regression.       |
| S2-FIX generated assets | `deno task check:assets-barrel`                                                                 | PASS          | No generated asset changed; the committed barrel remains fresh.                             |
| S2-FIX2 full CLI source suite | `cd packages/cli && deno test --allow-all ./src/`                                             | PASS          | 598 tests passed; zero failed. The stale pre-C1 route-template assertion is repaired.        |
| S3 CLI check | `cd packages/cli && deno task check` | PASS | All six CLI entrypoints checked with zero diagnostics. |
| S3 Fresh check | `cd packages/fresh && deno task check` | PASS | All configured entrypoints and both streams type checks passed. |
| S3 full CLI source suite | `cd packages/cli && deno test --allow-all ./src/` | PASS | 598 tests passed (534 steps); zero failed. |
| S3 full Fresh non-browser suite | `cd packages/fresh && deno task test` | PASS | 245 tests passed; zero failed. Browser-named files are intentionally outside this task. |
| S3 route-template regression | `cd packages/cli && deno test --allow-all ./src/kernel/templates/app/route-templates_test.ts` | PASS | One test group passed (26 steps), including both cache-age omission assertions. |
| S3 CLI export doc lint | `cd packages/cli && deno doc --lint ./mod.ts ./scaffolding.ts ./testing.ts` | PASS | Three public entrypoints checked with zero diagnostics. |
| S3 Fresh export-map doc lint | `cd packages/fresh && deno task doc-lint` | BASELINE_FAIL | 45 pre-existing `private-type-ref` diagnostics; S3 changes no Fresh source/export type, and the task command is unchanged. Full attribution remains S4-owned. |
| README standard | `deno task docs:readme:check` | BASELINE_FAIL | Only `packages/bench/README.md` lacks an Install section; both S3 package READMEs conform. |
| S4 combined format wrapper | `run-deno-fmt.ts --root packages/cli --root packages/fresh --root packages/sdk --ext ts,tsx` | PRE_EXISTING_FAIL | Exit 2: three batches selected by the wrapper were excluded by root Deno config; zero formatting findings. Exact command reproduces at `c53726c69`. See `reports/s4-format-failure.md`. |
| S4 CLI TypeScript format | `run-deno-fmt.ts --root packages/cli --ext ts,tsx --config <absolute runtime-config/deno.json> --batch-size 1000` | PASS | 887 files in one batch; zero failed batches and zero findings. Default batching is fail-close sensitive; see the append-only format report. |
| S4 Fresh TypeScript format | `run-deno-fmt.ts --root packages/fresh --ext ts,tsx --config <absolute fresh/deno.json>` | PASS | 201 files, two batches, zero failed batches and zero findings. |
| S4 SDK TypeScript format | `run-deno-fmt.ts --root packages/sdk --ext ts,tsx --config <absolute sdk/deno.json>` | PASS | 84 files, one batch, zero failed batches and zero findings. |
| S4 per-member TypeScript lint | `run-deno-lint.ts` with the same three member roots/configs | PASS | CLI 887, Fresh 201, SDK 84 files; zero findings. |
| S4 asset freshness | `deno task check:assets-barrel` | PASS | Exit 0; product tree remained clean. |
| S4 exact-pin audits | Per-member `scanNetscriptJsrSpecifiers` reports | PASS | CLI 739, Fresh 132, SDK 60 files scanned; zero failures. CLI has one reviewed exact-target alias allowance. |
| S4 CLI full export-map doc audit | `run-deno-doc-lint.ts --root packages/cli` | PASS | All 3 entrypoints; zero diagnostics. |
| S4 Fresh full export-map doc audit | `run-deno-doc-lint.ts --root packages/fresh` | PRE_EXISTING_FAIL | 16 entrypoints; 45 deduplicated diagnostics (28 private references, 17 missing JSDoc), reproduced at `c53726c69`. |
| S4 SDK full export-map doc audit | `run-deno-doc-lint.ts --root packages/sdk` | PRE_EXISTING_FAIL | 12 entrypoints; 3 deduplicated private references, including the separate plugin-streams finding; reproduced at `c53726c69`. |
| S4 CLI JSR audit | `audit-jsr-package.ts --root packages/cli --out reports/jsr-audit-cli.json` | PASS_WITH_WARNINGS | Exit 0; 3 exports, audit-internal dry-run OK, 19 WARN-only existing vocabulary/cardinality/banner findings, zero FAIL. |
| S4 Fresh JSR audit | `audit-jsr-package.ts --root packages/fresh --out reports/jsr-audit-fresh.json` | PASS_WITH_WARNINGS | Exit 0; 16 exports, audit-internal dry-run OK, 2 WARN-only cardinality/banner findings, zero FAIL. |
| S4 SDK JSR audit | `audit-jsr-package.ts --root packages/sdk --out reports/jsr-audit-sdk.json` | PASS_WITH_WARNINGS | Exit 0; 12 exports, audit-internal dry-run OK, 2 WARN-only cardinality/banner findings, zero FAIL. |
| S4 CLI per-member publish dry-run | `deno task publish:dry-run --member packages/cli` via supplemental `run-gate.ts` report | PASS | Exit 0; checked publish file list and public slow types at `e52aa44a6`. |
| S4 Fresh per-member publish dry-run | `deno task publish:dry-run --member packages/fresh` via supplemental `run-gate.ts` report | PASS | Exit 0; checked publish file list and isolated declarations at `e52aa44a6`. |
| S4 SDK per-member publish dry-run | `deno task publish:dry-run --member packages/sdk` via supplemental `run-gate.ts` report | PASS | Exit 0; checked publish file list and isolated declarations at `e52aa44a6`. |
| S4 binding check | `run-gate.ts --gate check --id app-service-client-wiring-s4-check` | PASS | Receipt attests `35061bc80`; 2,933 files, 25 batches, zero failed batches or diagnostics. |
| S4 binding test | `run-gate.ts --gate test --id app-service-client-wiring-s4-test` | FAIL | Receipt attests `35061bc80`; 4,201 passed, 1 failed, 19 ignored. Stale service-suite gate expectation is leaf-caused and does not reproduce at `c53726c69`. |
| S4 binding publish dry-run | Planned `app-service-client-wiring-s4-publish-dry-run` | NOT_RUN | Ordered stop at binding test failure; no receipt exists. |
| S4 binding arch check | Planned `app-service-client-wiring-s4-arch-check` | NOT_RUN | Ordered stop at binding test failure; no receipt exists. |
| S4-FIX1 binding check | `app-service-client-wiring-s4-fix1-check` | PASS | Fresh receipt attests `32ea23f50`; 2,933 files, 25 batches, zero diagnostics. |
| S4-FIX1 binding test | `app-service-client-wiring-s4-fix1-test` | PASS | Fresh receipt attests `32ea23f50`; 4,202 passed, zero failed, 19 ignored. |
| S4-FIX1 binding publish dry-run | `app-service-client-wiring-s4-fix1-publish-dry-run` | PASS | Fresh workspace dry-run receipt attests `32ea23f50`; exit 0. |
| S4-FIX1 binding arch check | `app-service-client-wiring-s4-fix1-arch-check` | PASS | Fresh receipt attests `32ea23f50`; exit 0 with baseline warnings and zero failures. |
| Changed-module doc lint | `deno task doc:lint --root packages/sdk --entrypoints ./src/query-client/key-bridge.ts --pretty` | PASS          | Zero documentation errors.                                                                  |
| CLI entrypoint doc lint | `deno task doc:lint --root packages/cli --entrypoints ./mod.ts --pretty`                          | PASS          | Zero documentation errors, including the new exported generator contract.                  |
| SDK root-entrypoint doc lint (`packages/sdk/mod.ts`) | `deno doc --lint packages/sdk/mod.ts`                                              | BASELINE_FAIL | Exactly two pre-existing `private-type-ref` errors for this root-entrypoint run: `QueryClientPort` at `src/ports/query-client.ts:41` and `createNetScriptQueryClient` at `src/query-client/query-client-factory.ts:44`, both referencing private `QueryClient`; measured before S1 and carried unchanged. The full 12-entrypoint export-map sweep is S4 and may surface further diagnostics. |
| Quality gate            | `deno task quality:gate`                                                                         | PASS          | Quality scan clean; architecture check passed with baseline warnings.                       |
| JSR audits              | Per-member package audit plus exact-pin and checked publish dry-run evidence                       | PASS_WITH_WARNINGS | All three audits exit 0; reports remain distinct per member.                              |

### Fitness Gates

| Gate      | Result         | Evidence                           | Notes                                 |
| --------- | -------------- | ---------------------------------- | ------------------------------------- |
| Plan gate | PASS cycle 2   | `plan-eval.md` through `c53726c69` | Terminal plan verdict; S1 released.   |
| S2 Tier-A | FAIL_FIX repaired | Coordinator finding S2-F1       | Add-path ordering repair committed for a fresh Tier-A review. |
| S2 Tier-A round 2 | FAIL_FIX repaired | Coordinator finding S2-F2 | Full-suite stale assertion repaired for a fresh Tier-A review. |
| F-5/F-6   | PENDING_SCRIPT | JSR section in research/plan       | Three publishable members applicable. |

### Runtime Gates

| Gate               | Result  | Evidence                | Notes                       |
| ------------------ | ------- | ----------------------- | --------------------------- |
| `scaffold.runtime` | NOT_RUN | Explicit lease boundary | Prohibited without release. |
| `fresh-browser`    | NOT_RUN | Explicit lease boundary | Prohibited without release. |

### S4 binding receipt sufficiency

**SUFFICIENT.** Recomputed over the exact contracted set; every receipt is PASS/exit 0, has a unique
invocation ID, attests `gitHead == actualGitHead ==
32ea23f501900ca4d7de603e00709e09f41be3dc`, and carries no mismatch override:

1. `receipts/s4-check.json` — `app-service-client-wiring-s4-fix1-check`.
2. `receipts/s4-test.json` — `app-service-client-wiring-s4-fix1-test`.
3. `receipts/s4-publish-dry-run.json` —
   `app-service-client-wiring-s4-fix1-publish-dry-run`.
4. `receipts/s4-arch-check.json` — `app-service-client-wiring-s4-fix1-arch-check`.

### Consumer Gates

| Consumer                  | Result  | Evidence | Notes                              |
| ------------------------- | ------- | -------- | ---------------------------------- |
| Two-service generated app | NOT_RUN | S5 plan  | Requires implementation and lease. |
| Hydrated Fresh browser    | NOT_RUN | S5 plan  | Requires implementation and lease. |

## Handoff Notes

- S2 owns only `apps/<app>/lib/<service>.ts`; the route-example
  `routes/examples/service/(_lib)/service-query.ts` remains init-owned.
- Generated modules import exactly `createServiceClient` from `@netscript/sdk/client` and
  `createQueryFactories` from `@netscript/sdk/query`, then define
  `{ queryKey: <svc>Queries.list.clientKey() } as const` after `<svc>Queries`.
- `service generate` discovers every manifest entry, including `Enabled: false`, validates every
  expected `contracts/versions/v1/<service>.contract.ts` and export before client or Aspire writes,
  and applies `--dry-run`/`--force` to both halves.
- `service add --with-client` now reuses the validation-only pass before `renderService`; an
  unrelated missing manifest contract therefore aborts before appsettings, workspace, service,
  contract, client, or Aspire-helper writes.
- Post-slice reconciliation found both issue closures, the terminal cycle-2 verdict, and the ruled
  design intact; no rescope or additional issue is needed.
- S3's controlled browser fixture compares `hydrationNow - 60_000` with `hydrationNow`, exposing
  snapshot text, `dataUpdatedAt`, fetching/refetching state, and query-function count through the
  public `@netscript/fresh/query` wrapper. It is wired into `test:browser` but remains unrun.
- No expensive gate, lease, ready transition, lockfile change, `docs/**` change, evaluator launch,
  or S4 work occurred in S3.
- S4 resumed with explicit per-member format configs: format, lint, asset freshness, and exact-pin
  audits passed. The full export-map doc audit passed for CLI and carries separately attributed
  pre-existing Fresh (45) and SDK (3) failures reproduced at `c53726c69`; plugin-streams remains a
  distinct newly exposed finding.
- All three per-member JSR audits exit 0 with WARN-only findings, and all three checked per-member
  publish dry-runs pass. Binding `check` passes, but binding `test` exposes one leaf-caused stale E2E
  registry expectation; publish/arch binding gates, expensive gates, and evaluator remain unrun.
- Tier-A authorized and the leaf landed the exact order-sensitive expectation repair. All four
  replacement binding receipts now pass at `32ea23f50`; S4 cheap sufficiency is SUFFICIENT. Runtime
  gates remain lease-blocked and no evaluator has run.

## S5-precondition F2 — executable-proof plan amendment

Tier-A accepted S4 cheap convergence but independently proved Expensive-Gate Release Condition 3
false: the exact second-service/key-isolation/settled-refetch scenarios existed only in `plan.md`,
not in `packages/cli/e2e/`. This is an implementation omission inside the accepted plan, not a
rescope and not authority to start S5.

The bounded S4-F2 amendment registers three cheap scaffold/static gates in both the service and
runtime suites plus one live behavior gate in runtime only. A single checked-in probe owns the
second-generate byte comparison, no-alias consumer check, actual generated key evidence, and CDP
settled-refetch observation; a unit test exercises its pure assertions without Chrome, Aspire,
Docker, or either expensive suite. The exact files, gate order, assertions, and replacement receipt
set are locked in `plan.md` before product edits. Existing S4-FIX1 receipts remain valid at
`32ea23f50` but become superseded once the content head moves.

The initial compile-pass design placed the pure/static contract and Chrome DevTools transport in one
572-line module, crossing doctrine F-1's 500-line review threshold. Before adding a second source
file, the bounded list is amended to name `service-client-browser-probe.ts` as the internal transport
dependency. The runtime probe retains all assertions and orchestration; the adapter owns only Chrome
discovery and CDP mechanics. No public surface, gate, scenario, or expensive-gate authority changes.

### S4-F2 implementation

- Registered `scaffold.service-client-add`, `scaffold.service-client-generate`,
  `generated.service-client-contract`, and `behavior.service-client-refetch` as finite gate IDs.
- Both service and runtime suites run init → payments add → first generate → static contract probe;
  runtime alone runs the browser probe after service health.
- The static probe snapshots both owned client modules and every Aspire `.mts`, runs the second
  generate, requires both zero-write output lines and exact path/byte identity, then checks and runs
  a temporary no-alias consumer importing `usersQueries` and `paymentsQueries` together.
- The consumer emits the exact four planned keys. Assertions require the concrete server/client
  arrays, index-0-only resource variance, four own-prefix TanStack matches, and both users→payments
  cross-prefix mismatches.
- The browser adapter pauses the successful `users.update` response through Chrome DevTools, proves
  the renamed optimistic row before releasing it, waits for mutation settlement and one completed
  `users.list` request, then records the final persisted row. The runtime assertion requires exactly
  `baseline + 1`; it never instruments `invalidateQueries`.
- Focused structured check: 7 files, 1 batch, zero diagnostics. Focused structured lint: 7 files,
  1 batch, zero findings. Probe + suite-registry tests: 25 passed, 0 failed. Repository quality scan:
  PASS, zero findings and seven unchanged reviewed allowances.
- `scaffold.runtime`, `fresh-browser`, Aspire, Docker, and Chrome were not run. No lease was requested
  or acquired.

### S4-F2 recovery repair

The first S4-F2 content head, `787cfa928`, had two browser-transport defects discovered before any
runtime lease: it resumed a response-stage Fetch pause with `Fetch.continueRequest`, and it captured
the list baseline after a fixed 750 ms delay without proving all observed requests had completed or
that the count was quiet. The run-gate-generated `receipts/s4-f2-check.json` (PASS) and
`receipts/s4-f2-test.json` (INTERRUPTED) attest only that unsound head. They are preserved as
**superseded evidence** and are never part of current-head sufficiency.

The additive repair uses `Fetch.continueResponse` and retains the subsequent
`Network.loadingFinished` wait on the paused response's `networkId`. It explicitly triggers the
showcase Refresh control, requires a positive request count with every observed list request
completed, and holds that candidate unchanged for a 500 ms confirmation window before recording the
baseline. Any late or incomplete request resets the candidate. The negative unit sequence proves a
one-request candidate is discarded when a second initial request arrives late and is accepted only
after the two-request state completes and remains quiet; a source-wiring regression locks both the
stable helper call and the response-stage resume. Focused result: 8 passed, 0 failed. No browser,
Aspire, Docker, or expensive suite ran.

### S4-F2 repaired binding evidence

The corrected immutable content head is
`2c82199680e4b3cfc8e93d831acd5d160f0b5db9`. Four fresh `run-gate.ts` invocations attest that
exact head with `gitHead == actualGitHead`, no mismatch override, unique IDs, and PASS/exit 0:

| Receipt | Invocation ID | Result |
| --- | --- | --- |
| `receipts/s4-f2-fix1-check.json` | `app-service-client-wiring-s4-f2-fix1-check` | PASS — 2,936 files, 25 batches, zero diagnostics. |
| `receipts/s4-f2-fix1-test.json` | `app-service-client-wiring-s4-f2-fix1-test` | PASS — 4,210 passed, zero failed, 19 ignored. |
| `receipts/s4-f2-fix1-publish-dry-run.json` | `app-service-client-wiring-s4-f2-fix1-publish-dry-run` | PASS — workspace publish simulation completed. |
| `receipts/s4-f2-fix1-arch-check.json` | `app-service-client-wiring-s4-f2-fix1-arch-check` | PASS — zero architecture failures; existing warnings remain visible. |

Recomputation through `evaluateEvidenceSet` over exactly those four files is **SUFFICIENT** with an
empty reason list. The older `s4-f2-check.json` and `s4-f2-test.json` remain superseded-only evidence
for `787cfa928`; they are not included. The earlier per-member audits remain unchanged: CLI
export-map doc lint PASS; Fresh export-map doc lint `PRE_EXISTING_FAIL` with 45 attributed
diagnostics; SDK export-map doc lint `PRE_EXISTING_FAIL` with three attributed diagnostics, including
the separately named plugin-streams `StreamsInstrumentation` finding; all three JSR audits exit 0
with warnings only, and all three per-member isolated declaration/publish dry-runs pass.

## S5 gate 1 failure — F3 authorization amendment

The coordinator leased and ran `scaffold.runtime` at PR/evidence head `b14975af7`; the suite reported
six passed and one failed. `scaffold.service-client-add` and
`scaffold.service-client-generate` both passed against the real generated project. The static
`generated.service-client-contract` probe failed with the three compiler diagnostics preserved in
`.llm/tmp/cli-e2e/plugin-smoke-20260815-175817.log`: one TS2307 for the not-yet-generated
`database/postgres/schema/.generated/zod/crud.ts`, plus two TS2345 diagnostics because its shared
plan-derived input does not satisfy the generated payments list contract. Cleanup passed, the
checked-in `leak-report.md` records no surviving Aspire resources, and the central lease was
released before any repair.

F3 is bounded to the existing service-client runtime probe, its unit test, the service/runtime suite
ordering and order-sensitive registry test, plus run artifacts. The locked design moves the static
probe after the already-owned standalone database codegen gate at its canonical position, adds an
explicit generated-schema precondition, derives separate inputs from the two real generated contract schemas,
and replaces index-zero-only tail equality with own/cross resource-prefix and per-service input
assertions. Exact design and negative tests are recorded in `plan.md`. No product file changes until
this amendment is committed and explicitly pushed.

A cheap replay after real standalone database codegen proved the parent-process dynamic import does
not inherit the generated app's alias map; importing the entire orchestration probe from the app
instead drags unrelated parent import-map dependencies into its check. The bounded design therefore
adds one dependency-free input-probe module. It uses only the actual schema instance's
`toJSONSchema` and `parse` methods, and is imported by both the generated consumer and the negative
unit test.

### S4-F3 implementation

- Preserved `database.codegen` at its canonical service/runtime position and moved
  `generated.service-client-contract` immediately after it in both order-sensitive suite lists.
- Added `assertGeneratedServiceSchemaReady`, which fails before the consumer write/import unless a
  real `database/<engine>/schema/.generated/zod/crud.ts` exists. The negative unit uses that exact
  exported primitive; it does not create a stub module.
- Removed `LIST_INPUT` and `assertIndexZeroOnly`. The generated consumer imports each real helper's
  contract and queries, derives each list input independently through the dependency-free
  `deriveProcedureInput`, and parameterizes the result with that helper's own key input type.
- Key evidence now requires each service's independently validated input, exact own resource/action
  filters, four own TanStack prefix matches, and four cross-service non-matches. It never compares
  users/payments tails.
- Focused check passed for five files. The probe and order-sensitive registry tests passed 29/0.
  A cheap replay against the preserved failed generated project ran real standalone database
  codegen, then the static probe only; both completed with exit 0. No Aspire, Docker, browser,
  `scaffold.runtime`, or lease was used for the replay.

### S4-F3 binding stop — current-head check failure

The first replacement binding invocation stopped the ordered gate run at immutable content head
`6e822a74b4de527a23da46f1c9c2f6ba6c94c72f`:

- `receipts/s4-f3-check.json`, invocation
  `app-service-client-wiring-s4-f3-check`, is `FAIL`/exit 1 with
  `gitHead == actualGitHead` and no mismatch override.
- The structured root check selected 2,937 files in 25 batches and reported one TS2322:
  `packages/cli/e2e/src/application/gates/scaffold/verify-producer-reconnect.ts:268`, where
  `Timeout` is not assignable to `number`.
- That file is unchanged from both `2c8219968` and the pre-implementation verdict head
  `c53726c69`; blame attributes the line to merged PR #1402 commit `3ce91f2c2`.
- An isolated archive at `c53726c69` ran the same `deno task check` command over 2,924 files in
  25 batches with zero diagnostics and exit 0. The current failure therefore does **not** reproduce
  at the named earlier head. It is a newly exposed binding-gate failure at this leaf's head, not a
  carried baseline, even though the diagnostic-bearing file itself is untouched.

Per the stop rule, `test`, `publish-dry-run`, and `arch-check` were not run. No receipts were
authored for them. Exact-set sufficiency is **INSUFFICIENT**: the check receipt is non-passing and
the other three contracted receipts are missing. No repair, expensive gate, lease action, Aspire,
Docker, browser, or evaluator followed the failure.

### S4-F3 checked repair — remove Node ambient typing from the shared graph

Coordinator checkpoint `ca10ffaeb` records a three-way single-variable experiment: the unchanged
`verify-producer-reconnect.ts` passes alone, fails when checked with the F3 probe importing
`node:path`, and passes with the same probe importing `@std/path`. The mechanism is leaf-caused
shared-graph type pollution: `node:path` introduces Node globals and changes `setTimeout` from the
web-platform numeric handle to `NodeJS.Timeout`.

The reviewed repair changes only the probe's path import back to
`import { join, relative } from '@std/path';`. Its custom walker is retained after source inspection:
it imports no Node or filesystem module and uses only `Deno.readDir` plus its own recursive call.
The required discriminating check ran `verify-producer-reconnect.ts` and the repaired probe together
in one `deno check --unstable-kv` invocation; both passed with exit 0. Contract-derived inputs,
resource-prefix isolation, schema readiness, and both F3 negative tests are unchanged. The original
`receipts/s4-f3-check.json` remains the immutable FAIL record and will not be overwritten.

### S4-F3 repaired binding evidence

The repaired immutable content head is `193e665ba0592273622253e3e9a1ebfc019b1be9`. Four fresh,
serial `run-gate.ts` invocations attest that exact head with `gitHead == actualGitHead`, no mismatch
override, unique invocation IDs, and PASS/exit 0:

| Receipt | Invocation ID | Result |
| --- | --- | --- |
| `receipts/s4-f3-fix1-check.json` | `app-service-client-wiring-s4-f3-fix1-check` | PASS — 2,937 files, 25 batches, zero failed batches and zero diagnostics. |
| `receipts/s4-f3-fix1-test.json` | `app-service-client-wiring-s4-f3-fix1-test` | PASS — 4,212 passed, zero failed, 19 ignored. |
| `receipts/s4-f3-fix1-publish-dry-run.json` | `app-service-client-wiring-s4-f3-fix1-publish-dry-run` | PASS — workspace publish simulation completed. |
| `receipts/s4-f3-fix1-arch-check.json` | `app-service-client-wiring-s4-f3-fix1-arch-check` | PASS — zero doctrine failures; existing warnings remain visible. |

`evaluateEvidenceSet` recomputed over exactly those four files is **SUFFICIENT** with an empty
reason list. `receipts/s4-f3-check.json` remains the preserved FAIL evidence at `6e822a74b` and is
not included in current-head sufficiency. Earlier `s4-f2-fix1-*` receipts likewise remain durable
but superseded. Supplemental package evidence is unchanged: CLI export-map doc lint PASS; Fresh
export-map doc lint `PRE_EXISTING_FAIL` with 45 attributed diagnostics; SDK export-map doc lint
`PRE_EXISTING_FAIL` with three attributed diagnostics, including the separately named
plugin-streams `StreamsInstrumentation` finding; all three per-member JSR audits exit 0 with
warnings only, and all three isolated-declaration/publish dry-runs pass.

## S5 leased expensive-gate stop

The coordinator granted the singleton runtime lease at central checkpoint `32df87c7c` after proving
an empty host. Its fresh preflight leak timestamp was committed as run-only head `ab78eaa35`; product
content remained `193e665ba`. The exact release-class command
`deno task e2e:cli run scaffold.runtime --cleanup --format pretty` returned exit 1 with
`passed=20 failed=1 skipped=0`.

The sole failure was `generated.service-client-contract`. Both
`scaffold.service-client-add` and `scaffold.service-client-generate` passed against the generated
project, as did database codegen. The later static probe observed zero client writes and three
Aspire-helper writes where it required both counts to be zero. The suite-owned raw JSONL output is
preserved byte-for-byte at `reports/s5-scaffold-runtime-20260815-184907.log` with SHA-256
`e45934adc737626e6b5d05dc1c8dccbb8fb7c2cab0bab76b828520150206d225`.

The exact failure cannot reproduce at pre-implementation `c53726c69` because neither the gate/probe
nor the new combined client/Aspire `service generate` contract exists there. It is leaf-caused and
is not carried as a baseline. No repair or rerun occurred under the lease.

Suite cleanup passed. Run-owned teardown reported no AppHosts, containers, or escalations to remove.
The mandatory leak check then recorded Aspire `ok`, Docker `ok`, and `survivors: []`. The host is
empty. The runtime failure blocked the conditional inter-gate audit, so `fresh-browser` is NOT_RUN
and no browser receipt exists. Full verdict and cleanup evidence are in
`reports/s5-runtime-failure.md`.

## F4 authorization amendment — probe sequence, not generator behavior

The runtime lease was released at central checkpoint `dbf87e379`; the host remains empty. The
coordinator independently continued from the preserved generated project after the failed probe had
reconciled its three Aspire-helper writes. Two further immediately consecutive identical
`service generate` commands both exited 0 with zero clients written, two clients skipped, and zero
Aspire helpers written. SHA-256 manifests of every `aspire/.helpers` file were unchanged across
both invocations.

Disposition: S5 observed convergence after plugin/runtime-schema/database inputs changed. The
product's same-input idempotency is correct; the probe asserted the zero-write state one invocation
too early. The S5 FAIL log, report, SHA-256, and all earlier red/baseline evidence remain unchanged.

The bounded F4 repair allows the first post-plugin generate to reconcile Aspire helpers while still
requiring zero client writes and two skips. It snapshots owned output only after that convergence,
then performs an immediately consecutive identical generate requiring zero client writes, two
skips, zero Aspire writes, and byte-identical owned output. The focused sequence test must fail for
either a second identical helper write or a byte change. Exact files and fresh `s5-f4-*` receipt IDs
are locked in `plan.md` before any product or test mutation.

Process correction: preflight artifacts are committed and pushed before readiness is reported. A
leased evidence head must remain immutable after the grant.

### F4 implementation

The static probe now delegates both post-plugin commands to the exported E2E-only
`assertServiceGenerationSequence` primitive. The first command requires zero client writes and two
skips but permits Aspire-helper convergence. The primitive snapshots all owned client/Aspire output
after that command, immediately runs the identical command again, requires zero client writes, two
skips, and zero Aspire writes, then invokes the existing SHA-256 path/byte comparison against a
second snapshot.

The focused sequence test calls that same primitive and locks the exact event order
`generate → snapshot → generate → snapshot`. It accepts three Aspire writes during convergence,
rejects one Aspire write during the identical repeat, and independently rejects helper byte drift
when the printed repeat counts claim zero. Focused format/lint/check passed for both authorized files;
the probe test suite passed 11/0. No generator, suite-order, manifest, template, SDK, Fresh, or public
package surface changed. No expensive gate, browser, Aspire, Docker, lease, or evaluator ran.

### F4 binding evidence

The immutable F4 content head is `7876aa10911c2eeea4aafb217d651b28a90bac2c`. Four fresh serial
`run-gate.ts` invocations attest that exact head with `gitHead == actualGitHead`, no mismatch
override, distinct invocation IDs, and PASS/exit 0:

| Receipt | Invocation ID | Result |
| --- | --- | --- |
| `receipts/s5-f4-check.json` | `app-service-client-wiring-s5-f4-check` | PASS — 2,937 files, 25 batches, zero failed batches and zero diagnostics. |
| `receipts/s5-f4-test.json` | `app-service-client-wiring-s5-f4-test` | PASS — 4,213 passed, zero failed, 19 ignored. |
| `receipts/s5-f4-publish-dry-run.json` | `app-service-client-wiring-s5-f4-publish-dry-run` | PASS — workspace publish simulation completed. |
| `receipts/s5-f4-arch-check.json` | `app-service-client-wiring-s5-f4-arch-check` | PASS — zero doctrine failures; existing warnings remain visible. |

`evaluateEvidenceSet` over exactly those four files is **SUFFICIENT** with an empty reason list.
Every earlier receipt and report remains preserved, including the S5 runtime FAIL and raw log, the
S4 red reports, Fresh 45 / SDK 3 `PRE_EXISTING_FAIL` entries, and the separately named plugin-streams
diagnostic. No expensive gate or lease was requested or run.

## S5 attempt 3 — F4 passes, pre-existing generated format gate fails

Central lease checkpoint `2da4e1b0e874e6d5740355dcd9efd8267dcbf2b0` bound the run to immutable
leaf head `6f813b0db35df38dcd9dc7f1ea333e997399fac0`; the suite executed at that exact
head. No commit occurred between grant and execution. The coordinator preflight's refreshed
`leak-report.md` timestamp remained a run-only working-tree change until after the sequence.

The exact release-class command returned exit 1 with `passed=32 failed=1 skipped=0`. F4's repaired
`generated.service-client-contract` passed in the real generated project. The sole later failure was
`generated.deno-fmt-check`: `deno task fmt:check` reported 12 unformatted files among 172 selected
files. The suite-owned raw JSONL log is preserved at
`reports/s5-attempt3-scaffold-runtime-20260815-191609.log`, SHA-256
`677e7912ff0e6e77cd61ecb68a106607b7e6305324575bb5e84c78771f81302c`.

Attribution is pre-existing: the captured diff maps to `aspire/.helpers/register-plugins.mts`; that
file alone reproduces formatter exit 1, its generator template is byte-unchanged from
pre-implementation `c53726c69`, and the baseline runtime suite already runs the unchanged service
environment regeneration before the unchanged generated format gate. This leaf did not touch that
generator. The single-file check supports attribution only; it does not replace the suite verdict.

Suite cleanup passed. Run-owned teardown found no AppHost, container, or escalation, and the final
leak check reports Aspire `ok`, Docker `ok`, `survivors: []`. The runtime failure blocked
`fresh-browser`; it is NOT_RUN and has no receipt. No product repair occurred under the lease.
Full evidence is in `reports/s5-attempt3-runtime-failure.md`.

## F5 plan amendment — canonicalize before compare/write

At `2026-08-15T19:45:11+02:00`, F5 was authorized for plan/run artifacts only. No product or test
file was touched, no binding gate was run, and no lease was requested. One read-only replay of the
preserved generated project's already-failing `deno task fmt:check` enumerated the exact path set;
it was diagnostic attribution, not a replacement verdict. The coordinator accepted the 12-path
arithmetic and corrected the earlier attribution: the missing post-init formatting seam is
pre-existing, but the failing generated state is within this leaf's service add/generate contract
and must be repaired rather than carried.

A read-only replay of the preserved generated project's structured `fmt:check` output named the
exact 12 paths: two app client modules; the payments contract, v1 contract aggregate, and payments
v1 router; and seven Aspire helpers (`register-apps`, `index`, `db-cli-mode`, `register-tools`,
`register-infrastructure`, `register-background`, and `register-plugins`). The plan maps each path
to `client-scaffolder`, `contract-scaffolder`/`version-registry`, service `scaffolder`, or service
`workspace-mutator`.

The amendment locks one internal formatter port backed only by `deno fmt`: a bulk path method keeps
init's current behavior, while a target-extension-aware stdin method returns canonical content for
post-init equality and writes. `ProcessPort` gains optional text stdin so command execution stays
behind the existing runtime adapter. Every affected writer compares and writes the same canonical
string; no command formats target files after writing. Exact product/test ceilings, named
inclusions/exclusions, preserved dry-run/force/C2/error/F4 contracts, and the cheap proof matrix are
in `plan.md` and `reports/f5-plan-amendment.md`.

### F5-A1 Tier-A plan repair

Tier-A accepted the formatter-port direction and the complete 15-product/12-test ceiling, then
required four additions only. The plan now binds a piped-stdin timeout regression whose child emits
an EOF marker before hanging, proving the adapter writes, closes, then awaits output and still kills,
closes, awaits, and returns when timed out. Supported-extension empty content is explicitly a
zero-byte/no-spawn passthrough; absent or unsupported extensions fail before spawn, with extension
validation preceding the empty branch. `services-group.ts` remains in the ceiling because it is the
projection edge from the root-constructed formatter into `service generate`'s
`GenerateAspireDependencies`, which is how the seven Aspire helpers receive the formatter.

No product/test/template/fixture file, gate, runtime, browser, lease, evaluator, lockfile, or
`docs/**` path was touched during F5-A1.

## F5 implementation — canonical content before compare/write

Tier-A released the reviewed 15-product/12-test ceiling at `630185e2c`. The implementation adds the
internal `GeneratedSourceFormatterPort` and one `DenoGeneratedSourceFormatter` adapter. Its content
operation validates the target extension first, returns supported empty content without spawning,
and otherwise runs Deno's generated-source policy over piped stdin. `DenoProcess` now writes the
complete input, closes the writer, and then awaits output while the existing timeout covers the
whole sequence. The EOF-marker timeout regression proves both writer closure and bounded kill/await.

The client, Aspire-helper, contract/version, and service owners now canonicalize rendered content
before their existing equality/write decision and persist the same canonical bytes. The root creates
one formatter dependency; `services-group.ts` projects it into `service generate`'s Aspire half.
Init bulk formatting and plugin/generate-aspire exact-file callers delegate through the same adapter
without changing their distinct project/generated policies or warning/throw contracts. No public
package export was added and no post-write formatter was introduced in either service command.

Focused formatter/writer/command coverage passes 34 tests plus 3 BDD steps with zero failures. The
new ordinary E2E test runs a real local `init` → `service add --name payments --with-client` →
`service generate` sequence, verifies the exact 12 owned paths, passes exact-set `deno fmt --check`
and the generated project's full `deno task fmt:check`, then proves the immediately repeated
generate reports 0 client writes, 2 client skips, 0 Aspire writes, and byte-identical output. The
neutral-config single-batch CLI lint and format wrappers each select 898 files and report zero
findings; the first default lint invocation remains an exploratory fail-closed exclusion/batching
observation, not a verdict. Binding exact-head receipts remain pending until the content commit.

### F5 binding evidence

The immutable F5 content head is `fda78ee438ea40888e5fb3870a78df70cabb8c82`. Four fresh serial
`run-gate.ts` invocations attest that exact head with `gitHead == actualGitHead`, unique invocation
IDs, no mismatch override, and PASS/exit 0:

| Receipt | Invocation ID | Result |
| --- | --- | --- |
| `receipts/f5-check.json` | `app-service-client-wiring-f5-check` | PASS — 2,944 files, 25 batches, zero failed batches and zero diagnostics. |
| `receipts/f5-test.json` | `app-service-client-wiring-f5-test` | PASS — 4,226 passed, zero failed, 19 ignored (4,245 total results). |
| `receipts/f5-publish-dry-run.json` | `app-service-client-wiring-f5-publish-dry-run` | PASS — workspace publish simulation completed. |
| `receipts/f5-arch-check.json` | `app-service-client-wiring-f5-arch-check` | PASS — zero doctrine failures; existing warnings remain visible. |

`evaluateEvidenceSet` recomputed over exactly those four named files as **SUFFICIENT** with an empty
reason list. Older receipts remain append-only evidence and are not included in the F5 final-head
set. The prior Fresh 45 and SDK 3 `PRE_EXISTING_FAIL` export-map baselines, including the separately
named plugin-streams `StreamsInstrumentation` diagnostic, remain unchanged. No runtime/browser
lease, Aspire, Docker, expensive gate, evaluator, readiness, lockfile, or documentation action ran.

## S5 attempt 4 — runtime lease verdict

The singleton lease at central `4619f4408` was bound to leaf evidence head `1263f655b` and content
head `fda78ee438`. The suite executed at exactly `1263f655b`; no pre-gate commit moved the leased
head. `scaffold.runtime` returned exit 1 with `passed=69 failed=1 skipped=0`. The repaired
`generated.service-client-contract` and `generated.deno-fmt-check` gates both passed. The sole
failure was `behavior.service-client-refetch`: its leaf-added browser probe unconditionally called
`child.kill('SIGTERM')` in `finally` after the child had already terminated, throwing before the
collected evidence could be returned. The probe path is absent at pre-implementation `c53726c69`,
so the failure is leaf-caused rather than carried. Raw output and attribution are preserved in
`reports/s5-attempt4-runtime-failure.md` and the hashed attempt-4 log.

Suite cleanup passed. Run-owned teardown applied with no stopped AppHosts, removed containers, or
escalations. The final leak check reports Aspire `ok`, Docker `ok`, and `survivors: []`; Aspire MCP
start helpers were untouched. Because the prerequisite suite failed, `fresh-browser` is `NOT_RUN`
and no receipt exists. No repair, retry, evaluator, readiness, lockfile, or documentation action
occurred under the lease.

## F6 plan amendment — precise browser-child termination

F6 is plan-only and awaits fresh Tier-A review. The attempt-4 failure is recorded as a leaf-caused
probe teardown defect and explicitly not a verdict on settled-refetch behavior: cleanup threw before
the evidence value returned. Attempt progression remains visible at 20 → 32 → 69 passing gates;
the real generated-project run confirms F5 because `generated.deno-fmt-check` passed in 343 ms and
confirms F4 remained intact because `generated.service-client-contract` passed.

The locked repair uses `terminateBrowserProcess(child, drain)` in the existing browser-probe module.
Deno exposes no typed already-terminated error code or state property on `ChildProcess.kill`; the
narrow condition is the runtime-observed `TypeError` with exact message
`Child process has already terminated`. Every other kill error and every raw drain error propagates.
The helper awaits status and drain and returns the status. Focused proofs cover a naturally exited
child, a ready/running child terminated with SIGTERM, an unrelated `TypeError`, and a non-TypeError
with the same message. The existing test seam supports all cases directly, so no new harness/path is
planned.

Later product/test scope is exactly the existing probe and its existing focused test. This amendment
changed only run artifacts; it ran no test, binding/expensive gate, browser, Aspire, Docker,
evaluator, lease, readiness, lockfile, or documentation action. The attempt-4 raw log and report,
all earlier attempts/reports/receipts, and all carried baselines remain append-only and unchanged.
The worktree already contained a timestamp-only refresh of `leak-report.md` when F6 began; its
Aspire/Docker `ok` and empty-survivor content is unchanged, and F6 neither reran leak-check nor
rewrote that artifact.

## F6 implementation — precise browser-child termination

Fresh Tier-A passed the amendment at `36da13fa1`. Implementation stayed inside the exact two-path
ceiling. `terminateBrowserProcess` now sends SIGTERM, tolerates only the exact runtime-observed
`TypeError` plus message conjunction, explicitly awaits child status and the raw stderr drain, and
returns the status. Every other kill or drain error propagates unchanged. The browser probe delegates
to the helper, and temporary-profile removal is in an enclosing `finally`; CDP close, baseline,
response-stage resume, evidence shape, and browser assertions are unchanged.

The existing focused test file now executes all four proof groups: naturally exited child; ready and
active child terminated with SIGTERM after drain completion; unrelated `TypeError`, same-message
non-`TypeError`, and raw-drain rejection by exact object identity; and source-level delegation with
no unguarded kill in the probe's `finally`. The first focused wrapper invocation stopped before test
execution on a test sink callback that accidentally returned the accumulated string. After changing
that callback to return `void` and formatting only the authorized files, the same structured command
passed **14/0**:

```text
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/e2e/tests/application/gates/service-client-runtime-probe_test.ts
```

The attempt-4 raw log still hashes to
`b476da4ce039d03785e46669d51919b48c41fbae80ca41ca9188bcbb53e97f23`. No expensive gate,
browser, Aspire, Docker, lease, evaluator, readiness, lockfile, documentation, template, fixture, or
third product/test path was touched. Four fresh binding receipts remain pending until this content
and run state are committed at a clean immutable head.

### F6 binding stop — permission-denied runtime residue

The immutable content head is `7fa29ad3ed10ad903b9cbbd518111e6bf2754761`. The serial binding
sequence stopped after `test`; no downstream gate ran and no missing receipt was authored.

| Contracted receipt | Invocation ID | Outcome |
| --- | --- | --- |
| `receipts/f6-check.json` | `app-service-client-wiring-f6-check` | PASS / exit 0 — 2,944 files, 25 batches, zero diagnostics |
| `receipts/f6-test.json` | `app-service-client-wiring-f6-test` | FAIL / exit 1 — 4,228 passed, 1 failed, 19 ignored (4,248 total) |
| `receipts/f6-publish-dry-run.json` | not invoked | missing / NOT_RUN |
| `receipts/f6-arch-check.json` | not invoked | missing / NOT_RUN |

The sole failure is the unchanged
`.llm/tools/agentic/teardown/forbidden-commands_test.ts` trying to traverse
`.llm/tmp/cli-e2e/plugin-smoke-20260815-203755/.data/postgres/18/docker`. That descendant is mode
`0700` and owned by `dnsmasq:root`; the outer workspace was created at 20:37:56 during S5 attempt 4.
The teardown test has no diff from `c53726c69` and was last changed by `4634afe56` on 2026-08-03.
This is earlier runtime-workspace filesystem residue rather than an F6 two-file source regression,
but a red binding receipt cannot be carried or called sufficient. Nothing was chmodded/deleted,
there was no retry, and the gate sequence stopped.

`evaluateEvidenceSet` over exactly the four named paths reports **INSUFFICIENT**: `test` is `FAIL`,
and `publish-dry-run` plus `arch-check` receipts are missing. The check PASS and test FAIL receipts
both have `gitHead == actualGitHead == 7fa29ad3e` with no mismatch override. Full attribution and
the preserved-evidence statement are in `reports/f6-binding-test-failure.md`.

### F6 environmental attribution and recoverable quarantine

Coordinator review accepted `receipts/f6-test.json` as an honest append-only red and established
the environmental mechanism. F5 had 4,226 passed / 0 failed / 19 ignored (4,245 total); F6 attempt
1 had 4,228 passed / 1 failed / 19 ignored (4,248 total). The three-result increase includes two
new passes, proving the F6 test delta executes successfully while the single failure remains the
permission-denied walk into S5 attempt 4's abandoned Postgres-owned tree.

The exact failing path was
`.llm/tmp/cli-e2e/plugin-smoke-20260815-203755/.data/postgres/18/docker`. The coordinator quarantined
the outer workspace recoverably: the source
`.llm/tmp/cli-e2e/plugin-smoke-20260815-203755` is verified absent, while
`/tmp/netscript-f6-quarantine.7kXcDX/plugin-smoke-20260815-203755` is verified present. The leaf did
not delete, chmod, move, or mutate it. `receipts/f6-test.json` stays red and is never overwritten or
claimed in a later passing set. One distinct `f6-test-attempt2` may retest the environment at the
unchanged content head `7fa29ad3e`; if it fails, the sequence stops without a third attempt.

Full attribution and quarantine details are in `reports/f6-environment-quarantine.md`.

### F6 binding recovery — attempt 2 and exact-set sufficiency

The sole authorized environmental rerun passed at unchanged content head `7fa29ad3e`:
`receipts/f6-test-attempt2.json` (`app-service-client-wiring-f6-test-attempt2`) records 4,229 passed /
0 failed / 19 ignored (4,248 total), exit 0, with matching `gitHead` and `actualGitHead`. The total
still includes all three F6-added results; after quarantine they all pass. This confirms the first
receipt's permission failure was environmental.

The conditional downstream gates then ran serially at the same content head and passed:

| Contracted receipt | Invocation ID | Outcome |
| --- | --- | --- |
| `receipts/f6-check.json` | `app-service-client-wiring-f6-check` | PASS / exit 0 — 2,944 files, 25 batches, zero diagnostics |
| `receipts/f6-test-attempt2.json` | `app-service-client-wiring-f6-test-attempt2` | PASS / exit 0 — 4,229 passed, 0 failed, 19 ignored |
| `receipts/f6-publish-dry-run.json` | `app-service-client-wiring-f6-publish-dry-run` | PASS / exit 0 |
| `receipts/f6-arch-check.json` | `app-service-client-wiring-f6-arch-check` | PASS / exit 0 — zero doctrine failures |

`evaluateEvidenceSet` over exactly those four named files reports **SUFFICIENT** with no reasons.
The earlier `receipts/f6-test.json` remains preserved as a superseded red and is not part of this
passing set. Full recovery evidence is in `reports/f6-binding-recovery.md`.

## S5 attempt 5 — runtime lease verdict

The singleton runtime lease was granted against immutable leaf evidence head `a8a160285d` over
product head `7fa29ad3e`, and that exact leaf head executed. The coordinator's preflight
`leak-report.md` timestamp refresh landed after its clean-tree observation; it was the only dirty
path before execution and did not move the leased head or touch product.

`deno task e2e:cli run scaffold.runtime --cleanup --format pretty` ran exactly once and **FAILED**
with inner exit code 1. The suite-owned terminal report contains 70 steps: 69 passed, 1 failed, 0
skipped. Family counts are preflight 2/2, scaffold 15/15, generated 11/11, runtime 21/21, database
5/5, behavior 13/14, and cleanup 2/2. The suite-owned NDJSON retains every exact step ID, verdict,
duration, and evidence object, including the synthetic Docker-prune pass not emitted as a separate
pretty gate line.

F4/F5 proofs remained green in the real generated project: service-client add/generate,
`generated.service-client-contract`, generated check/lint, and `generated.deno-fmt-check` all
passed. The sole failure was `behavior.service-client-refetch`, which timed out waiting for a Chrome
DevTools target before connecting CDP or exercising the mutation/refetch assertions. This is a
leaf-added probe/runtime-integration failure and **not a refetch-behavior verdict**; at
pre-implementation `c53726c69` both the probe path and gate ID are absent. The exact browser startup
mechanism remains unknown because stderr was drained without retention. No repair or retry ran.

Pretty raw log:
`reports/s5-attempt5-scaffold-runtime-20260815-2139.log`, SHA-256
`ff349b40f7f70341934e170df7c67d147c0ed983173b41871421755ad55e062b`.
Suite-owned NDJSON:
`reports/s5-attempt5-scaffold-runtime-20260815-2139.ndjson`, SHA-256
`e35d6fbcbdfc0b046be3fec29fa5dee0b0369094645b75cb42fca1e0350bbc16`.

Suite cleanup passed. Run-owned teardown applied with zero AppHosts, containers, or escalations.
Final leak-check at `2026-08-15T19:48:35.122Z` reports Aspire `ok`, Docker `ok`, and
`survivors: []`; Aspire inventory is empty, Docker is empty, no AppHost/DCP/application/browser/
runtime process or relevant listener remains, and only protected `aspire mcp start` helpers appear
in the process audit. Three run-owned stopped NuGet helpers exited naturally before TERM could be
delivered. The host is empty and the leaf releases the lease. `fresh-browser` is **NOT_RUN** and no
receipt exists because scaffold was red; the second browser cleanup audit is not reached.

Full evidence and attribution are in `reports/s5-attempt5-runtime-failure.md`. All earlier attempts,
reports, receipts, and carried baselines remain append-only.

## F7-C1 plan amendment — managed-browser selection and observable startup failure

The unreviewed F7 plan at `ff0ede997` is superseded because its host-capability premise was stale.
Coordinator measurement found two executable Playwright-managed Linux Chromium 151 binaries under
`chromium-1232` and `chromium-1234`, both returning successful Google Chrome for Testing version
strings. The runtime red is therefore an allowlist/selection defect: the six built-in candidates
omit managed browsers and select Windows Chrome without WSL binfmt interop. The independent startup
diagnostic defect then discards its code-2 shell/PE stderr and reports only a timeout. Path conversion
and loopback handling remain refuted.

The corrected later repair remains inside the existing F6 probe/test pair. The strict portable
boundary is `NETSCRIPT_E2E_BROWSER_EXECUTABLE`; an explicit value is exclusively validated with a
bounded `--version` probe and never falls back. Missing, empty, non-executable, start-failing,
timed-out/non-zero, and unrecognized values name the environment source and exact path. Without an
override, built-in candidates must pass the same runnable-version check before selection. Versioned
cache paths remain runtime values and are prohibited from source/test literals.

The bounded startup repair remains: a 32 KiB tail capture continuously drains, and the target/status
race reports selection source/path, exit code/signal, and stderr. Deterministic cheap proofs bind the
managed-binary version measurement, override precedence and invalid no-fallback cases, immediate
headless exit, retention bound, selection-aware live timeout, and all F6 cases. The runtime gate must
prove refetch; there is no skip outcome.

The exact path ceiling and proof matrix are recorded in `plan.md` and
`reports/f7-plan-amendment.md`. This correction changed run artifacts only and ran no test, gate,
lease, browser, Aspire, Docker, evaluator, readiness action, or metadata action. All prior evidence
remains append-only.

## F7 implementation — strict executable selection and bounded startup evidence

Fresh Tier-A passed F7-C1 at `a2e9515f5`. Implementation remained inside the exact two-path
probe/test ceiling. The probe now selects a browser only after a bounded runnable `--version`
check, treats `NETSCRIPT_E2E_BROWSER_EXECUTABLE` as exclusive when present, and carries source/path
metadata through real headless startup. Built-in candidates use the same probe, so a present but
unrunnable Windows PE is recorded as a failure rather than returned because it exists.

One 32 KiB tail capture continuously drains startup stderr. `awaitBrowserStartup` races the target
against the one captured child-status promise, reports bounded stderr and exit status on early
termination, and preserves a live target error's cause/text without inventing status. The raw drain
continues into the unchanged F6 termination helper. CDP/refetch behavior, response-stage resume,
stable baseline, and settled `+1` assertion are unchanged.

The first focused run was honestly red on two test assumptions: invalid executable images become a
shell exit 127 in this Deno runtime, and the self-source file URL needed a `URL` object. After a
test-only correction within the ceiling, the structured focused suite passed **22/0** with the
managed Chromium 151 path supplied only through the environment. A direct selector measurement
returned source `NETSCRIPT_E2E_BROWSER_EXECUTABLE`, the exact runtime path, and
`Google Chrome for Testing 151.0.7922.34`. Focused structured check/lint/format selected the three
related probe files and returned zero diagnostics/findings. Full details are in
`reports/f7-implementation.md`.

The four binding receipts remain pending until product/test plus this run state are committed at a
clean immutable content head. No expensive gate, lease, browser, Aspire, Docker, evaluator,
readiness, metadata, lockfile, documentation, or third product/test path was touched.

### F7 binding stop — unreadable attempt-5 runtime workspace

Immutable content head `e45144db643f6bde85552a615812c8371e4ce792` has a passing binding
`check` receipt and an honest failing binding `test` receipt. The sole failure is the unchanged
forbidden-command walker receiving `PermissionDenied` under the preserved
`plugin-smoke-20260815-213942/.data/postgres/18/docker` tree (mode `0700`, owner `dnsmasq:root`). The
walker has no diff from `c53726c69` and was last changed by `4634afe56` on 2026-08-03. This is S5
attempt-5 runtime residue, not F7 source.

The full result arithmetic is 4,236 passed / 1 failed / 19 ignored (4,256 total). F6 attempt 2 had
4,248 total; the exact eight-result increase matches the focused test file's 14→22 increase, and all
eight pass in the 22/0 focused run. The binding red still stops the sequence: no publish or
architecture receipt was run or authored, and there was no retry or residue mutation.

`evaluateEvidenceSet` over exactly `receipts/f7-check.json`, `receipts/f7-test.json`,
`receipts/f7-publish-dry-run.json`, and `receipts/f7-arch-check.json` reports **INSUFFICIENT** because
`test` is `FAIL` and the latter two receipts are missing. Full evidence is in
`reports/f7-binding-test-failure.md`. No expensive gate, lease, browser, Aspire, Docker, evaluator,
readiness, metadata, lockfile, documentation, or product repair occurred.

### F7 environment-only binding recovery

Coordinator disposition accepted the first F7 test receipt as an environmental red and moved the
S5 attempt-5 workspace recoverably to `/tmp/netscript-f7-quarantine.iXF6fb`. The original red and
evidence commit `885f352e7` remain append-only. The original passing `f7-check.json` was retained and
not rerun.

Because the leaf worktree contained a coordinator-owned `leak-report.md` modification, recovery ran
from the clean detached worktree `/home/codex/worktrees/netscript-f7-binding-e45144db6` at exact
content `e45144db643f6bde85552a615812c8371e4ce792`. Its short status was empty before and after. No
head mismatch waiver was used.

`f7-test-attempt2` passed **4,237/0/19** across the same **4,256** total results. Only then did
`f7-publish-dry-run` pass, followed serially by `f7-arch-check` with zero doctrine failures. Every
new receipt has `gitHead == actualGitHead == e45144db643f6bde85552a615812c8371e4ce792`.

`evaluateEvidenceSet` over exactly `receipts/f7-check.json`,
`receipts/f7-test-attempt2.json`, `receipts/f7-publish-dry-run.json`, and
`receipts/f7-arch-check.json` reports **SUFFICIENT** with an empty reason list. The original
`receipts/f7-test.json` stays excluded as a superseded red; including it would cause both duplicate
`test` evidence and a failing outcome. Full evidence is in `reports/f7-binding-recovery.md`.

No source/test, runtime attempt, lease, expensive gate, browser, Aspire, Docker, evaluator,
readiness, metadata, lockfile, documentation, quarantine, or coordinator-owned leak report changed.

### S5 attempt 6 — strict browser selection reaches a 900-second runtime red

The singleton lease recorded at features topic `ac1ec35cf` bound evidence
`ed3f78e0d87784b1869166bd2574737c62fac0af`. Because the leaf checkout carried only a
coordinator-generated `leak-report.md` timestamp refresh, the one authorized command ran from a new
clean detached checkout at that exact evidence commit. No commit occurred between grant and
execution.

The strict selector used source `NETSCRIPT_E2E_BROWSER_EXECUTABLE`, exact path
`/home/codex/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`, and version
`Google Chrome for Testing 151.0.7922.34`. The suite reports **69 passed / 1 failed / 0 skipped**.
The sole red is `behavior.service-client-refetch`: its child exited 143 after the suite-owned
900,030 ms command boundary with empty stdout/stderr tails. `generated.service-client-contract`,
`generated.deno-fmt-check`, and suite cleanup remain green. No retry occurred, and `fresh-browser`
is NOT_RUN with no receipt.

Pretty output, complete suite NDJSON, and the selector result are hashed in
`reports/s5-attempt6-runtime-failure.md`. Mandatory cleanup found and terminated three run-owned
Aspire NuGet search children using TERM+CONT. The D-18 scan then found one unreadable Postgres data
directory; the complete generated project and its suite log were moved recoverably to
`/tmp/netscript-s5-a6-quarantine-20260815-4M9v8k/`. The final audit is empty: leak-check Aspire and
Docker probes are `ok`, survivors are `[]`, Aspire and Docker inventories are empty, run-owned
processes/listeners are empty, and both leaf and detached `.llm/tmp` unreadable scans exit 0 with no
findings. The leaf relinquishes lease use only after that proof; central release is coordinator-owned.

No source/test, second runtime, browser gate, evaluator, readiness, metadata, lockfile,
documentation, or deletion occurred. Attempt 6 and every prior red remain append-only.

## F8 plan amendment — bounded and attributable CDP waits

Attempt-6 attribution was narrowed from the preserved code and NDJSON rather than guessed. The
runtime ledger proves `behavior.service-client-refetch` exited 143 at 900,030 ms with empty output,
but records no CDP-stage marker. It therefore cannot select between the two unbounded primitives in
`CdpClient`: `connect` waits only for open/error, and `send` waits only for a matching response id.
All surrounding polling/event/version/startup waits are already bounded.

The plan now binds separate inert-socket and missing-response tests using short production bounds
and larger test watchdogs. Those tests make each no-settlement path fail deterministically and
require distinct URL-versus-method diagnostics, while the production default remains the existing
20,000 ms `TIMEOUT_MS`—45 times below the suite boundary. A timed-out response id is removed before
rejection, and all F6 teardown and F7 selection/startup proofs remain required.

The exact later ceiling remains two paths:

1. `packages/cli/e2e/src/application/gates/scaffold/service-client-browser-probe.ts`
2. `packages/cli/e2e/tests/application/gates/service-client-runtime-probe_test.ts`

Full attribution and the executable proof matrix are in `reports/f8-plan-amendment.md`. This entry
and the amendment are plan/run artifacts only. No source, test, runtime, browser, Aspire, Docker,
lease, evaluator, readiness, metadata, issue, lockfile, docs, or quarantine mutation is authorized.
Attempt 7 remains prohibited until repair receipts and a second fresh Tier-A exist.

The commit also preserves the already-present coordinator audit refresh in `leak-report.md`
(timestamp and audited worktree only); it does not rerun or reinterpret that audit.

## Provenance correction — leak-report.md restored to its author blob

The F8 plan-only commit `d8d5ee619` carried a change to `leak-report.md` that the plan author did
not produce. A supervisor host audit ran into the author's checkout and rewrote the report's
`Generated` timestamp and `Worktree` line to `2026-08-15T21:33:41.742Z` /
`/home/codex/repos/netscript-007-features-1355`. The author's own values are
`2026-08-15T21:24:46.689Z` / `/home/codex/worktrees/netscript-s5-a6-ed3f78e0d`, recorded from the
attempt-6 detached checkout.

This commit restores `leak-report.md` byte-for-byte to its blob at `2385cdb72`, so the branch again
carries only the author's audit values. The earlier worklog sentence describing that change as a
preserved coordinator audit refresh is superseded: those bytes were foreign, not preserved evidence.

The repair is append-only and was made by a separate corrective owner in a dedicated detached
worktree. `d8d5ee619` is not amended, reset, rebased, or rewritten; it stands as an intermediate
contaminated plan head. F8 plan content is untouched. No gate, audit, leak-check, browser, Aspire,
Docker, lease, evaluator, readiness, metadata, issue, label, lockfile, or docs action occurred.

## F8 implementation — bounded and attributable CDP transport waits

Tier-A accepted the F8 plan at `20337441788b4e2341b0474d6297bec1ddd33b80`; implementation began
from that exact clean local/remote head. Product/test scope stayed inside the reviewed two-path
ceiling:

1. `packages/cli/e2e/src/application/gates/scaffold/service-client-browser-probe.ts`
2. `packages/cli/e2e/tests/application/gates/service-client-runtime-probe_test.ts`

`CdpClient` is now an E2E-internal exported test seam only; no package barrel or publish surface
changed. `connect` accepts an injected structural socket factory and timeout while production keeps
`new WebSocket(url)` and the existing 20,000 ms default. An inert connection now detaches open/error
handlers, closes the socket, and rejects with the exact URL, operation, and elapsed bound. `send`
uses the same default, names the CDP method on timeout, removes the command id before rejection, and
clears timers on result/error settlement. Unknown late ids still return early.

Three focused tests make the formerly silent paths executable without a browser or network:

- an inert socket loses to the production connection timeout, not the larger test watchdog, and is
  detached/closed with URL-specific diagnostics;
- a missing `Page.enable` response loses to the production response timeout, its pending entry is
  zero before and after a late matching response, and a following `Runtime.enable` response still
  settles normally;
- normal result, normal CDP error, and socket-error behavior remain unchanged, with an observation
  beyond the configured command bound proving no later timeout effect.

The focused wrapper command completed with **25 passed / 0 failed / 0 ignored**:

```text
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/e2e/tests/application/gates/service-client-runtime-probe_test.ts
```

All pre-existing F6 natural-exit/active-SIGTERM/three-negative/delegation proofs and F7 strict
selection/startup/bounded-drain/no-cache-literal proofs ran in that same file and remain green. No
proof was omitted. No third code path, stage logging, retry, reconnect, runtime attempt, browser,
Aspire, Docker, lease, binding gate, evaluator, readiness, metadata, issue, quarantine, lockfile, or
docs mutation occurred. The Tier-A supervisor owns the four post-push binding receipts.
