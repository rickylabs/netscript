# Plan — Fix prod CLI config-loader resolution

## Archetype And Doctrine

- Selected archetype: Archetype 6 — CLI / Tooling for `packages/cli`.
- Folded contract surface: `@netscript/config` is Archetype 1 — Small Contract
  and remains unchanged.
- Current doctrine verdicts: `@netscript/cli` is `Restructure`;
  `@netscript/config` is `Refactor`.
- Scope overlays: none.
- Relevant anti-patterns: AP-2, AP-11, AP-13, AP-19, AP-25; CLI-specific R-A6-N8
  and F-CLI-16 for `Deno.Command` placement.

## Locked Decisions

1. **Place the project-rooted loader in the CLI kernel config adapter.**
   - Rationale: subprocess loading is process IO and belongs in Archetype 6
     adapter code. Keeping `@netscript/config` pure avoids adding `--allow-run`
     and child-process semantics to a small contract package.
2. **Use a checked-in loader entrypoint run as a local project command.**
   - Rationale: when `<projectRoot>/deno.json` exists, the child process must be
     rooted there. A checked-in CLI loader module can import
     `@netscript/config`, preserve the existing `netscript.config.ts` / `.js` /
     `.mjs` search order through `loadConfig({ cwd })`, validate the authored
     config, and write a single JSON payload to stdout. If `deno.json` is
     absent, the adapter omits `--config` to preserve existing no-config local
     behavior.
3. **Parse stdout only and treat stderr as diagnostics.**
   - Rationale: Deno and package tooling may write download/approval notices to
     stderr. The parent parses only the stdout protocol and includes stderr in
     failure messages, never in JSON parsing.
4. **Pass arguments as arrays through `ProcessPort`.**
   - Rationale: no shell interpolation is needed; this preserves Windows path
     safety.
5. **Use `--minimum-dependency-age=0` in the child.**
   - Rationale: the release gate validates freshly published prereleases. The
     child should not reintroduce the default dependency-age delay while
     resolving project imports.
6. **Preserve config-file compatibility.**
   - Rationale: narrowing CLI config loading to `netscript.config.ts` would
     regress a documented `@netscript/config` capability. The child loader
     accepts an optional `configFile` and otherwise delegates search semantics
     to `loadConfig({ cwd })` from inside the project-rooted graph.
7. **Run the child with `--allow-all`.**
   - Rationale: installed public CLI workflows already run with all permissions,
     and user config files may transitively read env, files, subprocess-backed
     package hooks, or other APIs. Narrowing child permissions would be a new
     behavior change unrelated to the import-map defect.

## Open Decision Sweep

- Broader `@netscript/config` loader redesign: safe to defer. The public package
  API can keep in-process semantics for programmatic consumers; this slice fixes
  CLI prod behavior.

## Risk Register

- Child loader output corrupted by stderr: mitigate by parsing stdout only and
  unit testing stderr noise.
- Non-serializable config values: mitigate by validating with
  `NetScriptConfigSchema.parse` in the child and documenting that schema-backed
  config is declarative JSON-compatible.
- Local/maintainer regression: mitigate by using the child path for CLI calls in
  both modes and running local scaffold/plugin list repro plus the local runtime
  smoke when feasible.
- Process permissions: public CLI is already run with `-A` in prod installs and
  local dev. The child intentionally keeps `--allow-all` so project config
  behavior is not narrowed while only the import-map root changes.

## Gate Set

- Unit tests for the loader adapter: foreign cwd success, missing config
  failure, stderr noise ignored.
- Config compatibility regression: at least one test proves `.js` or `.mjs`
  config-file resolution semantics are preserved, or proves explicit
  `configFile` is honored.
- No-`deno.json` compatibility regression: existing config-registry tests must
  still pass when a temp project contains `netscript.config.ts` but no Deno
  config file.
- Scoped package checks:
  - `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx -- --unstable-kv`
  - `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli --ext ts,tsx`
  - `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli --ext ts,tsx`
- Targeted CLI tests for changed files.
- Archetype 6 gates selected:
  - Static gates: scoped check/lint/fmt above.
  - Universal gates F-1, F-3, F-5, F-6, F-7, F-8, F-9, F-10, F-11, F-12, F-15,
    F-16, F-17, F-18: `deno task arch:check` plus manual evidence for unchanged
    inherited debt where the script reports accepted/open debt.
  - F-2/F-4/F-14: manual evidence for this slice; the new code uses platform
    process execution only through existing `ProcessPort`, adds no classes
    extending external bases, and writes no `console.*` outside output adapters.
  - F-CLI-1 through F-CLI-31: `deno task arch:check` where implemented;
    otherwise `PENDING_SCRIPT` with manual evidence. This slice specifically
    exercises F-CLI-16 by keeping process execution under
    `src/kernel/adapters/config/**` and F-CLI-21 by using role-named
    adapter/test files.
- Local prod-mode repro: scaffold with local CLI in jsr import mode, then run
  `plugin list` from inside the project and via `--project-root` from a foreign
  cwd.
- `deno task publish:dry-run`.
- Final release gate: GREEN `e2e-cli-prod` after alpha.9 is published. This PR
  cannot be called fully closed before that release-triggered run.

## Commit Slices

1. **S1 project-root config loader adapter**
   - Files:
     - `packages/cli/src/kernel/adapters/config/project-config-loader.ts`
     - `packages/cli/src/kernel/adapters/config/project-config-loader-child.ts`
     - `packages/cli/src/kernel/adapters/config/project-config-loader_test.ts`
     - `packages/cli/src/kernel/adapters/config/plugin-registry.ts`
     - `packages/cli/src/kernel/adapters/config/deploy-config.ts`
     - `packages/cli/src/public/features/root/public-command-dependencies.ts`
     - `packages/cli/src/public/features/plugins/list/list-plugins-command.ts`
     - `packages/cli/src/public/features/plugins/plugins-group.ts`
     - `packages/cli/src/local/features/plugins/plugins-group.ts`
     - `.llm/tmp/run/fix-cli-config-loader-resolution--prod-d1/*`
   - Proves: CLI config-loading commands resolve project config under
     `<projectRoot>/deno.json`.
   - Gates: new unit tests, scoped check/lint/fmt, local prod-mode repro.

If implementation discovers another direct CLI
`loadConfig({ cwd: projectRoot })` call site, record drift and add that concrete
file to S1 before editing it.

## Deferred Scope

- No `@netscript/config` public API change.
- No broad CLI folder restructuring beyond the files required to fix the defect.
- No release publication; the supervisor/release flow must publish alpha.9 and
  observe `e2e-cli-prod`.
