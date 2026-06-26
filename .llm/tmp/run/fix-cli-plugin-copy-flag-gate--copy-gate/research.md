# Research — fix-cli-plugin-copy-flag-gate--copy-gate

## Origin

User concern (verbatim): reviewing maintainer-scaffolded output showed the workflow copies the
**whole plugin** as a userland `plugins/<name>/` dir. For maintainer that "could make sense, yet it
should be optional and behind a flag"; **in prod the `plugins/` dir should not be surfaced (copied)
into userland.** Investigation ran via a Claude Explore agent (cli/aspire skills) against `main`
@ `98b087ef` (alpha.4).

## Verdict (grounded)

There are two fully separate code paths. **Prod is already correct; only the maintainer/local path
copies source, and it does so unconditionally.**

### PUBLIC path — `netscript plugin add` (prod / JSR)

- `packages/cli/src/public/features/plugins/add/render-plugin.ts:41,61,89` — `importMode: 'jsr'`
  **hardcoded** (no flag, no branch).
- JSR mode routes through `packages/cli/src/kernel/adapters/plugin/scaffolder.ts:51-196`
  `PluginScaffolder.scaffold()`, which only **generates thin stub files** (`mod.ts`, `deno.json`,
  router/service entry, db schema templates). The generated `mod.ts` imports from JSR
  (`generate-plugin-mod.ts:49` → `import { definePlugin } from '@netscript/plugin'`).
- **Never invokes `copyPlugin()`.** No plugin SOURCE tree is copied. ✔ matches the prod guarantee.
- Test already asserts JSR import shape: `add-plugin_test.ts:71`
  (`imports['@netscript/plugin']` includes `jsr:@netscript/plugin`).

### LOCAL path — `netscript-dev plugin add` (maintainer / contributor)

- `packages/cli/src/local/features/plugins/add/add-local-plugin.ts:173,208,316` — `importMode:
  'local'`.
- Decision point `add-local-plugin.ts:189` (`maybeCopyOfficialPlugin` returns true for canonical
  official plugins) → **unconditional** copy at `:254`:
  ```ts
  const result = await copyPlugin({ sourceRoot, targetPath: plan.projectRoot, …, importMode: 'local', force: plan.overwrite, includeSamples: plan.includeSamples });
  ```
- `copyPlugin` → `packages/cli/src/maintainer/features/sync/plugin/copy-official-plugin.ts:94-104`
  `copyPluginDirectory(...)` → `packages/cli/src/maintainer/adapters/plugin-file-collector.ts:50-62`
  `copyDirectoryFiltered({ source: <repo>/plugins/<dir>, dest: <project>/plugins/<dir>, skipDirs:
  SKIP_DIRS, skipFileSuffixes: TEST_FILE_SUFFIXES })` — copies the whole filtered source tree into
  userland `plugins/<name>/`.
- For **non-canonical** plugin names the local path already falls back to thin-stub generation
  (same `PluginScaffolder`). So source-copy only happens for the official set.

## Findings table

| # | Finding | Anchor |
| - | ------- | ------ |
| 1 | Public command hardcodes `importMode:'jsr'`, no copy-mode flag | `render-plugin.ts:41,61,89` |
| 2 | JSR mode = stub generation only, never `copyPlugin()` | `kernel/adapters/plugin/scaffolder.ts:51-196`; `generate-plugin-mod.ts:49` |
| 3 | Local mode copies full official-plugin source unconditionally | `add-local-plugin.ts:189,254` |
| 4 | Copy mechanism = filtered directory tree copy into `plugins/<dir>` | `copy-official-plugin.ts:94-104`; `plugin-file-collector.ts:50-62` |
| 5 | No CLI option for copy mode anywhere | `add-plugin-command.ts:37-44`; `plugin-kind.ts:118` (`importMode` passed, not CLI-exposed) |
| 6 | Local-mode test asserts local source import (relative path), public asserts JSR | `add-local-plugin_test.ts:76`; `add-plugin_test.ts:71` |
| 7 | e2e `scaffold.plugins` gates exercise `plugin add` per kind | `e2e/.../gates/scaffold/plugin-add-gates.ts:47-57` |
| 8 | Aspire helper regen runs identically in both paths (post-scaffold) | `public/.../add/add-plugin.ts:76-82` |

## Open question carried to plan

The maintainer/local copy **default**: keep current copy-on (opt-out via `--no-copy-source`) vs
flip to copy-off (opt-in via `--copy-source`). This changes contributor DX and is the one decision
the user should confirm at PR review. See plan Locked/Open decisions.
