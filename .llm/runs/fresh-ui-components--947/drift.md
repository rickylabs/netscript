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

## 2026-07-31 — minor — checked-in fresh-ui test task lacks temp-write permission

The package task grants `--allow-read` only, but two pre-existing Markdown renderer tests create
temporary workspaces. The task verdict was 162 pass / 2 permission failures. The identical full
suite rerun with `--allow-write --allow-run --allow-env --allow-net` passed 164/164. This PR does not
change the package task because that permission-policy repair is outside the component public-surface
slice; evidence reports both results.
