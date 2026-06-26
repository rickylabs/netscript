# Research

Run: `fix-cli-prod-scaffold-config`

## Scope

- Package: `packages/cli`
- Archetype: 6, CLI/tooling
- User-directed slice: D1 import map, D3 CLI failure exit code proof, D5 Fresh UI embedded registry content lookup.

## Findings

- D1 root cause is in `packages/cli/src/kernel/templates/workspace/deno-json.ts`: JSR mode generated `@netscript/contracts`, `@netscript/kv`, and `@netscript/plugin`, but omitted `@netscript/config` while generated `netscript.config.ts` imports `defineConfig` from `@netscript/config`.
- `SCAFFOLD_PACKAGES.NETSCRIPT_CONFIG` exists in `packages/cli/src/kernel/constants/scaffold/scaffold-packages.ts`, and existing JSR resolver tables already map it to `JSR_SPECIFIERS.config`.
- The generated `netscript.config.ts` template still emitted a stale JSR TODO even though `@netscript/config` is published and should resolve in prod.
- D3 top-level public binary path currently exits through `packages/cli/bin/netscript.ts`; `runPublicCli` formats and rethrows `CliExitError`, and the binary catches it with `Deno.exit(error.exitCode)`. Acceptance should be proven with a real deliberately failing command.
- D5 root cause is in embedded Fresh UI registry content lookup. `FRESH_UI_REGISTRY_CONTENT` is keyed by POSIX-style manifest paths, while OS-aware path normalization can rewrite logical registry keys on Windows.
- Relevant existing debt: broad `@netscript/cli` Archetype-6 restructuring remains accepted doctrine debt. This slice does not deepen it because it changes existing files only and uses `@std/path/posix` rather than introducing local path helpers.

## Gate Selection

- Scoped CLI check/lint/fmt wrappers.
- Concrete prod scaffold proof in `/tmp`: import-map assertion, `plugin list` exit 0, deliberately failing command non-zero.
- Merge-readiness scaffold runtime E2E: `rtk proxy deno task e2e:cli run scaffold.runtime --cleanup --format pretty`.

