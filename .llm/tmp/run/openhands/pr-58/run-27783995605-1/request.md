You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment iterations=300 use harness

## IMPL-EVAL cycle 2 (slice G3-FUI) — remediation of the cycle-1 `FAIL_FIX` (ruling (b))

Cycle 1 returned `FAIL_FIX` with ruling **(b)**: the `(props: any) => unknown` approach cleared `deno doc --lint` but introduced **42 new `no-explicit-any` violations** (commit `8c26459`). The generator (same WSL Codex thread `019edc0d…`, separate session from you) has remediated per direction (b).

**New tip to evaluate:** `a98fbf8` (`fix/fresh-ui-namespace-exports`), on top of your cycle-1 trace commit `26cef70`.

### What the remediation changed (8 files, all under `packages/fresh-ui/`)
- Restored each `*Namespace` member from `(props: any) => unknown` back to **`typeof <Subcomponent>`** (precise typing).
- **Exported** every subcomponent function referenced via `typeof` (e.g. `AccordionItem`, `AccordionRoot`, …) so the `typeof` targets are public and no longer trigger `private-type-ref`.
- Re-exported those subcomponents from `packages/fresh-ui/interactive.ts`.
- Removed all introduced `any`.

Generator-reported gate results (you must independently re-run and paste raw output — do not trust):
- `deno doc --lint packages/fresh-ui/{mod.ts,interactive.ts,primitives.tsx}` → `0`
- `deno lint packages/fresh-ui/ 2>&1 | grep -c "no-explicit-any"` → `0` (was 86 grep-hits / 43 error count pre-fix)
- `deno check --unstable-kv` on the 3 public entries → `0`

### Re-verify (run and paste raw output)
1. `deno doc --lint packages/fresh-ui/mod.ts packages/fresh-ui/interactive.ts packages/fresh-ui/primitives.tsx` — expect **0**.
2. `deno lint packages/fresh-ui/` — expect **0** `no-explicit-any` errors (the cycle-1 regression must be gone). Confirm no other new lint classes were introduced.
3. `deno check --unstable-kv packages/fresh-ui/mod.ts packages/fresh-ui/interactive.ts packages/fresh-ui/primitives.tsx` — expect 0.
4. Scope: `git diff 26cef70..a98fbf8 --stat` — every file under `packages/fresh-ui/`; no `deno.json` `version` edit, no catalog/scaffold-versions edit, no `deno.lock` churn, no deleted files.
5. Confirm the `typeof <Subcomponent>` typing is genuinely restored (public type precision preserved) and the exported subcomponents are reachable from the public entry — i.e. ruling (b) is actually implemented, not faked with a looser type.

### Verdict
Emit `PASS` / `FAIL_FIX` / `FAIL_RESCOPE` / `FAIL_DEBT`. A clean `deno doc --lint` (0) **and** `deno lint` (0 `no-explicit-any`) **and** preserved `typeof` precision should be `PASS`. This is the second eval cycle; per protocol, a further `FAIL_*` escalates. Preserve lock hygiene: do not commit `deno.lock` or source churn.


Issue/PR title: fix(fresh-ui): export 7 *Namespace types to clear private-type-ref deno doc lint

Operational contract:
- Read AGENTS.md first.
- Your iteration budget is limited. Create deliverable files in the repository
  workspace EARLY and grow them incrementally as you learn; never defer all
  writing to the end of the run. Uncommitted workspace files are committed back
  to the branch automatically when the run ends, even if you run out of budget.
- If the task says "use harness", follow .agents/skills/netscript-harness/SKILL.md.
- If the work touches packages/ or plugins/, use .agents/skills/netscript-doctrine/SKILL.md.
- Use rtk for read-heavy git/grep/gh/docker commands when it is available.
- Preserve user changes and avoid destructive git commands.
- Run the smallest validation that proves the change.
- Do not post GitHub issue or PR comments directly. The workflow owns GitHub comments.
- Write /home/runner/work/_temp/openhands/27783995605-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27783995605-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-58/run-27783995605-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 58
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27783995605
