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

## 2026-07-17 — Runtime probe upgraded from status-only to aggregate semantics

- **What:** The existing `scaffold.runtime` users-service probe was retained and strengthened to
  parse `/health`, require healthy aggregate status, and require exactly the selected database
  adapter.
- **Source:** Tier-A requirement that the scaffold assertion prove the SQLite end-to-end response
  shape rather than only the package predicate.
- **Expected:** A new health-path assertion might require adding another runtime service probe.
- **Actual:** The canonical suite already discovers the generated users service via `aspire
  describe`; only its response validation was missing.
- **Severity:** minor
- **Action:** fix
- **Evidence:** `runtime-gates.ts` and its SQLite builder regression test.

## 2026-07-18 — Readiness preservation corrected after Tier-A review

- **What:** Restored the configured database argument to builder composition and extended the
  optional builder health-check options so the builder retains readiness ownership while using the
  selected candidate name for aggregate health.
- **Source:** Tier-A review-blocking finding on PR #847.
- **Expected:** Aggregate selection would leave liveness and readiness unchanged.
- **Actual:** Slice 1 omitted the second `withDatabase` argument, which removed database readiness.
- **Severity:** significant
- **Action:** fixed before sign-off
- **Evidence:** configured database readiness regression covers both resolving and throwing
  `$queryRaw`; aggregate regression still asserts one `database:sqlite` entry.
