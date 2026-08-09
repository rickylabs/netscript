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

See the ordered S0–S5 table in `plan.md`. S1 distinguishes its compile-time and behavioral REDs;
every implementation file must trace to the identity,
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
| PLAN-EVAL cycle 1 | separate Claude · Fable 5 evaluation | 1 (`FAIL_PLAN`) | F1 false equality authority blocked; F2–F4 required path, RED-class, and denial-policy corrections. One cycle remains. |
| PLAN-EVAL cycle 2 | separate Claude · Fable 5 evaluation | 0 (`PASS`) | All repairs independently verified; implementation authorized with per-RED-class raw-exit binding. |
| S1 compile-time RED | `deno check --unstable-kv --no-lock packages/cli/src/public/features/agent/mcp/cli-mcp-adapters_test.ts` | 1 | Expected TS2554 (host-runtime third argument absent) and TS2339 (`CommandExecutorPort.identity` absent). This intentionally leaves branch type-check red only until S2. |
| S1 behavioral RED | `deno test --no-lock --allow-all packages/mcp/tests/drift-evidence_test.ts --filter "successful execute_command receipt"` | 1 | Command returned success, but receipt command was `undefined` instead of `mcp execute_command`; proves the unwrapped execute→drift gap. |
| S1 characterization | `deno test --no-lock --allow-all packages/mcp/tests/command_adapters_test.ts --filter "published CLI prefix by default"` | 0 | Existing standalone fallback is already `jsr:@netscript/cli@${MCP_PACKAGE_VERSION}`; 1 passed, 0 failed. Not RED. |

## Phase status

`PLAN-EVAL: PASS cycle 2`. S1 RED/characterization evidence recorded separately. The committed S1
compile-time RED is an intentional intermediate state and S2 must restore it before S3 begins.
