# Drift — fix-1447-service-env--impl

Append-only.

## 2026-08-11 — lane override: Claude implements this slice (severity: minor)

`CLAUDE.md` makes WSL Codex the default implementation lane for harness slices and reserves Claude
for coordination. The run brief assigned implementation of #1447 to this Claude session directly.
Authorization: explicit owner/run-supervisor instruction in the run brief. Mirrored in
`supervisor.md` § Recorded lane/eval overrides. IMPL-EVAL still runs in a separate session.

## 2026-08-11 — issue title vs. actual defect (severity: minor)

#1447 is titled "generated service resources drop `Services[].Env`". The generator does not drop
it: `ServiceEntry` has no environment field, so Zod strips `Env` during `parseAppSettings` before
any generator sees it. The fix therefore spans the contract and the generator, not the generator
alone. Recorded because it changes the shape of the fix and the acceptance evidence (a schema-only
or generator-only patch would look correct and change nothing).

## 2026-08-11 — pre-existing oddity left untouched (severity: minor)

`preservePluginEnvironment` (`packages/cli/src/kernel/adapters/service/workspace-mutator.ts:181-197`)
re-reads `Environment` from the raw `appsettings.json` after `parseAppSettings` has already parsed
it, for `Plugins` only. It is redundant on the parsed path and has no services counterpart, so
services rely purely on schema parsing (which this run fixes). Not touched: out of scope for a P0
fix, and changing it risks the plugin regeneration path. Deferred, no debt entry filed — it is a
redundancy, not a doctrine violation.
