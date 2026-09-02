# Evaluation: Slice C resource contract and safe reconciler

Filled from `.llm/harness/templates/evaluate.md`. Allowed result values: `PASS`, `FAIL`, `N/A`,
`PENDING_SCRIPT`, `DEBT_ACCEPTED`, `NOT_RUN`. Anti-pattern status values: `CLEAR`, `VIOLATION`,
`DEBT_ACCEPTED`, `N/A`.

## Metadata

| Field          | Value                                                                        |
| -------------- | ---------------------------------------------------------------------------- |
| Run ID         | `feat-cli-resource-slice-contract--1354-c`                                   |
| Target         | `packages/cli/src/kernel/application/resource-slice/` (ten files, internal)  |
| Archetype      | `6 — CLI / Tooling`                                                          |
| Scope overlays | Fresh 2.x route-key semantics only; no runtime/browser/publish/release gates |
| Evaluator      | Separate IMPL-EVAL session, 2026-09-02                                       |

### Evaluator identity (requested vs observed)

| Field | Requested (brief)            | Observed                                                              |
| ----- | ---------------------------- | --------------------------------------------------------------------- |
| Model | native Claude Fable 5        | `claude-fable-5` (Claude Code)                                         |
| Effort | medium                      | session-default reasoning; no explicit effort attestation surface      |
| Session | separate from Codex generator | `https://claude.ai/code/session_01AM6zB9u6jKBxDjoMysrg6A` (background job, worktree `007-leaf-1354-c`) |

Generator was a Codex/GPT-5-family session (`supervisor.md`); this session is native Claude and did
not author any product byte. Generator ≠ evaluator holds.

## Process Verification

| Check                                  | Result | Evidence                                                                                                                                    |
| -------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | `PASS` | `PLAN-EVAL: N/A` justified and recorded in `plan.md`/`worklog.md` before implementation: the master plan (`origin/feat/cli-resource-slice-plan:.llm/runs/feat-cli-resource-slice--1354/plan.md`) carries its own evaluated verdict (`PASS_PLAN_WITH_FINDINGS` per `research.md`), and this leaf implements locked Slice C without re-planning. |
| Design section exists in worklog       | `PASS` | `worklog.md § Design` names public surface (none moved), domain vocabulary, ports (none — IO-free), constants, commit slice, deferred scope, and contributor path, matching the Archetype 6 checkpoint expectations for an internal application slice. |
| Commit slices match design plan        | `PASS` | One slice planned, one commit `03d4c2519 feat(cli): define resource slice reconciliation contract` against baseline `850cc7757`; diff touches exactly the ten product files + run dir. |
| Each slice has a passing gate          | `PASS` | Independently re-run: focused tests 32/32; scoped check/lint/fmt 10/10 files, 0 findings; `arch:check` exit 0; `quality:gate` exit 0; docs gates PASS (all below). |
| No speculative seams (unused files)    | `PASS` | The five modules are the contract-first deliverable master-plan Slices D/E explicitly consume; no other product file imports `resource-slice/` yet (`grep -rl "resource-slice/" packages plugins` → only the slice itself), which is the locked plan shape, not an orphan seam. |
| Constants used for finite vocabularies | `PASS` | `RESOURCE_SLICE_VARIANTS`, `RESOURCE_SLICE_LEAF_ROLES` (eleven D7 roles), `RESOURCE_SLICE_MARKER_PREFIX`, `RESOURCE_SLICE_MARKER_SCHEMA`, and the `ResourceSlicePreflightPhase` literal union in `resource-slice-contract.ts:3-28,121-127`. |

## Scope and locked-decision verification

