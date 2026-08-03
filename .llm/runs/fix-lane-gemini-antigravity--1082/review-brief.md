use harness

# Slice review: issue #1082 Antigravity documentation route

Perform the harness ordinary slice-review gate as a separate Claude session. This is read-only:
do not edit files, commit, push, or contact GitHub.

Review the working-tree diff against `2d58481e4` in `/home/codex/repos/ns004-lanefix` for exact
compliance with issue #1082. Confirm:

- `documentation_authoring` matches the existing Antigravity `research_extraction` binding shape;
- Gemini is removed from the OpenRouter model/preset configuration;
- the dated lane-policy decision is accurate and explicit about cost;
- the new non-OpenRouter test is meaningful;
- formal evaluator open-model invariants are unchanged, including the preserved named test;
- no unrelated scope or hardcoded volatile model id was introduced.

Read the run plan/worklog and the actual diff. Return either `SLICE_REVIEW: PASS` with concise
evidence or `SLICE_REVIEW: FAIL` with actionable findings.

## SKILL

- `.agents/skills/netscript-harness` — slice review invariant and run evidence.
- `.agents/skills/netscript-tools` — trustworthy gate evidence and git inspection.
- `.agents/skills/rtk` — token-efficient read-heavy git/search commands.
