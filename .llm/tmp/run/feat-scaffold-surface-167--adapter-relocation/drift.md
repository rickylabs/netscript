# Drift

- 2026-06-30 — `deno task arch:check` did not match the brief's baseline claim that all 13 roots were already `FAIL=0`. The task fails before touched roots on pre-existing `packages/plugin-auth-core` doctrine findings (`FAIL=12`, auth cast / `@ts-*` checks). S-b touched roots were checked independently and returned `FAIL=0` for `packages/plugin-sagas-core` and `plugins/sagas`. No auth files were edited because that would widen the approved S-b/S-c/S-d scope.
- 2026-06-30 — S-c repeated `deno task arch:check`; it failed on the same pre-existing `packages/plugin-auth-core` findings before touched roots. S-c touched roots were checked independently and returned `FAIL=0` for `packages/plugin-triggers-core` and `plugins/triggers`.
- 2026-06-30 — S-d repeated `deno task arch:check`; it failed on the same pre-existing `packages/plugin-auth-core` findings before touched roots. S-d touched roots were checked independently and returned `FAIL=0` for `packages/plugin-workers-core` and `plugins/workers`.
- 2026-06-30 — S-e verified the auth-core red was pre-existing gate-scope drift from #172a-2d/#179,
  not relocation-slice source churn. The documented diagnosis was correct for the centralized
  contract cast and `@ts-expect-error` guards; the first S-e `arch:check` run also exposed the same
  test-only over-flag for runtime `as unknown` assertions in
  `packages/plugin-auth-core/tests/contracts/auth-contract-soundness_test.ts`. No doctrine text or
  gate comment required auth tests to differ from the equivalent sagas/workers contract soundness
  tests, so the fix exempts test paths from the auth cast / `@ts-*` scanner while preserving the
  production auth no-extra-cast rule.
- 2026-06-30 — S-f confirmed the #157/#172 convergence dropped the executable scaffold runner from
  all five official plugin `scaffold.ts` files. Restoring the centralized bridge cleared the original
  E2E blocker: `scaffold.plugin.worker`, `scaffold.plugin.saga`, `scaffold.plugin.trigger`,
  `scaffold.plugin.stream`, and `scaffold.plugin.auth` all pass in `scaffold.runtime`.
- 2026-06-30 — S-f full `scaffold.runtime` then failed at a distinct later gate:
  `scaffold.plugin-list` exits 1 because `netscript plugin list` reads
  `plugins/workers/scaffold.plugin.json`, but the generated project has plugin sample files under
  `workers/`, `sagas/`, `triggers/`, `streams/`, and `auth/` and no installed
  `plugins/<name>/scaffold.plugin.json` registry entries. This is not the scaffold subprocess
  bridge class; it is recorded as `PLUGIN-LIST-MANIFEST-REGISTRATION-BLOCKER` debt for a follow-up
  #173 host install/list registration slice.
- 2026-06-30 — S-f root-scoped fmt wrapper over `packages/plugin` plus the five plugin roots reports
  five pre-existing unrelated formatting findings outside the bridge files. S-f did not mutate those
  files; touched-file fmt over the bridge diff is green.
- 2026-06-30 — S-g reproduced the plugin install/register/list failure before editing. The write side
  registered `./plugins/workers/mod.ts`, but plugin-owned scaffold output wrote userland glue to
  `workers/mod.ts`, `workers/jobs/health-check.ts`, and `workers/tasks/validate-payload.ts`; no
  `plugins/workers/mod.ts` and no `plugins/workers/scaffold.plugin.json` existed. The list side then
  failed by hard-reading `plugins/workers/scaffold.plugin.json`.
- 2026-06-30 — S-g fixed that existing config-driven contract without copying plugin internals:
  registration now points at generated userland glue when it exists, and `plugin list` derives a
  manifest-free fallback from `config.plugins`. The full `scaffold.runtime` suite now passes
  `scaffold.plugin-list`.
- 2026-06-30 — S-g then hit a distinct later runtime boundary at `runtime.wait.workers-api`. The
  thin-dependency model leaves appsettings runtime entries pointing at dependency runtime workdirs
  such as `plugins/workers`, but those package internals are no longer copied into the generated
  tree. Making runtime entries execute package specs instead of copied files requires a new public
  plugin package executable-entrypoint contract: service packages currently export `./services`, but
  background executables such as `bin/combined.ts` are not exported (`deno run
  jsr:@netscript/plugin-workers@0.0.1-alpha.12/bin/combined.ts` fails with unknown export). Per the
  S-g escape hatch, this was recorded as follow-up debt rather than implemented inside the
  install/list reconciliation slice.