| Check | Result | Evidence |
| --- | --- | --- |
| Ten-file touch set exact | `PASS` | `git diff 850cc7757..HEAD --name-only` → the ten master-plan Slice C paths plus `.llm/runs/feat-cli-resource-slice-contract--1354-c/**` only; `deno.lock` diff is empty. |
| Application-layer purity | `PASS` | Non-test modules import only `@std/text` and sibling contract; `grep -rnE "Deno\.|console\.|fetch\("` over the five product modules → no hits; no adapter/presentation import; SHA-256 via doctrine-authorized `crypto.subtle`. |
| Exact D3 marker format | `PASS` | `RESOURCE_SLICE_MARKER_PREFIX + JSON.stringify` with fixed key order schema/resource/role/options/bodySha256; `parseOwnedResourceSliceLeaf` enforces canonical round-trip (re-stringify equality, `resource-slice-contract.ts:291-293`); test pins the exact 64-hex marker line and rejects reordered keys, bad JSON, and schema 2. |
| Classifications exact | `PASS` | `ResourceSliceLeafClassification` = `absent`/`exact`/`owned`/`owned-edited`/`unowned`; missing/malformed/wrong-schema/wrong-resource/wrong-role → `unowned`; hash mismatch → `owned-edited` (force-ineligible); recomputed forgery → `owned` needing force — each pinned by a passing test. |
| Zero-write preflight structure | `PASS` | Only the `status: 'ready'` union arm carries `applyPlan` (`resource-slice-contract.ts:165-196`); dry-run, conflict, and all six `ResourceSlicePreflightPhase` failures structurally omit it; test injects each phase plus invalid staged metadata and proves the application map stays byte-identical. |
| Owned-only `--force` | `PASS` | `decideLeaf` writes under force only for `kind === 'owned'`; `owned-edited` and `unowned` conflict under force (tests: mismatched-hash, unowned-under-force); shared candidates never consult force. |
| Planner deltas | `PASS` | Core = six always-on leaves at exact D7 paths; form/partial/stream each add only their declared leaves plus page/view option transitions; `utils.ts` state edit absent for all shipped variant sets; query bindings factory-derived (`queryOptions`/`clientKey`) — `plan-resource-slice_test.ts` pins all of it, including the nested-route partial path `routes/partials/orders/history/summary.tsx`. |
| Fail-closed router transform | `PASS` | `reconcileAppRoutes` requires both stock generated-route imports and a single `export const appRoutes = { ... } as const` anchor; comment/string-aware `matchingBrace`; spread/computed entries, `Object.freeze`, `satisfies`, alias reuse, and same-route-key different-alias all conflict; the stock post-Slice-F router fixture is the recognized insert case and re-running returns `exact`. |
| Fail-closed State transform | `PASS` | `reconcileState` accepts only the empty `Record<string, never>` alias or a single unextended `export interface State`; property conflicts detected inside the interface body only (brace-in-comment fixture passes); extended/aliased/intersected/duplicate/missing shapes conflict. |
| Fresh 2.x route semantics | `PASS` | Route normalization rejects `[id]`, `[...path]`, `:id`, `*`, query strings, and non-kebab segments (static-only per locked D2); router alias value is a `generatedRoutes.<routeKeyPath>` property chain, never an inline `createRouteReference`. |

## Static Gates

| Gate             | Command or check                                                                                     | Result | Evidence                                            | Notes |
| ---------------- | ---------------------------------------------------------------------------------------------------- | ------ | --------------------------------------------------- | ----- |
| Narrow typecheck | `run-deno-check.ts --root .../resource-slice --ext ts,tsx`                                           | `PASS` | 10 selected, 1 batch, 0 diagnostics                 | re-run by evaluator |
| Slice typecheck  | `deno test --allow-all packages/cli/` (type-checks all modules)                                      | `PASS` | 974 passed (595 steps), 0 failed, exit 0            | matches worklog's 1,569 total count |
| Format           | `run-deno-fmt.ts --root .../resource-slice --ext ts,tsx --config <task-local>`                       | `PASS` | 10/10 processed, 0 findings                         | task-local config required; root `deno.json` fmt excludes `packages/cli/` (worklog drift confirmed) |
| Lint             | `run-deno-lint.ts --root .../resource-slice --ext ts,tsx --config <task-local>`                      | `PASS` | 10/10 processed, 0 findings; no `deno-lint-ignore` in the slice | same task-local config |
| Doc lint         | `deno task docs:readme-fences`; `deno task docs:jsdoc-examples`                                      | `PASS` | fences PASS `type_errors=7` = baseline 7; jsdoc PASS `unboundName=116` = baseline 116; both exit 0 | no baseline growth |
| Publish dry-run  | —                                                                                                    | `N/A`  | no export/`mod.ts`/`deno.json` change; brief marks publish gates N/A | assembled-wave gate |
| Link/path check  | ten paths vs master-plan Slice C enumeration                                                          | `PASS` | one-to-one match, `git diff --name-only`            | |

