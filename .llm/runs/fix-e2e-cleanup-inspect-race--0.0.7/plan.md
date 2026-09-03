# Plan: cleanup container-inspect removal race

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-e2e-cleanup-inspect-race--0.0.7` |
| Branch | `fix/e2e-cleanup-inspect-race` |
| Phase | `plan` |
| Target | `packages/cli/e2e` cleanup evidence |
| Archetype | `6 — CLI / Tooling` (parent package) |
| Scope overlays | `none` |

## Archetype

Archetype 6 applies because the parent package ships the NetScript CLI and owns this nested E2E
harness. This slice changes only an internal runtime-evidence probe. It does not alter CLI
presentation, application composition, public exports, scaffold output, or consumer contracts.

## Current Doctrine Verdict

`packages/cli`: **Keep** — preserve the Archetype-6 kernel/surface split. The nested E2E workspace
is intentionally excluded from the top-level doctrine-root denominator, while its new code still
observes A8/A13/A14 and the test-shape rules.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A8 | Keep the regression colocated with the evidence unit and the production change focused. |
| A13 | Distinguish the expected teardown terminal state from genuine Docker inspection failures. |
| A14 | Prove the race RED before the behavior change and preserve an exact GREEN regression. |

## Goal

Treat a container that vanishes between Docker list and inspect as an already-removed cleanup
observation, retain its id in the receipt, and preserve failure for every other inspect error.

## Scope

- Add an injectable runner seam to the internal `inspectAllContainers` probe.
- Add a unit regression that reproduces list-present/inspect-absent behavior.
- Add an additive `docker.vanishedContainerIds` receipt field aggregated across probes.
- Add a negative regression proving unrelated inspect failures still throw.

## Non-Scope

- No timeout, retry-wait, or gate-budget changes.
- No local Aspire/DCP runtime execution; hosted runtime tiers own that acceptance evidence.
- No CLI public surface, generated project, dependency, lockfile, or `.llm/tmp/pwcli/` changes.
- No refactor of the existing cleanup retry flow or unrelated architecture debt.

## Hidden Scope

- The receipt must aggregate ids from every container inspection, not merely the final probe, or an
  earlier removal observation can disappear from the evidence.
- Error matching must bind `No such object` to the id currently being inspected; a different
  inspect failure remains fatal.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Match only `No such object: <current id>` in the failed inspect transcript. | Avoids swallowing daemon, permission, connectivity, or malformed-output failures. |
| D2 | Add `docker.vanishedContainerIds` while retaining `docker.ids` and `docker.containers`. | Additive and backward compatible; the field names the required evidence directly. |
| D3 | Aggregate vanished ids in insertion order with a `Set`. | Multiple probes may observe the same id; receipts should be complete without duplicates. |
| D4 | Inject only the command runner into `inspectAllContainers`. | This is the smallest seam that deterministically reproduces the TOCTOU race without Docker. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Receipt field location/name | resolved now | Locked as `docker.vanishedContainerIds`. |
| Error predicate breadth | resolved now | Same-id `No such object` only. |
| Hosted tier execution | safe to defer | CI-hosted tiers run after push; local runtime is explicitly forbidden. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| A broad string match hides a genuine Docker failure. | Require the current id after `No such object:` and test a different exit-1 error. |
| A vanished id is lost during a later successful probe. | Aggregate every inspection result into one ordered set used by the receipt. |
| Receipt consumers break. | Preserve every existing field and add only one array field. |
| Scope expands into cleanup timing. | Diff-check all timeout/budget constants against the baseline. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-10 | risk | Catch only the expected same-id removal outcome; rethrow all other command failures. |
| AP-18 | avoided | Assert semantic result fields and thrown error behavior, not a whole receipt snapshot. |
| AP-25 | existing edge | Keep Docker process execution inside the established cleanup evidence edge; only inject it for tests. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-10 | yes | Focused semantic regression tests remain small and pass. |
| F-19 | yes | Structured scoped check/test/lint/fmt wrappers over touched TypeScript. |
| Archetype 6 structural gates | manual/no-change | Diff introduces no CLI surface, composition, folder-cardinality, or generated-output change. |
| `quality:gate` | yes | Required repository code-quality/doctrine gate for `packages/**` changes. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `scaffold-runtime-a8-f16-1333` | none | Existing registry/gate-directory debt is not touched or deepened. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | RED | `run-gate.ts --gate test -- .../evidence/cleanup_test.ts` | Nonzero on vanished-container assertion before S2. |
| 2 | Focused tests | Structured test wrapper over cleanup regression and existing cleanup-evidence tests. | PASS. |
| 3 | Scoped static | Structured check/lint/fmt wrappers over the touched evidence/test files. | PASS. |
| 4 | Receipt parity | `deno task check:aspire-version-parity` through `run-gate.ts`. | PASS because a receipt field is added. |
| 5 | Doctrine/quality | `deno task quality:gate` through `run-gate.ts`. | PASS or only unchanged accepted debt. |
| 6 | Diff guards | Baseline diff search for timeout/budget/lock/pwcli changes. | No prohibited delta. |
| 7 | Hosted runtime | Both hosted `scaffold.runtime` tiers at the fix head. | PASS in CI; no local Aspire runtime. |

## Risks

- Hosted tiers are the only runtime proof; readiness for merge depends on their fix-head results.

## Dependencies

- Docker command transcript semantics already captured by the E2E harness.
- Separate native Claude/Fable evaluator after S1–S3.

## Drift Watch

- Any need to change retry waits, gate timeouts, runtime registry, receipt consumers, or files
  outside the ceiling requires rescope rather than silent expansion.
