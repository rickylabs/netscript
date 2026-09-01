# Drift Log: #1351 SDK transport policy

No design or implementation drift from the approved plan has been recorded.

The final `scaffold.runtime` gate failed twice outside the changed surface after 38 passing steps:
Aspire returned `404 NotFound` for the generated Postgres executable during `database.init`.
Cleanup passed and the harness leak reporter found zero survivors. This is recorded as an external
validation blocker, not used to widen #1351 into CLI/Aspire source.

## D — dispatch-time integration merges (evaluator finding 1, recorded at close)

The IMPL-EVAL for #1351 recorded a minor process finding: evaluated head `6a1a001ad` was a **second**
merge of `origin/main` (`7d18ef104`) into the branch, taken by the supervisor at dispatch time so the
evaluator received an up-to-date head. The implementation session's worklog line "no second
integration was taken" was true **of that session** and did not cover the supervisor's merge. Recorded
here rather than left implicit. It introduced no slice content.

A third integration merge was subsequently taken onto main `e938ecd31`, producing head `fb2d124d3`.

**Why the verdict carries across it, proven rather than asserted:**

| Property | Pre-merge | Post-merge | Result |
| --- | --- | --- | --- |
| `packages/sdk` tree | `5db60b947` | `5db60b947` | **byte-identical** |
| `deno.lock` | `23cb256ba` | `23cb256ba` | **byte-identical** |

The incoming delta from main is confined to `.llm/tools/agentic/teardown/*`, `extract-verdict.ts`,
`run-codex-slice-lib_test.ts`, and the `aspire` SKILL mirrors — none of which is slice surface.

**Gates re-derived at the integrated head:**

| Gate | Result |
| --- | --- |
| Zero dependency churn vs `origin/main` | **0** `deno.lock` diff lines, **0** manifest files changed |
| `packages/sdk` type check | `SDK_CHECK_REAL_EXIT=0`; 101 files, 1 batch, 0 failures |

Gate 10 (`scaffold.runtime` E2E) remains the evaluator-judged **EXTERNAL** Aspire `database.init`
`404` for the generated Postgres executable — re-establish at merge readiness; not attributable to
this slice's 26-file footprint, which contains no CLI, Aspire, apphost, scaffold, or workflow source.
