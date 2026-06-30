## S9 — GREENFIELD `netscript plugin new <name>` FIRST

Scope:
- Added `netscript plugin new <name>` dual-tier generator.
- Emits `packages/plugin-<name>-core/` and `plugins/<name>/`.
- Default archetype is `kind: "proxy"` with `capabilities.hasRoutes: false` and zero `starterResources`.
- Uses `@netscript/plugin/scaffold`, `definePlugin().build()`, `inspectPlugin`, `createPluginAdapter`, `bindPluginContract`, and `createPluginService`.

Commit:
- `baec0909` — `feat(cli): generate dual-tier plugins`

Gate evidence:
- Generated smoke package: `s9-smoke`, generated from native `/home/codex/repos/netscript-plugin-rearch-v2`, removed before commit.
- Generated core check: PASS, 8 files, 0 diagnostics.
- Generated connector check: PASS, 13 files, 0 diagnostics.
- Generated core lint/fmt: PASS, 8 files, 0 diagnostics/findings.
- Generated connector lint/fmt: PASS, 13 files, 0 diagnostics/findings.
- Generated core test: PASS, 1 passed, 0 failed.
- Generated connector test: PASS, 1 passed, 0 failed.
- Generated core `publish:dry-run`: PASS, dry run complete, no slow-type findings.
- Generated connector `publish:dry-run`: PASS, dry run complete, no slow-type findings.
- Byte-identical-output guard: PASS, tree SHA `d78cad0767f67bbff54a7d135ff0ade07158e3466c0c4c7fd3b1e4468d631904` before and after regenerate.
- Source `packages/plugin` check/lint/fmt: PASS, 152 files.
- Source `packages/cli` check: PASS, 547 files, 0 diagnostics.
- Source CLI touched-file lint/fmt: PASS with `deno lint --no-config` and `deno fmt --no-config --check`; the scoped wrappers hit the CLI package exclusion with no diagnostics.
- Focused source tests: PASS (`packages/cli/src/public/features/plugins/new/new-plugin_test.ts`, `packages/plugin/tests/scaffold/scaffold-generators_test.ts`).
- Source `publish:dry-run`: PASS for `packages/plugin` and `packages/cli`; existing dynamic-import warnings remain.
- `deno task arch:check`: PASS exit 0, `FAIL=0`; existing WARN/INFO baseline remains.
- Local `scaffold.runtime --cleanup`: PASS, `passed=48 failed=0`.
