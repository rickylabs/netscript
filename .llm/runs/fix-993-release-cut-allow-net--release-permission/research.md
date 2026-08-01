# Research — fix-993-release-cut-allow-net--release-permission

## Re-baseline

- Carried-in source: issue #993 supervisor reproduction and root-cause lead.
- Re-derived against `origin/main` @ `3ab64720ffe06dedc80f12e8f7bb9fa281de37b9` on 2026-08-01.
- What changed vs the carried-in version: nothing material found; every load-bearing claim below was confirmed in this worktree.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | `release:cut` grants read/write/run/env but no net permission. | `deno.json:97` |
| 2 | The configured GitHub API base is `https://api.github.com`; a host-scoped permission is sufficient. | `.llm/tools/agentic/config/endpoints.ts:26` |
| 3 | With the real `gh auth token`, `validateGithubToken` returns `null` without net permission and `rickylabs` with `--allow-net=api.github.com`. | direct `deno run` probes recorded in `worklog.md` |
| 4 | The underlying `githubRequest` failure is `Deno.errors.NotCapable`, and its message says net access to `api.github.com:443` is required. | direct `githubRequest` probe recorded in `worklog.md` |
| 5 | `validateGithubToken` catches every error and returns `null`; `resolveGithubToken.accept()` records any null as `(401)` and its terminal error recommends `gh auth login`. | `.llm/tools/agentic/lib/agentic-lib.ts:976-1124` |
| 6 | Other audited GitHub-API task surfaces carry net permission; `release:canary` does not resolve a GitHub token. | `deno.json:79-100`; focused consumer search |
| 7 | Listed consumers use the shared resolver/request; `gh-token.ts` also calls `validateGithubToken` directly when storing a PAT. A thrown permission error is compatible and should fail that operation immediately. | focused search across the seven named consumers |
| 8 | No task-surface snapshot specific to `release:cut` was found in the focused test/search surface. | focused search in `.llm/tools` and `deno.json` |

## jsr-audit surface scan (package/plugin waves)

- N/A: this run changes repository release tooling and tests only; it does not touch `packages/` or `plugins/` or a publishable export surface.

## Open questions

- None. The error-classification choice is locked in the plan.

