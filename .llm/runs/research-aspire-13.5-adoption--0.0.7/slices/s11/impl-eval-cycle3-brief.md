use harness

## SKILL

- `netscript-harness` — IMPL-EVAL protocol, verdict format, evidence rules.
- `netscript-doctrine` — public-surface and docs boundaries.
- `rtk` — prefix read-heavy git/grep with `rtk` to cut output tokens.

## ROLE

You are an INDEPENDENT IMPL-EVAL agent for NetScript. Verdict only; do not edit files.

Repo: /home/agent/projects/netscript/worktrees/007-aspire-s11 (read-only)
PR #1771, branch docs/aspire-13-5-s11-public-docs-refresh, head a9344875a.

This is delta cycle 3. Cycle 2 returned FAIL_IMPL with three findings. Evaluate ONLY whether
each is now fixed, plus whether the fix introduced a new defect. Do not re-litigate cycle-1
findings already accepted, and do not expand scope to the rest of the PR.

Cycle-2 findings and the claimed repairs (verify each):

F1 (blocking): in docs/site/orchestration-runtime/how-to/detached-start-agents-ci.md the
   tracing guard restored `set -x` BEFORE the value was consumed, so the page's own pass-on
   line `MY_TOOL_DASHBOARD="$DASHBOARD_URL" my-tool` expanded the token into the trace.
   Claimed repair: the guard now spans extraction + pass-on + `unset DASHBOARD_URL`, and
   `set -x` is restored only after the value is gone. Both the primary snippet (~:88-97) and
   the rule's illustration (~:111-126) were changed.
   VERIFY EMPIRICALLY: replay the page's composite flow under `set -x` with a fake `aspire`
   on PATH emitting a token-bearing dashboardUrl, and count token appearances in the trace.
   Expect 0. Also confirm the rule's prose no longer claims protection it doesn't deliver.

F2 (minor): checkDetachedStartAccuracy was not invoked by runAccuracyCheck().
   Claimed repair: it is now awaited inside runAccuracyCheck() in
   .llm/tools/docs/check-accuracy-and-discoverability.ts.

F3 (minor): the guard's code block was unpinned — deleting it while keeping the imperative
   still passed. Claimed repair: `set +x …` and `unset DASHBOARD_URL` are now pinned markers.
   VERIFY by mutation: delete the fenced guard block from the doc in a scratch copy and
   confirm the contract test fails.

Run: deno test --allow-all .llm/tools/docs/check-accuracy-and-discoverability_test.ts

Output STRICT JSONL, one object per line, last line the verdict:
{"finding":"F1","status":"FIXED|NOT_FIXED","evidence":"..."}
{"verdict":"PASS|FAIL_IMPL","summary":"..."}
Ground every claim in a command you actually ran, with its output. If you assert a leak,
show the trace line. If you assert none, show the zero count.
