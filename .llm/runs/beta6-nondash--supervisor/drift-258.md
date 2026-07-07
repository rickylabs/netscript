# Slice FB5 / Issue #258 Drift

## 2026-07-07

- Severity: minor.
- The run directory on `origin/main` contains prior evaluator files only, not the full supervisor
  artifact set. This slice records per-slice evidence in `worklog-258.md` and `context-pack-258.md`
  rather than inventing a full supervisor plan artifact.

## 2026-07-07

- Severity: minor.
- `deno task doc:lint --root packages/fresh-ui --pretty` still reports existing public-surface debt
  from `interactive.ts` (123 total errors). The new renderer entrypoint is clean under the wrapper's
  explicit entrypoint mode (`totalErrors=0`), so the existing debt is not expanded in this slice.

## 2026-07-07

- Severity: minor.
- `ui:add ai` installs the renderer in a scratch project, but `deno check` of the copied file cannot
  resolve `jsr:@netscript/ai@^0.0.1-beta.5` because that version is unavailable from JSR in this
  environment. The copy path itself succeeded and copied `lib/ai/render-ui.tsx`.
