use harness

# Slice brief — HOTFIX: duplicate `--minimum-dependency-age` flag kills published-mode workers-api

## SKILL

Read: `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/netscript-cli/SKILL.md`,
`.agents/skills/netscript-tools/SKILL.md`.

## Identity + ground rules

- WSL Codex fast-fix agent (Luna) under the beta-7 orchestrator (`df71d36c`). Do NOT open PRs.
  **PLAN-EVAL waiver** (owner-waived, drift D1). This is the release-verification critical path —
  smallest correct change, no refactors.
- Worktree: `/home/codex/repos/ns-wt-prodfix`, branch `fix/e2e-prod-dup-dep-age-flag`.
- Push: `git push origin HEAD:refs/heads/fix/e2e-prod-dup-dep-age-flag`.
- Worklog at `.llm/runs/fix-prod-dup-flag--codex/worklog.md`, committed with the slice.

## Diagnosis (verified by the orchestrator on a preserved failing project)

`e2e-cli-prod` fails against published `0.0.1-beta.7`: workers-api crashes at spawn with
`error: the argument '--minimum-dependency-age <minimum-dependency-age>' cannot be used multiple times`.
Launch args observed:
`deno run --minimum-dependency-age=0 --config .netscript-flow-b-deno.json --minimum-dependency-age=0 --node-modules-dir=none ... jsr:@netscript/plugin-workers@0.0.1-beta.7/services`

Cause: two composition sites.
1. The beta.7 published CLI's generated `register-plugins.mts` workers-api block now natively
   contains `'--minimum-dependency-age=0'` after `'--config', 'deno.json'`
   (template `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-plugins.ts:74`).
2. `packages/cli/e2e/src/application/gates/scaffold/prepare-flow-b-fixture.ts` (~line 88): in
   published mode `flowBRunPrefix` rewrites `"['run', '--config', 'deno.json',"` to
   `"['run', '--minimum-dependency-age=0', '--config', '.netscript-flow-b-deno.json',"` — leaving
   the template's own flag in the block remainder → duplicate.
In beta.6 prod runs this was masked by the earlier telemetry graph crash (#624 unmasked it).
CI run 29152236349 saw "failed to start"; local repro passed `aspire wait` transiently then failed
`behavior.workers-health` — same crash, different observation phase.

## Fix (e2e layer only — do NOT touch scaffold templates or product source)

In `prepare-flow-b-fixture.ts` published mode: rewrite only the config filename
(`'deno.json'` → `'.netscript-flow-b-deno.json'`), then ensure `'--minimum-dependency-age=0'`
appears exactly once in the workers block — insert it only if absent after the rewrite (keeps
older published CLIs, whose templates lack the flag, working for targeted re-verification runs).
Add/extend a unit test in the e2e test layer asserting the rewritten block contains the flag
exactly once for (a) a template block that already carries the flag (beta.7 shape) and (b) one
that doesn't (beta.6 shape).

Note: PR #627 (branch `test/606-shared-local-source-fixture`) refactors the local-mode path of
this same file; your change is published-mode only — keep the diff minimal to minimize conflict.

## Validation (evidence in worklog)

- Scoped check/lint on `packages/cli` (`run-deno-check.ts`/`run-deno-lint.ts`, `--ext ts,tsx`).
- The new/updated fixture unit tests green (`deno test` on the e2e test layer).
- Do NOT run full scaffold.runtime (orchestrator owns it; a published-mode verification run will
  follow the merge).

## Done means

Fix + tests committed and pushed, worklog committed. Report "DONE" or "BLOCKED: <why>".
