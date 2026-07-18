use harness

## SKILL
- netscript-harness; netscript-tools; jsr-audit; netscript-pr; rtk

## Slice: bring packages/mcp/README.md to the production README standard before its FIRST JSR publish

Worktree `/home/codex/repos/b10-mcpreadme`, branch `docs/mcp-readme-standard`, base = current main. PR base: main. SCOPE: packages/mcp/README.md ONLY (the repo has 30+ other README-standard failures — they are explicitly OUT of scope).

`deno task docs:readme:check` flags packages/mcp/README.md missing: `## Install`, `## Quick example` (or `## Quick start`), `## Docs` (or `## Documentation`). @netscript/mcp ships its FIRST publish in v0.0.1-beta.10, so this README is the package's public face on jsr.io.

Task: study 2-3 READMEs that PASS the standard (find them: run the check, pick passing packages — e.g. packages/cli or telemetry) and match their section shape and voice. Author the three sections for mcp:
- `## Install`: the real consumption paths — via `netscript agent init` (primary; writes the MCP config), and direct `deno add jsr:@netscript/mcp` / `deno x -A jsr:@netscript/mcp@<pinned>/cli` forms — follow the pinned-specifier conventions used by sibling READMEs (NO bare pinnable specifiers; check how cli/telemetry READMEs handle version pins).
- `## Quick example`: a minimal, REAL stdio flow (e.g. the agent-host config snippet `agent init` writes, or launching `netscript agent mcp` and what tools/list returns conceptually) — verify every command against the in-tree public CLI (`deno run --no-lock -A packages/cli/bin/netscript.ts agent --help`); do not invent flags.
- `## Docs`: link the docs-site MCP reference + agent-tooling pages (verify the paths exist under docs/site/).
Keep the existing tagline paragraph byte-identical (it is under the 250-byte JSR cap — do not touch it). Preserve badges.

Gates: `deno task docs:readme:check` shows packages/mcp/README.md CLEAN (other failures unchanged — diff the failure list before/after to prove you fixed only mcp); `deno task docs:tagline:check` still `over=0`; `deno fmt --check` on the file; changed-line grep: no internal wording, no bare pinnable specifiers.

Push explicit refspec `git push origin HEAD:refs/heads/docs/mcp-readme-standard`; DRAFT PR to main titled `docs(mcp): production README — Install / Quick example / Docs sections before first publish`, labels `type:docs, area:docs, priority:p0, status:impl-eval`, milestone 12 if open else 13, body with before/after failure counts + verification. resolveGithubToken, fallback ~/.config/gh/hosts.yml oauth_token. No self-evals; do not merge.
