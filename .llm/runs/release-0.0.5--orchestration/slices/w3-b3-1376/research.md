# Research: truthful MCP host CLI execution (#1376)

## Baseline

- Branch is clean at `aa8e151e6`, the assigned `origin/main` baseline.
- Live issue #1376 was read on 2026-08-09. Its evidence remains true at this baseline.
- `packages/mcp/src/infrastructure/spawn-command-executor.ts` defaults to
  `deno run -A jsr:@netscript/cli@${MCP_PACKAGE_VERSION}`.
- `packages/cli/src/public/features/agent/mcp/run-agent-mcp.ts` constructs the executor without an
  override and builds the catalog with `version: "current"`.
- `packages/mcp/cli.ts` receipt-wraps the other diagnostic/read flows, but directly binds
  `list_commands` and `execute_command`.
- The current command result and tool output schema expose exit/duration/output bounds, but no
  executor command or CLI version.
- `execute_command` has no `resource` input. The generic receipt wrapper therefore cannot associate
  an execution with a named drift resource except by its `project` fallback.
- An allowed child process with a non-zero exit currently returns an `ok: true` flow result. Receipt
  success must therefore be based on the child exit code, not merely flow transport success.
- CLI runtime code already distinguishes script mode from `deno compile`: compiled binaries re-enter
  through `Deno.execPath()`; script/installed-shim runs re-enter through
  `[Deno.execPath(), "run", "-A", Deno.mainModule]`.

## Public and publish surfaces

- Affected published surfaces: `@netscript/mcp` exports `.`, `./cli`, and
  `./openapi-projection`; `@netscript/cli` hosts MCP from its public command tree.
- Archetype: A6 CLI/tooling. The change is composition and adapter identity, not a new command or
  extension axis.
- Doctrine constraints: A1 public result contract first; A6 no cosmetic helper; A10 composition
  root injects the host adapter; A14 tests and publish gates preserve the contract.
- JSR risk: changes to exported result/option types require explicit annotations, JSDoc, full
  export-map doc lint, and publish dry-run. No dependency or export-map change is planned.
- Standalone policy: `deno x jsr:@netscript/mcp/cli` has no host CLI. It intentionally selects the
  published CLI compatibility version equal to `MCP_PACKAGE_VERSION`, even if CLI and MCP package
  versions are independently changed in the future. The identity is surfaced as `standalone`, so
  this MCP-owned compatibility choice is visible rather than accidental.
- `generate-publish-assets.ts` reads the CLI and MCP manifests independently and asserts no
  equality. Versions agree in current releases because `.llm/tools/deps/bump-version.ts` rewrites
  every workspace manifest together and release readiness runs the `lockstep-residue` audit. That
  release mechanism is contextual evidence, not a runtime or generation equality guarantee.

## Scope boundary

Issue #1375 owns docs-root composition in the same `run-agent-mcp.ts`. This slice will not touch
`--docs-root`, `writeHostConfig`, `NETSCRIPT_DOCS_ROOT`, or the docs corpus. If
`run-agent-mcp.ts` changes, its edit is restricted to version and executor injection. The MCP
package README may document hosting-mode executor identity because #1376 explicitly requires that
published consumer contract; it will not alter corpus wiring.

## Baseline proof strategy

S1 contains two explicitly different RED classes:

- **Compile-time RED:** the mismatched-version host test names the planned execution-identity input
  and output fields. On the baseline those types/fields do not exist, so targeted type-check must
  fail before the product contract is added. After S2 compiles, the test becomes the decisive
  behavioral proof in S3 by executing a temporary host entrypoint with a deliberately different
  version and observing that identity in both tools.
- **Behavioral RED:** the existing types suffice to execute an allowed command and then call
  `record_drift`. On the baseline `execute_command` is unwrapped, so no receipt exists and drift is
  refused. The same behavioral fixture also proves denial/failure overwrite behavior after S4.

Each raw command, exit code, and expected failure reason is recorded in `worklog.md` before product
implementation. Standalone fallback is a baseline characterization test, not mislabeled as RED.
