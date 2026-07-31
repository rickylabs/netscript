use harness

## SKILL

netscript-harness, netscript-doctrine, netscript-cli, netscript-tools, netscript-pr

## Assignment — beta.12 grouped fix: release-hygiene

You are implementing ONE pull request that resolves 1 issue(s):
#973.

Branch: `fix/release-specifier-ranges` (already checked out, already has a draft PR: #984).
Run dir: `.llm/runs/fix-release-hygiene--973/`
Milestone: 0.0.1-beta.12

### Why these are one change, not 1

Standalone follow-up to the merged #956. Range-pinned @netscript/* specifiers still name alpha/beta releases.

This group was assessed as MECHANICAL: go straight to implementation. Do not write a plan document.

### The issues as filed

---

#### #973 — fix(release): range-pinned @netscript/* specifiers still name alpha/beta releases

Labels: type:fix, area:plugins, area:tooling, status:triage, priority:p3
Milestone: 0.0.1-beta.12

## Summary

Eighteen `@netscript/*` specifiers in framework source carry ranges from earlier releases. They are
**not broken** — `^0.0.1-alpha.12` satisfies `0.0.1-beta.11` under SemVer, so they resolve — but they
are the version skew #956 describes, and they are what an agent sees when it reads plugin source or
a generated scaffold and concludes the CLI and its output disagree about the release.

Split out of #953 / #956 deliberately: converting a range to an exact pin changes what a consumer
workspace resolves to over time, which is a release-policy decision rather than a bug fix.

## Inventory

`deno task check:netscript-jsr-specifiers` now lists these as `NOTE JSR-NETSCRIPT-RANGE` (added by
PR #957 — non-failing, so the skew stays visible):

| Location | Specifier |
| --- | --- |
| `plugins/{workers,sagas,triggers,auth,streams}/src/adapter/plugin.ts` (2 each) | `jsr:@netscript/plugin-<name>@^0.0.1-alpha.12` |
| `plugins/ai/src/adapter/plugin.ts` (2) | `jsr:@netscript/plugin-ai@^0.0.1-beta.1` |
| `packages/cli/src/kernel/templates/workspace/contracts/deno-json.ts:14` | `jsr:@netscript/contracts@^0.0.1-alpha.18` |
| `packages/fresh-ui/registry.manifest.ts:1349` | `jsr:@netscript/ai@^0.0.1-beta.5` |
| `packages/plugin/src/templates/skeleton/deno.json.template:15-16` + its generated twin | `jsr:@netscript/{plugin,aspire}@^0.0.1-alpha.0` |

The contracts scaffold template is the one Grok reported as an "ongoing scar": the CLI reports
`0.0.1-beta.11` while the workspace it generates pins `^0.0.1-alpha.18`.

## Suggested direction

Decide the policy first, then apply it once:

1. **Do first-party pins track the release train exactly?** If yes, derive them from
   `NETSCRIPT_RELEASE_VERSION` / `netscriptJsrSpecifier` (the pattern
   `packages/cli/src/kernel/constants/jsr-specifiers.ts` already establishes) and promote the guard's
   range notes to failures.
2. **Or do generated consumer workspaces intentionally get a floor-range** so a user picks up patch
   releases without a scaffold regeneration? If yes, the floor should still be the current release,
   and the guard should assert *that* instead.

Either way the outcome is one rule, enforced by the existing guard, rather than eighteen literals
drifting independently.

## Acceptance

- [ ] gate: the chosen policy is written down in the release skill or doctrine
- [ ] gate: `deno task check:netscript-jsr-specifiers` enforces it (range notes become failures, or
      the floor-currency rule replaces them)
- [ ] gate: no `@netscript/*` specifier in `packages/**` or `plugins/**` names a release older than
      the one being cut

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
- Commit and push to `fix/release-specifier-ranges`. Do NOT merge, and do NOT take the PR out of draft —
  the supervisor does that after verifying.