## Fitness Gates

`deno task arch:check` exit 0; CLI package summary `FAIL=0 WARN=59 INFO=1`; zero occurrences of
`resource-slice` anywhere in the report — no warning names a Slice C file. `deno task quality:gate`
exit 0, scanner `ok:true`, 0 findings, 7 pre-existing allowances, no new allowance.

| Gate | Function                     | Result | Evidence | Violations |
| ---- | ---------------------------- | ------ | -------- | ---------- |
| F-1  | File-size lint               | `PASS` | largest new file `resource-slice-contract.ts` 373 lines < 500 cap; no A8/AP-1 warning names a slice file | none |
| F-2  | Helper-reinvention scan      | `PASS` | casing from `@std/text`, hashing from `crypto.subtle`; no local re-wrap | none |
| F-3  | Layering check               | `PASS` | application imports domain/contract + platform-pure libs only (purity grep above) | none |
| F-4  | Inheritance audit            | `N/A`  | no class in the slice | — |
| F-5  | Public surface audit         | `N/A`  | no export map/`mod.ts` change | — |
| F-6  | JSR publishability gate      | `N/A`  | internal-only slice; assembled-wave gate | — |
| F-7  | Doc-score gate               | `PASS` | `docs:jsdoc-examples` PASS without baseline growth | none |
| F-8  | Workspace `lib` override     | `N/A`  | no config change | — |
| F-9  | Permission declaration check | `N/A`  | no new permission; slice is IO-free | — |
| F-10 | Test-shape audit             | `PASS` | five colocated `_test.ts` with semantic assertions (no giant snapshots) | none |
| F-11 | Forbidden-folder lint        | `PASS` | single role-named `resource-slice/` folder; no utils/helpers/lib | none |
| F-12 | Naming-convention lint       | `PASS` | `plan-`/`reconcile-` verb-noun application files; contract file name is the master-plan-locked path | none |
| F-13 | Saga/runtime invariants      | `N/A`  | not touched | — |
| F-14 | Console-log lint             | `PASS` | zero `console.*` in the slice (grep) | none |
| F-15 | Re-export-of-upstream lint   | `PASS` | no upstream symbol re-exported | none |
| F-16 | Folder-cardinality lint      | `PASS` | `resource-slice/` has 10 direct children ≤ 12; depth 3 from `src/`; no F-16 warning names the folder. Locked observation: A+C+D assembly will reach 14 and WARN — recorded, not a failure, per master plan | none |
| F-17 | Abstract-derived co-location | `N/A`  | no abstract introduced | — |
| F-18 | Sub-barrel lint              | `PASS` | no `mod.ts`/`index.ts` in the folder | none |
| F-19 | Scoped source gate runners   | `PASS` | structured wrappers used for check/lint/fmt verdicts (above) | none |

## Runtime Gates

| Gate | Validation | Result | Evidence |
| ---- | ---------- | ------ | -------- |
| runtime/browser/E2E/release | — | `N/A` | Pure internal application slice; no command calls the planner; brief and plan mark runtime, browser, publish, public-surface, and release gates N/A. |

## Consumer Gates

| Consumer | Validation | Result | Evidence |
| -------- | ---------- | ------ | -------- |
| Master-plan Slices D/E (future) | contract shape matches the locked D3/D5/D6/D7 inputs they will consume | `PASS` | `ResourceSliceStagingResult`/`ResourceSliceReconcileResult` union and the two transform result types cover every downstream branch named in D3 steps 1–7; no current consumer exists to break (`grep` shows zero imports outside the slice). |
| Full `packages/cli` suite | no regression from the added files | `PASS` | `deno test --allow-all packages/cli/` → 974 passed (595 steps), 0 failed, exit 0. |

## Anti-Pattern Check

