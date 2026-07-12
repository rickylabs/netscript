# Umbrella IMPL-EVAL verdict — NetScript agentic combo

- Evaluator: separate WSL Codex evaluator session
- Branch: `eval/netscript-mcp-skills-umbrella`
- Evaluated HEAD: `56069b52` (`0f280378` is an ancestor)
- Scope: epic #721 / PR #715, criteria 1–6 from the umbrella brief

## Preflight

```text
$ git log --oneline -1
56069b52 chore(harness): umbrella IMPL-EVAL brief
$ git branch --show-current
eval/netscript-mcp-skills-umbrella
$ git merge-base --is-ancestor 0f280378 HEAD
exit 0
packages/mcp/mod.ts: EXISTS
packages/cli/src/public/features/agent/agent-group.ts: EXISTS
initial git status --short: empty
```

## Criteria

| # | Criterion | Result | Evidence |
| --- | --- | --- | --- |
| 1 | Doctrine fit | **FAIL** | Presentation effect grep: empty (`grep_exit=1`); forbidden `utils/helpers/common/lib` directory scan: empty. `deno task arch:check`: exit 0. Direct target scan: `# Doctrine readiness — mcp`, `FAIL=0 WARN=1 INFO=1` (README example warning and architecture-doc info). `deno task doc:lint --root packages/mcp --pretty`: exit 0, `totalErrors=0`, `totalPrivateTypeRef=0`, `totalMissingJSDoc=0`. **Manual dependency-direction audit fails:** `packages/mcp/src/application/runner/mcp-server.ts:6` imports `../../presentation/json-rpc.ts`. Doctrine requires `presentation -> application`; application must not depend on presentation. |
| 2 | Wrap, do not reimplement | **PASS** | Read flows import and call `TelemetryQueryPort` (`get_app_status`, `list_runs`, `get_run`, `get_recent_errors`, `get_last_job_result`, and both analysis flows). Doctor receives `ProjectDoctorPort`; CLI wiring injects `CliProjectDoctor`. `createListCommandsFlow` consumes `CommandCatalogPort`, and `PublicCliCommandCatalog` recursively enumerates the real CLI command tree. `createExecuteCommandFlow` consumes `CommandExecutorPort`; `decideCommand` checks deny rules before allow rules and default-denies unmatched paths. No CLI business flow is reimplemented inside `packages/mcp`; mutation deliberately executes the public CLI through the injected subprocess adapter. MCP tests cover deny-before-execute and live catalog behavior. |
| 3 | `netscript.*` correctness | **PASS** | `telemetry-aggregation.ts` imports `KVAttributes`, `NetScriptExecutionAttributes`, `NetScriptJobAttributes`, `SagaAttributes`, and `TriggerAttributes` from `@netscript/telemetry/attributes`; all attribute value reads use those constants (OTel `service.name` / `db.*` remain semconv literals). `classifyDomain` consumes `DOMAIN_ATTRIBUTE_PREFIXES`. Non-test literal grep found only the documented classification prefixes in `telemetry-summaries.ts:8-12` plus `telemetry-aggregation.ts:355` (`netscript.kv.`), used solely as a namespace-presence test for DB/KV span classification; the KV value read at line 359 uses `KVAttributes.KV_OPERATION`. |
| 4 | #745 code-quality gate | **PASS** | `deno task quality:gate`: exit 0. Repository `quality:scan`: `{"ok":true,"findings":[]}`; `arch:check`: exit 0. Focused scan command `scan-code-quality.ts --root packages/mcp --root packages/cli/src/public/features/agent --max-allow 0`: `{"ok":true,"findings":[],"allowCount":0}`. Independent non-test grep for `Command<any`, `as unknown as`, `as any`, `.name === '`, and `kind === '` returned empty (`grep_exit=1`). |
| 5 | Public-docs law | **PASS** | Exact grep `grep -rInE "eis|VIF|CSB|PR #|dogfood|harness|OpenHands|Codex|Tier-" skills/ docs/site/capabilities/agent-tooling.md` returned no matches (`grep_exit=1`). |
| 6 | Runtime proof | **PASS** | `deno test --no-lock --allow-all packages/cli/e2e/tests/agent/agent-mcp-stdio_test.ts`: exit 0, `1 passed | 0 failed`. `deno test --no-lock --allow-env --allow-net --allow-run --allow-read packages/mcp/tests/`: exit 0, `39 passed | 0 failed`. `deno test --no-lock --allow-env --allow-net --allow-run --allow-read --allow-write packages/cli/src/public/features/agent/`: exit 0, `4 passed | 0 failed`. |

## Command evidence

```text
$ deno run --allow-read .llm/tools/fitness/check-doctrine.ts --root packages/mcp
# Doctrine readiness — mcp
  FAIL=0 WARN=1 INFO=1
  WARN A3: README has only 1 TS code fences — needs >= 2 (basic + advanced) for the 80% path
  INFO A9: docs/architecture.md missing — required when public symbols > 25

$ deno task doc:lint --root packages/mcp --pretty
summary: totalPackages=1 totalErrors=0 totalPrivateTypeRef=0 totalMissingJSDoc=0 totalOther=0

$ deno run --allow-read .llm/tools/quality/scan-code-quality.ts \
    --root packages/mcp --root packages/cli/src/public/features/agent --max-allow 0
{"ok":true,"mode":"repository","scanned":["packages/mcp","packages/cli/src/public/features/agent"],"findings":[],"allowCount":0,"allowances":[]}

$ grep -rInE "['\"]netscript\." packages/mcp/src --include='*.ts' --exclude='*_test.ts'
packages/mcp/src/domain/telemetry-summaries.ts:8:  saga: ['netscript.saga.'],
packages/mcp/src/domain/telemetry-summaries.ts:9:  trigger: ['netscript.trigger.'],
packages/mcp/src/domain/telemetry-summaries.ts:10:  worker: ['netscript.worker.'],
packages/mcp/src/domain/telemetry-summaries.ts:11:  stream: ['netscript.stream.', 'netscript.sse.'],
packages/mcp/src/domain/telemetry-summaries.ts:12:  service: ['netscript.job.'],
packages/mcp/src/application/telemetry-aggregation.ts:355:    key.startsWith('netscript.kv.') || key.startsWith(OTEL_DB_ATTRIBUTE_PREFIX)

$ grep application imports of presentation/infrastructure
packages/mcp/src/application/runner/mcp-server.ts:6:import { type JsonRpcResponse, parseJsonRpcRequest } from '../../presentation/json-rpc.ts';

$ deno task quality:gate
quality:scan: {"ok":true,"mode":"repository","findings":[]}
arch:check: exit 0

$ public-docs prohibited-term grep
no matches (grep exit 1)

$ runtime suites
agent-mcp-stdio_test.ts: 1 passed | 0 failed (exit 0)
packages/mcp/tests/: 39 passed | 0 failed (exit 0)
packages/cli/src/public/features/agent/: 4 passed | 0 failed (exit 0)
```

## Findings

1. `packages/mcp/src/application/runner/mcp-server.ts:6` — The application-layer MCP runner imports `presentation/json-rpc.ts`, reversing the doctrine dependency direction (`presentation -> application -> ports/domain`). Move the JSON-RPC request/response contract and parser to a domain/application-owned module that the presentation edge and application runner can both consume, or move protocol handling to presentation so presentation calls an application-owned request handler. Remove every application-to-presentation import and add a regression gate/test for the layer edge.

[PHASE: IMPL-EVAL] [VERDICT: CHANGES_REQUESTED]
