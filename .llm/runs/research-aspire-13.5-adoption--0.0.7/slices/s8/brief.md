use harness

## SKILL

- netscript-harness — run lifecycle, slice review gate, evaluator separation (you never self-certify).
- netscript-doctrine — `packages/cli` is framework code; `quality:scan` + `arch:check` per slice; no `any`/casts/lint-ignores; A7/A11: IO in the emitted runtime edge, never in the generator.
- netscript-tools — scoped wrappers, receipts, `gen:assets-barrel`/`check:assets-barrel`, configured `deno task lint`.
- netscript-cli — `netscript db` adapters (`aspire-command-executor`, `operation-runner`), scaffold/E2E surface (`scaffold.plugins`; `scaffold.runtime` on CI).
- netscript-pr — draft PR, labels, `Closes`, commit-trail comments.
- aspire — 13.5 facts: `withCommand(name, displayName, cb, { commandOptions: { arguments: [{ name, inputType, required }] } })`, `ctx.arguments().value('x')`, `aspire resource <r> <cmd> --<arg>`, `excludeFromMcp()` (MCP exposure only — **not** `withHidden()`, D-6), `aspire wait <r> --status healthy --timeout <n>` exit 17/18; **no AppHost start, no host CLI change** (no runtime lease in this phase).

## Context

