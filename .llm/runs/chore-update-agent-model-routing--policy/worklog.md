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
