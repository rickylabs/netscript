use harness

# Slice: onboarding quick-wins — #1250, #1254, #1253 (three fixes, three PRs, one lane)

## SKILL

Activate `netscript-harness` plus the domain skills `netscript-doctrine` (package/plugin
surfaces and gates), `netscript-pr` (branch/PR/label/closing-keyword law), and
`netscript-deno-toolchain` (dependency/API inspection). Per milestone ruling D6 you do NOT
spawn a local PLAN-EVAL; evaluation composes draft→ready augment, the OpenHands label, and the
orchestrator pre-merge gate. Route identity for this lane: openai · gpt-5.6-sol · **medium**
(owner-specified; do not escalate or reduce).

## Why you, why now

Three p1 defects from the maintainer's real Windows/Zed onboarding against canary.7 and an
independent Codex verification pass on clean `netscript init` scaffolds. The diagnosis work is
already done — each issue body carries the exact command, output, root cause with file:line,
and an acceptance list. Your job is the edit, the regression test, and the PR discipline.
Read each issue body FIRST with `gh issue view <n> --repo rickylabs/netscript` and treat it as
the specification; where the issue and this brief disagree, the issue wins and you say so in
the PR.

## The three fixes, in order

1. **#1250 — Zod-3 coercion plugin against Zod-4 scaffolds.**
   `packages/service/src/primitives/handlers.ts:25` imports `ZodSmartCoercionPlugin` from
   `@orpc/zod` (Zod 3) while `openapi.ts:21` in the same package already imports from
   `@orpc/zod/zod4` and scaffolds ship Zod 4. The plugin installs and silently coerces
   nothing; every numeric query/path param 400s. Fix the import. Then add the test the issue
   demands: one that FAILS if the plugin ever no-ops again — a silently-inert plugin must not
   be able to pass as installed. That property, not the import, is the acceptance.

2. **#1254 — `@database/zod` maps to the single-model `crud.ts`.**
   The workspace import map points `@database/zod` at `.generated/zod/crud.ts` (one model);
   the complete barrel is `.generated/zod/schemas/models/index.ts`, and the scaffold's own
   contract template imports model schemas from `@database/zod`. Repoint the import map to
   the barrel so multi-model projects can derive contracts for every model. Check whether the
   contract template's imports and any generated-code assumptions (named exports, naming
   scheme) still hold against the barrel, and cover it with a scaffold-level assertion.

3. **#1253 — `search_exports` fails with `export_corpus_error`.**
   This is the #1218 export-surface capability failing on its first real use by an agent that
   actually reached for it — the one MCP tool with no bash equivalent. The issue body traces
   the root cause to source. Reproduce, fix, and add a regression test that exercises the
   corpus path end-to-end (not a mock that cannot fail the way production did).

## Mechanics

- Worktree: `/home/codex/repos/ns005-quickwins` (branch `fix/onboarding-quickwin-1250`
  checked out, NO upstream by design).
- **One PR per issue.** Work them sequentially. For #1254 and #1253 create fresh branches off
  `origin/main` in this same worktree (`git fetch origin main` first;
  `git switch -c fix/<slug> FETCH_HEAD`). Push every branch with an explicit refspec:
  `git push origin HEAD:refs/heads/<branch>`.
- Each PR: draft first; body carries `Closes #<n>`, the fenced ```acceptance-evidence``` YAML
  block mirroring that issue's acceptance boxes with your evidence, and the standard labels
  (`type:fix`, the issue's `area:*`, its `priority:*`, one `status:`) + milestone 0.0.5. Tick
  the issue's acceptance boxes only for what you have actually proven, with citations. Flip
  ready only when your local targeted checks pass (`deno check --unstable-kv` scoped to what
  you touched, the new tests green, and the relevant package test task).
- Validation is smallest-that-proves: do NOT run the full e2e:cli suite; the orchestrator
  gate covers merge-readiness. Lock hygiene: never commit `deno.lock` churn your change does
  not require.
- Record progress in your rollout as you go; if a fix turns out larger than its issue claims
  (the #1253 corpus error may hide a deeper defect), STOP that fix, record what you found in
  the PR as draft, and move to the next — honest partial delivery beats a stalled lane.