| AP    | Status  | Evidence | Notes |
| ----- | ------- | -------- | ----- |
| AP-1  | `CLEAR` | largest file 373 lines; arch:check reports no size warning for the slice | |
| AP-2  | `CLEAR` | `@std/text` and `crypto.subtle` used directly | |
| AP-3  | `CLEAR` | interfaces are narrow single-purpose contracts | |
| AP-4  | `N/A`   | no inheritance | |
| AP-5  | `N/A`   | no abstract chain | |
| AP-6  | `N/A`   | no base class | |
| AP-7  | `CLEAR` | options objects throughout (`ReconcileResourceSliceInput`, requirement objects) | |
| AP-8  | `N/A`   | no DI container | |
| AP-9  | `CLEAR` | contract-first modules with named Slice D/E consumers in the locked plan | |
| AP-10 | `CLEAR` | `try/catch` only around `JSON.parse`/option normalization to return typed `undefined`, not to swallow handler errors | |
| AP-11 | `CLEAR` | no module-load client/env/logger/store; all inputs injected | |
| AP-12 | `N/A`   | no time/scheduling | |
| AP-13 | `CLEAR` | zero `console.*` (grep) | |
| AP-14 | `CLEAR` | no re-export of upstream | |
| AP-15 | `CLEAR` | no `IFoo`/`FooT` naming | |
| AP-16 | `CLEAR` | no generic folder | |
| AP-17 | `CLEAR` | contracts named by role in the feature folder | |
| AP-18 | `CLEAR` | tests assert structured reports/classifications, plus one exact one-line marker pin (canonical-format requirement, not a giant snapshot) | |
| AP-19 | `N/A`   | no permission change; IO-free | |
| AP-20 | `N/A`   | no config change | |
| AP-21 | `N/A`   | no presentation/feature surface touched | |
| AP-22 | `CLEAR` | no barrel added | |
| AP-23 | `N/A`   | composition untouched | |
| AP-24 | `CLEAR` | variant/role vocabularies drive data (`LEAF_DEFINITIONS` table), not switch-over-union implementations | |
| AP-25 | `CLEAR` | no side effect in any slice file | |

## Arch-Debt Delta

| Metric                | Count | Evidence |
| --------------------- | ----- | -------- |
| New entries           | 0     | `git diff 850cc7757..HEAD -- .llm/harness/debt/arch-debt.md` empty |
| Resolved entries      | 0     | same |
| Deepened violations   | 0     | arch:check CLI `FAIL=0`; no new warning; future 14-child WARN is a master-plan-locked observation, correctly not a debt entry |
| Unrecorded violations | 0     | quality:gate `ok:true`, 0 findings, no new allowance |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| low | Branch is unpushed and the PR is not yet open, so the draft-PR commit trail does not exist at evaluation time. This is the owner-directed lifecycle recorded in `supervisor.md`/`drift.md` (non-draft PR with `status:impl` opened after IMPL-EVAL), not a generator omission. | `git ls-remote origin feat/cli-resource-slice-contract` empty; `context-pack.md § Next Steps` | Push and open the metadata-complete non-draft PR with the per-slice comment immediately after this verdict, per the recorded override. No code change. |
| low | `reconcileAppRoutes` alias/same-value detection assumes deno-fmt two-space top-level entry indentation. An existing alias at non-stock indentation inside an otherwise recognized object would be missed and re-inserted, producing a duplicate object key (a loud TypeScript error, never a silent overwrite, and outside the recognized stock shape the transform targets). | `reconcile-app-routes.ts:47-60` | Optional hardening when Slice E wires the transform; no change required for this slice's locked contract. |

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Structural zero-write proof | Encode "no apply plan" in the result union (only the `ready` arm carries `applyPlan`) so pre-apply safety is type-structural, then snapshot-compare an application map per injected failure | Archetype 6 generators/reconcilers | medium |

## Verdict

| Field     | Value  |
| --------- | ------ |
| Verdict   | `PASS` |
| Rationale | The locked Slice C scope is complete and exact: ten files, application-layer pure, the D3 marker/classification/force/zero-write contract is implemented and pinned by tests, planner deltas match D7, and both shared-source transforms fail closed. Every required gate was independently re-run green by this separate session (32/32 focused tests; 10/10 scoped check/lint/fmt; full CLI suite 974 passed/0 failed; `arch:check` and `quality:gate` exit 0 with no slice-named finding; both docs gates at baseline). No doctrine violation was introduced and the debt registry is correctly untouched. The two low findings are a recorded lifecycle step (push/PR after eval) and an optional future hardening; neither blocks the pass. |
