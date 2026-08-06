use harness

## SKILL

- `netscript-harness` — enforce the final evaluator protocol and no-self-certification rule.
- `netscript-tools` — run scoped repository verification and raw Git checks.
- `netscript-pr` — verify issue/PR acceptance evidence without merging.
- `rtk` — use repository-standard read-heavy wrappers where available.

You are the separate local IMPL-EVAL session for run
`chore-qwen-3-8-evaluator--1331`, PR #1336, issue #1331. You are running through OpenRouter as
`qwen/qwen3.8-max`, the owner-confirmed canonical IMPL-EVAL model. You are distinct from the Codex
generator and from the Minimax PLAN-EVAL session. Do not implement, edit, commit, push, merge, or
publish.

Read the governing evaluator protocol, verdict definitions, plan, `plan-eval.md`, research,
worklog, context pack, drift, supervisor record, S1–S3 evidence/reviews, and the full PR diff.
Verify independently that:

- PLAN-EVAL canonically resolves to `minimax/minimax-m3`;
- IMPL-EVAL canonically resolves to `qwen/qwen3.8-max`;
- stale Qwen 3.7 and cross-phase evaluator preset/route use are rejected;
- requested and observed model/preset identity are enforced;
- focused and full tests, scoped check/lint/fmt, static and exact-model live canaries are credible;
- canonical skills were edited before generated Claude mirrors and synchronization is clean;
- documentation consistently states the phase-specific defaults;
- every remaining Qwen 3.7 occurrence is explicit rejection or immutable historical evidence;
- no package/plugin surface or unrelated `deno.lock` change entered the branch;
- issue #1331 acceptance and PR #1336 evidence are complete enough for merge after this verdict.

Run any bounded read-only checks needed to spot-check the evidence. Return a complete `evaluate.md`
body using the repository template and exactly one formal IMPL-EVAL verdict. Do not modify files:
emit the proposed artifact on stdout so the supervisor can record it verbatim with evaluator
session/model provenance.
