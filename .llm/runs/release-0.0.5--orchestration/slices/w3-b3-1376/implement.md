use harness

You are the W3-B3 implementation supervisor for the NetScript 0.0.5 stable release. You own one PR
cluster: **#1376 — `execute_command` spawns a downloaded `jsr:@netscript/cli` pinned to the MCP
package version even when the server is hosted by a local CLI.** Priority p1.

## SKILL

- `netscript-harness`
- `netscript-cli` — the MCP server, `agent mcp`, the command catalog and policy surface
- `netscript-doctrine` — A6 CLI/tooling plus the `packages/mcp` published surface
- `netscript-tools`, `netscript-deno-toolchain`, `netscript-pr`
- `jsr-audit` — `@netscript/mcp` is published

Read the inlined shared contract below in full.

## Identity

| Field     | Value                                                                                           |
| --------- | ----------------------------------------------------------------------------------------------- |
| Lane      | `light_implementation` — Codex · OpenAI · GPT-5.6 Sol · low                                     |
| Worktree  | `/home/codex/repos/ns005-w3b3`                                                                  |
| Branch    | `fix/mcp-execute-command-host-cli`                                                              |
| Base      | `origin/main@aa8e151e6`                                                                         |
| Slice dir | `.llm/runs/release-0.0.5--orchestration/slices/w3-b3-1376/`                                     |
| PLAN-EVAL | Claude · Fable 5, separate session, orchestrator-launched — **mandatory before implementation** |
| IMPL-EVAL | Claude · Fable 5, separate session, orchestrator-launched                                       |

## Hard scope boundary — your own issue demands it

Your Boundaries section says #1375 owns another change in the same composition root and the two
**must remain separable**: _do not fold either into the other's PR._ #1375 is being implemented
right now by a sibling lane on `fix/agent-mcp-docs-root`.

So you do **not** touch `--docs-root`, `writeHostConfig`, the docs corpus, or `NETSCRIPT_DOCS_ROOT`.
If you both must edit `run-agent-mcp.ts`, keep the edit minimal and tell me.

An earlier milestone plan folded these two issues into one cluster; a separate-session PLAN-EVAL
caught it by reading your Boundaries section and the cluster was split. Do not undo that.

## The defect

Read #1376 in full and quote its acceptance rows into your plan from the live body.

`SpawnCommandExecutor`'s `DEFAULT_CLI_COMMAND` is
`deno run -A jsr:@netscript/cli@${MCP_PACKAGE_VERSION}`, and `run-agent-mcp.ts` passes no
`cliCommand` override — so the CLI-hosted server shells out to a **downloaded** CLI pinned to the
**MCP package's** version rather than re-entering the host CLI. Meanwhile `list_commands` reports
`version: "current"`, so the agent cannot notice. One process boundary, three version identities;
they agree today only because both packages read the same number.

`execute_command` and `list_commands` are also the only two flows not receipt-wrapped, so work done
through MCP cannot satisfy the `record_drift` evidence gate — and that gate's refusal text is
currently _correct only because_ `execute_command` cannot produce a receipt.

## Mission

1. Make the CLI-hosted server re-enter the **host** CLI rather than downloading one, and report the
   real host version through `list_commands`.
2. Decide and document what a **standalone** server (`deno x jsr:@netscript/mcp/cli`) should spawn —
   the honest answer may be "the pinned published CLI", but it must be a stated decision with the
   version identity visible to the agent, not an accident.
3. Address the receipt gap the issue names, so `record_drift`'s refusal is no longer accidentally
   correct.
4. **RED-first with the RED recorded.** The decisive test: a locally-hosted server executing a
   command must run the host binary, provable by version identity rather than by inspection.
5. Note `command-policy.ts` permits mutating verbs through `execute_command`
   (`db init|generate|
   migrate|seed`, `generate`, `contract`, `plugin install|sync|doctor`,
   `ui:*`), which is what makes the mismatched binary able to write to a project. Your fix should
   make that safe, not merely consistent.
6. Gates: focused MCP/CLI tests, scoped check/lint/fmt, `quality:gate`, `arch:check`, `doc:lint`
   over the `packages/mcp` export map, `publish:dry-run`, then the serialised `scaffold.runtime` —
   **request the token, do not start it.**

Open the draft PR with `Closes #1376` only when every acceptance row is truthfully tickable.
