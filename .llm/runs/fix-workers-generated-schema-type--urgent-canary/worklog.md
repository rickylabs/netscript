# Worklog

## Design

Public surface: generated worker registry and compile-registry command, using workers-core JobPayloadSchema/RegisterJobInput. Domain: literal handler schemas and normalized job policy. Ports: existing ProjectFiles seam. Constants: existing source-kind and policy vocabularies. Slices: bootstrap/evidence, then separate evaluator/final evidence. Contributor path: workers CLI generator/compiler and corresponding CLI tests. Deferred scope: other plugin behavior.

## Phases

1. Bootstrap: clean clone reused after fetch; published branch selected.
2. Research: main already integrated; issue contract and focused source inspected.
3. Plan & Design: bounded evidence refresh recorded above.
4. Plan-Gate: PLAN-EVAL N/A, mechanical validation of carried-in implementation.
5. Implement: no new implementation required yet.
6. Gate: pending focused refresh; Docker preflight exit 1.
7. Evaluate: mandatory separate-vendor launch pending.
8. Release: N/A, no release cut or merge.
9. Close: pending gate/evaluator outcome.

Owner directive: run headless opencode run -m opencode-go/glm-5.3-flash --variant max --auto; fallback agy --model gemini-3.8-flash-high. This overrides evaluator matrix routing for this run; independence remains mandatory.

## Gate results

| Gate | Exit | Evidence |
| --- | --- | --- |
| Focused generator and compiler wrapper | 0 | 11 tests pass; literal consumer fixtures and policy doctor assertions executed |
| Workers test directory wrapper | 0 | 38 tests pass |
| Scoped CLI check wrapper | 0 | 18 TypeScript files selected; no findings |
| Scoped CLI lint wrapper | 0 | no findings |
| Scoped CLI format wrapper | 0 | no findings |
| quality:gate | 0 | quality:scan and arch:check both pass |
| Workers JSR audit | 1 | doctor.ts missing module tag, also present on current main |
| Local Docker preflight | 1 | daemon unavailable |
| CI scaffold runtime | pending | Opted in via e2e-cli-gate; workflow 37679143081 |

The earlier new compiler-policy regression mutation has recorded exit 1 with project-policy loading disabled and exit 0 after restoration. This refresh adds no tests.

## Acceptance evidence

| Requirement | Evidence |
| --- | --- |
| Real payload schema contract | generated registry consumer fixture checks against workers-core RegisterJobInput and JobPayloadSchema |
| Exact literal payload inference | GeneratedJobPayloadMap equality assertions and negative type expectations in runtime-registry-generator_test.ts |
| Contract composition | Both generator/compiler fixtures invoke createWorkersContract with the generated map |
| Doctor accepts supported forms | Generator-backed fixtures inspect doctor checks for local, configured local, configured plugin and plugin handlers |
| Compiler preserves policy | Grouped policy fixture verifies configured ID and scheduling/retry/concurrency settings and grouped precedence |

No new acceptance boxes were added or marked; both issue bodies express their requirements as prose. Current-head CI and independent evaluator remain required.

Reconcile: exact implementation-head CI runtime workflow 37679143081 is green across all scaffold tiers. quality is red only at audit-critical; no worker test failure or unanswered review thread remains.

## Final disposition

IMPL-EVAL FAIL_FIX at 6a8a4de3e00d09237e0b3bbc1664f9a7c40afbe7, independent GLM 5.3 Flash session <session>, requested/observed OpenCode Go max. Evaluator confirms both issue contracts complete. Its runtime snapshot predates the completed green CI runtime workflow linked in ci-evidence.md. F2 remains: critical proxy-addr dependency audit is red; evaluator requires separate dependency maintenance, outside the one-PR-per-item brief. Stop item for owner dependency-maintenance decision; no audit bypass, new dependency PR, merge or readiness claim. F3 folder-cardinality advisory is preserved for owner review, with no debt accepted.

6. Gate: worker/consumer/static gates pass; runtime CI passes; audit-critical fails.
7. Evaluate: separate-vendor FAIL_FIX recorded; no self-certification.
8. Release: N/A, no merge or cut.
9. Close: owner decision required; proceed to the next item as directed.

Supervisor provenance correction: the evaluator temporarily created and removed a baseline worktree, and restored the transient import caused by the supervisor dependency probe. These are validation-state changes, despite its opening read-only statement. No product source change survived. The isolated native patched resolution is retained outside git for a possible owner-authorized maintenance lane.
