# Run summary — PR-C PLAN-EVAL cycle 2 (`chore-alpha1-legacy-purge--purge`)

## Summary

PLAN-EVAL (separate session) for the project-wide alpha-1 legacy/deprecated purge + folded
hygiene plan. Read `research.md` and `plan.md`, walked the Plan-Gate checklist
(`gates/plan-gate.md`), and spot-checked the plan's load-bearing claims against the current
tree on branch `chore/alpha1-legacy-purge` (baseline `abb6e9a4`). Verdict: **PASS** with two
minor non-blocking wording drift items surfaced in `plan-eval.md` for the implementer to
address during S1 (these do not gate implementation).

## Changes

Files written during this run:

- `.llm/tmp/run/chore-alpha1-legacy-purge--purge/plan-eval.md` — the PLAN-EVAL verdict
  deliverable (PASS), including the Plan-Gate checklist table, evaluator-run spot-check
  evidence table, and three Notes for the implementer:
  1. `safeExtend` has 1 in-class caller (`search-params.ts:76`), not 0 — removal still
     correct (rewrite to `this.extend(shape)`), but plan wording should be updated.
  2. `startWorkersStreamMirror` IS the canonical name — there is no separate alias; the
     S1 action is delete + inline (or move `createStreamMutationHook` to consumer),
     not "rename to canonical name".
  3. `dependsOn` lives on TWO surfaces: aspire `DependsOn` (legacy alias, removed) vs
     canonical `ServiceConfig.dependsOn` (LIVE, kept) — plan correctly scopes removal to
     aspire only; noting here so IMPL-EVAL can spot-check the discipline.

No code changes were made. No commits were made. No PR comment was posted (the task says
"Do not post GitHub issue or PR comments directly. The workflow owns GitHub comments.").

## Validation

PLAN-EVAL is the planning gate; it does not run code. Validation was the spot-check
evidence-gathering documented in `plan-eval.md` (table of plan-claim vs tree-evidence):

- `updatePluginRegistry` — 1 test consumer at
  `packages/cli/src/kernel/adapters/plugin/workspace-mutator_test.ts:270` (plan claim OK).
- `safeExtend` — 1 caller at
  `packages/fresh/src/application/builders/define-page/search-params.ts:76` (plan says 0;
  minor drift).
- `DependsOn` legacy vs canonical `dependsOn` — verified both surfaces:
  `packages/aspire/src/domain/raw-config.ts` (legacy alias) vs
  `packages/config/src/domain/schemas/service-schema.ts:17` +
  `config-section-types.ts:127` (LIVE canonical). `deploy-config-resolvers.ts:133` cascade
  confirmed: `dependsOn: appSvc?.DependsOn ?? nsSvc.dependsOn`.
- `startWorkersStreamMirror` — 1 consumer at `plugins/workers/services/src/main.ts`; no
  separate "canonical" alias found via grep across `packages/`/`plugins/`/`workers/`.
- H1 — `git ls-files .llm/tmp/init-json-smoke/` shows tracked artifacts; `.gitignore`
  does not yet exclude the dir; `init-json_test.ts` writes there.
- H2 — 5 zero-ref scratch files exist under `.llm/tmp/`; 0 code refs (only mentions in
  run logs / handover notes).
- H3 — 5 query hooks at `packages/fresh/src/application/query/hooks.ts:142,149,156,163,174`
  and `FreshAppTelemetryOptions` at
  `packages/fresh/src/runtime/server/define-fresh-app.ts:14` all carry the
  "Backward-compatible alias" wording.
- Version policy — `deno.json` single `0.0.1-alpha.0`; per-package bump would break lockstep.
- Slice decomposition S1–S4 — small, ordered, S2 isolated as the only behavior-affecting
  slice with documented rollback.
- Gate set — `scaffold.runtime` E2E + `deno doc --lint` per affected package + `arch:check`
  + `publish:dry-run` + scoped check/lint/fmt + named pre-delete grep gate is adequate
  for breaking subtractive across aspire+cli+fresh+plugins+scaffold.

## Remaining risks

- The PASS verdict is conditional on the implementer picking up the two S1 wording-drift
  fixes (Notes 1 and 2 in `plan-eval.md`) before/during S1. These are mechanical, not
  load-bearing, and do not require a new PLAN-EVAL cycle.
- IMPL-EVAL (next session) must spot-check S2 scope discipline: the canonical
  `ServiceConfig.dependsOn` (in `packages/config/...`) MUST remain untouched; only aspire's
  `DependsOn` legacy alias is removed. The plan scope is correct; the risk is
  scope-creep drift at implementation time.
- No `deno.lock` churn and zero-cast discipline must be preserved by IMPL-EVAL (per plan
  Decision 5).
- `scaffold.runtime` E2E is the load-bearing gate for S2; if it regresses, rollback S2
  alone and record the `ServiceReferences`-gap as arch-debt (per plan Rollback section).
- The task instructions said to "post your verdict as a PR comment" — this was NOT done
  in this session because the operational contract in the trigger metadata explicitly
  states "Do not post GitHub issue or PR comments directly. The workflow owns GitHub
  comments." The verdict is captured in `plan-eval.md` and the PR comment is owned by
  the workflow. The run summary makes this explicit so the workflow can post the
  PASS verdict from `plan-eval.md` per the harness protocol.