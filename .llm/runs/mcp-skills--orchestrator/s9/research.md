# Research — S9 agent tooling polish

## Re-baseline

- Mandatory preflight passed: `cf55fe69` is an ancestor of baseline `c6f9162`, and
  `packages/cli/src/public/features/agent/agent-group.ts` exists.
- The branch already contains S1–S8: `@netscript/mcp` exposes 13 immutable tool definitions,
  `netscript agent mcp` composes real CLI adapters, and `netscript agent init` installs host config
  and the embedded skill bundle.
- The carried design in `../design.md` remains directionally accurate, but source is authoritative
  for final tool descriptions, endpoint behavior, command policy, and installer output.

## Findings

1. `packages/mcp/src/application/tool-registry.ts` is the authoritative 13-tool inventory and
   bounded-output wording.
2. `packages/mcp/cli.ts` is the public composition root. It exposes `McpCliOptions` seams for the
   command catalog, executor, policy, project doctor, project root, docs root, and endpoint.
3. Endpoint discovery is implemented by the telemetry adapter; docs must describe the actual chain,
   not the earlier design shorthand.
4. `initAgent` writes Claude `.mcp.json`, Claude skill files plus a marked `AGENTS.md` section, and
   VS Code `.vscode/mcp.json`; autodetection falls back to both hosts.
5. `execute_command` uses `DEFAULT_COMMAND_POLICY`, returns a structured `command_denied` failure,
   and only invokes the executor after an allow decision.
6. The existing CLI E2E package is optimized for scaffold capability suites. A single protocol smoke
   has no scaffold graph and belongs as a focused test under `packages/cli/e2e/tests/agent/`,
   runnable standalone with `deno test`.
7. The root provides `doc:lint`, `publish:dry-run`, scoped check/lint/fmt wrappers, and the
   per-package JSR fitness script required by the requested audit.
8. `packages/cli/README.md` exists. `packages/mcp/README.md` is currently minimal and must document
   the public composition surface and required permissions/data boundary.

## JSR surface scan

- `packages/mcp/deno.json` has scoped name, description, two exports, publish include/exclude rules,
  and no new dependency is needed.
- Both export entrypoints carry `@module` docs. The full export map must be checked with
  `deno task doc:lint --root packages/mcp --pretty` and the repo JSR audit script.
- Risks: undocumented exported symbols, slow types, or an unintended publish file list. Trivial
  documentation findings are in scope; structural public-API changes are debt unless essential.

## Open questions resolved by the plan

- Page location: `docs/site/capabilities/agent-tooling.md`, matching a user-facing capability page.
- Smoke placement: focused CLI E2E test, not a new scaffold suite.
- Full `scaffold.runtime`: explicitly excluded because the user requested the cheap smoke only.
