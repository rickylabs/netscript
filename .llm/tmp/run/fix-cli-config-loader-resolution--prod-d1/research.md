# Research — Fix prod CLI config-loader resolution

## Scope

- Branch: `fix/cli-config-loader-resolution`
- Run: `.llm/tmp/run/fix-cli-config-loader-resolution--prod-d1/`
- Surface: `packages/cli` public command config loading, with `packages/config`
  public API treated as a consumed contract.
- Archetype: `@netscript/cli` is Archetype 6 (CLI / Tooling);
  `@netscript/config` remains Archetype 1 (Small Contract).

## Re-baseline

The carried-in defect diagnosis matches the current tree:

- `@netscript/config` exports
  `loadConfig(options?: LoadConfigOptions): Promise<NetScriptConfig>` from
  `packages/config/loader.ts`. It resolves `cwd`, finds `netscript.config.*`,
  and then performs in-process dynamic `import(fileUrl)`.
- `packages/cli/src/public/features/root/public-command-dependencies.ts` imports
  `loadConfig` directly and uses it for plugin host loading, plugin doctor, and
  runtime schema generation.
- `packages/cli/src/public/features/plugins/list/list-plugins-command.ts`
  imports `loadConfig` directly, so `netscript plugin list` bypasses the public
  dependency graph.
- `packages/cli/src/kernel/adapters/config/plugin-registry.ts` defaults to
  direct `loadConfig({ cwd: projectRoot })` when no config is provided.
- `packages/cli/src/kernel/adapters/config/deploy-config.ts` imports
  `loadConfig as loadNetScriptConfig` and uses it while building deploy config.

The tree therefore still has remote-CLI graph-root config loading paths that can
ignore the generated project `deno.json` import map.

## Public Surface Scan

`deno doc --filter loadConfig packages/config/mod.ts` confirms `loadConfig` is a
published `@netscript/config` function documented as a pure config loader for
the current process. This slice does not change `@netscript/config` exports,
`packages/config/deno.json`, or package subpaths.

Planned JSR impact:

- `@netscript/config`: no public surface or publish config change; no
  subprocess/`--allow-run` permission added.
- `@netscript/cli`: public binary behavior changes, but no new exported library
  symbol is planned.
- Publish risk is limited to the CLI package gaining a child Deno invocation in
  an allowed adapter path.

## Findings

1. Deno uses one import map for the process module graph. A dynamic import of
   `<projectRoot>/netscript.config.ts` from a `jsr:@netscript/cli` graph does
   not switch to `<projectRoot>/deno.json`.
2. The validated fix shape is to invoke
   `deno run --config <projectRoot>/deno.json` with `cwd = projectRoot` and a
   loader entrypoint that imports the authored project config locally.
3. Existing CLI doctrine allows process execution in
   `packages/cli/src/kernel/adapters/**`; moving subprocess behavior into
   `@netscript/config` would deepen Archetype 1 by adding process IO and an
   `--allow-run` concern to a small contract package.
4. `ProcessPort` and `DenoProcess` already provide shell-free command execution
   with captured `stdout` and `stderr`, which satisfies the Windows quoting
   requirement when args are passed as an array.
5. `defineConfig` returns a validated `NetScriptConfig` plain object today.
   `NetScriptConfigSchema.parse` is the normalization boundary; the child loader
   can parse and `JSON.stringify` that validated value. Functions and symbols
   are outside the current schema contract.
6. Existing `@netscript/config` search semantics include `netscript.config.ts`,
   `netscript.config.js`, and `netscript.config.mjs`, plus explicit
   `configFile`. The CLI adapter must preserve that compatibility instead of
   narrowing to TypeScript-only config.

## Open Questions

- None blocking. The child should pass `--minimum-dependency-age=0` to match
  prerelease prod E2E behavior and avoid the just-published prerelease age gate
  when the child resolves project imports.
