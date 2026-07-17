# Drift Log: issue #826 aggregate health

## 2026-07-17 — Provider-aware composition added

- **What:** Expanded scope from an aggregate predicate alone to the `defineService(options.db)` host
  composition that must drive it, plus the generated scaffold runtime proof.
- **Source:** Tier-A PLAN-EVAL review and `packages/service/src/presets/define-service.ts` research.
- **Expected:** Original plan exposed optional `HealthCheck.configured` and expected callers to set
  it.
- **Actual:** Multi-adapter composition selects the first `$queryRaw`-capable record member, so an
  inactive MySQL member can poison a SQLite app unless the framework maps provider configuration.
- **Severity:** significant
- **Action:** fix
- **Evidence:** supervisor verdict in `plan-eval.md`; plan D6/D7; PR #847.
