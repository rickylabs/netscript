# Context Pack — docs-v3-ia-plan--supervisor

**Branch:** `docs/v3-ia-plan` (off `origin/main` @ `5f273355`) · **Overlay:** SCOPE-docs · **Phase:** Plan & Design (PLAN-EVAL pending)
**Worktree:** `.claude/worktrees/docs-v3-ia-plan` (session entered via EnterWorktree).

## What this run is
A **planning-only** PR that produces a locked IA + workstream plan to take the NetScript docs from
"accurate v3" to production-grade public docs (Medusa/Astro/Laravel/TanStack bar). Closes the orphaned
structural backlog (tasks #26/#27/#28) + verified feature gaps + public-voice cleanup. No prose authoring
here; a later separately-gated build run consumes this IA.

## Locked decisions
D1 multiple independent tutorial tracks · D2 per-track real apps (storefront/workspace/erp-sync/live-dashboard)
· D3 full design-system + rendered diagrams (touch central base.vto/styles) · D4 layered eval (WSL Codex
adversarial harden → OpenHands minimax-M3 PLAN-EVAL gate).

## Key correction
First gap agent ran on a STALE worktree (`feat/framework-prime-time` @ 5a938ef8) and falsely reported
auth packages missing. Verified on origin/main: `packages/{plugin-auth-core,auth-better-auth,auth-workos,
auth-kv-oauth}` + `plugins/auth` all EXIST. Auth docs accurate; finding discarded. All other gaps
re-verified on origin/main.

## Artifacts (this dir)
- `research.md` — grounding synthesis + verified surface + constraints
- `doc-architecture-v3.md` — the locked IA (sitemap, hubs, 4 tracks, components, 11 diagrams, xref, migration map)
- `plan.md` — 8 workstreams (WS1 IA restructure · WS2 tracks · WS3 feature homes · WS4 components ·
  WS5 diagrams · WS6 xref · WS7 voice cleanup · WS8 affordances), gates, risks, eval handoff
- `ground/leakage-diagram-barraising.md` — 19 leakage instances (concentrated in Explanation zone),
  11 diagram slots, competitor affordance gaps
- `ground/playground-showcase-map.md` — netscript-start/apps/playground integration map (grounds WS2)

## Next steps
1. Fold playground map into research §6 / WS2.
2. Commit all artifacts; push via explicit refspec `HEAD:refs/heads/docs/v3-ia-plan` (upstream unset);
   open **draft** PR off `main` (gh runs as WSL codex user).
3. WS task #84: WSL Codex adversarial panel (unoriented) → fold findings.
4. WS task #85: OpenHands minimax-M3 PLAN-EVAL (separate session, unoriented) → PASS before any build.

## Landmines in play
- Push: explicit refspec only (upstream was origin/main; unset) — [[codex-worktree-upstream-tracking-landmine]].
- gh comment bodies via `--body-file` not shell $VAR.
- Codex launch gate tightened — needs user allowlist / `!`-launch / fresh per-command auth.
- Don't re-inject fixed docs-v2 accuracy caveats. reference/** untouched.
