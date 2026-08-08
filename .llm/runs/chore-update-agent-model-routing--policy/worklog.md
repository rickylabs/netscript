# Worklog

## Design

- **Public surface:** `MODEL_IDS`, `CANONICAL_ROUTE_POLICY`, and
  `resolveCanonicalFormalEvaluatorRoute()`.
- **Domain vocabulary:** native primary, third opinion, native quota limit, OpenRouter limit.
- **Ports:** native Claude/Codex sessions, Claude-over-OpenRouter escalation, AGY fallback.
- **Constants:** model IDs remain centralized in `config/models.ts`.
- **Commit slices:** one bounded routing-policy migration.
- **Deferred scope:** historical benchmark pricing and archived run evidence.
- **Contributor path:** update model IDs in config, bindings in routing policy, then human policy.

PLAN-EVAL: N/A — owner supplied exact routing decisions and the implementation is bounded by
machine-readable tests.

## Gate evidence

- Routing + hardcoded guards: 40 passed, 0 failed.
- Fresh UI fixture tests: 15 passed, 0 failed.
- Scoped Deno lint: passed.
- Claude skill mirror/surface validation: passed.
- `git diff --check`: passed after EOF cleanup.

## CI follow-up

- `check-test` exposed one stale read-only snapshot in
  `runtime/cli/routing-state_test.ts`: the human routing-state renderer expectation omitted the
  four new native PLAN/IMPL evaluator rows.
- Updated only that expected canonical route list. Focused runtime, policy, gateway, launcher, and
  evaluator-guard suites now pass: 55 passed, 0 failed; format and `git diff --check` pass.

## IMPL-EVAL cycle 1

Native Fable 5 medium returned `FAIL_FIX`: two wrapped active startup paragraphs still described
OpenRouter-first evaluation, and the PR lacked its per-slice evidence comment. Both paragraphs were
aligned to native-first policy; the historical benchmark description was clarified without changing
its pinned model or unverified pricing. Claude mirrors were regenerated and gates rerun.
