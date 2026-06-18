# Context Pack — release-jsr-readiness--supervisor

Resumable summary. Read this first on resume.

## What this is

Supervisor program to make the repo JSR-publishable and pass the **scorecard** (`scorecard.md`),
which unblocks publish steps E (26 non-CLI via OIDC @ `0.0.1-alpha.0`) and F (`@netscript/cli`
last). Claude supervises; OpenHands evaluates (separate session); Codex WSL implements.

## State (2026-06-18)

- Umbrella branch `release/jsr-readiness` created off `main` @ `cc3b8731`.
- Supervisor run dir scaffolded: `scorecard.md`, `phase-registry.md`, `plan.md`, `research.md`,
  `worklog.md`, `drift.md`, `commits.md`, this file.
- Four sub-run skeletons scaffolded under `.llm/tmp/run/`:
  `chore-prod-readiness--cleanup`, `chore-deps-hygiene--deps`, `docs-user-site--diataxis`,
  `docs-internal-overhaul--contributor`.
- No generator launched; no sub-branch/worktree/sub-PR created (handover §5.5 — present plans first).

## Blockers

- **D-1 GitHub access** (no `gh`, no GitHub MCP wired to this session). Gates all PR/eval/merge ops.

## Next actions

1. Present scorecard + 4 plans to the user; resolve GitHub-access decision (D-1).
2. Per sub-run: PLAN-EVAL (separate OpenHands, minimax M3) → Codex WSL generator (mobile-visible)
   → IMPL-EVAL (separate OpenHands, qwen 3.7 max). Groups 1 & 2 parallel; docs IMPL after 1+2 merge.
3. Scorecard PASS (evaluator) → publish prep (E, F) on explicit user dispatch.

## Invariants (do not break)

- Catalog law (npm `catalog:`, JSR inline `jsr:`; never de-catalog). No edits to
  `scaffold-versions.ts` / version pins / `packages/aspire/src/public/mod.ts`. No lock deletion;
  no `deno cache --reload` without approval. `@netscript/cli` last. No real publish until scorecard
  PASS + explicit dispatch. Evaluator session ≠ generator session.
