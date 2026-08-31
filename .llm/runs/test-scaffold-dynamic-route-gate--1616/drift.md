# Drift Log: dynamic-route scaffold gate coverage

Drift is append-only.

## 2026-08-30 — research precision correction (minor)

The brief's broad wording that every CLI-emitted reference is static is true for the default
scaffold named by #1616, but `ui:add page` can interpolate a caller-provided dynamic segment. This
does not change scope: the generated default app and current scaffold gates have no dynamic route.

## 2026-08-31 — current-main convergence and cycle-2 plan amendment (minor)

The supervisor merged current main `8a925764276b25ef7cef484db273604f44557cef` into the branch at
`f22348a80fec2e8489108404423247b224d208cb`; it was clean and the product-source diff against current
main is empty. Current main moved runtime behavior registration from the earlier
`runtime-gates.ts` plan path into `runtime/behavior-gates.ts`; the File Plan now names the live
location.

Cycle-1 PLAN-EVAL returned bounded `FAIL_FIX` without changing D1, D2, D6's suite ownership, D7's
resolver choice, or D8. Cycle 2 locks non-overlapping element attributes, a per-run nonce, plain and
`?fresh-partial=true` GETs, exact generator-derived `$id.$route` seed parity, semantic-only
compilable RED, and app-home → dynamic-route → app-reference ordering. It also adds the cheap
canonical-conventions and retained-route coverage. Scope, archetype, public-surface decision, lease
boundary, and no-workflow ruling are unchanged.
