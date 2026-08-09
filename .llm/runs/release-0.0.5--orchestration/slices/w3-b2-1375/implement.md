use harness

You are the W3-B2 implementation supervisor for the NetScript 0.0.5 stable release. You own one PR
cluster: **#1375 — the emitted `.mcp.json` carries no `--docs-root`, so the corpus `agent init` just
installed is invisible and `search_docs` indexes two documents.** Priority p1.

## SKILL

- `netscript-harness`
- `netscript-cli` — `agent init`, `agent mcp`, the emitted host config, scaffold output
- `netscript-doctrine` — A6 CLI/tooling. `packages/cli` carries accepted maintainer/public-mixing
  and permission-docs debt; do not deepen either
- `netscript-tools`, `netscript-deno-toolchain`, `netscript-pr`
- `jsr-audit` if any published export changes

Read the inlined shared contract below in full.

## Identity

| Field     | Value                                                                                           |
| --------- | ----------------------------------------------------------------------------------------------- |
| Lane      | `normal_implementation` — Codex · OpenAI · GPT-5.6 Sol · medium                                 |
| Worktree  | `/home/codex/repos/ns005-w3b2`                                                                  |
| Branch    | `fix/agent-mcp-docs-root`                                                                       |
| Base      | `origin/main@aa8e151e6`                                                                         |
| Slice dir | `.llm/runs/release-0.0.5--orchestration/slices/w3-b2-1375/`                                     |
| PLAN-EVAL | Claude · Fable 5, separate session, orchestrator-launched — **mandatory before implementation** |
| IMPL-EVAL | Claude · Fable 5, separate session, orchestrator-launched                                       |

## Hard scope boundary — read this first

**#1376 owns a change in the same composition root, and the two must remain separable.** #1376's own
Boundaries section says: _do not fold either into the other's PR._ It is being implemented **right
now** by a sibling lane on `fix/mcp-execute-command-host-cli`.

That means:

- You do **not** touch `execute_command`, `SpawnCommandExecutor`, `DEFAULT_CLI_COMMAND`, the
  `list_commands` version identity, or receipt-wrapping. Those are #1376's.
- If your change and theirs must both edit `run-agent-mcp.ts`, keep your edit minimal and tell me —
  a merge conflict resolved with care beats two lanes silently overwriting each other. Wave 2 ended
  with exactly that conflict between two slices and it resolved cleanly because both sides were
  named in advance.

## The defect and the real scope

Read #1375 in full and quote its acceptance rows into your plan **from the live issue body**. This
matters here specifically: an earlier orchestrator summary described this issue as
"`writeHostConfig` plus a probe plus tests", and that is **wrong**. Its target and eleven acceptance
rows also require a generated embedded fallback corpus, version provenance, a size budget,
corpus-kind/root/count observability, precedence behaviour, and negative cases. Plan against the
issue, not against that summary — and if you find the eleven rows cannot all be satisfied by one PR,
say so before building.

The mechanism: `agent init --with-docs` writes a bundle to `.netscript/docs/`; `agent mcp` accepts
`--docs-root` and honours it; but `writeHostConfig` emits neither the flag nor
`NETSCRIPT_DOCS_ROOT`, and the server never probes the project. Result: two documents.

## Mission

1. Make the emitted host config reach the installed corpus, for **both** the `mcpServers`
   (`.mcp.json`) and `servers` (`.vscode/mcp.json`) shapes.
2. Deliver the embedded fallback corpus, provenance, size budget and observability the issue's rows
   require — corpus kind, root and document count must be inspectable, because "the agent has no
   signal that the corpus is degraded" is half the defect.
3. Define and test **precedence**: explicit flag versus environment versus probe versus embedded.
4. **RED-first with the RED recorded.** The decisive proof is a real `search_docs` against a
   generated project returning the installed corpus rather than two documents.
5. Gates: focused CLI/MCP tests, scoped check/lint/fmt, `quality:gate`, `arch:check`,
   `publish:dry-run`, then the serialised `scaffold.runtime` — **request the token, do not start
   it.**

## Related but not yours

#1197 (agent-init adoption) closes on a **post-publish measured agent run**, not on this PR. Your
work is the mechanism that makes that measurement meaningful; do not claim its row.

Open the draft PR with `Closes #1375` only when all eleven rows are truthfully tickable.
