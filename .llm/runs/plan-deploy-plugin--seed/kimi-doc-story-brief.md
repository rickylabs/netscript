use harness

# Brief — Kimi K3 doc-driven story pass (deploy plugin seed, stage 3)

You are the **doc-driven story** stage of harness run `plan-deploy-plugin--seed` (branch
`plan/deploy-plugin`, this worktree). The design corpus (revision r2, adversarially hardened) is
complete. Your job: **forecast the public-facing documentation as if the deploy plugin had
shipped through wave W3**, so the API/DX becomes concrete before implementation. Where the docs
cannot explain something cleanly, that is a **design bug to report — not something to paper
over with prose**.

## SKILL

- `.agents/skills/netscript-harness/SKILL.md` — run mechanics (context only; you write one file).
- Docs voice: mirror the existing site (`docs/site/orchestration-runtime/how-to/deploy.md`,
  `docs/site/orchestration-runtime/how-to/deploy-deno-deploy.md`) — practical, honest about
  limits, command-first.

## Read (in order)

All under `.llm/runs/plan-deploy-plugin--seed/`:

1. `design/canonical/DP-0-concept-and-goal-frame.md` (the concept + three-tier goal frame)
2. `design/canonical/DP-2-deploy-core.md` (eight-op lifecycle, capability verdicts, cells)
3. `design/canonical/DP-4-plugin-and-host.md` (CLI surface: mount-children, `target add`,
   `capabilities --json`, doctor)
4. `design/canonical/DP-8-scaffold-stories.md` (the five walked stories)
5. `design/canonical/DP-3-adapter-cards.md`, `DP-6-migration-map.md`,
   `DP-7-contribution-matrix.md` (reference as needed)
6. `plan.md` §2–§5 (locked decisions, board)

## Deliverable (ONE file)

Write `.llm/runs/plan-deploy-plugin--seed/doc-story-kimi.md`:

1. **Docs IA outline** — the deploy section's page tree for the docs site (titles + one-line
   scope each), replacing today's "alpha-minimal" deploy page.
2. **Four fully-written forecast pages** (in the site's voice, fenced as documents inside the
   file):
   - *Deploy a NetScript workspace* (the new getting-started page: `plugin install deploy` →
     `deploy target add deno-deploy` → `plan` → `emit` → `up`; reading capability output;
     CI split build-vs-deploy with `up --prebuilt`).
   - *Deploy to Cloudflare Workers* (Story 1: target add, wrangler config emission, the
     workers-variant capability caveats — sagas rejected, KV no-CAS — and what
     `suggestedCells` looks like when the app exceeds the isolate profile).
   - *Reference: `deploy capabilities` and `deploy doctor`* (verdict levels incl. `unverified`
     vs `unsupported` vs adapter-not-installed vs credential-unavailable; per-target permission
     profiles).
   - *Migrating from the built-in deploy commands* (legacy verbs keep working; what changed:
     unknown-target config errors; where `build/start/stop/upgrade` now live).
3. **`## DX findings`** — numbered `KF-1…KF-n`: every seam the docs could not explain cleanly
   (naming friction, missing commands/flags, confusing concept counts, outputs users can't
   parse, migration traps). One-line claim + why it hurt the page + the corpus ref (DP-N §x).
   These findings are your primary value — be adversarial about the DX, constructive in form.

## Hard rules

- **Public-docs hygiene**: no internal process/agent/PR-number/codename mentions in the
  forecast pages; no invented capabilities — every claim must trace to the r2 corpus; where the
  corpus is honest about a limit, the docs are too.
- Write ONLY `doc-story-kimi.md`. Do not edit any other file. Do not run git commands. No
  GitHub mutations. No `packages/`/`plugins/` reads needed beyond the two docs-voice references.
- End your final message with `DONE` (or `BLOCKED: <reason>`).