You are the GPT-5.6 Sol implementation agent for **S8 of the Aspire 13.5 epic** (#1712):
**#1720 — [aspire-13-5 S8] Typed resource commands for db-cli-mode resources + `excludeFromMcp()` ownership**. Will close #863. Supervisor: the Fable 5 session.

### Your worktree / branch — STACKED ON S6 (→ S5)
- Worktree: `/home/codex/repos/netscript-aspire-13-5-s8` (native ext4; work ONLY here)
- Branch: `feat/aspire-13-5-s8-typed-resource-commands`, based on **S6's head `78d0ded28`** (`feat/aspire-13-5-s6-health-checks`, phase A) because the bounded wait relies on S6's listener-readiness meaning of "healthy". No upstream — push only with `git push origin HEAD:refs/heads/feat/aspire-13-5-s8-typed-resource-commands`. Draft PR **base `feat/aspire-13-5-s6-health-checks`**; the supervisor retargets after S6 merges. Never touch S5/S6 commits. If the supervisor tells you S6 moved (fix cycle), rebase onto the new S6 head before continuing.
- Run dir you own: `.llm/runs/feat-aspire-13-5-s8-typed-resource-commands--impl/` (`supervisor.md` from `.llm/harness/templates/supervisor.md`, `worklog.md` with `## Design`, `context-pack.md`, `drift.md`).

### Required reading (in order)
1. Issue #1720 (scope, boundaries, acceptance), #863 (indefinite block), epic #1712; locked decision D-6 (`excludeFromMcp()` = MCP exposure only; `withHidden()` deliberately not adopted).
2. `git show origin/research/aspire-13.5-0.0.7:.llm/runs/research-aspire-13.5-adoption--0.0.7/plan.md` (D-6, S-08 row, S-05→S-06→S-08 chain); `…/sources/aspiredev-reference_api_typescript_aspire.hosting.md` (`withCommand`, `CommandOptions`, `arguments`, `excludeFromMcp`) and `…/sources/aspiredev-fundamentals_custom-resource-commands.md`; cite the exact API page per emitted member (S4's `member-table.md` format).
3. S2 receipts on `origin/test/aspire-13-5-s2-runtime-verification` (`03-v8-*` MCP 14 tools, `03-v12-*` CLI help receipts incl. `aspire resource`/`aspire wait` argv and exit codes, `02-v5-aspire-describe-final.json` `commands[]` shape).
4. `packages/cli/src/kernel/templates/aspire/helpers/generate-db-cli-mode.ts` (+ tests), `packages/cli/src/kernel/assets/aspire/helpers/run-tool.ts.template`, `generate-register-tools-1.ts.template:108-123` (`PROCESS_COMMANDS_FLAG` seam to remove), `packages/cli/src/kernel/adapters/database/{aspire-command-executor,operation-runner}.ts` (+ tests), `packages/cli/e2e` `ASPIRE_RESTART_SCRIPT` usage, S6's `runtime/` gate modules.

### Phase split (no lease in this dispatch)
- **Phase A (now):** generator emission (typed `withCommand` per op with `--timeout`/`--confirm`, `Visibility`, `IconName`, `.excludeFromMcp()` exactly on `<db>-cli` resources via `RESOURCE_DEFAULTS.DbCliModeExcludeFromMcp`), `PROCESS_COMMANDS_FLAG` seam removal + grep test, snapshot/barrel regen, CLI adapter routing (running AppHost detected via `aspire ps --format Json` match → `aspire resource <db>-cli <op> …`; standalone path kept), bounded `aspire wait` with exit 17/18 → actionable message, unit tests for all arms, E2E typed-command gate code (unexecuted).
- **Phase B (lease-backed, same PR):** `aspire resource <db>-cli --help` receipt, `migrate --timeout 60` / `reset` without `--confirm` receipts, `aspire ps` count receipt (no second AppHost), Unhealthy-but-Running #863 receipt. Do not attempt now.

## Slices (commit in order; RED-first where a gate exists)
1. **Grep gate RED.** Test asserting no `PROCESS_COMMANDS_FLAG` / "Aspire 13.4" seam remains in `generate-register-tools-1.ts.template` and generated output (RED on base, receipt via `run-gate`), plus the generator test that `.excludeFromMcp()` appears exactly on `<db>-cli` resources for a postgres scaffold and on no user-facing resource (RED).
2. **Generator: typed commands + `excludeFromMcp`.** `generate-db-cli-mode.ts` + `run-tool.ts.template`: `withCommand` per op (`migrate`/`seed`/`reset`) with typed `arguments`; `reset` requires `--confirm true` before any mutation; results `{ success, message }`; `RESOURCE_DEFAULTS.DbCliModeExcludeFromMcp = true` in `_aspire-compat.ts.template`; seam removed. Generator tests green; member table for the new SDK members.
3. **Snapshot + barrel regen.** `check:assets-barrel` clean.
4. **CLI adapters: route to the running AppHost + bounded wait (#863).** `aspire-command-executor.ts` / `operation-runner.ts`: detect running AppHost by `apphost.mts` path match, call `aspire resource <db>-cli <op> --<args> --non-interactive --nologo`; otherwise standalone; `aspire wait <db> --status healthy --timeout <n>` first; exit 17/18 → actionable message naming the resource and the timeout. Adapter tests with a fake process for every arm.
5. **Consumer type-check (mandatory, D-19).** Render a generated AppHost with the local CLI at head (`deno run -A packages/cli/bin/netscript.ts init s8tsc --db postgres --cache --cache-backend redis --service --no-git --ci --yes` from a scratch dir under `.llm/tmp/`), copy S2's restored `.aspire/modules/{aspire,base,transport}.mts` + `aspire.config.json` from `/home/codex/repos/netscript-aspire-13-5-s2/.llm/tmp/aspire-13-5-s2/aspire-13-5-postgres/aspire/` (symlink its `node_modules`), run `./node_modules/.bin/tsc --noEmit -p tsconfig.apphost.json`; only the two pre-existing `zod` TS2307 errors are allowed. Commit the receipt. Verify `withCommand`/`CommandOptions.arguments`/`ctx.arguments()`/`excludeFromMcp` signatures against that module (cite line numbers), not prose.
6. **E2E + gates.** Replace `ASPIRE_RESTART_SCRIPT` with a typed command call where the flow allows (restart kept as fallback), phase-B gate code unexecuted; `scaffold.plugins` green; configured `deno task lint`, scoped wrappers (+ raw fmt/lint on config-excluded `packages/cli`), `quality:scan`, `arch:check`, `check:assets-barrel`. Draft the #411 comment text in the run dir.

## Boundaries
- No `promptInputs`, no plugin contribution changes, no `withHidden()`, no pins, no `packages/fresh`, no skills/docs (S11 owns the docs table), no runtime, no MCP receipt (S9), no S5/S6 commit edits.

## Draft PR and receipts
- After commit 1: draft PR (base `feat/aspire-13-5-s6-health-checks`), title `feat(aspire): typed db-cli-mode resource commands with bounded wait and excludeFromMcp (S8)`; body per `.github/pull_request_template.md`, `## Scope` = `Closes #1720`, `Closes #863`, `Part of #1712`; labels `type:feat`, `epic:aspire-13-5`, `area:cli`, `area:aspire`, `priority:p1`, `status:impl`; milestone `0.0.7`. State the S6 stacking and the phase-B lease dependency.
- Push with the explicit refspec after every commit; per-commit PR comment with scope, SHA, gate evidence; push lines in `worklog.md`.

## Stop conditions
- Final non-empty line exactly `DONE` (plain text, no table, nothing after) when slices 1–6 are pushed, the draft PR carries the commit trail, gates green locally, run-dir artifacts committed. You do not mark ready and do not self-certify.
- Otherwise final non-empty line exactly `BLOCKED: <exact reason and evidence path>` (plain text).
