# Worklog — S7 CLI integration

## Design

### Public surface

- `netscript agent mcp --endpoint --project-root --docs-root`
- `netscript agent init --host=claude|vscode|all`
- Programmatic installer/composition functions remain feature-local unless tests need a documented
  export; `@netscript/mcp` exports are unchanged.

### Domain vocabulary

- `AGENT_HOSTS = ['claude', 'vscode'] as const`; `AgentHost` derived from it.
- `SkillBundleFile`, `EmbeddedSkillBundle`, `AgentInitInput`, `AgentInitResult`.
- `AgentMcpInput` and CLI-owned adapter classes for project doctor, command catalog, and executor.

### Existing spine and extension axes

- Spine: `CliCommand<Input,Result>`, `CliCommandGroup`, `CliRoot`, `UseCase<Input,Result>`,
  `Registry<TKey,TValue>`; S7 introduces no new abstract.
- Existing registries remain unchanged; `CliCommandRegistry<string,CliCommandFactory>` is populated
  by `createPublicCommandRegistry()` and consumed by root composition plus the MCP catalog adapter.

### Vertical feature catalog

- `public/features/agent/agent-group.ts`
- `public/features/agent/init/`: input, use case, command, embedded bundle adapter/tests.
- `public/features/agent/mcp/`: input, composition/use case, command, CLI-to-MCP adapters/tests.

### Ports and side effects

Existing CLI filesystem/config adapters own reads/writes; MCP-owned ports remain
`ProjectDoctorPort`, `CommandCatalogPort`, and `CommandExecutorPort`. Commands contain no direct
filesystem/process behavior. No new layer-2 abstract is justified or introduced.

### Constants and composition

Host IDs, marker strings, config filenames, server ID, published CLI invocation, and skill paths are
named constants. `public-command-tree.ts` remains the sole top-level command list; it receives one
additive `agent` factory.

### Commit slices

The three ordered slices in `plan.md` are the implementation sequence and each includes its proving
gate and owned files.

### Deferred scope

Full docs embedding, new MCP tools, skill prose, S9 pages, and unrelated CLI restructuring.

### Contributor path

Add a host by extending `AGENT_HOSTS` and its config writer; add an agent sub-feature beside `init/`
and `mcp/`; add a skill file through `skills/manifest.json` then regenerate embedded assets; add a
CLI verb through the existing registry, which automatically appears in the MCP catalog.

## Evidence

- 2026-07-12: mandatory base preflight passed.
- 2026-07-12: separate-session PLAN-EVAL `PASS` (`14b1aba7`, Claude/Opus family) before implementation.
- Focused agent tests: `4 passed, 0 failed` (init files/idempotence/hosts/hash mismatch; MCP initialize,
  13 tools, live command tree including descendants, real plugin doctor).
- Combined MCP + agent tests: `43 passed, 0 failed` with required read/write/env/net/run permissions.
- Scoped check wrapper: MCP 57 files / 0 findings; CLI 612 files / 0 findings.
- Scoped lint wrapper: infrastructure failure before diagnostics because Deno 2.9 rejects the
  branch's pre-existing root workspace array (`invalid type: string "packages/*", expected
  WorkspaceConfig`). A focused `deno lint` of touched files passed before the workspace parser was
  triggered; no root-config change is in S7 scope.
- Scoped fmt wrapper: same root-workspace parser failure with 0 findings reported. All owned TS was
  formatted successfully with `deno fmt --no-config` (13 files).
- `deno task arch:check`: exit 0; existing warnings only, none in S7 roots.
- Full-export doc lint: MCP and CLI both report 0 combined errors.
- Publish dry-run: `@netscript/cli` exit 0 (existing dynamic-import warnings); `@netscript/mcp`
  exit 0 with no slow-type failures.
- Public CLI smoke: `netscript agent --help` lists `mcp` and `init`.

## Reconcile

- Slices 1–2: issue #731 remains open and this branch intentionally uses no closing keyword; no PR
  was opened per the slice brief. Shared registry change remains one additive import/register block.
- Slice 3: no scope expansion. Root workspace config incompatibility is recorded as gate
  infrastructure drift rather than changed in this slice.

## Blocker

The harness A1 slice-review gate initially failed to launch to completion twice. The supervisor
subsequently performed the substantive check-in, directed removal of the unrelated Fresh UI
regeneration and supervisor-owned brief formatting, and explicitly instructed completion. Both
files were restored before sign-off commits; the blocker is resolved.

## Supervisor sign-off

- Restored `packages/fresh-ui/registry.generated.ts`; its one-line regeneration was an unintended
  side effect of the multi-output asset generator.
- Restored supervisor-owned `s7/implement.md`; all implementation notes remain in this worklog.
- Re-ran combined tests and scoped checks after restoration: 43/43 tests pass; MCP 57 files and CLI
  612 files check with zero findings.
