# Research — Graft integration + benchmark

## Subject

[NanoNets/Graft](https://github.com/NanoNets/Graft) (`@nanonets/graft`, npm, v0.13.0 at run time):
an open-source "context layer for coding agents". It builds a local knowledge graph of the repo —
linked markdown cards plus `wiring.json` — via tree-sitter (structural pass, offline, no API key)
with an optional LLM-enrichment pass (`graft build --deep`, needs `GRAFT_API_KEY`). Agents query it
via CLI (`graft ask|grep|callers|skeleton|map`) or an MCP server (`graft_find_code`,
`graft_file_api`, `graft_trace_calls`, `graft_find_all`, `graft_repo_map`,
`graft_check_freshness`). Upstream claims: −42% tokens, −46% tool calls, −60% wall time vs cold
Claude Code sessions.

## Findings (verified in this container)

1. **Install**: `npm install -g @nanonets/graft` works under Node v22.22.2 (this repo already
   requires Node for docs tooling). No daemon; on-demand CLI.
2. **Structural build on NetScript**: `graft build` parsed 2,956 TS/TSX/JS files in ~36s wall,
   producing 17,861 nodes / 35,598 edges / 2,956 cards under `graft/`. Deno-style imports parse
   fine at the structural tier (tree-sitter, not module resolution). No API key needed.
3. **Side effects**: the tool self-appends `/graft/` to `.gitignore` and writes a root `.ignore`
   re-admitting `graft/` for ripgrep. Both are small and reviewable; the graph itself is a local
   regenerable cache and is not committed.
4. **Query smoke**: `graft ask "where is the plugin registry generation implemented?"` (lexical
   mode, since no deep pass) returned `plugins/workers/src/cli/runtime-registry-generator.ts` and
   the e2e registry gates in its top-5 — plausible ranking on a cold structural graph.
5. **Deep pass unavailable here**: no `GRAFT_API_KEY` in this container; the benchmark therefore
   measures the structural graph only. The upstream claims are for the enriched graph; our verdict
   is thus a lower bound on Graft's ceiling and an exact measure of its zero-cost tier.
6. **Deno not first-class**: TypeScript is full-fidelity for parsing, but Graft's LSP tier and
   module resolution assume Node conventions; `jsr:`/`npm:` specifiers are treated lexically.

## Fit with existing harness surface

- The repo already has token-hygiene tooling (`rtk`) and read-order doctrine (AGENTS.md,
  `deno doc` guidance). Graft would slot in as a *navigation* accelerator, complementary to
  `deno doc` (public surface) and `rtk grep` (cheap search).
- Canonical skills live in `.agents/skills/<name>/` mirrored to `.claude/skills/` — a Graft skill
  must follow that layout, not the `.claude`-only file `graft init` writes.
- `graft init`'s MCP/hook/statusline wiring mutates agent configs; for this evaluation we
  integrate the **skill + CLI surface only** (lowest-risk slice), leaving MCP/hooks as follow-up.

## Open questions the benchmark must close

- Does the structural graph measurably reduce tool calls / tokens / wall time for Opus 5 (medium)
  subagents on real NetScript codebase-navigation tasks?
- Does answer *quality* (grounding, correctness of file/symbol citations) improve, degrade, or
  hold?
- Is the 36s build + per-query refresh cost acceptable inside harness runs?
