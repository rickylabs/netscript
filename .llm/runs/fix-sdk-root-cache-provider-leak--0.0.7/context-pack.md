# Context Pack: SDK root cache-provider isolation

## Run Metadata

| Field          | Value                                     |
| -------------- | ----------------------------------------- |
| Run ID         | `fix-sdk-root-cache-provider-leak--0.0.7` |
| Branch         | `fix/sdk-root-cache-provider-leak`        |
| Current phase  | `plan-eval` handoff                       |
| Archetype      | `2 — Integration`                         |
| Scope overlays | none                                      |

## Current state

S1 research/design is complete against `origin/main` `13878a80a50c55b9662099fed64555f2310ae4a3`. The
chosen design performs all three issue moves: add a focused `./presets` entry, remove the cache
adapter/provider from the root and make the cache entry pure, and register `cacheQuery` explicitly
inside `defineFreshApp()`. The design and complete path ceiling are locked in `plan.md`. No test or
product file has been written.

PLAN-EVAL is mandatory. This implementation thread stops after the S1 plan commit/push/PR handoff.

## Completed

- Read all requested skills and relevant harness/doctrine authorities.
- Verified branch/base/no-upstream and clean starting state.
- Used `deno doc` before focused source reads.
- Verified the root → cache barrel → provider → query factory → dynamic KV source chain.
- Fetched the current issue acceptance text without editing it.
- Selected Archetype 2 / Keep and named layering/fitness rules.
- Compared all three design moves for dominance.
- Declared the compatibility break and migration owner.
- Locked the product/proof ceiling and generated-derivative cascade.
- Measured current doc-lint and JSR audit negatives.

## In progress

- Separate PLAN-EVAL handoff by the fixes-lane coordinator.

## Next steps

1. Coordinator launches a fresh native opposite-family PLAN-EVAL session.
2. If verdict is `FAIL_PLAN`, amend S1 only and resubmit (two-cycle harness limit).
3. If verdict is `PASS`, authorize S2: add the browser-shaped failing test alone, record
   exit/counts, commit/push/comment before any product change.
4. Do not start S3 until S2 is committed and its exact red is on record.

## Key decisions

| Decision                    | Source                                       | Notes                                                       |
| --------------------------- | -------------------------------------------- | ----------------------------------------------------------- |
| All three issue moves       | `research.md` / `plan.md` D1                 | Combined choice is not dominated by any single alternative. |
| Remove root cache re-export | `plan.md` D2                                 | Purity alone would retain the server KV adapter edge.       |
| Curated `./presets` entry   | JSR/doc-lint baseline                        | Direct file has 10 private refs.                            |
| Fresh explicit registration | Doctrine composition root + issue acceptance | Custom servers migrate explicitly.                          |
| Migration note required     | Compatibility analysis                       | README/site/PR, no new SDK changelog convention.            |

## Files changed in S1

| Path                                                                | Status | Notes                                                                         |
| ------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------- |
| `.llm/runs/fix-sdk-root-cache-provider-leak--0.0.7/supervisor.md`   | new    | Run identity without prohibited session/thread ids.                           |
| `.llm/runs/fix-sdk-root-cache-provider-leak--0.0.7/research.md`     | new    | Current facts, doctrine, alternatives, compatibility, JSR/generated findings. |
| `.llm/runs/fix-sdk-root-cache-provider-leak--0.0.7/plan.md`         | new    | Locked design, ceiling, slices, and gates.                                    |
| `.llm/runs/fix-sdk-root-cache-provider-leak--0.0.7/worklog.md`      | new    | Design checkpoint and baseline evidence.                                      |
| `.llm/runs/fix-sdk-root-cache-provider-leak--0.0.7/context-pack.md` | new    | Resumable PLAN-EVAL handoff.                                                  |
| `.llm/runs/fix-sdk-root-cache-provider-leak--0.0.7/drift.md`        | new    | Append-only drift log; no material drift in S1.                               |

## Gates

| Gate family             | Current status    | Evidence                                                                                     |
| ----------------------- | ----------------- | -------------------------------------------------------------------------------------------- |
| Research/currentness    | PASS              | Base/source/issue and `deno doc` verification in `research.md`.                              |
| Plan-Gate               | PENDING           | Mandatory separate PLAN-EVAL; no implementation authorized.                                  |
| JSR surface scan        | BASELINE RECORDED | Audit exit 0 with two warnings; full doc-lint and direct preset entry are measured negative. |
| Static/runtime/consumer | NOT RUN           | No product/test changes in S1.                                                               |

## Open questions

None in the author plan. The evaluator may return adversarial findings.

## Drift and debt

- Drift: none; RTK executable unavailable, so focused raw reads were used.
- Debt: none created or closed. Existing SDK cardinality/private-ref/slow-type findings remain
  measured baselines.

## Commits

- See the draft PR commit list + phase comments after the S1 plan commit is pushed.
