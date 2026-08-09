# Worklog: #1356 UI app-root resolution

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `release-0.0.5--orchestration/slices/cli-1356` |
| Branch | `fix/ui-commands-resolve-app-root` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Design

### PLAN-EVAL

`PLAN-EVAL: N/A` — the live issue supplies a complete resolution order, five-command surface,
ambiguity/error contract, corrected-gate contract, negative controls, docs expectations, and scope
boundaries. The existing composition/port seams make this mechanical; no deferred decision would
force rework.

### Public Surface

- `ui:init`, `ui:add`, `ui:list`, `ui:update`, `ui:remove` gain `--app <name>`.
- `--project-root <path>` continues to accept an explicit app path.
- `UiAddCommandInput` describes `route`, `island`, `query`, and `app`.
- No package export-map or `mod.ts` change.

### Domain Vocabulary

- `UiAppRootInput` — optional explicit app path and optional named app.
- `UiAppCandidate` — direct `apps/<name>` workspace member with deterministic name/path.
- `UiAppRootResolver` — injected shared command resolver.

### Ports

- Existing `FileSystemPort` — reads root `deno.json`; no new port.
- Injected cwd/path/workspace-root functions — retain host and filesystem test seams.

### Constants

- Existing `ASPIRE_RESOURCE.APP` — E2E default app identity (`dashboard`).
- No new finite vocabulary requires a registry or constant family.

### Archetype-6 Existing Spine / Axes

- Spine unchanged: `CliCommand<Input, Result>`, `CliCommandGroup`, `CliRoot`,
  `UseCase<Input, Result>`, `Registry<TKey, TValue>`.
- No layer-2 abstract is introduced; therefore no new concrete-pair justification is required.
- Vertical feature catalog touched: public `ui/{init,add,list,update,remove}` only.
- Extension axes unchanged: template, preset, DB engine, plugin kind, deploy target, and output
  renderer registries are not modified.
- Composition declarativity remains in `public/features/root/public-command-tree.ts`; it only wires
  the new resolver dependency.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 0 | Research/design + PLAN-EVAL N/A | artifact review | run directory |
| 1 | Shared app resolution, five commands, public input, corrected E2E discriminator | focused tests + help + scoped/quality/arch gates | owned CLI/UI/E2E files + run artifacts |

### Deferred Scope

- Full `scaffold.runtime` — owner/CI only; no serialized token granted.
- Dynamic app naming/content and new page flags — linked sibling issues.

### Contributor Path

Add a UI subcommand under `public/features/ui/<verb>`, expose the shared `--app` and
`--project-root` options, resolve through the injected UI app-root resolver, and add it to the
cross-command help/destination tests. E2E assertions run from `apps/${ASPIRE_RESOURCE.APP}`.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-09 | 0 | bootstrap | Clean branch at `origin/main@1395f3989`; live issue and doctrine re-baselined. |
| 2026-08-09 | 0 | PLAN-EVAL | N/A recorded before implementation; mechanical contract, mandatory IMPL-EVAL retained. |
| 2026-08-09 | 0 | Tier-D identity | Thread id recorded; runtime controller reported `missing_identity` exit 3, so no daemon/mobile claim. |
| 2026-08-09 | 1 | pre-fix RED | UI command behavior: `0 passed / 5 failed`, raw exit 1. Sole-app and cwd cases wrote the workspace; `--app` exited 2 as unknown; multi-app succeeded instead of rejecting; all-five help assertion failed. |
| 2026-08-09 | 1 | pre-fix RED | Corrected E2E discriminator: `0 passed / 2 failed`, raw exit 1. Old workspace layout was accepted (actual 0, expected 1), and install cwd was `/repo` rather than the generated workspace. |
| 2026-08-09 | 1 | implementation | Added one injected application resolver; wired all five commands and their shared `--app` option; corrected every UI AI gate cwd to `apps/dashboard`. |
| 2026-08-09 | 1 | path audit | Moving the MCP widget gate exposed its local module path as another cwd-relative consumer; changed it to `../../packages/ai/mcp.ts` and locked both local paths in the gate test. |
| 2026-08-09 | 1 | docs verification | Both issue-named how-tos already state the intended `apps/dashboard` paths and `--app dashboard` command; preserved them byte-identical per D6. |
| 2026-08-09 | 1 | CI repair | `check-test` exposed ANSI-sensitive help matching. Normalized all five `getHelp()` values with `stripAnsiCode` while retaining the exact `--app <name>` assertion. |
| 2026-08-09 | 1 | mutation control | A detached scratch copy with only `ui:init`'s `--app` registration removed failed the normalized assertion: 0 passed / 1 failed, raw exit 1. Scratch worktree removed afterward. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Direct `apps/<name>` candidates | Matches generated workspace and issue contract | issue #1356; scaffold plan |
| Ambiguity is an error | Prevents silent writes | acceptance row 4 |
| E2E app constant | Avoids duplicating default name | `ASPIRE_RESOURCE.APP` |

