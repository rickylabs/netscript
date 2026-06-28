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
- C7a `b6d38104`: `fix(plugin): harden scaffold core entrypoint`
- C7b `ce64a2bf`: `feat(plugin): centralize auth scaffold deno config`

## Final State

- New public export: `@netscript/plugin/scaffold`.
- Core owns scaffold value types, schema URL generation, manifest generation, filesystem-backed
  base scaffolder, CLI `--context-json` runner, generated-plugin `deno.json` envelope, and standard
  root artifact trio.
- C7 kept the abstract `PluginScaffolder` base per supervisor disposition, removed the concrete
  filesystem adapter default from the base constructor, and constructs `DenoFileSystemAdapter` at
  the `toEntrypoint` composition edge.
- Core now owns the shared `options.pluginName` parser/validator as `readScaffoldPluginName(...)`.
- Core `buildPluginDenoJson(...)` now accepts auth's package metadata, publish filters, task/import
  map, and compiler-option data while preserving previous auth generated `deno.json` bytes.
- Workers, streams, sagas, triggers, and auth expose thin `./scaffold` surfaces through
  `toEntrypoint(...)` and core `runScaffoldCli(...)`.
- Plugin-local `files.ts` / `writePlannedFiles` adapters were removed.
- Plugin-local hand-rolled casing helpers were removed; generated scaffolders import `@std/text`
  directly where casing is needed.
- The five committed `plugins/*/scaffold.plugin.json` files stayed byte-unchanged.

## Drift / Debt

- `drift.md` records C7 dispositions: Finding 1 was narrow hardening only, Finding 2 was a false
  positive documented in JSDoc with no behavior or manifest-byte change, and C7b superseded the C5b
  auth `deno.json` boundary by centralizing it byte-stably.
- No new architecture debt was added for the scaffold-core implementation.

## Final Gate Results

- `deno task plugins:check`: PASS.
- `deno task arch:check`: PASS, warnings only.
- Full scaffold doc lint over all `packages/plugin/src/scaffold/*.ts`: PASS, 10 files checked.
- Scoped check/lint/fmt on `packages/plugin` + `plugins`: PASS, 421 TS/TSX files selected.
- `deno task test`: PASS, 939 passed, 0 failed, 12 ignored.
- `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`: PASS, passed=48 failed=0.
- Publish dry-runs for `@netscript/plugin` and all five plugins: PASS, existing dynamic-import
  warnings only.
- Lock hygiene: PASS, `deno.lock` restored to HEAD and not committed.
