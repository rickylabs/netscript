# Drift — orch-divybot-752--fresh-ui-design-guide

| When | Drift | Disposition |
| --- | --- | --- |
| S0 | Implementer is Claude Opus 5.5, not the matrix `sol` primary. | Dispatcher directive (harness#752 `harness: claude`, `model: claude-opus-5-5`). Evaluator stays non-Anthropic. |
| S0 | Framework source (fresh-ui token sources, CLI guidance builder, MCP concept table) edited by a Claude lane, not WSL Codex. | Dispatcher assigned the leaf to Claude; scope is value/string-level, recorded here and in `supervisor.md`. |
| S0 | Two orchid inbox stubs (harness#751, #752) target one upstream issue (#2406). | Coordinated split with the #751 session over SendMessage; ownership table in `supervisor.md`. |
| S0 | Worktree started on stale `6f6cbdf`. | Reset to `origin/main` `a833dfa` before reading code. |
| S1 | `deno task tokens:build` fails under `--lock=deno.lock --frozen` (lru-cache@6 resolved for path-scurry). | Generated with the `--no-lock` form, proven byte-identical on the unmodified tree; lock untouched; filed as a caveat. |
| S3 | Writable surface grew to `packages/mcp` guidance concepts + tests. | Item 3 of #2406 is "MCP find_guidance returns off-topic hits"; embedding pages alone does not route intents. Recorded in `supervisor.md`. |
| S4 | Standalone MCP `get_doc` could not resolve docs-site slugs (`web-layer/...`); the release carrier keys pages as `pages/web-layer/...`. Any hard-coded slug in guidance (this run's AGENTS.md, #2407's skill) failed on the default consumer corpus. | Fixed narrowly in `ReleaseEmbeddedDocsCorpus.get` (fallback to `pages/<slug>` with `redirectedFrom`), with tests. |
| S5 | `~/.local/bin/opencode` is now OpenCode 2.1.2 (n5-ops); its `models` command rejects the provider argument, so the `agentic:opencode` preflight fails with `launcher-catalog-unavailable` for `openrouter/meta/muse-spark-1.3`. The evaluator session `ses_ea08ab886ffeD4MI4Ly0kKJlRJ` lives in the V1 `opencode.db`. | Round 3 used the launcher's `OPENCODE_BIN` override pointed at the retired V1 binary (`~/.opencode/bin.old-20261021/opencode`, 1.19.3): same matrix route, same session, no installed tooling changed. Main needs an OpenCode 2 catalog path in `opencode-preflight.ts`. |

## S9 (2026-10-28)

| Planned | Reality | Resolution |
| --- | --- | --- |
| S1 derives intent tints/hover/accent/ring in `tokens/semantic.tokens.json` | #2435 (tokens v2) deleted those sources; v2 values are Figma-owned and NS One's legacy CSS is byte-locked | S1 dropped on rebase. The guides document the v2 seven-role alias override; the v2-native fix is a caveat for the design-system owners |
| Guides teach editing `:root` in `assets/tokens.css` | v2 generates `tokens.css`; restyling goes through `netscript tokens init/build` and alias overrides | Theme sections rewritten against v2, measured on a local-source scaffold |