## Gate Results

| Gate | Command | Result |
| --- | --- | --- |
| Pre-fix command behaviors | `deno test --no-lock --allow-all packages/cli/src/public/features/ui/ui-app-root-command_test.ts` | **RED**, exit 1; 0 passed / 5 failed for the five distinct old behaviors. |
| Pre-fix corrected E2E discriminator | `deno test --no-lock --allow-all packages/cli/e2e/tests/application/gates/scaffold/ui-ai-gates_test.ts` | **RED**, exit 1; 0 passed / 2 failed after correcting a test import-path defect. |
| Focused CLI/UI/E2E | `deno test --no-lock --allow-all packages/cli/src/public/features/root/public-command-tree_test.ts packages/cli/src/public/features/ui/ packages/cli/src/kernel/application/ui/ packages/cli/e2e/tests/application/gates/scaffold/ui-ai-gates_test.ts` | PASS, exit 0; 36 passed / 0 failed. |
| Five real help surfaces | local `netscript.ts <ui-command> --help` loop | PASS, exit 0; all five individual commands exited 0 and printed `--app <name>`. |
| Scoped check | `run-deno-check.ts --root packages/cli --ext ts,tsx --deno-arg --no-lock --pretty` | PASS, exit 0; 829 files / 7 batches / 0 findings. |
| Scoped lint | `run-deno-lint.ts --root packages/cli --ext ts,tsx --pretty` | PASS, exit 0; 829 files / 5 batches / 0 findings. |
| Scoped format | `run-deno-fmt.ts --root packages/cli --ext ts,tsx --pretty` | PASS, exit 0; 829 files / 5 batches / 0 findings. |
| Quality | `deno task quality:scan` | PASS, exit 0; `findings=[]`, 7 pre-existing allowances. |
| Doctrine aggregate | `deno task arch:check` | PASS, exit 0; existing catalog/doctrine warnings only. |
| Extra CLI doctrine diagnostic | `check-doctrine.ts --root packages/cli` | NON-DECISIVE RED, exit 1; known global Restructure debt (`FAIL=50 WARN=51 INFO=1`), not widened here. |
| Lock/manifest hygiene | `git diff -- deno.lock '**/deno.json'` | PASS, exit 0; empty. |
| Full runtime | prohibited locally | NOT_RUN; no serialized token, owner/CI supplies live row 9 evidence. |
| ANSI-independent help regression | `env -u NO_COLOR deno test --no-lock --allow-all --filter "every ui command help documents --app" packages/cli/src/public/features/ui/ui-app-root-command_test.ts` in a TTY | PASS, exit 0; 1 passed / 0 failed. |
| Missing-option mutation | same filtered test in detached scratch after deleting only `ui:init`'s `.option("--app …")` | EXPECTED RED, exit 1; 0 passed / 1 failed, exact placeholder assertion named `ui:init`. |
| CI-repair focused file | `deno test --no-lock --allow-all packages/cli/src/public/features/ui/ui-app-root-command_test.ts` | PASS, exit 0; 7 passed / 0 failed. |
| CI-repair scoped check/lint/fmt | package wrappers over 829 TS/TSX files | PASS, exits 0; 0 findings in every wrapper. |

## Handoff Notes

- IMPL-EVAL must independently inspect the pre-fix RED transcript, row-4 real process
  exit/candidate list, five help surfaces, scratch old-layout E2E discriminator, and both corrected
  local-source relative paths.
- Do not accept local green gates as Tier-D self-certification.
