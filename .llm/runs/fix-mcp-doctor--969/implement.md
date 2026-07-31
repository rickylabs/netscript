use harness

## SKILL

netscript-harness, netscript-doctrine, netscript-cli, netscript-tools, netscript-pr

## Assignment — beta.12 grouped fix: mcp-doctor

You are implementing ONE pull request that resolves 1 issue(s):
#969.

Branch: `fix/mcp-doctor-truthful-report` (already checked out, already has a draft PR: #981).
Run dir: `.llm/runs/fix-mcp-doctor--969/`
Milestone: 0.0.1-beta.12

### Why these are one change, not 1

Standalone: doctor reports false positives and disagrees with the running AppHost.

This group was assessed as MECHANICAL: go straight to implementation. Do not write a plan document.

### The issues as filed

#### #969 — fix(mcp): doctor reports false positives and disagrees with the running AppHost

labels: bug, type:fix, area:tooling · milestone: 0.0.1-beta.12

```
## Summary

The MCP `doctor` tool produced several incorrect results in a session where it was otherwise genuinely useful (it correctly found ghost plugin workspaces):

- a telemetry HTTP 404 was treated as a passing check
- it reported no NetScript AppHost marker while that AppHost was running
- `list_commands` returned no worker commands despite the CLI exposing a substantial workers command tree

## Why it matters more than an ordinary bug

This is the tool a coding agent trusts to tell it what is true about a running system. A diagnostic that passes a 404 and denies a running AppHost does not merely fail to help — it actively misleads the consumer least able to sanity-check it.

## Suggested direction

Generate MCP command metadata from the CLI command registry rather than a parallel list, and add contract tests asserting the pass/fail semantics of every doctor check.

---
*Found by GPT-5.6 Sol.*
```


## Non-negotiables (learned the hard way — do not rediscover these)

1. **VERIFY THE ARTEFACT, NEVER THE EXIT CODE.** A previous session produced two false "pushed"
   reports from an `&&` chain short-circuiting on a no-op commit, and silently lost a file.
   After any commit/push, confirm the object exists: `git log`, `git ls-remote`, `gh pr view`.
2. **ALWAYS pass `--repo rickylabs/netscript` to every `gh` command.** Running `gh pr edit` from the
   wrong directory once destroyed an unrelated merged PR's body.
3. **Root `deno task lint` and `fmt:check` EXCLUDE `packages/cli` by their own exclude regex.**
   A green root wrapper proves NOTHING about a change under `packages/cli`. Re-run scoped:
   `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root <pkg> --ext ts,tsx`
   (same for `run-deno-fmt.ts` and `run-deno-check.ts`). Gate evidence must cover the files you
   actually changed.
4. **THE ISSUE IS PROBABLY WRONG.** Every single fix agent in round one found its issue understated
   or misframed; two found the stated cause was not the real cause; one found the described
   component did not exist at all (`grep HealthCheck` returned zero hits for an issue that said
   "the probe checks the port"). Verify the framing against the code BEFORE fixing. When the issue
   is wrong, **correct the issue itself** with `gh issue comment` — do not let the correction die
   in a PR body.
5. **Closing keyword.** Per AGENTS.md the PR body MUST carry `Closes #N` for every issue it fully
   resolves. Bare `#N` and `Refs #N` do not auto-close — that omission stranded 40+ merged PRs
   with stale-open issues.
6. **Report failures as failures.** A gate you could not run is declared NOT RUN with the reason.
   Never quietly drop it, never claim a pass you did not observe.


## What "done" means for this slice

- The fix is at the **root cause**, not at each symptom. If you find the issues share one cause,
  say so explicitly in the PR body and fix it once.
- A **regression guard** exists that fails when the defect is reintroduced. Prove it: break the fix,
  watch the guard fail, restore it, watch it pass. Report that as fails-before evidence.
- Gate evidence covers the changed files (see non-negotiable 3).
- Any issue that turned out to be wrong is corrected **on the issue**.
- Commit and push to `fix/mcp-doctor-truthful-report`. Do NOT merge, and do NOT take the PR out of draft —
  the supervisor does that after verifying.
