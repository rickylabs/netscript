# Evaluation: #754 deeper type-erasure elimination tail

Allowed result values: `PASS`, `FAIL`, `N/A`, `PENDING_SCRIPT`, `DEBT_ACCEPTED`, `NOT_RUN`.
Anti-pattern status values: `CLEAR`, `VIOLATION`, `DEBT_ACCEPTED`, `N/A`.

## Metadata

| Field          | Value                          |
| -------------- | ------------------------------ |
| Run ID         | `quality-q754-tail--codex`     |
| Target         | seven package roots (telemetry, aspire, sdk, fresh-ui, bench, plugin-ai-core, plugin-auth-core) |
| Archetype      | 2 (telemetry/aspire), 4 (sdk/fresh-ui), 6 (bench), 1 (plugin cores) |
| Scope overlays | frontend (`fresh-ui`); none otherwise |
| Evaluator      | Claude Opus 4.8 (`claude-opus-4-8`), separate local IMPL-EVAL session, 2026-07-12 |
| Generator      | WSL Codex GPT-5.6 Sol / high (opposite family) |
| Commit trail   | base `3b3d615b` → `e465a6db` (plan lock) → `d52294b8` (plan gate) → `779171bd` (slice 1) → `6d7c3d54` (slice 2) → `a6b046e5` (slice 3, HEAD) + uncommitted final worklog/context/session-record |

## Process Verification

| Check                                  | Result | Evidence                    |
| -------------------------------------- | ------ | --------------------------- |
| Plan-Gate passed before implementation | `PASS` | `plan-eval.md` = `PASS` (Claude session `session_01WMKgGNRNc4UG9E7bjDryF1`), committed at `d52294b8` **before** the three slice commits `779171bd`/`6d7c3d54`/`a6b046e5`. |
| Design section exists in worklog       | `PASS` | `worklog.md` `## Design` — Public Surface / Domain Vocabulary / Ports / Constants / Commit Slices (4 ordered slices, each names gate + files). |
| Commit slices match design plan        | `PASS` | Slice 1 → `779171bd` (telemetry 5 + aspire/bench/sdk comment sites 1 each); slice 2 → `6d7c3d54` (fresh-ui 7 + sdk 2); slice 3 → `a6b046e5` (plugin-ai-core 4 + plugin-auth-core 4); slice 4 = artifacts/this IMPL-EVAL. Per-commit `git show --name-only` confirms no cross-slice leakage. |
| Each slice has a passing gate          | `PASS` | Independently reproduced: scanner 16→6→2→0 progression; telemetry/sdk/fresh-ui/plugin scoped check/lint/fmt + tests green per slice (see Static/Runtime). |
| No speculative seams (unused files)    | `PASS` | New `base-error-adapter.ts` (both cores) is imported and called at module scope in `ai.contract.ts:54,129-131` / `auth.contract.ts:17,138-140`; guards in `otel-sdk.ts`/`http-client-link.ts` are invoked at the load/creation seam. No dead export. |
| Constants used for finite vocabularies | `N/A`  | Design introduces no new finite domain vocabulary; guards/types only. |
| Agent-brief `## SKILL` chapters (rule 13) | `N/A` | No-PR local variant: sub-agent/review briefs are not committed run artifacts, so not verifiable from the run dir; every recorded eval/review session states its role + skills. Not blocking. |

## Static Gates

| Gate             | Command or check | Result | Evidence | Notes |
| ---------------- | ---------------- | ------ | -------- | ----- |
| Code-quality scanner | `scan-code-quality.ts` over 7 roots `--max-allow 4` | `PASS` | `{"ok":true,"findings":[],"allowCount":0,"allowances":[]}` | Central acceptance; 0 findings, 0 allowances, no surviving allowance. |
| Seven-root typecheck | `run-deno-check.ts --root <7> --ext ts,tsx` | `PASS` | 420 files, 4 batches, 0 failed, `totalOccurrences:0` | Proves the corrected typing compiles across all roots. |
| Format           | `run-deno-fmt.ts --root <7> --ext ts,tsx` | `PASS` | 420 files, 0 findings | |
| Lint             | `run-deno-lint.ts --root <7> --ext ts,tsx` | `PASS` | 420 files, 0 findings | |
| Doc lint (fresh-ui public) | `deno doc --lint packages/fresh-ui/{mod.ts,primitives.tsx}` | `PASS` | both `Checked 1 file`, 0 diagnostics at HEAD | Closes slice-2 FAIL_FIX `private-type-ref` regression. |
| Doc lint (plugin cores) | `deno doc --lint <core>/mod.ts` HEAD vs baseline | `PASS` | privateTypeRef delta = 0 (ai/auth identical HEAD vs `3b3d615b`) | 2 privateTypeRef/core are pre-existing (oRPC `Implementer`, internal shape). |
| Publish dry-run  | `deno publish --dry-run --allow-dirty` ×6 | `PASS` | telemetry/aspire/sdk/fresh-ui/plugin-ai-core/plugin-auth-core all exit 0, **no slow types**; telemetry's only warning is the sanctioned `unanalyzable-dynamic-import`. bench = `publish:false` (N/A). | |
| Lock/ignore hygiene | `git diff 3b3d615b..HEAD -- deno.lock`, fresh-ui lock, ignore sweep | `PASS` | committed root + fresh-ui lock delta **empty**; no new `deno-lint-ignore`, no `quality-allow` in the 7 roots. | See Findings note on validation-time lock touch (evaluator artifact, restored). |

