# Drift — chore-jsr-alpha1-publish-prep

Append-only drift log.

## 2026-06-24 — Slice 1 broad grep includes planned Slice 2 literals

- Severity: minor
- Plan reference: Slice 1 verification command searched all `packages plugins` for `jsr:@netscript` refs.
- Reality: that broad command also matches planned Slice 2 hardcoded CLI scaffold/test pins at `^1.0.0`.
- Handling: Slice 1 verified the bump-owned surface instead: member `packages/*/deno.json` and `plugins/*/deno.json` refs plus member version fields. Slice 2 will remove the remaining CLI scaffold/test literals.

## 2026-06-24 — CLI manifest strict JSON for version import

- Severity: minor
- Plan reference: Slice 2 derives the release-version constant from the CLI package's own `deno.json` at module load.
- Reality: `packages/cli/deno.json` had one JSONC comment, which made a side-effect-free JSON import fail before tests ran.
- Handling: removed the lone comment from `packages/cli/deno.json` instead of adding a module-load file read or a parser dependency. This keeps the version source drift-free and avoids requiring read permission for importing the CLI scaffold constants.

## 2026-06-24 — Docs formatter check is not a slice-green verdict

- Severity: minor
- Plan reference: Slice 3 requested scoped docs-site fmt plus docs build if cheap.
- Reality: `run-deno-fmt.ts --root docs/site --ext ts,tsx,vto,md` reports 158 existing findings across `_plan`, generated reference pages, and long-form Markdown/Vento pages. A mutating formatter pass on this surface also breaks Vento-in-Markdown expressions in at least one touched page.
- Handling: kept the slice changes narrow, verified with stale-version scans, `git diff --check`, config schema tests, and the docs build. Formatter output is retained as evidence but not treated as a safe auto-fix for this release-prep slice.
