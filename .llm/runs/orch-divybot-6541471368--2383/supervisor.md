# Saga compensation persistence — #2383

Date: 2026-10-31. Branch: `orch/divybot-6541471368`. Baseline: `f6839463668c5dae4ca7234d26909e74e10b89c0`.
Implementation: OpenAI Codex, feature tier, owner-requested high effort.
Coordinator: #2474, mc009e, B1. Implementer owns this leaf; coordinator owns merge and release.

## Declared write surface

- `packages/plugin-sagas-core/` compensation engine and tests, existing transition-commit contracts if necessary.
- `plugins/sagas/` store adapters, tests, and store guarantee documentation.
- `.llm/runs/orch-divybot-6541471368--2383/` tracked plan, evidence, memory and evaluator summaries.
- Excluded assignment/report handoff files only for operator delivery; never commit them.

No dependencies, lockfile, scheduling/cascaded-effects work, labels or milestones.
Public evidence uses repository-relative paths and omits machine identity and evaluator session ids.

## Route

Resolved through `deno task agentic:matrix --tier feature --json` before implementation.
Matrix implementation primary `sol` xhigh; declared fallback `muse_spark_1_3` xhigh.
Matrix plan-evaluation `glm_5_3` provider default, then `fable_5_1` low.
Matrix implementation-evaluation `muse_spark_1_3` xhigh, then `opus_5` xhigh.
Owner override, verbatim: “Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only.”
Use the owner-specified separate Anthropic evaluator, preserve its session between rounds, maximum 2 plan rounds / 5 implementation rounds, and stop on two consecutive terminal failures. Final evaluation must attest the exact pushed head.


## CI repair scope extension

Owner follow-up authorizes diagnosing and fixing the red scaffold-runtime check, then pushing. Extend this run's write surface to `.llm/tools/e2e/prepull-runtime-images.ts` and its existing `_test.ts` for prerequisite preparation. Keep generated product source, workflow gate policies, labels and milestones unchanged. Reuse the same evaluator session; selected PLAN-EVAL round 2 precedes this CI preparation edit; remaining IMPL-EVAL rounds 4 and 5 cover repair sign-off and final pushed head.
