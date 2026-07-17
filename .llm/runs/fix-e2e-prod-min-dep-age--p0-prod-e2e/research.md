# Research

## Baseline

The branch and `origin/main` both resolve to `8a8a95377a1b3714c5407959bc46eeb1489dbdb1`.
The supplied production failure is consistent with Deno 2.9's default minimum dependency age:
the exact freshly published `@netscript/plugin-ai` version exists, but `deno x` refuses it during
the release-day window.

## E2E command sweep

- `src/application/gates/scaffold/plugin-install-gates.ts` builds the published AI lifecycle
  command directly as `deno x -A jsr:@netscript/plugin-ai@<release>/cli ...`; it is the one
  published NetScript JSR execution missing `--minimum-dependency-age=0`.
- `gate-factory.ts` already adds the override to published `jsr:@netscript/cli` runs and to raw
  generated-workspace Deno subcommands in JSR mode.
- `prepare-flow-b-fixture.ts` already adds the override to its published workers CLI and services
  resolution paths.
- Other `deno run` arrays under the suite execute local files and therefore are not published
  `jsr:@netscript/*` targets.
- `README.md` describes public plugin dispatch but does not document why release E2E disables the
  minimum-age guard.

## Deferred user-facing window

The shipped CLI has the same fresh-release exposure, intentionally not fixed in this slice:

- `packages/cli/src/public/features/plugins/dispatch/dispatch-plugin-verb.ts:102` builds
  `['x', '-A', resolvePluginCliSpecifier(...), ...]`.
- `packages/cli/src/public/features/plugins/ai/ai-plugin-command.ts:101` builds
  `['x', '-A', AI_CLI_SPECIFIER, ...]`.
- `packages/cli/src/public/features/agent/init/init-agent.ts:119` writes host MCP configs using
  `deno run -A jsr:@netscript/cli@<release> agent mcp ...` without an age-policy decision.

This requires a product policy decision rather than silently disabling the supply-chain default
for all users.

## Public/publish surface scan

No package export, dependency, manifest, or published API changes are planned. JSR slow-type and
export-map risk is N/A; this changes only internal E2E command construction, its unit assertion,
documentation, and harness evidence.

