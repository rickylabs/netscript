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

## D-1 workflow-token update (2026-06-18) — workflow-scoped PAT PROVIDED + stored, scope blocker RESOLVED

- **Provided + verified:** user generated a classic PAT and supplied it. `GET /user` → `200 OK`,
  login `rickylabs`, `X-OAuth-Scopes: repo, workflow` — both required scopes present.
- **Stored:** persisted to **Windows Credential Manager** via GCM (`git credential approve`, host
  `github.com`, user `rickylabs`). Durable across sessions, OS-encrypted; value NOT written to any
  file or run artifact. At Group 3, verify retrieval with a guarded `git credential fill` before the
  Lume→Pages workflow-file push.
- **Exposure:** the token value was pasted into the chat transcript (persisted in the session log).
  Recommend a short expiry + rotating/revoking after the program (or sooner) via
  `https://github.com/settings/tokens`.
- **Net effect:** the "workflow scope ABSENT" item above is RESOLVED. All GitHub ops — including
  `.github/workflows/**` — are now unblockable from this session.

## D-3 — WSL Codex remote-control daemon found UNMANAGED (IMPL lane)

- **Severity:** significant (blocks mobile-visible Codex implementation launches; NOT the bootstrap).
- **Skill activated:** `.agents/skills/codex-wsl-remote` (no `.claude/skills/` mirror in worktree).
- **Observed (2026-06-18 ~11:19 CEST):** transport up (`127.0.0.1:2222`), SSH → `codex` user OK,
  CLI `codex-cli 0.141.0`, managed daemon reports `status:running` with `--remote-control`
  (pids 3160 app-server, 3169 pid-update-loop). **BUT** `codex remote-control start --json` →
  `Error: app server is running but is not managed by codex app-server daemon`. This is the
  documented **unmanaged-app-server** state (skill "Known Incidents" 2026-06-14) — exactly why no
  sub-run is visible on Desktop/mobile.
- **Guard check clean:** no active `deno`/`dotnet`/`aspire`/`docker`/`node`/`git` work; latest
  Codex session `2026-06-17 19:49` (~15.5h idle). Safe to repair.
- **Repair attempted, BLOCKED:** the skill's anchored-PID safe recovery (kill only
  `^/home/codex/.codex/packages/standalone/current/codex app-server` PIDs → `rm` stale control
  socket → `codex remote-control start --json`) was denied by the Claude Code auto-mode classifier
  (kill + socket removal on a shared host needs explicit authorization, not general "make it
  work"). Not retried.
- **Resolution (pending user):** user authorizes the repair, or runs it themselves (one-liner
  provided in chat). Expected good output: `"status":"connected"`, `"remoteControlEnabled":true`,
  `serverName":"YogaBook9i"`. **Not blocking today** (pre-generator); MUST be green before any
  Codex generator launch.
- **RESOLVED (2026-06-18 CEST):** user authorized; ran the skill's anchored-PID repair (killed pids
  3160/3169 → removed stale socket → `codex remote-control start --json`). Now
  `status:connected`, `remoteControlEnabled:true`, `serverName:YogaBook9i`,
  env `env_e_6a2d7485c5a0832a82505a12442cd3ec`. Bonus: app-server/CLI version skew also cleared
  (`0.140.0` → `0.141.0`, now equal). Lane is Desktop/mobile-connected.
- **Remaining lane prerequisite (NOT yet done):** no native WSL worktree exists under
  `/home/codex/repos/` for `release/jsr-readiness` or its sub-branches (`chore/prod-readiness`,
  `chore/deps-hygiene`, `docs/user-site`, `docs/internal-overhaul`). One must be created on ext4
  (NOT `/mnt/c`) before the first generator slice launches; until then there is nothing for a
  sub-run thread to attach to.
