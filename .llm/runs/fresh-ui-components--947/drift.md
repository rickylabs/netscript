# Drift — fresh-ui-components (#947, #948, #949)

## 2026-07-31 — significant — incomplete carried run bootstrap

The committed run contained `context-pack.md`, `plan.md`, and `implement.md` but lacked mandatory
`supervisor.md`, `research.md`, `worklog.md`, `drift.md`, and `plan-eval.md`. Implementation was
stopped and the missing planning artifacts were reconstructed from current code/remote evidence.

## 2026-07-31 — significant — focus restoration inventory correction

The plan stated that `use-dismissable-layer.ts` already handles focus restoration. Direct source
inspection shows it only owns outside/Escape dismissal; it never focuses the trigger. The shared
cause remains the presentation/runtime seam, but ActionMenu must supply focus restoration through
the popover trigger/content composition. The #948 issue correction records this nuance.
