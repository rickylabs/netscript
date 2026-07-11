use harness

# Slice brief — #659: remove the legacy C# AppHost option (--legacy-aspire) + docs sweep

## SKILL

Read: `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/netscript-cli/SKILL.md`,
`.agents/skills/netscript-doctrine/SKILL.md` (packages/cli is framework source),
`.agents/skills/netscript-tools/SKILL.md`.

## Identity + ground rules

- WSL Codex implementation agent under the beta-8 orchestrator (`4d300496`). Do NOT open PRs.
  PLAN-EVAL owner-waived (carried drift D1) — plan in worklog, then implement.
- Worktree: `/home/codex/repos/ns-b8-659`, branch `refactor/659-remove-legacy-aspire`.
- **Every file operation uses absolute paths inside `/home/codex/repos/ns-b8-659`.**
- Base preflight: `git -C /home/codex/repos/ns-b8-659 rev-parse HEAD` must start `955b4abf`.
- Push: `git -C /home/codex/repos/ns-b8-659 push origin HEAD:refs/heads/refactor/659-remove-legacy-aspire`.
- Worklog at `/home/codex/repos/ns-b8-659/.llm/runs/refactor-659-legacy-aspire--codex/worklog.md`.

## Task (issue #659 — read it first; its Scope + Acceptance sections are the contract)

Owner directive: C# is no longer supported. Remove the `--legacy-aspire` escape hatch and all
C#/dotnet-AppHost content:

- `packages/cli`: both init commands (`public/features/init/init-command.ts:83`,
  `maintainer/features/init/init-command.ts:63`), `orchestrate-maintainer-init.ts` flag,
  `kernel/domain/scaffold/scaffold-options.ts:61` legacy branch,
  `kernel/templates/workspace/generate-readme.ts` C# sections, and every template/codepath that
  only serves the C# shape. Line numbers are from the filing — re-locate against current main.
- Reword "C# parity" comments in aspire register generators only if they describe genuine TS
  AppHost behavior; otherwise delete.
- Docs sweep (per the issue's acceptance list): `docs/site/explanation/aspire.md`,
  `docs/site/how-to/deploy-local-aspire.md`, `docs/site/tutorials/storefront/06-deploy.md`,
  `docs/site/tutorials/erp-sync/05-deploy.md`, `docs/site/tutorials/live-dashboard/01-scaffold.md`
  — remove legacy-C#-AppHost notes. The erp-sync ch3 `dotnet run <file.cs>` polyglot-TASK runtime
  row is a distinct feature: keep it only if `dotnet` single-file task executors remain supported
  in the task-runtime code (verify; record verdict in worklog).
- No backward-compat shim: pre-beta stale code is deleted, not shimmed. Unknown-flag error is the
  desired end state for `--legacy-aspire`.

Doctrine first: identify archetype/public-surface impact in the worklog before editing.

## Validation (evidence in worklog)

- `grep -rni "legacy-aspire\|C# AppHost" /home/codex/repos/ns-b8-659/packages/cli /home/codex/repos/ns-b8-659/docs/site` → 0 hits.
- Scoped check/lint on `packages/cli` (`run-deno-check.ts`/`run-deno-lint.ts`, `--ext ts,tsx`).
- Scaffold unit tests green (packages/cli test suite).
- Docs `deno task verify` (or the docs-site verify task) green.
- Do NOT run full scaffold.runtime yourself — the PR's CI scaffold-runtime job is the live verdict.

## Done means

Removal + docs sweep + tests committed and pushed, worklog committed. Report "DONE" or
"BLOCKED: <why>".
