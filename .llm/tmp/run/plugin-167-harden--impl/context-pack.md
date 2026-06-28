# Context Pack — plugin scaffold core centralization

- Task: #157, user-declared pre-release blocker.
- Branch: `chore/plugin-167-harden`.
- PR: #170.
- Implementation session: WSL Codex, daemon-attached.
- Plan authority: `.llm/tmp/run/plugin-167-harden--impl/plan-scaffold-core.md`.
- PLAN-EVAL: PASS_PLAN from OpenHands minimax-M3, run `28329181305`.

## Slice Commits

- C1 `ec769454`: `feat(plugin): add scaffold value surface`
- C2 `b0d959df`: `feat(plugin): centralize scaffold manifest builder`
- C3 `72fa9147`: `feat(plugin): add scaffold base and cli runner`
- C4 `7fd926d9`: `refactor(plugins): migrate workers and streams scaffolders`
- C5 `a55d2190`: `refactor(plugins): migrate sagas triggers and auth scaffolders`
- C5b `bdd95445`: `feat(plugin): extract scaffold skeleton helpers`
- C6 final verification evidence commit: this commit.

## Final State

- New public export: `@netscript/plugin/scaffold`.
- Core owns scaffold value types, schema URL generation, manifest generation, filesystem-backed
  base scaffolder, CLI `--context-json` runner, generated-plugin `deno.json` envelope, and standard
  root artifact trio.
- Workers, streams, sagas, triggers, and auth expose thin `./scaffold` surfaces through
  `toEntrypoint(...)` and core `runScaffoldCli(...)`.
- Plugin-local `files.ts` / `writePlannedFiles` adapters were removed.
- Plugin-local hand-rolled casing helpers were removed; generated scaffolders import `@std/text`
  directly where casing is needed.
- The five committed `plugins/*/scaffold.plugin.json` files stayed byte-unchanged.

## Drift / Debt

- `drift.md` records the C5b byte-stability boundary: auth keeps its published-package
  `deno.json` template because centralizing it through the generated-plugin envelope would change
  package name/version, publish config, compiler options, and task fields.
- No new architecture debt was added for the scaffold-core implementation.

## Final Gate Results

- `deno task plugins:check`: PASS.
- `deno task arch:check`: PASS, warnings only.
- Full scaffold doc lint over all `packages/plugin/src/scaffold/*.ts`: PASS, 8 files checked.
- Scoped check/lint/fmt on `packages/plugin` + `plugins`: PASS, 420 TS/TSX files selected.
- `deno task test`: PASS, 935 passed, 0 failed, 12 ignored.
- `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`: PASS, passed=48 failed=0.
- Publish dry-runs for `@netscript/plugin` and all five plugins: PASS, existing dynamic-import
  warnings only.
- Lock hygiene: PASS, `deno.lock` restored to HEAD and not committed.
