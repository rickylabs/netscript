use harness

## SKILL

netscript-harness, netscript-doctrine, netscript-cli, netscript-tools, netscript-pr

## Assignment — beta.12 grouped fix: scaffold-hygiene

You are implementing ONE pull request that resolves 4 issue(s):
#966, #975, #967, #968.

Branch: `fix/scaffold-hygiene` (already checked out, already has a draft PR: #983).
Run dir: `.llm/runs/fix-scaffold-hygiene--966/`
Milestone: 0.0.1-beta.12

### Why these are one change, not 4

All four are `netscript init` / CLI scaffold output over the same files, so they share one fresh-clone verification: #966 generated .gitignore excludes appsettings.json which a clean clone needs; #975 scaffold writes a top-level `Parameters` block the appsettings schema rejects; #967 init nests a project directory when the cwd is already the target; #968 non-interactive invocations still hit selection prompts.

This group was assessed as MECHANICAL: go straight to implementation. Do not write a plan document.

### The issues as filed

---

#### #966 — fix(scaffold): generated .gitignore excludes appsettings.json, which a clean clone needs

labels: bug, type:fix, area:cli

## Summary

The scaffold ships a `.gitignore` that excludes `appsettings.json`. That file is source configuration, not generated output: `aspire/apphost.mts` reads it at start and `netscript generate` derives the Aspire helpers **from** it. Nothing regenerates it.

A clean clone of a scaffolded project therefore cannot start, and the missing file is not obviously the cause.

## Evidence

Noted by Claude Fable 5 while preparing its playground for publication, which it flagged in the `.gitignore` it wrote:

> "`appsettings.json` is deliberately NOT ignored, although the scaffolds original `.gitignore` excluded it. It is source configuration… nothing regenerates it. It contains no secrets. A clean clone needs it."

## Suggested direction

Stop ignoring `appsettings.json` in the generated `.gitignore`. If the concern was secrets, the fix is to keep secrets out of it (they are not in it today) rather than to exclude a file the build depends on.

---
*Found by Claude Fable 5 while packaging its experiment for others to clone.*

---

#### #975 — fix(aspire): scaffold writes a top-level 'Parameters' block the appsettings schema drops

labels: type:fix, area:cli, status:triage

## Summary

`generateAppsettings()` emits a top-level `Parameters` block for `--db mssql`, but `AppSettingsSchema` in `@netscript/aspire/config` models only `$schema`, `Logging`, and `NetScript`. Zod's default object behaviour strips unknown keys, so `parseAppSettings()` silently drops `Parameters` from its output.

## Where

- Written: `packages/cli/src/kernel/templates/aspire/generate-appsettings.ts:320-325`
- Not modelled: `packages/aspire/config.ts` (`AppSettingsZod`)

## Why it matters now

#955 replaced `netscript config set`'s blind key mapping with schema-aware resolution against the generated appsettings JSON Schema. Because `Parameters` is not in that schema, the CLI classifies `Parameters.postgres-password` as "a key the generator does not read" and requires `--force`. That is currently correct-by-the-schema but wrong-by-intent: the block is real configuration, consumed by Aspire's .NET parameter mechanism rather than by `parseAppSettings()`.

The `--force` escape hatch in #955 exists specifically to cover this case (see PR #974, drift D3).

## Decide one of

1. **Model it.** Add an optional `Parameters: z.record(z.string(), z.string())` to `AppSettingsZod`. `config set Parameters.<name>` then works without `--force`, `config list` shows it, and `parseAppSettings()` stops discarding it.
2. **Document it as host-side.** Keep the schema NetScript-only and state in the `@netscript/aspire` README that `Parameters` is .NET-consumed configuration outside the NetScript schema — then `--force` is the intended path and the CLI error text should name it.

Option 1 is the smaller surprise for a developer who runs `netscript config list` and does not see a key their own scaffold wrote.

## Acceptance

- [ ] A decision is recorded in `packages/aspire/README.md` or the schema itself.
- [ ] `netscript config set Parameters.<name> <value>` behaves per that decision, with a test.

---

*Found while fixing #955.*

---

#### #967 — fix(cli): init nests a project directory when the cwd is already the target

labels: bug, type:fix, area:cli

## Summary

Running `netscript init <name>` from a directory that is already meant to be the workspace creates a nested `<name>/` inside it, rather than initialising in place.

## Impact

Small in time (~15 min) but it propagates: the resulting layout has the real project one level down, so every later path, script and publication step has to account for it. One agent published its playground with the project nested inside a workspace directory for exactly this reason.

## Suggested direction

Detect an empty or otherwise suitable cwd and offer to initialise in place, or support `netscript init .` explicitly.

---
*Found by Grok 4.5, and independently visible in Claude Fable 5s playground layout.*

---

#### #968 — fix(cli): non-interactive invocations still hit selection prompts

labels: bug, type:fix, area:cli, dx

## Summary

Commands run in a non-interactive shell (CI, an agent session, a script) hit selection prompts and fail rather than either defaulting or erroring with the flag that would have answered them.

## Suggested direction

Every prompt should have a corresponding flag, and `--non-interactive` should either use the documented default or fail naming the exact flag that would have supplied the answer. An agent or CI job cannot answer a prompt; it can only be told which flag it missed.

---
*Found by Grok 4.5 (~20 min across several commands).*

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
- Commit and push to `fix/scaffold-hygiene`. Do NOT merge, and do NOT take the PR out of draft —
  the supervisor does that after verifying.
