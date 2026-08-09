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
| S2 MCP type-check | `deno check --unstable-kv --no-lock packages/mcp/mod.ts packages/mcp/cli.ts ...focused tests` | 0 | Identity contract, composition, and focused tests type-check. |
| S2 CLI identity type-check | `deno check --unstable-kv --no-lock packages/cli/src/public/features/agent/mcp/cli-mcp-adapters_test.ts` | 0 | Restores the intentionally red S1 identity contract. |
| S2 identity tests | `deno test --no-lock --allow-all packages/mcp/tests/command_adapters_test.ts packages/mcp/tests/command_flows_test.ts` | 0 | 9 passed, 0 failed; standalone identity and result identity included. |
| S2 MCP doc lint | `deno task doc:lint --root packages/mcp --pretty` | 0 | Full export map; summary `totalErrors: 0`. |
| S2 exact-file format preflight | `deno fmt --check <10 changed TypeScript files>` | 0 | Changed TypeScript formatted; not substituted for final scoped-wrapper gate. |
| S3 CLI host check | `deno check --unstable-kv --no-lock packages/cli/src/public/features/agent/mcp/run-agent-mcp.ts packages/cli/src/public/features/agent/mcp/cli-mcp-adapters_test.ts` | 0 | Host runtime resolver and composition type-check. |
| S3 decisive host behavior | `deno test --no-lock --allow-all packages/cli/src/public/features/agent/mcp/cli-mcp-adapters_test.ts` | 0 | 4 passed, 0 failed. Temporary `9.9.9-host` entrypoint executed `generate plugins`; list/execute reported host version/command and no JSR CLI prefix. |
| S4 focused MCP tests (first run) | focused drift/command suite | 1 | 23 passed, 1 failed: existing description test required the phrase `bounded combined output tail`; product behavior tests were green. Repaired wording without weakening test. |
| S4 focused MCP tests (final) | `deno test --no-lock --allow-all packages/mcp/tests/{drift-evidence,command_adapters,command_flows,command_composition}_test.ts` | 0 | 24 passed, 0 failed. Success/failure receipt, all five denied commands, drift authorization/refusal, identity, and descriptions green. |
| S4 CLI host regression | `deno test --no-lock --allow-all packages/cli/src/public/features/agent/mcp/cli-mcp-adapters_test.ts` | 0 | 4 passed, 0 failed. |
| S4 publish assets (pre-regeneration) | `deno task check:publish-assets` | 1 | Expected stale `packages/mcp/src/publish-assets.generated.ts` after approved README policy change. |
| S4 publish assets (regenerated) | `deno task gen:publish-assets` then `deno task check:publish-assets` | 0 | Only MCP generated README constant changed; no corpus root/selection/wiring change. |
| S4 focused type-check | `deno check --unstable-kv --no-lock packages/mcp/mod.ts packages/mcp/cli.ts ...focused MCP/CLI tests` | 0 | Receipt/status/schema/documentation changes type-check. |
| S4 MCP doc lint | `deno task doc:lint --root packages/mcp --pretty` | 0 | Full export map; `totalErrors: 0`. |
| S4 MCP package tests | `deno task --cwd packages/mcp test` | 0 | 113 passed, 0 failed. |
| S5 scoped MCP check | package-local `run-deno-check.ts --root . --ext ts,tsx --deno-arg --no-lock --pretty` | 0 | 103 files selected; no occurrences or failed batches. The wrapper supplied `--unstable-kv`. |
| S5 scoped CLI-host check | package-local `run-deno-check.ts --root . --ext ts,tsx --deno-arg --no-lock --pretty` | 0 | 7 files selected; no occurrences or failed batches. The wrapper supplied `--unstable-kv`. |
| S5 scoped MCP/CLI lint | package-local `run-deno-lint.ts --root . --ext ts,tsx --config <package deno.json> --pretty` | 0 each | MCP 103 files and CLI-host 7 files; no lint occurrences. |
| S5 scoped MCP/CLI format | package-local `run-deno-fmt.ts --root . --ext ts,tsx --config <package deno.json> --pretty` | 0 each | MCP 103 files and CLI-host 7 files; no findings or failed batches. |
| S5 wrapper invocation correction | initial root-config lint/fmt and malformed check-argument attempts | 1 | Tool invocation/config parse failures, not product verdicts. Corrected with package-local configs and the two-argument `--deno-arg --no-lock` form; all required wrapper verdicts above are green. |
| S5 framework quality | `rtk proxy deno task quality:gate` | 0 | `quality:scan` found no findings and `arch:check` completed; seven existing inline allowances reported. |
| S5 doctrine fitness | `rtk proxy deno task arch:check` | 0 | Named separately as required; repository warnings remain non-failing and outside this slice. |
| S5 MCP export-map doc lint | `rtk proxy deno task doc:lint --root packages/mcp --pretty` | 0 | All three exports checked; `totalErrors: 0`. |
| S5 MCP JSR audit | `deno run --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/mcp --text` | 0 | Dry-run OK; three non-failing warnings (two existing cardinality warnings and slow-types notice). |
| S5 publish assets | `rtk proxy deno task check:publish-assets` | 0 | Generated MCP README asset matches its source. |
| S5 publish dry-run | `rtk proxy deno task publish:dry-run` | 0 | Workspace simulation completed with `Success Dry run complete`; existing dynamic-import warnings remain non-failing. |
| S5 focused MCP tests | `deno test --no-lock --allow-all packages/mcp/tests/drift-evidence_test.ts packages/mcp/tests/command_adapters_test.ts packages/mcp/tests/command_flows_test.ts packages/mcp/tests/command_composition_test.ts` | 0 | 24 passed, 0 failed. |
| S5 decisive CLI-host tests | `deno test --no-lock --allow-all packages/cli/src/public/features/agent/mcp/cli-mcp-adapters_test.ts` | 0 | 4 passed, 0 failed; host-version mismatch and no-JSR behavior remain proven. |
| S5 MCP package tests | `rtk proxy deno task --cwd packages/mcp test` | 0 | 113 passed, 0 failed. |
| S5 review threads | `rtk proxy deno task agentic:review-threads -- --repo rickylabs/netscript --pr 1400 --pretty` | 0 | `threads=0 unanswered=0`. |

## Phase status

`PLAN-EVAL: PASS cycle 2`. S2 restores branch type-check and lands one executor-owned identity shared
by list/execute; standalone reports its visible MCP-selected compatibility pin. Receipt behavior
remains the recorded S1 behavioral RED assigned to S4.

S3 changes the shared #1375 composition file minimally: `version: host.version` plus an injected
host-mode `SpawnCommandExecutor`; it does not touch docs-root, host config, environment, or corpus.

S4 resolves the behavioral RED. `execute_command` accepts an optional named resource, writes success
only for status `pass`, and overwrites with failure for non-zero/timeout/throw/denial. `list_commands`
is explicitly receipt-exempt because it diagnoses no resource. README policy regeneration changed
only the embedded README constant, not #1375 corpus selection or filesystem wiring.

S5 non-serialized gates are green. The serialized runtime token is requested below; no leak check,
container, AppHost, or `scaffold.runtime` command has been started before a grant.

EXPENSIVE-GATE-REQUEST
