use harness

## SKILL

netscript-harness, netscript-doctrine, netscript-cli, netscript-tools, netscript-pr

## Assignment — beta.12 grouped fix: plugin-runtime-wiring

You are implementing ONE pull request that resolves 3 issue(s):
#959, #962, #961.

Branch: `fix/plugin-runtime-wiring` (already checked out, already has a draft PR: #988).
Run dir: `.llm/runs/fix-plugin-runtime-wiring--959/`
Milestone: 0.0.1-beta.12

Read `.llm/runs/fix-plugin-runtime-wiring--959/plan.md` first — it states the shared cause, the
contract change, the compatibility story and the regression guards you are required to produce.

### Why these are one change, not 3

ONE DEFECT CLASS, not three bugs. The generator knows the answer at generation time and emits glue that never reaches its runtime: #959 install/remove leaves contradictory state and `plugin sync` validates against the root import map while Deno resolves through workspace members; #962 generated plugin runtimes do not opt into the KV backend the installer selected; #961 the cache provider side-effect import is missing and the error does not name it. Find the shared cause. Three separate patches to three symptoms is the failure mode this grouping exists to prevent.


### The issues as filed

---

#### #959 — fix(plugin): install/remove leaves contradictory state; plugin sync validates against the wrong resolution graph

## Summary

Installing and removing plugins leaves several sources of truth disagreeing: package references that do not exist, manifests left behind after removal, and ghost workspaces the doctor later reports.

## Reproduction steps

1. Install a plugin under a chosen instance name, e.g. `netscript plugin install workers --name rehearsal-worker`.
2. Remove it.
3. Reinstall under the official name.
4. Run the MCP `doctor` tool, or `netscript plugin doctor`.

## Expected behavior

Install creates one coherent package/config/runtime identity; remove removes exactly that identity; the doctor agrees with the state on disk.

## Actual behavior

- **GPT-5.6 Sol** — installing under a domain name created references to a non-existent `plugin-rehearsal-worker` package while samples still landed under `workers/`. Removal cleared the runtime entry but left a manifest in `netscript.config.ts`. Reinstalling under the official name made resources run while `plugin doctor` still warned that `plugins/workers` did not exist. Four ghost workspaces were later reported by the MCP doctor.
- **Claude Fable 5** (~90 min, hit twice — its single most expensive finding) — `plugin sync` validates workspace imports against the **root import map only**, while Deno resolves through workspace members. The generator refused imports that the runtime it feeds accepts happily, so the agent hand-wrote a file labelled generated, after reading the dispatcher's source to learn its true shape.
- **Grok 4.5** (~15 min) — plugin enable / package name mismatch.

## Environment

`0.0.1-beta.11`.

## Suggested direction

Separate `--instance-name` from the immutable plugin package id; make install and remove transactional so a partial failure does not leave a half-identity; run the doctor's own invariants before reporting success; and make `plugin sync` validate against the same resolution graph Deno actually uses, not just the root import map.

The Fable finding is the sharpest of the three: a generator that refuses what its own runtime accepts will always cost an hour, because the developer has no reason to suspect the validator rather than the code.

---

*Confirmed independently by 3 of 4 agents.*

---

#### #962 — fix(plugin): generated plugin runtimes do not opt into the KV backend the install selected

## Summary

The Redis KV adapter is opt-in via a side-effect import, but the plugin installer generates runtime glue that never opts in — even when the install selected Redis as the cache backend.

## Actual behavior

The generated runtime crash-loops at boot until the import is added by hand. The error message is good (it names the exact import), but the generator that chose the backend should not be emitting code that does not use it.

## Suggested direction

When plugin installation selects a KV/cache backend, emit the corresponding adapter import into the generated runtime entrypoint. The installer already knows the answer at generation time.

---
*Found by Claude Fable 5 (~15 min).*

---

#### #961 — fix(scaffold): cache provider side-effect import missing, and the error does not name the fix

## Summary

Page loaders throw `Cache provider not initialized. Call setCacheProvider(cacheQuery) during server bootstrap`, but the actual fix is a side-effect import the error never mentions:

```ts
import "@netscript/sdk/cache"; // registers the server-side cache provider
```

The scaffold does not include it, so a workspace created with `--cache` fails at first render.

## Why this one is worth fixing carefully

The same framework gets the mirror case exactly right. When the triggers runtime crash-looped, its error said, verbatim: *"Add `import @netscript/kv/redis;` to your service entrypoint to opt-in."* The exact fix, in the error, one line.

> "Same registration pattern, opposite documentation outcomes." — Claude Fable 5

## Suggested direction

Include the import in the scaffold when a cache backend is selected, and make the error name the import the way the KV error already does. The good version already exists in this codebase; this is bringing one error up to the standard of another.

---
*Found by Claude Fable 5 (~20 min).*

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
- Commit and push to `fix/plugin-runtime-wiring`. Do NOT merge, and do NOT take the PR out of draft —
  the supervisor does that after verifying.