## Fitness Gates

| Gate | Function                     | Result | Evidence | Violations |
| ---- | ---------------------------- | ------ | -------- | ---------- |
| F-1  | File-size lint               | `PASS` | ai.contract 472→476 (<500); auth.contract 517→517 (pre-existing WARN, not deepened); otel-sdk.ts 342→444 (<500). | none new |
| F-5  | Public surface audit         | `PASS` | telemetry exports package-owned interceptor types (no upstream re-export); `PrimitiveNode` self-contained; adapter internal-only. | none |
| F-6  | JSR publishability gate       | `PASS` | six dry-runs, no slow types; bench `publish:false`. | none |
| F-7  | Doc-score gate               | `PASS` | fresh-ui public entrypoints 0; plugin-core delta 0. | none |
| F-10 | Test-shape audit             | `PASS` | 7 suites green: telemetry 51 / sdk 16 / fresh-ui 134 / aspire 18(58 steps) / bench 22 / AI 4 / auth 29; new guard + render + adapter + soundness tests present and non-vacuous. | none |
| F-15 | Re-export-of-upstream lint   | `PASS` | no `@orpc/server` dep added; telemetry callback types are package-owned; adapters import upstream types only internally. | none |
| F-19 | Scoped source gate runners   | `PASS` | seven-root check/lint/fmt wrappers all green (see Static). | none |
| doctrine (per-root + aggregate) | `check-doctrine.ts --root <7>` + `deno task arch:check` | `PASS` | FAIL=0 in every root; aggregate `arch:check` exit 0; baseline-worktree diff shows telemetry WARN 6→5 (dropped WARN = fixed `_types.ts:9 any`), all other roots identical → nothing deepened. | none |

## Runtime Gates

| Gate     | Validation     | Result | Evidence |
| -------- | -------------- | ------ | -------- |
| OTEL dynamic-module boundary | `otel-sdk.ts` structural `asserts`-guards + loader returns `unknown` | `PASS` | Six `assert*Module`/handle guards use `typeof`/`isRecord` predicates, throw `TypeError` on mismatch; `resourceFromAttributes` guarded optional. No `as`. telemetry 51 tests green. |
| SDK recursive contract-router guard | `isOrpcContractRouter` at `createHttpClientLink` | `PASS` | Leaf predicate is oRPC's own `isContractProcedure`; rejects arrays, empty namespaces, and reserved `~orpc` impostors; sdk 16 tests (incl. impostor-rejection regression) green. |
| Standard-Schema error-map guard | `isStandardSchema` + `satisfies ErrorMap` in both cores | `PASS` | Checks exactly `StandardSchemaV1.Props` members (`version===1`, `vendor:string`, `validate:fn`); runs at import (module-scope const); AI 4 / auth 29 tests assert compiled `errorMap` shape. |
| Browser/visual | typing-only slice | `N/A` | No visual output changed; SSR render regression test substitutes (accordion `<summary>`/`aria-disabled`/no-invoke). |

## Consumer Gates

| Consumer     | Validation     | Result | Evidence |
| ------------ | -------------- | ------ | -------- |
| SDK + Fresh UI public surface | scoped check + package tests + publish dry-run | `PASS` | 420-file check green; fresh-ui 134 / sdk 16; both publish dry-runs no slow types. `PrimitiveNode`/summary/style corrections break no in-repo consumer. |
| plugin AI + auth cores | package tests + contract error-map assertions | `PASS` | AI 4 / auth 29; soundness tests read the compiled `~orpc.errorMap` (non-vacuous); behavior preserved (auth 422 `VALIDATION_ERROR` spelling still wins). |

## Anti-Pattern Check

