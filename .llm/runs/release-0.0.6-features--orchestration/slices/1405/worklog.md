# Worklog — #1405 durable producer rejection taxonomy

## Design

### Public surface

- Add exactly `transport-refused` to `StreamWriteUnknownReasonV1`.
- Reuse the existing `producer-stopping` rejection reason during graceful close drain.
- Keep the existing root re-exports; add no entrypoint or export.

### Domain vocabulary and ports

- Closing intent is private supervisor state, visible from `close()` entry until shutdown settles.
- A non-retryable transport failure is a positive refusal; retryable failure at the attempt bound is
  exhaustion.
- Existing transport, clock, random, queue, and lifecycle ports remain unchanged.

### Constants

- No new constant collection is required; the published reason unions remain the finite vocabulary.

### Commit slice

- S1 changes only reason selection and adds deterministic close/refusal/exhaustion tests. Proving
  gates are the focused tests plus the complete gate set named in the slice brief.

### Deferred scope

- No acceptance, delivery, cancellation, retry-count, telemetry-classification, scaffold, #1398,
  merge, or release changes.

### Contributor path

- Start with `producer-contract-v1.ts` for reason vocabulary, then follow supervisor settlement and
  rejection selection into the contract behavior tests.

## Phase status

- `PLAN-EVAL: N/A` — the owner brief and orchestrator research fully specify the two selectors,
  locked vocabulary, negative tests, boundaries, and gates.
- Implementation and generator gates complete on the assigned `light_implementation` lane.
- Separate orchestrator-owned slice review and IMPL-EVAL remain pending.

## Evidence

| Gate | Exit | Result |
| --- | ---: | --- |
| Focused contract behavior | 0 | 8 passed, 0 failed; includes all four new negative tests. |
| Existing telemetry classification guard | 0 | 2 passed, 0 failed. |
| Scoped check wrapper | 0 | 43 files, 1 batch, 0 failures/occurrences. |
| Scoped lint wrapper | 0 | 43 files, 1 batch, 0 occurrences. |
| Scoped format wrapper | 0 | 43 files, 1 batch, 0 findings. |
| Post-format reason grep | 0 | `transport-refused` and `producer-stopping` remain in contract, selector, and tests. |
| `deno task quality:gate` | 0 | `quality:scan` and `arch:check` completed; existing repository warnings only. The configured quality roots omit this package. |
| Explicit target quality scan | 0 | `packages/plugin-streams-core/src`; `findings=[]`, `allowCount=0`. |
| Explicit target doctrine audit | 0 | `FAIL=0 WARN=1 INFO=1`; supervisor is 515 lines versus the 500-line advisory cap, and architecture docs are informationally absent. |
| Full export-map doc lint | 0 | 4 entrypoints; `totalErrors=0`, `totalMissingJSDoc=0`. |
| JSR audit | 0 | dry-run OK; one non-failing slow-types banner warning. |
| Brief's exact `deno test packages/plugin-streams-core` | 1 | 14 passed, 19 failed solely with `NotCapable` because the command omits `--allow-env`. |
| Package-declared `deno task --cwd packages/plugin-streams-core test` | 0 | 33 passed, 0 failed. |

## Reconcile

- #1405 remains the only resolving issue; the draft PR must carry `Closes #1405` and target
  `main`. No #1398 surface was touched.
- No new dependency, export-map key, lint suppression, unsafe cast, `any`, or architecture debt was
  introduced.
