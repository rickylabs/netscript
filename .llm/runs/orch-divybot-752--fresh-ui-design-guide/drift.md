# Drift — orch-divybot-752--fresh-ui-design-guide

| When | Drift | Disposition |
| --- | --- | --- |
| S0 | Implementer is Claude Opus 5.5, not the matrix `sol` primary. | Dispatcher directive (harness#752 `harness: claude`, `model: claude-opus-5-5`). Evaluator stays non-Anthropic. |
| S0 | Framework source (fresh-ui token sources, CLI guidance builder, MCP concept table) edited by a Claude lane, not WSL Codex. | Dispatcher assigned the leaf to Claude; scope is value/string-level, recorded here and in `supervisor.md`. |
| S0 | Two orchid inbox stubs (harness#751, #752) target one upstream issue (#2406). | Coordinated split with the #751 session over SendMessage; ownership table in `supervisor.md`. |
| S0 | Worktree started on stale `6f6cbdf`. | Reset to `origin/main` `a833dfa` before reading code. |
| S1 | `deno task tokens:build` fails under `--lock=deno.lock --frozen` (lru-cache@6 resolved for path-scurry). | Generated with the `--no-lock` form, proven byte-identical on the unmodified tree; lock untouched; filed as a caveat. |
