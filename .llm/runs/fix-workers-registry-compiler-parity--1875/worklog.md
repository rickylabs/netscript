# Worklog: workers registry compiler parity

> **LIVE DEFECT FOUND:** the current compiler drops five normalized `JobConfig` keys from generated
> definitions: `description`, `schedule`, `permissions`, `metadata`, and `retention`. This slice
> will emit each key explicitly without recreating any schema default or constraint.

## Run Metadata

| Field          | Value                                        |
| -------------- | -------------------------------------------- |
| Run ID         | `fix-workers-registry-compiler-parity--1875` |
| Branch         | `fix/workers-registry-compiler-parity`       |
| Archetype      | `5 - Plugin Package`                         |
| Scope overlays | `none`                                       |

## Design

### Public Surface

- No exported signature or entrypoint changes.
- Existing `compileWorkersRegistry()` continues to emit `RegisterJobInput` definitions.

### Domain Vocabulary

- `JobConfigSchema` — core-owned normalized job configuration contract and parity-key authority.
- emitted job definition — compiler-authored `RegisterJobInput` object whose keys must cover the
  schema contract.

### Ports

- `ProjectFiles` — existing filesystem seam used by the deterministic compiler test; no new port.

### Constants

- No new finite vocabulary. Expected parity keys are deliberately derived from the schema rather
  than declared as a constant list.

### Commit Slices

| # | Slice                                           | Gate                                                                 | Files                                                                                                                       |
| - | ----------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 1 | Prove and repair schema → emitted-output parity | Focused structured test plus plugin check/lint/fmt and quality gates | `plugins/workers/src/cli/registry-compiler.ts`, `plugins/workers/tests/cli/registry-compiler-golden_test.ts`, run artifacts |

### Deferred Scope

- Runtime/scaffold/E2E coverage — explicitly prohibited for this bounded slice.
- Broader workers plugin Refactor verdict — separately owned doctrine debt.

### Contributor Path

Add a field to the core-owned `JobConfigZodSchema`; the registry compiler parity test will fail and
name the missing emitted key until `createLocalJobDefinition()` covers it.

## PLAN-EVAL

`PLAN-EVAL: N/A` — this is a small mechanical repair with a complete issue contract, one locked
directional invariant, explicit exclusions, a one-slice file set, and prescribed gates. There are no
material architecture, sequencing, or trade-off decisions requiring adversarial plan advice.

## Progress Log

| Time       | Slice     | Step             | Notes                                                                                                                                                                                        |
| ---------- | --------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-01 | bootstrap | research/design  | Re-baselined at `82a2527e2`; confirmed five live omitted keys.                                                                                                                               |
| 2026-09-01 | S1        | implementation   | Emitted all five missing optional keys as `undefined`; added schema-derived subset assertion to the golden test.                                                                             |
| 2026-09-01 | S1        | focused gates    | Check/test/lint/fmt wrappers green after replacing literal regex indentation that lint rejected.                                                                                             |
| 2026-09-01 | S1        | fitness gates    | `quality:gate` green; supplemental JSR audit remains red on pre-existing, non-surface-changing findings.                                                                                     |
| 2026-09-01 | S1        | slice review     | PASS from separate Claude Opus 5 low fallback session `9ab1eef0`; reviewer independently re-ran the focused test.                                                                            |
| 2026-09-01 | S1        | sign-off         | Supervisor sign-off commit `cfbc07fa8` pushed; PLAN and IMPL comments posted to draft PR #1882.                                                                                              |
| 2026-09-01 | S1        | formal IMPL-EVAL | PASS from fresh native Claude Opus 5 medium fallback against frozen candidate `e400cd3f9`; no blocking findings. Fable was quota-blocked and the prescribed GLM fallback could not complete. |

## Post-Slice Reconcile

- Issue #1875 remains open at milestone 0.0.7; PR #1882 retains `Closes #1875`.
- PR #1882 opened with exactly the requested metadata: `orchestrator:features`, `status:impl`,
  `type:fix`, `priority:p2`, `wave:v1`, `area:workers`, milestone 0.0.7, and draft state. During the
  formal-evaluation window, an external owner/coordinator transition made it non-draft and advanced
  the sole status label to `status:impl-eval`; final reconciliation preserved that foreign state.
- No new review/evaluator comments required a source readjustment after S1.
- The plan remains unchanged; the live five-field gap was anticipated by its conditional repair
  scope and is prominently recorded above.
- Per-slice comments: PLAN `5497517791`; IMPL `5497518145`.
- Formal evaluation independently confirmed all 19 schema keys reach the emitted definition,
  injected a synthetic future key to prove the gate fails loudly, removed an emitted key to prove
  regression detection, and compared generated-module type errors between baseline and candidate.
  The five `undefined` emissions introduced zero new errors.
