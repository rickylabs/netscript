# Worklog: W3-B3 #1376

## Design

### Public surface

- One immutable execution identity: hosting mode, CLI version, resolved executor prefix.
- `list_commands` returns catalog rows plus that identity.
- `execute_command` accepts optional `resource` and returns command evidence plus that identity.
- No new entrypoint, tool name, command verb, dependency, or export-map key.

### Domain vocabulary and ports

- `CliExecutionIdentity`: truthful fixed child-command identity.
- `CommandExecutorPort`: executes and exposes the identity it will use.
- `DiagnosticEvidencePort`: existing receipt persistence; no new persistence abstraction.

### Constants

- Host version: existing `CLI_PACKAGE_VERSION`.
- Standalone pin/version: existing `DEFAULT_CLI_COMMAND` and `MCP_PACKAGE_VERSION`.
- Hosting modes: finite `host | standalone` values defined with the identity contract.

### Commit slices

See the ordered S0–S5 table in `plan.md`. Every implementation file must trace to the identity,
receipt, schema, host composition, test, or published-contract concepts named there.

### Deferred scope

Issue #1375 docs-root work, command-policy changes, installed consumer canary, adoption measurement,
release operations, and serialized runtime execution without a token.

### Contributor path

Start at the MCP executor port to understand identity, follow it to the spawn adapter and
`createMcpCliServer` composition, then inspect the CLI-only injection in `run-agent-mcp.ts`. Tests
mirror standalone, host, success, failure, and denial modes.

## Evidence

| Phase | Command | Exit | Result |
| --- | --- | ---: | --- |
| Bootstrap | `deno task agentic:gh-token check` | 0 | GitHub identity resolved as `rickylabs`; token not printed. |
| Baseline | ground-truth git status/log | 0 | clean branch at `aa8e151e6`. |
| Research | live GitHub issue search for #1376 | 0 | ten acceptance rows and boundaries copied verbatim into plan. |

## Phase status

`PLAN-EVAL: REQUESTED`. Product implementation is prohibited until a separate Claude · Fable 5
session writes `plan-eval.md` with `PASS`.
