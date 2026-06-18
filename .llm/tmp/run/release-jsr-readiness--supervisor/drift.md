# Drift Log — release-jsr-readiness--supervisor

Append-only. Severity ∈ {minor, significant, architectural}.

## D-1 — GitHub access not available to this session (BLOCKER)

- **Severity:** significant (blocks the PR/eval/merge machinery; not the bootstrap deliverables).
- **Observed:** `gh` not installed (`Get-Command gh` → not found, as handover §1 warned). No
  GitHub MCP tools (`mcp__github__*`) connected to this Claude Code session; no GitHub server in
  the connecting list. `mcp-server-github` IS enabled in **Zed** (`%APPDATA%\Zed\settings.json`
  `context_servers`, with a PAT) — but Zed's context servers are scoped to Zed's agent, not this
  session's MCP surface (confirmed: this session's MCP set differs from Zed's enabled set).
- **Impact:** cannot open the draft umbrella PR, sub-PRs, post PR comments, trigger OpenHands via
  PR comment, or merge from this session as configured.
- **Resolution (pending user decision):** (a) register `mcp-server-github` in Claude Code's MCP
  config (`claude mcp add` / `.mcp.json` / `~/.claude.json`); (b) install `gh`; or (c) user
  performs GitHub ops. Even then the Zed PAT likely **lacks `workflow` scope** → `.github/
  workflows/**` edits (Lume→Pages) still require a local-git-worktree push.
- **Security note:** the Zed settings file stores live secrets in plaintext (GitHub PAT, Sanity
  tokens, Firecrawl key) — recommend rotating/securing.

## D-2 — Sub-run count: handover §3 "four" vs §5 "three"

- **Severity:** minor (scope clarity).
- **Observed:** Handover §3 lists **four** sub-runs (prod-readiness, deps-hygiene, user-site,
  internal-overhaul); §5.2/§5.5 say "three". §5.4 names only docs×2 + cleanup for research kickoff
  (omits deps-hygiene research).
- **Resolution:** §3 governs — built **four** sub-run skeletons. Flag to the user at the review
  checkpoint. (Likely §5 drafting slip treating deps-hygiene as tooling rather than a research-heavy
  run.)

## D-1 update (2026-06-18) — GitHub access RESOLVED for ops; MCP registration deferred

- **PAT verified:** user authorized using the Zed PAT. `GET /user` → `200 OK`, login `rickylabs`,
  `X-OAuth-Scopes: repo`. Remote is `github.com/rickylabs/netscript`. ⇒ push / PR create / PR
  comment / merge all work from this session via `git` + REST API directly (no MCP required).
- **`workflow` scope ABSENT:** confirmed. `.github/workflows/**` changes are rejected by GitHub
  even over git push without it. The Lume→Pages workflow file (Group 3 IMPL) needs a
  **workflow-scoped token** — **user will provide one later; trigger = when Group 3 reaches the
  Pages workflow file.** Until then, no workflow-file changes are attempted.
- **MCP auto-registration DENIED:** `claude mcp add github -s user …` was blocked by the Claude
  Code auto-mode classifier (it read the "prepare a token later" message as a boundary and flagged
  secret-embedding). Not retried. Resolution: user self-runs the `claude mcp add` command, or
  explicitly authorizes it. **Not a blocker** — GitHub ops proceed via the PAT over git+REST. Even
  once registered, the running session must restart for MCP tools to bind.
- **Security:** Zed `settings.json` stores the PAT (and Sanity/Firecrawl secrets) in plaintext —
  recommend rotating/securing. The verified token value is NOT recorded in run artifacts.
