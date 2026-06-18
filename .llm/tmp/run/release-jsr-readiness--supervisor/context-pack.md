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

## State (2026-06-19)

- Fresh-ui interactive JSX/doc-lint fix landed in
  `7c29de5c33d5597d995eb700306a1092bf2e9934`.
- The seven interactive namespaces under `packages/fresh-ui/src/runtime/` now use concrete
  component prop types with implementation returns restored to `VNode`; the public namespace types
  and component prop types are exported from `packages/fresh-ui/interactive.ts`.
- Added `FreshUi*` public prop helper types so `./interactive` exposes doc-lint-safe structural
  props without publishing Preact `JSXInternal` types.
- Repaired the stale `packages/sdk/README.md` doctest fixture mismatch (`users` example vs `orders`
  prelude, missing JSON fence) so the literal root `deno task test` gate is green.
- Gate evidence for this slice:
  - `deno task test` from repo root: exit 0, `653 passed (356 steps)`, `0 failed`, `12 ignored`.
  - `deno doc --lint ./mod.ts ./interactive.ts ./primitives.tsx` from `packages/fresh-ui`: exit 0,
    `Checked 3 files`.
  - `deno task check` from repo root: exit 0, `1598` files, `0` occurrences.
  - Scoped fresh-ui check/lint wrappers: exit 0, `0` occurrences.
- Formatting-only CI quality slice landed in
  `6350b544e3b6f66d954c86597dabf5e7d9c8fbef`.
- `deno task fmt:check` reported exactly one file:
  `packages/fresh/src/runtime/server/define-fresh-app.ts`; that file was formatted with `deno fmt`.
- Gate evidence for the formatting slice:
  - `deno task fmt:check` from repo root: exit 0, `1169` files selected, `0` findings.
  - `deno task check` from repo root: exit 0, `1598` files selected, `0` occurrences.

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
