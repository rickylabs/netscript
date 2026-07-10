# Plan — canonical routing policy migration (#581)

## Scope and profile

- Archetype: **6 — CLI / Tooling**, because repository launch commands and runtime policy contracts
  enforce route selection.
- Overlay: **SCOPE-docs**, covering harness policy, skills, templates, generated mirrors, and
  operator-facing documentation.
- Doctrine verdict: this does not change a published package/plugin surface; current repository
  doctrine debt remains unchanged.
- Baseline: integration `908d4f25`; branch bootstrap `fb77d165`.

## Locked decisions

1. `.llm/harness/workflow/lane-policy.md` remains the only complete routing-policy table. Every
   other surface references it and carries only local invariants or usage instructions.
2. Canonical policy is typed data consumed by launch enforcement; prose is rendered/referenced from
   the same semantics, not accepted as launch authority.
3. Launch commands require explicit provider/model/effort (and profile where applicable), validate
   them through the existing #577 `RouteIdentity` path, reject mismatch/missing identity before
   sending, and record requested plus observed identity in secret-safe evidence.
4. The Fable planning override is date-bounded through 2026-07-12 with an explicit GPT-5.6 Sol max
   transition on 2026-07-13.
5. GPT-5.6 Sol xhigh is primary for deep analysis. Fable 5 becomes eligible only on classified
   Codex/GPT-5.6 quota exhaustion; no generic availability failure silently selects it.
6. The research/extraction lane is Antigravity CLI (`agy`). “Gemini 3.5 Flash” is logged as
   superseded drift, not encoded as an additional guessed model route.
7. Outside-plan and higher-effort Fable routes are declarative policy only and retain explicit
   approval guards. Tests must prove no paid route is triggered.
8. Generator and evaluator remain distinct sessions. GPT-authored work is reviewed by Claude-family
   routes and Claude-authored work by GPT-5.6 Sol xhigh; mixed authorship is per-slice opposite-family
   or dual review.
9. #582 rollout, promotion, and production canaries remain deferred and regression-locked. #577–#580
   contracts remain intact.
10. `.claude/skills` changes only through `sync-claude-skills.ts` and must pass
    `validate-claude-surface.ts`.

## Open-decision sweep

- **Safe to defer:** distinct Gemini 3.5 Flash model lane separate from Antigravity. The current
  epic decision is unambiguous for #581; record the question without guessing.
- **Safe to defer:** exact date Anthropic restores Fable 5 subscription inclusion. Policy represents
  unknown availability and outside-plan approval constraints.
- **Resolved now:** canonical-file ownership, dated override semantics, quota-only fallback trigger,
  launcher enforcement fields, opposite-family evaluation, generated mirror procedure, and #582
  boundary.
- No unresolved decision would force implementation rework within #581.

## Expected files and scope budget

Planned production scope is approximately 12–20 source/doc files and 350–650 net LOC, excluding
generated `.claude/skills` mirrors and run artifacts. No individual TypeScript file should grow by
more than 250 LOC; prefer a focused policy module/test over expanding launchers beyond their current
single-command responsibility.

Expected surfaces:

- canonical: `.llm/harness/workflow/lane-policy.md`;
- runtime/enforcement: `.llm/tools/agentic/runtime/routing-policy.ts`, related contract/adapter files,
  `launch-codex-slice.ts`, `dispatch-openhands.ts`, and focused tests;
- skills/docs/templates: relevant `.agents/skills/**`, `CLAUDE.md`, agentic README, harness handoff
  templates/briefs discovered by focused search;
- generated: matching `.claude/skills/**` from the sync tool only;
- run evidence: this run directory.

If implementation discovery exceeds 20 authored files or 650 net LOC (generated mirrors excluded),
stop and ask the coordinator to rescope.

## Gate set

- Focused Deno tests for policy data, quota-only fallback, launch argument validation, route mismatch,
  requested/observed evidence, generator/evaluator separation, and #582 deferred boundaries.
- Scoped wrapper check/lint/fmt for `.llm/tools/agentic` TypeScript.
- `deno run --allow-read --allow-write .llm/tools/agentic/sync-claude-skills.ts`, then
  `deno run --no-lock --allow-env --allow-read --allow-write --allow-run
  .llm/tools/agentic/validate-claude-surface.ts --pretty`.
- Docs source-alignment, local-link, terminology, and single-table searches.
- `git diff --check`; secret-pattern scan over changed files; raw git status/diff evidence;
  `deno.lock` byte-for-byte unchanged.
- JSR audit: N/A (no publishable package/plugin surface).
- Full CLI E2E: N/A unless implementation unexpectedly affects scaffold/runtime launch behavior.

## Risk register

| Risk | Mitigation |
| --- | --- |
| Policy duplicated across skills/docs | One full table only; regression search/test rejects duplicate route matrices. |
| Launch prose diverges from actual route | Require explicit route fields, validate via #577 identity, record requested and observed identity. |
| Dated override becomes permanent | Encode start/end/fallback as policy data and test both sides of 2026-07-13. |
| Fable fallback triggers on broad failure | Permit it only for classified `quota_exhausted`; retain #579 depth/turn/approval guards. |
| Paid outside-plan route is invoked | No live provider call; policy-data tests assert approval-blocked behavior. |
| Generated Claude mirror is edited manually | Modify `.agents` only, run sync, validate exact parity. |
| #582 scope leaks into this PR | Keep capability-deferred blocks/tests; no rollout/promotion/live canary commands. |
| Historical evidence churn | Never mass-edit `.llm/runs/**`; touch only this run directory. |

## Deferred scope

- #582 rollout/promotion/production canaries and live route switching.
- Provider authentication, subscription detection, billing, or paid-model execution.
- Historical run-record normalization.
- A distinct Gemini 3.5 Flash model lane unless owner explicitly resolves the recorded question.
- Dependency or lock-file changes.

## Commit slices

1. **Plan proves bounded design.** Files: this run's `research.md`, `plan.md`, `worklog.md`,
   `context-pack.md`, `drift.md`. Gates: Plan-Gate checklist, `git diff --check`, secret scan,
   `deno.lock` unchanged.
2. **Canonical policy proves one dated, reconciled route source.** Files: lane policy, typed routing
   policy/contracts, focused policy tests, run evidence. Gates: focused tests + scoped wrappers +
   duplicate-policy search.
3. **Launch contracts prove enforced and recorded identity.** Files: Codex/OpenHands launchers,
   shared adapters/evidence and focused tests, agentic README, run evidence. Gates: launcher tests,
   mismatch/missing identity tests, #577–#580 and #582 boundary regressions, scoped wrappers.
4. **Documentation and mirrors prove one operator contract.** Files: relevant `.agents` skills,
   `CLAUDE.md`, harness templates/docs, generated `.claude` mirrors, run evidence. Gates: mirror sync,
   `validate-claude-surface.ts`, link/terminology/single-table checks, scoped docs review.
5. **DoD evidence proves merge-readiness handoff.** Files: tests/docs/run evidence and PR DoD only;
   no new feature scope. Gates: all selected gates, `git diff --check`, secret scan, lock unchanged.

