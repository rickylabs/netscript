# Context Pack: #1709 lint/fmt partial-exclusion fail-closed

## Run Metadata

| Field          | Value                                                                              |
| -------------- | ---------------------------------------------------------------------------------- |
| Run ID         | `release-0.0.7-internals--orchestration/slices/lint-partial-exclusion-fail-closed` |
| Branch         | `fix/lint-partial-exclusion-fail-closed`                                           |
| Current phase  | amended plan; fresh independent PLAN-EVAL pending; implementation blocked          |
| Archetype      | `6-cli-tooling`                                                                    |
| Scope overlays | none                                                                               |
| Thread         | `01a047f0-f17e-7692-b6f0-83a6d22888c9`                                             |
| Baseline       | `cf648f1ff973d74c213bb125a6f5f5b9328e693b`                                         |

## Current state

The coordinator accepted the mandatory fmt audit's evidence-triggered rescope.
The plan envelope is exactly six implementation paths: lint/fmt wrappers and
focused tests, `deno.json`, and canonical lint-driven
`agent-tools.generated.ts`. No repository source has been changed.

One common selected-vs-processed coverage contract applies to both reports. The
adapters and later implementation slices are separate because the signals
differ: lint clean/diagnostic runs terminate in `Checked N file(s)`; fmt check
findings terminate in `Found M not formatted file(s) in N file(s)`, while fmt
clean/write runs use `Checked N`. Both adapters feed identical `coverage` JSON
keys and refusal causes. Mismatch-only per-file probes identify dropped paths
and never supply diagnostics.

PLAN-EVAL remains required and unperformed by the author. The supervisor must
evaluate the exact committed/pushed amended plan head in a fresh Tier-A session
before any later implementation authorization.

## Completed

- Re-read the accepted six-path rescope brief, required skills, harness
  workflow, and plan gate.
- Preserved the exact `cf648f1ff` re-baseline and prior lint/root-count
  evidence.
- Promoted the fmt defect from deferred escalation to first-class in-scope
  research.
- Proved raw fmt signal forms for clean, dirty, mixed included, partial
  excluded, all-excluded, and write cases; established that lint/fmt adapters
  differ.
- Locked one coverage wire contract, common cause vocabulary, symmetrical
  refusal output, diagnostics-once rule, and batch-size invariant across both
  wrappers.
- Ordered S1 doctor correction before separate S2 lint and S3 fmt guards,
  followed by S4 lint-only canonical asset regeneration.
- Kept the frozen proving-gate set and all explicit N/A surfaces unchanged.

## In progress

- Commit/push/PR record for the amended plan, followed by independent PLAN-EVAL
  handoff.

## Next steps

1. Supervisor performs fresh independent Tier-A PLAN-EVAL on the reported
   amended plan head.
2. If and only if verdict is `PASS`, coordinator separately authorizes
   implementation.
3. Later implement S1 → S2 → S3 → S4, with named gates, supervisor review,
   commit/push, and phase evidence per slice.
4. Stop and rescope if any seventh implementation path becomes necessary.

## Key decisions

| Decision                                                       | Source                | Notes                                                     |
| -------------------------------------------------------------- | --------------------- | --------------------------------------------------------- |
| Any silently dropped selected lint or fmt file forces exit 2.  | coordinator           | Report-only green rejected.                               |
| One common coverage object/cause set applies to both wrappers. | amended plan          | Tool-specific adapters cannot redefine coverage.          |
| Lint and fmt adapters/slices are separate and ordered.         | executed raw controls | Signals differ; evidence decides the split.               |
| Doctor task exclusion is removed first.                        | frozen sequencing     | Expected `2037 → 2041`; malformed sibling remains hidden. |
| Generated text/hash and publish gates are lint-only.           | settled rescope brief | Fmt absent from consumer manifest.                        |
| Generated asset uses canonical task only.                      | asset contract        | Idempotent, one-file generated delta.                     |

## Files changed

Current turn: only permitted leaf harness artifacts. The later implementation
surface is exactly the six paths listed in `plan.md`; no seventh path is
authorized.

## Gates

| Gate family                   | Current status                                              | Evidence / bound                                                         |
| ----------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------ |
| Plan gate                     | READY FOR FRESH INDEPENDENT EVALUATION after amendment push | `research.md`, `plan.md`, `worklog.md` Design section                    |
| Frozen proving gates          | NOT_RUN for implementation                                  | `check`, `test`, `publish-dry-run`, `quality-job`, `check:assets-barrel` |
| Behavioral controls           | RED/signal baselines captured                               | lint+fmt mixed default vs batch-size-1; raw completion forms             |
| Quality                       | NOT_RUN for implementation                                  | must retain `allowCount: 7`                                              |
| Consumer/publish              | baseline captured; after-state NOT_RUN                      | lint-only CLI audit baseline 19 WARN; fmt no publish consequence         |
| Runtime/E2E/docs-site/MCP JSR | N/A                                                         | explicitly excluded; no evaluator/runtime lease                          |

## Open questions

- Must resolve now: none.
- Safe to defer: local helper/type names only.

## Drift and debt

- Drift: fmt analogue discovered under mandatory audit, then explicitly accepted
  as a significant six-path rescope; both entries are append-only in `drift.md`.
- Debt: no new architecture debt planned; existing CLI warnings/doc debt remain
  baseline.

## Commits

- Original four-path plan head: `f01c1fb593312926d24ad226c45a25f206d772db`.
- Amended six-path plan head: pending commit/push in this turn.
- Draft PR #1710 commit list and phase comments are the durable trail. No
  implementation commit exists.
