# Research

Run id: `feat-e2e-cli-prod-local--prod-suite`

## Scope

This slice changes the CLI e2e harness and GitHub Actions coverage for a prod-local mode:
local public CLI binary, generated workspace dependencies from JSR.

## Re-baseline

- Branch: `feat/e2e-cli-prod-local`.
- Upstream: intentionally none per user brief.
- Pre-existing unrelated drift exists under `.llm/tmp/run/openhands/**/request.md`; leave unstaged.
- PLAN-EVAL is waived by the user for velocity.

## Findings

- The public binary is `packages/cli/bin/netscript.ts`; the maintainer/contributor binary is
  `packages/cli/bin/netscript-dev.ts`.
- The current e2e default CLI entrypoint is the contributor binary via
  `packages/cli/e2e/src/application/builders/workspace/workspace-options.ts`.
- `--source jsr` currently fails unless `cliEntrypoint` starts with `jsr:@netscript/cli@`, blocking
  local public-bin prod-local runs.
- `denoCommand` already adds `--minimum-dependency-age=0` whenever
  `packageSource === PACKAGE_SOURCE.JSR`, so generated workspace checks can resolve freshly
  published JSR packages.
- Plugin add gates already route through `cli(context, ...)` for JSR source mode, so the public
  entrypoint is honored in prod-local mode.
- The published-CLI workflow is separate and must remain unchanged because it exercises the CLI
  loaded from JSR/HTTPS.

## JSR Surface Scan

This is not a JSR publishability/package-surface slice. It validates resolution of already-published
`@netscript/*` packages from JSR and does not edit package exports, `mod.ts`, or publish metadata.
The relevant JSR risk is version pinning: generated workspaces import the CLI version from
`deno.json`, so the mode is expected to pass only when that version has already been published.

## Open Questions

None blocking. The requested future `--package-version` override is out of scope.
