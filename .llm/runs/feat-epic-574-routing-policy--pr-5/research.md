# Research — canonical routing policy migration (#581)

## Baseline

- Branch `feat/epic-574-routing-policy` is at `fb77d165` and descends from integration baseline
  `908d4f25` (verified with `git merge-base --is-ancestor`).
- Plain `git fetch origin` fails because the worktree's remote fetch configuration still names the
  absent `feat/fresh-ui-pixel-polish` ref. Explicit fetches for the integration and feature refs
  succeeded. This is operational drift, not #581 scope.
- The only pre-existing worktree change is untracked
  `.llm/runs/feat-epic-574-routing-policy--pr-5/codex-thread-ids.md`; it is coordinator-owned and is
  preserved.
- The branch bootstrap already contains `supervisor.md`. No implementation exists beyond that run
  bootstrap.

## Current policy and enforcement surface

1. `.llm/harness/workflow/lane-policy.md` is explicitly named as the lane-policy single source, but
   its table still binds older tier-specific models (Fable supervisor, GPT-5.5-high Codex, Sonnet
   workflows) and therefore does not encode the owner-approved 2026-07-10 policy.
2. Several skills and `CLAUDE.md` repeat model routing prose. They must point to the canonical table
   and retain only invariant/surface-specific guidance.
3. `RouteIdentity` in `.llm/tools/agentic/runtime/contract.ts` already requires agent, provider,
   model, effort, worktree, and mobile-required state. Provider adapters validate completeness and
   conflicts. #577 therefore owns the runtime identity contract; #581 must reuse it.
4. `launch-codex-slice.ts` accepts an optional profile but does not accept an explicit model and
   effort contract, and its thread artifact records only parsed model plus fixed sandbox prose.
5. `dispatch-openhands.ts` accepts model and provider as optional prose-trigger fields and has no
   effort argument. Its launch record is the PR comment, not a normalized route-identity record.
6. The runtime policy module currently selects quota fallback candidates but has no canonical task
   lane data. Its `DEFERRED_ISSUES` includes #581 and #582; completing #581 must remove only #581's
   deferral while retaining #582 rollout/promotion boundaries and tests.
7. `.claude/skills` is generated wholesale from `.agents/skills` by
   `sync-claude-skills.ts`. Mirrors must never be hand-edited. `validate-claude-surface.ts` checks
   exact mirror parity and hook lock hygiene.
8. Antigravity is already the canonical Google CLI identity (`agent: antigravity`, provider Google,
   executable `agy`) in the runtime and README. This supports reconciling the issue's stale
   “Gemini 3.5 Flash” research lane to Antigravity without inventing a distinct model lane.

## Canonical-policy interpretation

- One complete table will remain in `.llm/harness/workflow/lane-policy.md`. Skills, docs, templates,
  and launch help will link to it instead of reproducing the routes.
- The planning/decision lane is dated policy data: Fable 5 medium through Sunday 2026-07-12, then
  GPT-5.6 Sol max from Monday 2026-07-13. It is not a silent default replacement.
- Deep analysis uses GPT-5.6 Sol xhigh first; Fable 5 is eligible only after Codex/GPT-5.6
  `quota_exhausted`, reusing #579 fallback semantics.
- Fable mobile orchestration is policy data only. Outside-plan/higher-effort routes remain approval
  blocked; this work never triggers paid spend.
- Massive external research/extraction routes to Antigravity CLI (`agy`). The issue-body Gemini
  reference is superseded and will be recorded in `drift.md`; no separate Gemini model lane is
  inferred.

## Doctrine and publishability

- Selected profile: Archetype 6 (CLI/tooling), because launcher contracts and agentic TypeScript
  tooling change; add `SCOPE-docs.md` for harness, skill, and human documentation.
- No `packages/` or `plugins/` source/public export changes are planned. JSR audit is N/A: the
  changed runtime tools are repository-internal and no publish surface or dependency changes.
- Relevant doctrine risks are AP-1 (oversized launcher edits), AP-2/AP-6 (duplicate policy/helper),
  AP-8 (mixed concerns), AP-14 (stringly finite route values), and AP-20 (tests coupled to internal
  mechanics). The design uses finite typed policy data, a single source, thin launch edges, and
  behavior-level regression tests.
- No existing architecture-debt entry is directly affected and no new debt is anticipated.

## Open questions

- Safe to defer: whether a distinct Gemini 3.5 Flash model lane is desired in addition to `agy`.
  Current epic reconciliation makes Antigravity authoritative; coordinator/owner can create a
  follow-up if the distinct model lane is intentional.
- Must resolve during Plan-Gate: exact launcher set that is considered a #581 launch edge. The plan
  includes Codex and OpenHands launchers plus shared route-policy/runtime adapters; it excludes
  provider login, rollout promotion, canaries, and external-provider execution.

