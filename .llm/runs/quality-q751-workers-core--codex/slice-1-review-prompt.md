use harness

Review Slice 1 of NetScript #751 in `/home/codex/repos/ns-q751-workers-core-h`. This is a substantive pre-commit slice review of GPT-authored implementation, not PLAN-EVAL or final IMPL-EVAL. Do not edit source.

## SKILL

Read `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/netscript-doctrine/SKILL.md`, `.agents/skills/jsr-audit/SKILL.md`, and `.agents/skills/netscript-tools/SKILL.md`. Read the run plan/design and inspect the current diff for Slice 1 (`src/config/*`, `src/contracts/v1/*`, `src/streams/*`).

Verify: no cast/suppression loophole; Zod input/output/default variance is sound; oRPC base-error runtime narrowing preserves schemas; stream schema/entity/producer types stay correlated; isolated declarations and public compatibility are credible; targeted check/tests/scanner evidence is sufficient. Run read-only checks if useful. Write `.llm/runs/quality-q751-workers-core--codex/slice-1-review.md` with `PASS` or `FAIL_FIX` and concrete evidence/findings. Owner prohibited PRs. Your only write is the review file.
