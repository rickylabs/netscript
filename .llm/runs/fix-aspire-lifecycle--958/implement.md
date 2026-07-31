use harness

## SKILL

netscript-harness, netscript-doctrine, netscript-cli, netscript-tools, netscript-pr

## Assignment — beta.12 grouped fix: aspire-lifecycle

You are implementing ONE pull request that resolves 2 issue(s):
#958, #970.

Branch: `fix/aspire-lifecycle` (already checked out, already has a draft PR: #986).
Run dir: `.llm/runs/fix-aspire-lifecycle--958/`
Milestone: 0.0.1-beta.12

### Why these are one change, not 2

Both are `aspire start` under isolation: #958 the default 120s start timeout fails the FIRST cold AppHost start (triple-confirmed); #970 a persistent Postgres conflicts with isolated instances. Changing what a persistent resource means for an existing workspace is a semantics change, so this one plans.

**The plan already exists and is binding: read `.llm/runs/fix-aspire-lifecycle--958/plan.md` before
you touch code.** It states the shared cause, the three contract changes in dependency order, the
compatibility constraint for existing workspaces, and the four regression guards required.
`.llm/runs/fix-aspire-lifecycle--958/context-pack.md` has the recon touchpoints — treat those file
and line references as leads to verify, not as facts.

### The issues as filed

---

#### #958 — `fix(aspire): default 120s start timeout fails the first cold AppHost start`

Labels: bug, type:fix, area:aspire

## Summary

The default `aspire start` timeout of 120 seconds is too short for a cold TypeScript AppHost, especially on a loaded machine. Three agents hit it independently on their first run.

## Reproduction steps

```bash
netscript init <workspace>
cd aspire && aspire restore
aspire start --isolated
```

on a machine that has not validated this AppHost before.

## Expected behavior

Either the start completes, or the output distinguishes "still validating" from "hung".

## Actual behavior

The first start fails on the default 120s timeout. A warm retry succeeds.

- **GPT-5.6 Sol** — measured ~67s of cold TypeScript AppHost validation, which crossed the detached-start window; `aspire ps --format Json` then returned `[]` because the detached child had gone.
- **Grok 4.5** (~25 min of looping) — "default 120s timeout under multi-agent load".
- **Claude Fable 5** (~15 min) — "first `aspire start` fails on the default 120s timeout".

## Environment

`0.0.1-beta.11`, Aspire 13.4.6, Linux, several workspaces on one machine.

## Suggested direction

Cache the validation during `aspire restore` so the first `start` is not also the first validation; print the phase and elapsed time so a slow start is distinguishable from a hung one; and make the timeout configurable.

The first run is the one that forms an opinion, and this makes the first run fail.

---

*Confirmed independently by 3 of 4 agents in a build experiment.*

---

#### #970 — `fix(aspire): persistent Postgres conflicts with isolated instances; prisma-studio exits 1`

Labels: bug, type:fix, area:aspire

## Summary

Two related generated-resource defects.

**Persistent container vs isolated mode.** `ContainerLifetime.Persistent` reuses the previous container while isolated mode generates new endpoints, so Postgres stays unhealthy because the existing port mapping belongs to the earlier instance. Removing the container while preserving the bind-mounted data recreates the conflict. Workaround: set `NetScript.Databases.postgres.Persistent` to `false` and regenerate.

**Prisma Studio.** The generated `deno task db:studio` resource reports `Executable exited unexpectedly with exit code 1` and the dashboard shows only `Finished`, with no indication of why.

## Suggested direction

Isolated generation should override persistent lifetime, namespace the persistent container by isolation id, or reject the combination with a direct message. For the studio resource: validate that the workspace actually exposes `db:studio`, and surface the failed commands first stderr line in the resource state rather than only `Finished`.

---
*Found by GPT-5.6 Sol.*

---


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
- Commit and push to `fix/aspire-lifecycle`. Do NOT merge, and do NOT take the PR out of draft —
  the supervisor does that after verifying.
