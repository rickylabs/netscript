# Context Pack: SDK root cache-provider isolation

## Run Metadata

| Field          | Value                                     |
| -------------- | ----------------------------------------- |
| Run ID         | `fix-sdk-root-cache-provider-leak--0.0.7` |
| Branch         | `fix/sdk-root-cache-provider-leak`        |
| Current phase  | S2 red-before handoff                     |
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

PLAN-EVAL cycle 2 returned `PASS_PLAN` at plan commit `9a0f5876`, authorizing implementation. S2 now
contains only the new regression test plus run evidence. Its intact-runtime fresh child imports the
root `defineServices`, then observes `hasCacheProvider() === true`; the structured runner exits 1
with 0 passed and 1 failed. The failure is the product defect, not an unrelated runtime crash.

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
- Received PLAN-EVAL cycle 2 `PASS_PLAN`.
- Added the S2 red-before test without changing product code.
- Recorded structured RED: exit 1, 0 passed / 1 failed, observed provider `true`.
- Embedded the final graph assertion in that test: both root and presets must exclude resolved KV,
  logger, every `node:` module, raw `@netscript/kv`, and raw `node:` dependencies.

## In progress

- S2 commit/push/comment checkpoint.

## Next steps

1. Commit and push S2, then post its structured PR comment before any product edit.
2. Implement S3 strictly inside the locked ceiling.
3. Run the focused regression green and the whole SDK test directory, plus the order-independent
   Fresh registration child test.
4. Run the locked docs/export/generated cascade in order and record measured negatives as such.
5. Prove `deno.lock` unchanged with raw Git before the S3 checkpoint.

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

| Gate family          | Current status     | Evidence                                                                                     |
| -------------------- | ------------------ | -------------------------------------------------------------------------------------------- |
| Research/currentness | PASS               | Base/source/issue and `deno doc` verification in `research.md`.                              |
| Plan-Gate            | PASS_PLAN          | Cycle 2 independently measured the revised plan sufficient.                                  |
| JSR surface scan     | BASELINE RECORDED  | Audit exit 0 with two warnings; full doc-lint and direct preset entry are measured negative. |
| Agent-docs host      | PASS               | `check:agent-docs-prose` exit 0; 638-file Lume build; corpus `fresh: true`.                  |
| S2 behavioral red    | EXPECTED RED       | Structured exit 1; 0 passed / 1 failed; root provider observed `true`.                       |
| S2 graph assertion   | COMMITTED, DORMANT | Runs after the behavioral assertion turns green in S3.                                       |

## Open questions

None. S3 follows the locked plan and evaluator refinements M1-M3.

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
