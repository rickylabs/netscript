# Drift Log: dynamic-route scaffold gate coverage

Drift is append-only.

## 2026-08-30 — research precision correction (minor)

The brief's broad wording that every CLI-emitted reference is static is true for the default
scaffold named by #1616, but `ui:add page` can interpolate a caller-provided dynamic segment. This
does not change scope: the generated default app and current scaffold gates have no dynamic route.
