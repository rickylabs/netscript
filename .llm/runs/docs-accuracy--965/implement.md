use harness

## SKILL

netscript-harness, netscript-doctrine, netscript-cli, netscript-tools, netscript-pr

## Assignment — beta.12 grouped fix: docs-accuracy

You are implementing ONE pull request that resolves 3 issue(s):
#965, #971, #972.

Branch: `docs/accuracy-and-discoverability` (already checked out, already has a draft PR: #985).
Run dir: `.llm/runs/docs-accuracy--965/`
Milestone: 0.0.1-beta.12

### Why these are one change, not 3

One editorial pass: #965 defineSaga is documented as an object argument and implemented as a function; #971 task pages surface the general-purpose route ahead of the first-class helper; #972 there is no compact map of what each command mutates and regenerates. THESE THREE GATE ROUND TWO OF THE AGENT EXPERIMENT — until they land, that experiment measures the documentation a second time instead of the framework.

This group was assessed as MECHANICAL: go straight to implementation. Do not write a plan document.

### The issues as filed

#### #965 — docs(sagas): defineSaga is documented as an object argument, implemented as a fluent builder

## Summary

Documentation examples show `defineSaga({ name, initialState, handler })` taking an object. In beta.11 `defineSaga` expects a string id followed by a fluent chain: `.durability().state().on().build()`.

## Impact

An agent or developer following the docs writes code that does not compile, and has to read the source to recover the real shape. This is the kind of drift that costs newcomers disproportionately, because they cannot tell whether they have misunderstood the concept or the signature.

## Suggested direction

Update the examples to the fluent form, and consider a doc test that type-checks the documented snippets so the two cannot drift again.

---
*Found by Gemini 3.6 Flash.*

#### #971 — docs: task pages surface the general-purpose route ahead of the first-class helper

## Summary

Two agents independently reported that the task-oriented documentation makes the general-purpose construction easier to find than the framework-specific helper, so they wrote the clumsy version and only discovered the good one by reading full `deno doc` exports.

> "I found `createServiceClient`, `createServiceStreamProducer`, typestate worker builders, permission presets, retention and idempotency ports by reading full `deno doc` exports. The task-oriented pages made the general-purpose route easier to find than the framework-specific helper." — GPT-5.6 Sol

> "Every time I reached for the obvious general-purpose construction, the specific helper I should have used was sitting three exports below the one I knew about." — Claude Fable 5

## The measurable consequence

Across four independent reviews and three writing passes each, **none** of the four used `withResource`, `useLiveQuery`, `ui:add`, `cloud-run`, `@netscript/sdk/collections`, `query-client`, the cache engine, or the Scalar/OpenAPI surface. Not by choice — the docs never put those on the path they were walking. One agent wrote `z.number()` for a GET query parameter and got a runtime 400, while the frameworks own generated CRUD contract coerces correctly.

## Suggested direction

Put one **preferred path** sample at the top of every task page, and link each general-purpose alternative back to it. GPTs formulation is a usable test: *a sample that would work unchanged in Express should not be the main NetScript sample.*

---
*Reported independently by 2 of 4 agents; corroborated by a coverage analysis of all four reviews.*

#### #972 — docs(cli): no compact map of what each command mutates and what it regenerates

## Summary

The CLI covers contract promotion, route aggregation, configuration topics and percentage rollout, auth providers, plugin generation, many deployment targets, desktop releases and agent tooling. Exhaustive `--help` reveals the hierarchy but not the blast radius.

> "There is no compact map explaining which declaration each command mutates and which artefacts it regenerates. The capabilities were impressive; predicting their blast radius required source reading." — GPT-5.6 Sol

## Suggested direction

For every mutating command, show `source of truth → generated artefacts → runtime consumers` in the help output, and support `--dry-run` consistently.

This matters more than a normal docs gap because generation is the composition model: a developer who cannot predict what a command regenerates cannot safely run it, and an agent will simply run it.

---
*Reported by GPT-5.6 Sol and corroborated by Grok 4.5.*


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
- Commit and push to `docs/accuracy-and-discoverability`. Do NOT merge, and do NOT take the PR out of draft —
  the supervisor does that after verifying.