| AP    | Status | Evidence | Notes |
| ----- | ------ | -------- | ----- |
| AP-2  | `CLEAR` | Guards encode real upstream/dynamic policy; no primitive renamed. | |
| AP-9  | `CLEAR` | Guards kept local to each genuine boundary; byte-identical core adapters duplicated by deliberate scope choice, not a speculative shared abstraction. | future consolidation candidate only |
| AP-14 | `CLEAR` | No upstream package re-exported; `@orpc/*`/Preact types imported internally; no new `@orpc/server` dependency. | |
| AP-20 | `CLEAR` | Package `lib` configs untouched; scoped check green. | |
| all others | `N/A` | Outside this typing-slice scope. | |

## Arch-Debt Delta

| Metric                | Count | Evidence |
| --------------------- | ----- | -------- |
| New entries           | 0 | No doctrine FAIL introduced; scanner 0/0. |
| Resolved entries      | 0 | Run did not close a registered debt entry (telemetry `_types.ts` WARN cleared is fitness improvement, not a registry entry). |
| Deepened violations   | 0 | Baseline-worktree doctrine diff: telemetry 6→5 WARN (improved), all other roots identical; auth 517-line cap pre-existing and unchanged. |
| Unrecorded violations | 0 | No new/deepened violation; drift entries recorded (no-PR variant, absent remote branch, fresh-ui `--allow-read` test permission). |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| low (non-blocking, evaluator-side) | Running package-level `deno task test` / `deno publish --dry-run` inside `packages/fresh-ui` during validation resolves extra workspace specifiers into `packages/fresh-ui/deno.lock` (630 insertions). This is a **validation-time artifact of the evaluator session**, not a delivered defect: the generator's committed delta `3b3d615b..HEAD -- packages/fresh-ui/deno.lock` is **empty**. | `git diff --quiet 3b3d615b..HEAD -- packages/fresh-ui/deno.lock` exit 0; working-tree churn restored via `git checkout HEAD -- packages/fresh-ui/deno.lock`; final `git status` shows only the three artifacts under evaluation. | none for the generator; noted so future IMPL-EVAL restores the package lock after full-suite runs. |
| low (non-blocking) | Core adapter unit tests do not individually exercise the `version!==1` / non-string `vendor` / non-function `validate` guard branches. | `base-error-adapter_test.ts` covers positive path + `{}` negative; module-scope runtime map covers the boundary. | optional test nicety; not a correctness gap. |

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Eliminate erasure by typing the seam, not relocating it | Return `unknown` from dynamic/upstream boundaries and narrow with `asserts`/`value is` guards whose predicate matches the consumer's own runtime predicate (e.g. oRPC `isContractProcedure`); replace `as unknown as` with `satisfies`. | Arch 1/2/4 boundary code | high |
| Package-owned structural callback types beat variadic-`any` at contravariant seams | Declare only the fields the callback reads; oRPC passes a superset. Avoids adding an upstream type/dep to the public graph. | oRPC handler/interceptor plugins | high |
| Full-suite validation can dirty a package-local lock | Evaluators running `deno task test`/publish in a package should `git diff`/restore the package `deno.lock` afterward to keep the read-only guarantee. | any harness IMPL-EVAL | medium |

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | `PASS` |
| Rationale | Approved scope is complete. The central acceptance reproduces exactly: the exact seven-root scanner `--max-allow 4` returns `ok:true`, 0 findings, `allowCount:0`, no allowances — down from the rejected attempt's 6. The fixes are genuine typing/guards, not relocated erasure: 6 `as unknown as` casts and 4 `deno-lint-ignore no-explicit-any` directives removed with none added, no surviving allowance, no new ignore. All required static gates (seven-root check/lint/fmt 420/0, six publish dry-runs no slow types, doc-lint public entrypoints clean), all seven package test suites, per-root + aggregate doctrine (FAIL=0, nothing deepened vs baseline worktree), and runtime guard soundness (OTEL structural asserts, SDK recursive router guard = oRPC's own leaf predicate, Standard-Schema guard = exact `StandardSchemaV1.Props`) pass independently. The slice-2 `FAIL_FIX` correction is verified closed (fresh-ui public doc-lint 0, guard/accordion regression tests present and passing, and the fix caught a real empty-branch/reserved-`~orpc` bug). Public surfaces are truthful with no upstream re-export or new dependency; no lock churn in the committed trail (the fresh-ui lock touch was an evaluator validation artifact, now restored). Close-gate is N/A (owner-forbidden PR; local commit trail is the recorded override); release-gate is N/A (non-release run). Design checkpoint present, commit slicing faithful, drift recorded. No unresolved correctness, acceptance, debt, or process defect remains. |
