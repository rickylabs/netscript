# fix(mcp): execute_command spawns a downloaded jsr:@netscript/cli pinned to the MCP package version even when the server is hosted by a local CLI — DRAFT (no GitHub mutation; owner ratification pending)

**Draft-ID:** T5-04 · **Proposed milestone:** 0.0.6 · **Labels:** `type:fix` `area:agentic`
`area:tooling` `area:cli` `priority:p1` `status:triage` · **Depends on:** none

## Summary

When an agent calls `execute_command` against the MCP server started by `netscript agent mcp`, the
command does not re-enter the running CLI. It shells out to
`deno run -A jsr:@netscript/cli@<MCP_PACKAGE_VERSION>`, downloading and executing a *different*
binary at a version pinned to the MCP package rather than to the host CLI. A maintainer working from
a local or workspace build silently gets published behaviour, and an agent that scaffolds through
MCP can produce artifacts from a different release than the one it is documenting. The same host
reports `version: "current"` to `list_commands`, so the agent has no way to notice. `list_commands`
and `execute_command` are also the only two flows that are not receipt-wrapped, so work performed
through MCP cannot satisfy the `record_drift` evidence gate.

## Evidence

Corpus: `research/repo-audit/mcp-cli.md` §1.4, §1.6 M3/M5, §4.5 C4; `SYNTHESIS.md` §4 T5.

Verified in the worktree at `fac9e339042c`:

1. `packages/mcp/src/infrastructure/spawn-command-executor.ts:6-14`:
   ```ts
   import { MCP_PACKAGE_VERSION } from '../publish-assets.generated.ts';
   export const DEFAULT_CLI_COMMAND: readonly string[] = Object.freeze([
     'deno', 'run', '-A', `jsr:@netscript/cli@${MCP_PACKAGE_VERSION}`,
   ]);
   ```
2. `packages/cli/src/public/features/agent/mcp/run-agent-mcp.ts:44` passes
   `commandExecutor: new SpawnCommandExecutor()` with no `cliCommand` override, so
   `DEFAULT_CLI_COMMAND` applies inside the CLI-hosted server.
3. `run-agent-mcp.ts:27-30` builds the command-catalog program with `version: "current"`, so
   `list_commands` never reports the real CLI version. The public tree otherwise reports
   `CLI_PACKAGE_VERSION` (`packages/cli/src/public/features/root/public-command-tree.ts:121`).
4. `packages/mcp/cli.ts:194-200` binds `list_commands` and `execute_command` **without**
   `withReceipt`, while every read/analytics/doctor/service flow at `:150-234` is wrapped
   (`withReceipt` at `:236-264` writes `{resource, command, timestamp, exitStatus}` through
   `FilesystemDiagnosticEvidence`).
5. `packages/mcp/src/application/flows/record-drift-flow.ts:5,29-42` refuses unless a receipt for the
   named resource exists, has `exitStatus === 0`, and is younger than
   `DIAGNOSTIC_RECEIPT_TTL_MS = 15 * 60 * 1000`. Its refusal text
   (`diagnosticEvidenceRefusal`, `:17-22`) tells the agent to run `plugin doctor` or a doctor/telemetry
   tool — which is correct only because `execute_command` cannot produce a receipt.
6. `packages/mcp/src/domain/command-policy.ts` allows mutating verbs through `execute_command`
   (`db init|generate|migrate|seed|…`, `generate`, `contract`, `plugin install|sync|doctor`,
   `ui:add|ui:init|ui:list|ui:update`), so the mismatched binary can write to the project.
7. Version pinning elsewhere is host-correct by comparison: `agent init` writes
   `jsr:@netscript/cli@${CLI_PACKAGE_VERSION}`
   (`packages/cli/src/kernel/constants/jsr-specifiers.ts:33-45`, used at `init-agent.ts:232`), i.e.
   the CLI's own version — not the MCP package's.

## Current surface

