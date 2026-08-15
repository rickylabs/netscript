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

**INSUFFICIENT.** S4 stopped before binding gates, so each exact contracted file is absent:

1. `receipts/s4-check.json` — missing / NOT_RUN.
2. `receipts/s4-test.json` — missing / NOT_RUN.
3. `receipts/s4-publish-dry-run.json` — missing / NOT_RUN.
4. `receipts/s4-arch-check.json` — missing / NOT_RUN.

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
  publish dry-runs pass. Binding gates remain next; expensive gates and evaluator remain prohibited.
