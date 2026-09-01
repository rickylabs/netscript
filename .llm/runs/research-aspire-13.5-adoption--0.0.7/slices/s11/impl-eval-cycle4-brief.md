use harness

## SKILL

- `netscript-harness` — IMPL-EVAL protocol, verdict format, evidence rules.
- `rtk` — prefix read-heavy git/grep with `rtk`.

## ROLE

INDEPENDENT IMPL-EVAL agent. Verdict only; do not edit files.

Repo: /home/agent/projects/netscript/worktrees/007-aspire-s11 (read-only)
PR #1771, branch docs/aspire-13-5-s11-public-docs-refresh, head 38e4f9d9c.

Delta cycle 4, NARROW. Cycle 3 marked F1/F2/F3 FIXED and raised exactly one new finding:

F4: the PRIMARY snippet in docs/site/orchestration-runtime/how-to/detached-start-agents-ci.md
    ran `set +x` and never restored, leaving a copier's xtrace off permanently, while the
    rule illustration did restore — an inconsistency and a side effect on copyable code.

Claimed repair: both snippets now save the caller's state with
`case $- in *x*) xtrace_was_on=1 ;; esac` and restore with
`if [ -n "${xtrace_was_on:-}" ]; then set -x; fi` after `unset DASHBOARD_URL`.
The `if` form was chosen deliberately over `[ … ] && set -x`, which returns non-zero as a
script's last line and would fail a `set -e` job when tracing was off.

Evaluate ONLY:
1. Is F4 fixed in BOTH the primary snippet and the rule illustration?
2. Replay each snippet empirically with a fake `aspire` on PATH emitting a token-bearing
   dashboardUrl, under BOTH caller states (xtrace on, xtrace off), with `set -e` active.
   For each: token appearances in the trace (expect 0), xtrace state afterwards (expect
   identical to the caller's original), and that the block does not abort under `set -e`.
3. Did this repair introduce any new defect?

Do NOT re-litigate F1/F2/F3 or expand scope to the rest of the PR.
Run: deno test --allow-all .llm/tools/docs/check-accuracy-and-discoverability_test.ts

Output STRICT JSONL, last line the verdict:
{"finding":"F4","status":"FIXED|NOT_FIXED","evidence":"..."}
{"verdict":"PASS|FAIL_IMPL","summary":"..."}
Ground every claim in a command you actually ran, with its output.
