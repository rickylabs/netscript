use harness

## SKILL

- `netscript-harness` — IMPL-EVAL protocol, verdict format, evidence rules.

## ROLE

INDEPENDENT IMPL-EVAL agent. Verdict only; do not edit files.

Repo: /home/agent/projects/netscript/worktrees/007-aspire-s11 (read-only)
PR #1771, head 503a90b9e.

Delta cycle 5, NARROW — one finding only.

Cycle 4 marked F4 FIXED and raised F5: neither snippet cleared `xtrace_was_on`, so a
second invocation in the same shell inherited the first call's flag and enabled tracing
for a caller that had it off (`second_initial=off second_final=on`).

Claimed repair: both snippets now assign `xtrace_was_on=` BEFORE sampling `$-`, i.e.
`xtrace_was_on=; case $- in *x*) xtrace_was_on=1 ;; esac`. Reset-before-sample was chosen
over unset-after-restore because the latter leaves the stale flag whenever the block exits
early, and reset-first also ignores an inherited environment value.

Evaluate ONLY:
1. Is F5 fixed in BOTH the primary snippet and the rule illustration? Replay each block
   twice in one shell under `set -e`: first call with tracing ON, second with tracing OFF.
   Expect first ends on, second ends off, zero token appearances in either, block completes.
2. Also confirm the single-invocation properties from cycle 4 still hold (fresh caller on
   and off, 0 leaks, correct final state, no `set -e` abort).
3. Did this repair introduce any new defect?

Do NOT re-litigate F1-F4 or expand scope to the rest of the PR.
Run: deno test --allow-all .llm/tools/docs/check-accuracy-and-discoverability_test.ts

Output STRICT JSONL, last line the verdict:
{"finding":"F5","status":"FIXED|NOT_FIXED","evidence":"..."}
{"verdict":"PASS|FAIL_IMPL","summary":"..."}
Ground every claim in a command you actually ran, with its output.