- One process boundary with three independent version identities: the host CLI
  (`CLI_PACKAGE_VERSION`), the MCP server (`MCP_PACKAGE_VERSION`, also `serverInfo.version`), and the
  spawned child (`jsr:@netscript/cli@MCP_PACKAGE_VERSION`). They agree today only because both
  packages read `0.0.4` at this baseline.
- `list_commands` advertises `version: "current"`.
- Two mutating tools produce no diagnostic receipt.

## Target contract

1. **The CLI-hosted server executes the CLI that hosts it.** `run-agent-mcp.ts` injects a
   `cliCommand` derived from the running entrypoint (`Deno.execPath()` / `import.meta.url` for a
   source run, the installed binary for a global install), so `execute_command` never downloads a
   second CLI when one is already running.
2. **Version identity is truthful.** `list_commands` reports `CLI_PACKAGE_VERSION`, and the tool
   result carries the version and the resolved executor command so an agent can see what it is
   driving. `serverInfo.version` remains the MCP package version; a mismatch between the two is
   surfaced, not hidden.
3. **The standalone default stays pinned, but to the right thing.** When no host CLI exists
   (`deno x jsr:@netscript/mcp/cli`), `DEFAULT_CLI_COMMAND` remains a pinned JSR specifier; the pin
   must be documented as MCP-package-derived and asserted equal to the CLI version by the existing
   publish-assets generation, or explicitly decoupled with a stated policy.
4. **Mutating tools leave receipts.** `execute_command` is receipt-wrapped on the same terms as the
   read flows: a successful run writes a receipt for its resource; a failed run writes
   `exitStatus: 1`. `list_commands` is wrapped or explicitly exempted with a written reason. The
   `record_drift` refusal text is updated to name `execute_command` once it can authorize.

## Acceptance

- [ ] `netscript agent mcp` injects a `cliCommand` that re-enters the running CLI.
- [ ] No JSR download occurs for `execute_command` when the server is CLI-hosted.
- [ ] `list_commands` reports `CLI_PACKAGE_VERSION`, not `"current"`.
- [ ] `execute_command` results include the resolved executor command and version.
- [ ] `execute_command` writes a diagnostic receipt on success and on failure.
- [ ] `record_drift` accepts a receipt produced by a successful `execute_command`.
- [ ] The `record_drift` refusal message lists the tools that can authorize it, accurately.
- [ ] Tests cover: CLI-hosted executor resolution; standalone fallback to the pinned specifier;
      receipt written on both exit paths.
- [ ] Negative test: a denied command (`deploy`, `init`, `db reset`, `plugin remove`, `ui:remove`)
      writes no success receipt and cannot authorize `record_drift`.
- [ ] Negative test: with the host CLI at a version different from the MCP package, no spawn resolves
      to the MCP-pinned specifier.

## Boundaries

- **#1197** owns the agent-surface adoption fix and re-measurement; **#1090** owns observing whether
  agent behaviour changed. This issue does not restate or re-measure adoption — it removes one
  mechanism by which MCP-driven work is silently wrong.
- **#1093** owns plugin discovery hardcoding official factory callees; unrelated to executor
  resolution.
- **#1343** owns the installed-consumer canary smoke; proving the published pin works end to end is
  theirs.
- **T5-03** owns docs-corpus wiring in the same host composition root; keep the two changes
  separable — do not fold either into the other's PR.
- **#1126 / #1139** own the OpenAPI→MCP tool surface; this issue adds no new tools.
- Not a goal: adding `list_generators` / `plan_generation` (corpus gap M4), or changing
  `command-policy.ts` allow/deny sets.

## Docs/consumer proof

The agent-tooling reference states which binary `execute_command` runs in each hosting mode and what
`list_commands` reports. A wave run's transcript shows an `execute_command` receipt followed by an
accepted `record_drift`, which is currently impossible.

## Provenance

Seed run `plan-fable5-remediation-roadmap--seed`, PR #1347, 2026-08-08. All line citations
re-verified against the worktree at `fac9e339042c`.