- The evaluator observed the same five-field defect class in the owner-excluded
  `runtime-registry-generator.ts`. This is a non-blocking follow-up after PR #1872, not
  authorization to touch or file against that in-flight scope during this run.
- The branch received owner-authored merge commit `ad5eb3041`, syncing current `origin/main`
  `102ef8a10` after the frozen source candidate. That merge touched Fresh/docs/generated corpus
  files only; no workers/core/lock path changed between `e400cd3f9` and the final harness head, so
  the evaluator's product-tree evidence remains exact for this slice.

## Decisions

| Decision                                           | Reason                                                                              | Source                             |
| -------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------- |
| Schema keys are a required subset of emitted keys. | This is the issue's required direction and permits legitimate compiler-only fields. | issue #1875                        |
| Missing optional keys emit as `undefined`.         | Shape parity without duplicated policy/defaults.                                    | core schema + thin-plugin doctrine |

## Drift

| Drift                                                                                  | Severity | Logged in drift.md |
| -------------------------------------------------------------------------------------- | -------- | ------------------ |
| `rtk` is unavailable on this host despite repo guidance.                               | minor    | yes                |
| Fable slice-review primary quota-blocked; Opus low fallback launched.                  | minor    | yes                |
| Formal Fable quota-blocked and GLM fallback unusable; Opus medium completed IMPL-EVAL. | moderate | yes                |

## Gate Results

### Static Gates

| Gate          | Command or check                                                                             | Result | Notes                                           |
| ------------- | -------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------- |
| Plugin check  | `run-deno-check.ts --root plugins/workers --ext ts,tsx --pretty`                             | PASS   | 102 selected; 1 batch; 0 failed; 0 occurrences. |
| Parity test   | `run-deno-test.ts -- --allow-all plugins/workers/tests/cli/registry-compiler-golden_test.ts` | PASS   | 1 passed; 0 failed.                             |
| Plugin lint   | `run-deno-lint.ts --root plugins/workers --ext ts,tsx --pretty`                              | PASS   | 102 selected/processed; 0 findings.             |
| Plugin format | `run-deno-fmt.ts --root plugins/workers --ext ts,tsx --pretty`                               | PASS   | 102 selected/processed; 0 findings.             |
| Lock hygiene  | `git diff --exit-code -- deno.lock`                                                          | PASS   | No lockfile diff.                               |

### Fitness Gates

| Gate             | Result        | Evidence                                                     | Notes                                                                                                                                                              |
| ---------------- | ------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Quality/doctrine | PASS          | `deno task quality:gate`, exit 0                             | Scanner found no violations; doctrine had no failures.                                                                                                             |
| JSR audit        | BASELINE_FAIL | `audit-jsr-package.ts --root plugins/workers --text`, exit 1 | Pre-existing `doctor.ts` module tag, cardinality, and slow-type findings; no export or public-surface change in S1. Existing #1655 debt remains out of scope.      |
| Slice review     | PASS          | Claude Opus 5 low session `9ab1eef0`                         | Confirmed correctness, schema direction, future-key failure, thinness, and scope. Fable primary `bd792425` was quota-blocked before review.                        |
| Formal IMPL-EVAL | PASS          | `evaluate.md`; Claude Opus 5 medium                          | Fresh opposite-family session independently re-ran gates and empirical failure probes against `e400cd3f9`; no blockers. Route deviation is recorded in `drift.md`. |

### Runtime Gates

| Gate                      | Result | Evidence                       | Notes                 |
| ------------------------- | ------ | ------------------------------ | --------------------- |
| Runtime/Aspire/Docker/E2E | N/A    | Owner's explicit gate boundary | Must not run locally. |

### Consumer Gates

| Consumer                  | Result | Evidence                   | Notes                                                                                |
| ------------------------- | ------ | -------------------------- | ------------------------------------------------------------------------------------ |
| Generated registry source | PASS   | Focused golden/parity test | Reads all expected keys from `JobConfigSchema.shape`; fails with named missing keys. |

## Handoff Notes

- Inspect the schema-key derivation first; it must contain no field-name list and no constraints.
- Confirm the five live omissions are visible in both source and golden output.
- Non-blocking reviewer notes: explicit `undefined` values would matter only if a future consumer
  spreads generated definitions over stored definitions; no such merge exists. A separate future
  required `JobDefinition`-only key is outside #1875's `JobConfig` parity contract.
- The supplemental JSR audit remains honest `BASELINE_FAIL`: its pre-existing `doctor.ts`
  module-tag, cardinality, and slow-type findings were not introduced or deepened here. No
  export/public surface changed; this result was not promoted to a false green.
