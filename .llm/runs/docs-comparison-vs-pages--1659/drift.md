# Drift log — comparison pages (#1659)

This log is append-only.

## 2026-08-15 — Region helper is not public

- Expected from the brief: a `Region.Settled` layer component.
- Actual package surface: no public `Region` export; `withLayer()` accepts the region component
  directly and exposes the required loader, partial, fallback, freshness, and delivery options.
- Severity: minor API-shape adjustment; no scope or claim change.
- Action: use the documented public component overload and do not invent an export.
- Evidence: `deno doc` against the workspace `@netscript/fresh/builders` surface.
