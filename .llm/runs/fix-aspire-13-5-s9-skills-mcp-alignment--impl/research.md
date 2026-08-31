# Research — S9 skills, corpora, and Aspire MCP alignment

## Re-baseline

- Worktree HEAD is the required clean S8 Phase-A head `9dd06647`; merge-base with
  `feat/aspire-13-5-s8-typed-resource-commands` is identical.
- The acceptance contract is the supervisor's
  `sub-issues/09-skills-corpora-mcp-alignment.md`, read in full on 2026-08-30.
- The 13.4.6 baseline contains 14 tools. The locked 13.5 expectation is those 14 plus
  `get_integration_docs`; `refresh_tools` remains present.
- S2's 13.5.3 runtime evidence supplies the cited command behavior and JSON-RPC transcript shape.
  S8 owns `excludeFromMcp()` emission; S9 only asserts the resulting visibility contract.
- The NAS is approved only for a single no-AppHost stdio MCP surface capture. Phase B is excluded.

## Current implementation facts

- `packages/cli/e2e` is an unpublished (`publish: false`) tooling surface. The new gate is not a
  `@netscript/cli` public export; its JSR slow-type and package-export risk is therefore N/A, while
  normal CLI doctrine and quality gates still apply.
- Runtime gates are built in `runtime-gates.ts` and suite membership is asserted in
  `tests/presentation/suite-registry_test.ts`.
- Agent-init delegates upstream skill installation through `DenoAspireAgentInitializer`; canonical
  agent prose and consumer tools are generated into CLI assets and downstream mirrors.
- Generated `.claude/skills`, barrels, corpora, publish assets, and dogfood outputs must never be
  hand-edited.

## Open questions

- None that can force Phase-A rework. Phase-B runtime observations and the docs audit are explicitly
  deferred to supervisor-owned lanes.

## D-194 runtime.aspire-start repair re-baseline

- CI run `33404325326`, job `99528225703`, failed `runtime.aspire-start` in 59 ms while reading
  `.llm/tmp/cli-e2e/plugin-smoke-*/aspire.config.json`; the control head `2032d4ed7` passed the
  same sqlite suite in run `33404321608` attempt 2.
- `renderTsAppHost()` writes both `apphost.mts` and `aspire.config.json` under the generated
  project's `aspire/` directory. `createSmokeProject()` records the AppHost as
  `<projectRoot>/aspire/apphost.mts`.
- S9 commit `d9bd6250c` added dashboard authentication by reading
  `<projectRoot>/aspire.config.json`. The pre-S9 script never read that path. This is the confirmed
  fail-fast cause: the new read used the scaffold project root instead of the AppHost workspace.
- Static suite materialization eliminated ordering: both runtime tiers place scaffold init and the
  pre-start fixtures before `runtime.aspire-start`, then describe and `agent.aspire-mcp-smoke` after
  start. It also eliminated sqlite capability routing: the sqlite tier selects the same start gate
  and differs only through sqlite defaults and removal of Postgres-only gates.
