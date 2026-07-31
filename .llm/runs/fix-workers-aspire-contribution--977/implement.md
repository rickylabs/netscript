use harness

## SKILL

netscript-harness, netscript-doctrine, netscript-cli, netscript-tools, netscript-pr

## Assignment — beta.12 grouped fix: workers-aspire-contribution

You are implementing ONE pull request that resolves 2 issue(s):
#977, #960.

Branch: `fix/workers-aspire-contribution` (already checked out, already has a draft PR: **#987**).
Run dir: `.llm/runs/fix-workers-aspire-contribution--977/`
Milestone: 0.0.1-beta.12

Read `.llm/runs/fix-workers-aspire-contribution--977/context-pack.md` and
`.llm/runs/fix-workers-aspire-contribution--977/plan.md` first — the plan states the contract
change, the compatibility requirement, and the regression guard you must produce. It also names a
pre-existing test that passes while production 404s; do not trust it.

### Why these are one change, not 2

#977 the workers Aspire contribution declares WORKERS_API_URL as the wrong shape; #960 the plugin RPC route shape does not match createServiceClient routerName. Both are the same seam — what a plugin publishes versus what a client is generated to call. Contract change, so it plans.


### The issues as filed

---

#### #977 — fix(plugin-workers): workers Aspire contribution declares WORKERS_API_URL as a literal, not a service reference

Labels: type:fix, area:plugins, area:aspire, status:triage

## Summary

`WorkersAspireContribution.declareEnv` hands out `WORKERS_API_URL` as a hardcoded string rather than an Aspire service reference, so consuming services get no `ServiceReferences` edge to `workers-api` — no dependency ordering, no health gating, no endpoint rewrite if the port moves.

`plugins/workers/src/aspire/workers-contribution.ts`:

```ts
override declareEnv(_ctx: ContributionContext): Record<string, EnvSource | string> {
  return {
    WORKERS_API_URL: 'http://localhost:8091',
    WORKER_CONCURRENCY: '2',
  };
}
```

The signature already admits `EnvSource`; the contribution just does not use it. Compare `ctx.port('workers-api', 8091)` a few lines above, which *does* go through the builder — so a project that relocates the port gets a correct listener and a stale `WORKERS_API_URL`.

## Why this is filed separately

Split out of **#951** / PR #976. #951 bundled three symptoms from three independent reporters under one title. Two of them (`triggerJob` → `NOT_FOUND`, and the dispatcher's "not found in registry") shared a single root cause in the generated-job-registry load path and are fixed in #976. The third — Grok 4.5's "workers missing `ServiceReferences`, so jobs **silently** could not resolve the probe", the one that cost hours — points at this file instead. Different mechanism, different fix, different blast radius, so it was not folded into a registry fix.

## Expected behavior

`WORKERS_API_URL` resolves through the Aspire service-reference mechanism, so consumers of the workers plugin get a real dependency edge and an endpoint that tracks the actual `workers-api` resource.

## Also noticed in the same file

`contribute()` registers `workers-combined` **and** `workers-scheduler` **and** `workers-worker`. Since `workers-combined` already runs scheduler + worker in one process, the scheduler and worker each run twice in a default graph. Worth confirming whether that is intentional; if not, it belongs in the same fix.

## Notes

Found while fixing #951; not verified against a live Aspire graph — the reading is from `src/aspire/workers-contribution.ts` plus the reporter's symptom. Confirm against a running graph before choosing the fix.

---

#### #960 — fix(sdk): plugin RPC route shape does not match createServiceClient routerName — 404 on triggerJob

Labels: bug, type:fix, area:plugins, area:sdk

## Summary

`workers-api` mounts plugin procedures at `/api/rpc/v1/triggerJob`, while `createServiceClient({ contract, serviceName, routerName })` builds `/api/rpc/v1/workers/triggerJob` and receives 404.

## Actual behavior

Service discovery resolves the base URL correctly; the last mile of plugin RPC routing does not agree with the typed client. The agent worked around it by POSTing against the discovered base URL by hand for that one call.

> "Discovery still did half the job. The last mile of plugin RPC routing needs a first-class client the way service contracts already have one." — Grok 4.5

## Suggested direction

Either mount plugin procedures under the router segment the client derives, or give plugin APIs a first-class typed client the way service contracts have. Falling back to a hand-built fetch defeats the contract-first guarantee at exactly the boundary where it matters most.

---
*Found by Grok 4.5 while building a dependency health board (~45–60 min).*

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
- Commit and push to `fix/workers-aspire-contribution`. Do NOT merge, and do NOT take the PR out of draft —
  the supervisor does that after verifying.
