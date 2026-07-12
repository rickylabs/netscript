# Worklog: `@netscript/mcp` S6

## Design

### Public Surface

- Existing `mod.ts` and `cli.ts` remain the only entrypoints; no CLI command group is added.
- Export command descriptors, execution results, catalog/executor ports, policy data/functions, flows, and injectable default adapters.
- `list_commands` returns bounded descriptors; `execute_command` states and enforces the allowlist gate and returns a bounded combined output tail.

### Domain Vocabulary

- `CommandDescriptor`: bounded command path, description, and argument/flag usage summary.
- `CommandCatalogPort`: dynamically lists descriptors from an outer command registry.
- `CommandExecutionRequest` / `CommandExecutionResult`: normalized verb path + args and bounded process evidence.
- `CommandExecutorPort`: executes one normalized request.
- `CommandPolicy`, `CommandPolicyDecision`, and prefix rules: immutable allow/deny data and pure evaluation.

### Ports and Adapters

- Catalog variability is CLI registry materialization; S6 supplies `StaticCommandCatalog`, S7 supplies the live registry adapter.
- Execution variability is subprocess invocation; `SpawnCommandExecutor` wraps `Deno.Command` at infrastructure edge.
- Composition root is `cli.ts`; application imports no infrastructure.
- Required runtime permission: subprocess execution (`--allow-run`) for the default executor.

### Constants

- Maximum descriptor count: 100; bounded descriptor fields.
- Maximum combined output tail: 4096 bytes.
- Default timeout: 120,000 ms.
- Default CLI prefix: `deno run -A jsr:@netscript/cli`.
- Default policy: explicit immutable allow/deny prefix tables; deny wins; default deny.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | contracts, policy, flows | focused policy/flow tests + scoped check | domain/application files, exports, contracts/tests, artifacts |
| 2 | static/spawn adapters | focused subprocess tests + all MCP tests | infrastructure files/tests, exports, artifacts |
| 3 | composition and full evidence | requested complete gate set | `cli.ts`, registry/contracts/tests, artifacts; bounded fixes only |

### Deferred Scope

S7 real CLI registry/default composition, S7 `agent` commands, S8 policy rendering, public skill bundle, docs/telemetry, external dependencies, and destructive/deploy/publish verbs.

### Contributor Path

Add or replace a catalog by implementing `CommandCatalogPort` at the outer composition edge. Customize allowed commands by supplying immutable `CommandPolicy` data. Replace process invocation by implementing `CommandExecutorPort`; keep all effects in infrastructure and prove behavior with a fake or injected cheap command.

## Progress Log

| Date | Phase | Evidence |
| --- | --- | --- |
| 2026-07-12 | preflight | HEAD `0b8ed075`; required `454be64d` is ancestor; `doctor-flow.ts` exists. |
| 2026-07-12 | bootstrap/research | Required skills/harness/doctrine read; current MCP/CLI surfaces and scaffold invocation re-baselined; plan/design provisioned. |
| 2026-07-12 | plan gate | Separate opposite-family PLAN-EVAL cycle 1 returned `PASS` on all eight checklist items. |
| 2026-07-12 | slice 1 | Added command catalog/executor contracts, immutable deny-wins policy, bounded list flow, policy-gated execute flow, exports, and table tests. Focused tests: 3 passed; scoped check: 53 files, 0 findings. Tier-A substantive review pending supervisor handoff. |

## Slice Reconcile Notes

- **Slice 1:** Scope remains aligned with #730 and excludes S7/S8. No new issue/PR surface was opened by this implementation session. The separate PLAN-EVAL advisory to assert the default CLI prefix is assigned to Slice 2. No plan or doctrine drift detected.
