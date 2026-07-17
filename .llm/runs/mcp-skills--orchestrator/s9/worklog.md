# Worklog: S9 agent tooling polish

## Run Metadata

| Field          | Value                                 |
| -------------- | ------------------------------------- |
| Run ID         | `mcp-skills--orchestrator/s9`         |
| Branch         | `feat/netscript-mcp-skills-s9-polish` |
| Archetype      | `6 — CLI / Tooling`                   |
| Scope overlays | `docs`                                |

## Design

### Public Surface

- Documentation: `/capabilities/agent-tooling/`, `@netscript/mcp` README, CLI README section.
- Existing entrypoints under test: `packages/cli/bin/netscript.ts agent mcp`, `@netscript/mcp`, and
  `@netscript/mcp/cli`. No new export or command is planned.

### Domain Vocabulary

- Tool catalog — the 13 names in `TOOL_NAMES` with bounded semantic results.
- Agent host — `claude` or `vscode`, plus `all` installer selection.
- Data boundary — telemetry, project metadata, and public docs; excludes source and secret values.
- Command policy — ordered allow/deny rules producing a structured decision.

### Ports and constants

- Existing ports only: `CommandCatalogPort`, `CommandExecutorPort`, `ProjectDoctorPort`, docs
  corpus, telemetry query/probe. The smoke reaches their real outer composition; it adds no port.
- Existing constants only: `TOOL_NAMES`, `DEFAULT_COMMAND_POLICY`, protocol version, truncation
  policy. The test asserts catalog cardinality and semantic response fields.

### Archetype-6 checkpoint

The five CLI spine abstracts and the existing feature/registry catalog are unchanged. This slice
adds no layer-2 abstract, extension axis, template, command name, output format, or composition
branch. The top-level public command tree remains owned by
`packages/cli/src/public/features/root/public-command-tree.ts`; the agent group remains a vertical
feature under `src/public/features/agent/`.

### Commit Slices

| # | Slice                                                     | Gate                                | Files                               |
| - | --------------------------------------------------------- | ----------------------------------- | ----------------------------------- |
| 1 | Public docs describe one accurate agent vocabulary        | prohibited-term grep, source review | docs page, READMEs, run artifacts   |
| 2 | Real CLI stdio edge satisfies the semantic protocol smoke | focused `deno test`                 | CLI E2E test, run artifacts         |
| 3 | Final tree is publishable and package-quality green       | final validation matrix             | trivial fixes if any, run artifacts |

### Deferred Scope and contributor path

- New tools, transports, behaviors, dependencies, and full scaffold E2E are deferred.
- Add tools through the MCP domain contracts/registry and flows, wire adapters in
  `packages/mcp/cli.ts`, expose CLI twins through the CLI registry, then update this catalog and
  protocol smoke.

## Progress Log

| Time       | Slice | Step        | Notes                                                                              |
| ---------- | ----- | ----------- | ---------------------------------------------------------------------------------- |
| 2026-07-12 | plan  | bootstrap   | Mandatory preflight passed; source re-baselined.                                   |
| 2026-07-12 | plan  | PLAN-EVAL   | Separate Claude/Opus session returned `PASS`.                                      |
| 2026-07-12 | 1     | docs        | Added capability page and completed MCP/CLI README guidance from current source.   |
| 2026-07-12 | 1     | reconcile   | Scope remains #733-only; no command or tool vocabulary changed.                    |
| 2026-07-12 | 2     | stdio smoke | Real public CLI binary passed the six-request semantic protocol smoke.             |
| 2026-07-12 | 2     | reconcile   | Focused placement remains sufficient; no scaffold suite required.                  |
| 2026-07-12 | 3     | audit/fix   | Workspace publish exposed portable timer-handle typing; corrected and revalidated. |
| 2026-07-12 | 3     | reconcile   | No dependency, lock, public API, or deferred-scope expansion.                      |

## Gate Results

### Final validation matrix

| Gate                   | Command                                                                                                                                | Result                        | Evidence                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ----------------------------------------------------------------- |
| Scoped check           | `run-deno-check.ts` for MCP + agent smoke, excluding doctor fixture                                                                    | PASS                          | 55 files, 1 batch, 0 failed batches/diagnostics                   |
| Scoped lint            | `run-deno-lint.ts` with the same selection                                                                                             | PASS                          | 55 files, exit 0, 0 occurrences                                   |
| Scoped format          | `run-deno-fmt.ts` with the same selection                                                                                              | PASS                          | 55 files, 0 failed batches/findings                               |
| MCP + agent tests      | `deno test --allow-all packages/mcp/tests packages/cli/src/public/features/agent packages/cli/e2e/tests/agent/agent-mcp-stdio_test.ts` | PASS                          | 44 passed, 0 failed                                               |
| Stdio smoke standalone | `deno test --allow-all packages/cli/e2e/tests/agent/agent-mcp-stdio_test.ts`                                                           | PASS                          | 1 passed, 0 failed; 13 tools and required calls asserted          |
| Public docs law        | `grep -rInE "eis\|VIF\|CSB\|PR #\|dogfood" docs/site packages/mcp/README.md`                                                           | PASS                          | empty output                                                      |
| Internal doc links     | `deno task docs:links`                                                                                                                 | PASS                          | 96 docs, 0 broken links/anchors                                   |
| Architecture           | `deno task arch:check`                                                                                                                 | PASS                          | exit 0; existing repository warnings only                         |
| MCP doc lint           | `deno task doc:lint --root packages/mcp --pretty`                                                                                      | PASS                          | combined total 0 across both exports                              |
| JSR fitness audit      | `audit-jsr-package.ts --root packages/mcp --text`                                                                                      | PASS with known audit warning | dry-run OK; sole warning counts the normal slow-type check banner |
| MCP raw dry-run        | `(cd packages/mcp && deno publish --dry-run --allow-dirty)`                                                                            | PASS                          | success, clean intended file list, no slow-type diagnostic        |
| Workspace publish      | `deno task publish:dry-run`                                                                                                            | PASS                          | second run exit 0 after timer portability fix                     |

The scoped wrappers exclude `packages/mcp/tests/fixtures/doctor/` because its intentionally
synthetic legacy workspace configuration makes Deno reject explicit-file lint/format batches. Those
fixture files remain covered by the passing doctor tests. Scoped formatting normalized five
inherited MCP files before the final green verdict.

### Fitness status

- F-5/F-6/F-7: PASS via full-export doc lint, JSR audit, and raw/workspace dry-runs.
- F-19: PASS via scoped wrappers.
- F-CLI-1…F-CLI-31: PENDING_SCRIPT/manual; no CLI structure or command behavior was added.
- Docs overlay alignment/link/terminology: PASS via source review, exact grep, and link gate.

## Handoff Notes

- Inspect the agent-tooling page, MCP README, and real-process smoke first.
- The only behavior-adjacent fix is `ReturnType<typeof setTimeout>` for workspace portability;
  command-adapter tests and the stdio smoke cover it.
