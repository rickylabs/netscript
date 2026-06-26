# Worklog — Fix prod CLI config-loader resolution

## Design

### Public Surface

- Public CLI behavior affected: `netscript plugin list`, plugin doctor/host
  config loading, runtime schema generation, and deploy build config loading.
- Package exports affected: none planned.
- Binary permissions: child process uses Deno via the CLI process adapter;
  public install/dev commands already run with full permissions in existing
  workflows.

### Domain Vocabulary

- `ProjectConfigLoader`: CLI-owned adapter function that loads a validated
  `NetScriptConfig` from a project root.
- `ProjectConfigLoadOptions`: `{ projectRoot: string; configFile?: string }`.
- `ProjectConfigLoadResult`: parsed `NetScriptConfig`.
- `ProcessPort`: existing command execution port used by the adapter.

### Ports

- Consumed port: `ProcessPort.exec(command, args, { cwd })`.
- No new public port is required for this slice; tests can use an in-memory
  `ProcessPort`.

### Constants

- Loader stdout protocol: one JSON document on stdout.
- Child command when `deno.json` exists:
  `deno run --allow-all --minimum-dependency-age=0 --config <projectRoot>/deno.json <loader>`.
- Child command when `deno.json` is absent:
  `deno run --allow-all --minimum-dependency-age=0 <loader>`.
- Child loader entrypoint:
  `packages/cli/src/kernel/adapters/config/project-config-loader-child.ts`.
- Parent adapter:
  `packages/cli/src/kernel/adapters/config/project-config-loader.ts`.
- Config search order: preserve `@netscript/config` behavior for
  `netscript.config.ts`, `.js`, and `.mjs`; explicit config files remain
  supported through loader options.

### Commit Slices

1. S1 project-root config loader adapter
   - Introduce the CLI adapter and tests.
   - Replace direct CLI config-loading call sites with the adapter.
   - Run targeted validation and local repro.

### Deferred Scope

- Keep `@netscript/config` unchanged.
- No custom config extension expansion beyond the current `@netscript/config`
  contract.
- Do not run the expensive release-only `e2e-cli-prod`; record that alpha.9
  release verification remains authoritative.

### Contributor Path

A contributor debugging CLI config loading starts in
`packages/cli/src/kernel/adapters/config/project-config-loader.ts`, then follows
call sites through
`packages/cli/src/public/features/root/public-command-dependencies.ts` and the
plugin list command factory.

## Log

- Bootstrapped harness run and read required skills, doctrine, archetype, gates,
  and focused CLI/config code.
- PLAN-EVAL attempt 1 returned `FAIL_PLAN`; revised plan preserves config
  extension compatibility, locks concrete S1 paths, and accounts for Archetype 6
  gates.
- Implementation uses child `--allow-all` to preserve the installed CLI
  permission posture; this is a documented permission decision, not drift.
- Implemented `project-config-loader.ts` and `project-config-loader-child.ts`.
  The parent adapter runs `deno run --allow-all --minimum-dependency-age=0`,
  adds `--config <projectRoot>/deno.json` only when the project config exists,
  reads JSON from stdout only, and treats stderr as diagnostics.
- Rewired public/local plugin list, plugin host/doctor/runtime-schema dependency
  loading, plugin registry fallback loading, and deploy config loading through
  the project-rooted adapter.

## Validation

| Gate | Result | Evidence |
| --- | --- | --- |
| PLAN-EVAL | PASS | Attempt 2 in `plan-eval.md`. |
| Targeted `deno check` | PASS | `deno check --unstable-kv` on project loader, config adapters, public/local plugin groups, and root dependencies exited 0. |
| Loader/plugin tests | PASS | `deno test --allow-all packages/cli/src/kernel/adapters/config/project-config-loader_test.ts packages/cli/src/kernel/adapters/config/plugin-registry.test.ts` — 7 passed / 0 failed. |
| Focused lint | PASS | `deno lint --no-config` on 9 touched CLI files exited 0. The repo lint wrapper cannot lint `packages/cli` because workspace config excludes that package and reports “No target files found” / nonzero with zero findings. |
| Focused fmt | PASS | `deno fmt --check` with repo-style inline fmt config on 9 touched CLI files exited 0. The repo fmt wrapper has the same `packages/cli` workspace-exclude limitation and returns nonzero with zero findings. |
| Scoped CLI check wrapper | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx --pretty` — 524 files, 5 batches, 0 failed, 0 occurrences. |
| Local prod-mode repro | PASS | Public CLI scaffolded `.llm/tmp/prod-d1-repro/prod-d1-app` in JSR import mode; `plugin list` from inside the project and from repo root with `--project-root` both exited 0 and printed `No plugins configured.` |
| `deno task publish:dry-run` | PASS | Exit 0. Existing dynamic-import / slow-type warnings remained; dry run completed successfully. |
| `deno task arch:check` | BLOCKED_UNRELATED | Exited 1 before doctrine checks on pre-existing `DEPS-JSR-CENTRALIZATION` failures for divergent `@netscript/aspire` and `@netscript/plugin` ranges. No dependency ranges were changed by this slice. |
| Local `scaffold.runtime` smoke | PASS | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` — 47 passed / 0 failed, including `scaffold.plugin-list`, generated checks, Aspire startup, behavior probes, and cleanup. |

## Release Gate

The defect is not finally closed until alpha.9 is published and the release-triggered
`e2e-cli-prod` gate is GREEN against the freshly published prerelease.
