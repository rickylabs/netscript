# 2026-08-08 — Fable 5 remediation roadmap seed run (session record)

Run: `.llm/runs/plan-fable5-remediation-roadmap--seed/` · PR #1347 (draft, never merges itself)
· branch `plan/fable5-remediation-roadmap` · baseline `fac9e339042c` (unchanged at lock).

One-session planning-only seed run (Fable 5 · high supervisor; PLAN-EVAL/IMPL-EVAL owner-waived;
Claude Workflows with 25 Opus 5 research/drafting subagents across 3 pre-committed workflow
scripts, 0 errors, ~3.8M subagent tokens). Produced the complete long-range remediation plan
under `fable-5-remediation-plan/`: 19-artifact cited corpus, synthesis, master plan with a
12-fork owner sweep, milestone train (two inserted milestones via house rename), 41 issue
drafts in three milestone directories, RFC-A/RFC-B drafts, 16 amendment blocks, Wave-7 design,
implementation handoff. Zero GitHub board mutation; owner ratifies filing later.

Lessons worth promoting (candidates, not promoted here): (1) drafting agents that re-verify
corpus claims at source caught six corrections a prose-only pass would have shipped; (2) the
"commit workflow scripts before execution" rule made a 25-agent run auditable from the PR alone.
