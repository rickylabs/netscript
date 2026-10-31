# Issue 2259 — supervisor

Date: 2026-10-31. Branch: `orch/divybot-6539763986`. Target: `main`.
Baseline: `d25f65b5ead991c372592afb08b13621b5dfda46`.

Owner: issue #2259 operator assignment; coordination: #2474, milestone 0.0.9, group D1.
Implementer: Codex, OpenAI family, requested Sol at xhigh. Feature tier.
No private machine identity, session identifier, or operator location is recorded publicly.

## Writable surface

The initial spike may write only `.llm/runs/orch-divybot-6539763986--2259/**`.
Temporary build output and private evaluator transport output go to the project run storage,
outside Git. Product implementation scope must be declared before any product edits, and only
if the pinned-version masking spike succeeds. `.divybot-goal.md` is never staged.

## Routing

`deno task agentic:matrix --tier feature --json` succeeded against the repository's pinned
Harness matrix. Implementation: sol/xhigh, fallback muse_spark_1_3/xhigh. PLAN-EVAL:
glm_5_3/provider_default, fallback fable_5_1/low. IMPL-EVAL: muse_spark_1_3/xhigh,
fallback opus_5/xhigh. Feature limits: two plan rounds and five implementation rounds.

The owner explicitly overrides both evaluators: “Run PLAN-EVAL before implementing and
IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5
--effort high, read-only, stdin closed, blockers only.” This is the selected route;
the independent evaluator belongs to the Anthropic family. Exact grant is also in worklog.md.

## Operating contract

The dispatcher-supplied leaf profile is authoritative; no repository profiles are loaded.
First verify whether Aspire 13.5.3 can mask composed connection strings. On a negative result,
stop implementation, preserve evidence, and post BLOCKED with options and recommendation.
Do not upgrade Aspire, weaken acceptance, run local scaffold.runtime, change labels or
milestones, merge, tag, or release.
