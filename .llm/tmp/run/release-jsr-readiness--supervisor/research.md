# Research — release-jsr-readiness--supervisor

## Re-baseline

- Carried-in source: handover prompt (this session) + S1 supervisor run
  `.llm/tmp/run/feat-package-quality--supervisor/` (worklog through 2026-06-18).
- Re-derived against `main` @ `cc3b8731` (= `origin/main`, verified by `git ls-remote`).
- What changed vs the carried-in version:
  - `main` is now `cc3b8731` ("P0: reconcile feat/package-quality → main (#52)"), the
    superset; `feat/package-quality` fully merged (0 ahead). S1 worklog's last SHA was
    `a76414c5` (PR #51 Copilot removal) — `cc3b8731` post-dates it (PR #52).
  - S1 (waves 0–6 package quality), S2 (CI minimal gate + full quality lane PR #49), and
    Copilot-setup removal (PR #51) are all merged. Program A/B/C/D done.

## Findings

| # | Finding | How to verify |
|---|---------|---------------|
| 1 | `main` @ `cc3b8731`; clean tree; umbrella `release/jsr-readiness` created off it. | `git ls-remote origin main` → `cc3b8731`; `git -C <wt> rev-parse HEAD`. |
| 2 | All 27 units pass `publish:dry-run` with 0 slow types on `main` (S1 outcome). | `deno task publish:dry-run` (= `.llm/tools/run-publish-dry-run.ts`). |
| 3 | CI on `main`: `check-test` (required) + `quality` (lint/fmt/scaffold-versions/dry-run/audit) + `deps-report`. | `.github/workflows/ci.yml`. |
| 4 | `.llm/tmp/run/` is **tracked** (only `.llm/tmp/{claude,cli-e2e,openhands}/` ignored) → run artifacts commit + push. | `.gitignore` lines 13–18. |
| 5 | **Catalog reality:** Deno has no JSR catalog; `catalog:` is npm-only. JSR-version centralization is impossible via Deno config → must be a scanner gate. | Handover §3 + Deno PR #32947; confirm member `catalog:` resolves on 2.8.3. |
| 6 | **GitHub access gap:** `gh` not installed; no GitHub MCP wired to this Claude Code session (only enabled in Zed `context_servers`, a separate scope). | `Get-Command gh` → not found; tool list has no `mcp__github__*`. See `drift.md` D-1. |
| 7 | Handover §3 says **four** sub-runs; §5 says "three". Reconciled to **four** (§3 governs). | Handover text; see `drift.md` D-2. |

## jsr-audit surface scan

- N/A at the umbrella level (no single package surface). Each package/plugin sub-run that
  touches a public surface applies the `jsr-audit` rubric in its own Plan & Design. The S1
  baseline (27 units, 0 slow types) is the standing publishability floor the umbrella must hold.

## Environment / tooling notes

- **Worktree:** session isolated in `.claude/worktrees/release+jsr-readiness` on branch
  `release/jsr-readiness` (EnterWorktree sanitized `/`→`+` in the path; branch renamed to the
  canonical `release/jsr-readiness`).
- **GitHub:** see Finding 6 + `drift.md` D-1. Local `git push` over HTTPS may still work via a
  cached credential helper (independent of the missing MCP/`gh`) — to be verified at push time.
  Even with the Zed PAT, it likely **lacks `workflow` scope**, so `.github/workflows/**` changes
  (e.g. the Lume→Pages workflow) need a local-git-worktree push, not the API.
- **Docs research** captured at `.llm/tmp/docs/docs-architecture-research.md` (Diátaxis;
  Lume→Pages recipe; Laravel/TanStack/Medusa architectures).

## Open questions

- How will this session perform GitHub operations (sub-PRs, PR comments, OpenHands PR-comment
  triggers, merges)? Options: wire `mcp-server-github` into Claude Code config; install `gh`;
  or the user performs GitHub ops. **Gating** — see `plan.md` Open-Decision Sweep.
- Confirm member `catalog:` refs resolve on the pinned Deno 2.8.3 before `chore/deps-hygiene`
  touches anything (handover early-check).
- Exact reference-doc denominator across the 27 (library vs examples/apps/e2e) — pin in
  `docs/user-site` research.
