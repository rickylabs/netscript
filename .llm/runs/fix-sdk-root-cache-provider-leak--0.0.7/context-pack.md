# Context Pack: SDK root cache-provider isolation

## Run Metadata

| Field          | Value                                     |
| -------------- | ----------------------------------------- |
| Run ID         | `fix-sdk-root-cache-provider-leak--0.0.7` |
| Branch         | `fix/sdk-root-cache-provider-leak`        |
| Current phase  | revised `plan-eval` cycle 2 handoff       |
| Archetype      | `2 — Integration`                         |
| Scope overlays | none                                      |

## Current state

S1 research/design remains against `origin/main` `13878a80a50c55b9662099fed64555f2310ae4a3`.
PLAN-EVAL cycle 1 returned `FAIL_PLAN` at `1bf9c567`: the archetype, doctrine, three-move design,
compatibility analysis, and ceiling discipline were accepted, while six measurement findings
required revision. The revised plan keeps that design and locks an executable intact-runtime red, a
committed graph assertion, a finite curated-entry closure, an order-independent Fresh test, the four
affected site pages, and the full agent-docs/publish derivative chain. No test or product file has
been written.

PLAN-EVAL remains mandatory. This implementation thread stops after the revised S1 plan
commit/push/PR handoff for cycle 2.

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
- Recorded PLAN-EVAL cycle 1 `FAIL_PLAN` and repaired F1-F7 in the plan artifacts only.
- Proved this host can run the Lume corpus gate: `check:agent-docs-prose` exit 0, 638 files built,
  rendered output OK, corpus fresh.
- Added the three omitted published guidance pages and both `.llm/assets/agent-docs/*` outputs to
  the locked ceiling.

## In progress

- Separate PLAN-EVAL cycle 2 handoff by the fixes-lane coordinator.

## Next steps

1. Coordinator launches PLAN-EVAL cycle 2 in a separate session against the revised plan commit.
2. If verdict is `PASS`, authorize S2: add the intact-runtime failing test plus its later graph
   assertion alone, record exit/counts and the observed boolean mismatch, then commit/push/comment
   before any product change.
3. If cycle 2 does not pass, stop and escalate; the two-cycle harness limit is exhausted.
4. Do not start S3 until S2 is committed and its exact red is on record.

## Key decisions

| Decision                    | Source                                       | Notes                                                         |
| --------------------------- | -------------------------------------------- | ------------------------------------------------------------- |
| All three issue moves       | `research.md` / `plan.md` D1                 | Combined choice is not dominated by any single alternative.   |
| Remove root cache re-export | `plan.md` D2                                 | Purity alone would retain the server KV adapter edge.         |
| Curated `./presets` entry   | JSR/doc-lint + cycle-1 measurement           | Explicit type-only ports enumeration minus `QueryClientPort`. |
| Fresh explicit registration | Doctrine composition root + issue acceptance | Custom servers migrate explicitly.                            |
| Migration note required     | Compatibility analysis                       | README + four site pages + PR; no new changelog convention.   |
| Corpus cascade              | Tool source + host run                       | Site -> agent-docs pair -> publish assets; host is capable.   |

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

| Gate family             | Current status                | Evidence                                                                                     |
| ----------------------- | ----------------------------- | -------------------------------------------------------------------------------------------- |
| Research/currentness    | PASS                          | Base/source/issue and `deno doc` verification in `research.md`.                              |
| Plan-Gate               | CYCLE 1 FAIL; CYCLE 2 PENDING | Six measurement repairs incorporated; no implementation authorized.                          |
| JSR surface scan        | BASELINE RECORDED             | Audit exit 0 with two warnings; full doc-lint and direct preset entry are measured negative. |
| Agent-docs host         | PASS                          | `check:agent-docs-prose` exit 0; 638-file Lume build; corpus `fresh: true`.                  |
| Static/runtime/consumer | NOT RUN                       | No product/test changes in S1.                                                               |

## Open questions

None in the revised author plan. Cycle 2 must independently verify the repairs.

## Drift and debt

- Drift: cycle 1 exposed an invalid Deno-global test shape and an incomplete generated-doc cascade;
  both are corrected without product rescope. RTK remains unavailable, so focused raw reads were
  used.
- Debt: none created or closed. Existing SDK cardinality/private-ref/slow-type findings remain
  measured baselines.
- Follow-up reference: PLAN-EVAL cycle 1 F9's neighbouring Fresh-root cache edge remains
  coordinator-owned and outside this leaf.

## Commits

- Initial plan: `1bf9c567` (`FAIL_PLAN` cycle 1). See the draft PR commit list + phase comments for
  the revised S1 commit and cycle-2 handoff.
