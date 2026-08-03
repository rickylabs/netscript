use harness

# Slice review: issue #1089 Antigravity prompt argv

Perform the harness ordinary slice-review gate as a separate Claude session. Read-only: do not edit,
commit, push, or mutate GitHub.

Review the uncommitted #1089 diff in `/home/codex/repos/ns004-lanefix` against `HEAD`. Confirm:

- every adapter print invocation omits `--print-timeout`;
- fixed flags precede `--print`, which is the final flag and owns the prompt value;
- `--new-project` and `--dangerously-skip-permissions` are unconditional;
- the native model id is centralized in config, not hardcoded elsewhere;
- stream-JSON parsing extracts only the final response for empirical classification and retains no raw output;
- CLI/API cleanup is coherent and tests are meaningful;
- #1082 routing work remains untouched;
- the recorded live/evidence/full-suite/lint/fmt artefacts support the claims.

Return `SLICE_REVIEW: PASS` or actionable findings.

## SKILL

- `.agents/skills/netscript-harness` — slice review and drift requirements.
- `.agents/skills/netscript-tools` — validation evidence and lock hygiene.
- `.agents/skills/netscript-pr` — combined PR/close-gate requirements.
- `.agents/skills/rtk` — read-heavy inspection.
