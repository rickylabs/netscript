# IMPL-EVAL — PR #795 (fixes #791, sub-slice A of #781)

| Field | Value |
| --- | --- |
| Verdict | **PASS** |
| Evaluator | Claude · Fable 5 · medium (route `review_codex_complex`), separate session from the GPT-5.6-Sol generator |
| Subject | worktree `/home/codex/repos/b10-781a`, branch `fix/781a-aspire-generator-emission` @ `e8c735bf`, base `origin/feat/beta10-integration` |
| Run dir | `.llm/runs/fix-781a-aspire-generator-emission--codex/` (subject worktree) |
| Date | 2026-07-17 |

## Rationale

All seven in-scope findings (1–6, 8 of the #791 re-baseline) are fixed at their owning
generator/template/package-helper layers, each with a regression test that both asserts the
corrected output and explicitly rejects the old invalid shape; the previously false-green
assertions were deliberately reversed and called out in the PR body and worklog. I independently
re-ran the focused generator/helper tests (19 suites / 154 steps, 0 failed) and the embedded-asset
parity gate (`deno task check:assets-barrel`, exit 0 — the regenerated `embedded.generated.ts` is
byte-derived from its templates). The 60/0 `scaffold.runtime` log is accepted; nothing in the code
contradicts it. No suppression, `any`, or `@ts-ignore` appears on any added source line. The
recorded `quality:scan` baseline failure is pre-existing outside the diff and was reported
transparently, not hidden.

## Per-finding verification (evidence)

1. **`withBrowserLogs()` on generic executables — FIXED.** The `if (type === 'app')` emission was
   removed (`packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-apps.ts:82`
   region); test reversed to explicit absence
   (`generators-background-app_test.ts:275` — `assert(!output.includes('withBrowserLogs'))`).
2. **`--minimum-dependency-age=0` in `deno task` argv — FIXED.** Removed from app/Tauri/task blocks
   (`generate-register-apps.ts:195,214,233`) and tools (`generate-register-tools.ts:59`); DB
   CLI-mode was already clean on the newer base (recorded in drift.md) and now carries an explicit
   absence assertion (`generators-tools-db-index_test.ts:191`). Valid `deno run` uses retain the
   flag (services `generate-register-services.ts:71`, plugins, background — asserted in
   `generators-service-plugin_test.ts:198`).
3. **Vite key normalization — FIXED, no collision risk.** Both segments normalize
   `[^a-zA-Z0-9_] → _` in the package helper
   (`packages/aspire/src/application/build-vite-env-var-name.ts:50-58`) and the generated compat
   copy (`_aspire-compat.ts.template:179-193`), changed together in one cluster. Collision probe:
   scaffold names are validated `/^[a-z][a-z0-9-]*$/`
   (`packages/cli/src/kernel/constants/scaffold/scaffold-validation.ts:10`), so underscores/dots
   cannot occur in a valid name and no two distinct valid names normalize to the same key. New
   regression covers multi-segment normalization (`packages/aspire/tests/helpers_test.ts:62-67`).
4. **DB provider projection — FIXED for all three consumer kinds.** `buildDatabaseProviderEnvVars`
   emits `DB_PROVIDER` + `DATABASE_PROVIDER` from `PrimaryDatabase`
   (`_aspire-compat.ts.template:96-104`), and the projection loop is emitted inside the existing
   `RequiresDb` branches of services (`generate-register-services.ts:93-95`), plugins
   (`generate-register-plugins.ts:125-127`), and background processors
   (`generate-register-background.ts:126-128`), with the imports added to all three preamble
   templates (`generate-register-{services,plugins,background}-1.ts.template`). Tests assert the
   projection per kind.
5. **Bounded Garnet restore — REAL bound, graceful degradation.** `execFileSync("dotnet", ["tool",
   "restore"], { …, timeout: GARNET_TOOL_RESTORE_TIMEOUT_MS })` with a named `10_000` ms constant
   (`_aspire-compat.ts.template:87,372-378`). Node kills the child on timeout and throws; the
   throw lands in the pre-existing swallow-`catch`, so AppHost construction proceeds and the
   missing tool surfaces when the executable resource starts (comment documents this). The call
   remains synchronous but is now bounded — exactly locked decision D8; the async/preflight
   redesign is a recorded safe-to-defer. Pipeline regression asserts both the constant and its use
   (`generators-pipeline_test.ts:160-167`).
6. **SQLite workdir-relative URLs — FIXED, workdir-independent.** `buildSqliteDatabaseUrl` returns
   `pathToFileURL(resolve(appHostDir, 'database/<key>/<name>')).href`
   (`_aspire-compat.ts.template:106-114`); `appHostDir` is derived once as project root
   (`generate-index-1.ts.template:42` — one level up from `aspire/`), matching where the DB CLI
   workdir already resolves (`generate-db-cli-mode.ts:26`). The URL no longer references any
   consumer resource workdir, so it is correct for both nested (`services/foo`) and root-workdir
   consumers. Tests reject the old `file:./database/…` shape explicitly in all three consumer
   generators. DB CLI/tool relative paths deliberately unchanged (D7 — those workdirs are the DB
   dirs).
8. **`--unstable-no-legacy-abort` on plugin resources — FIXED, consistent with service tasks.**
   Emitted as a named constant in plugin `deno run` argv (`generate-register-plugins.ts:29,76`),
   matching the flag the generated service deno.json tasks already carry
   (`generate-service-deno-json.ts:63-64`). Asserted in `generators-service-plugin_test.ts:199`.

## Gates independently verified

| Gate | Result | Evidence |
| --- | --- | --- |
| Focused generator/helper tests (re-run by evaluator) | PASS | `deno test packages/aspire/tests/helpers_test.ts packages/cli/src/kernel/templates/aspire/helpers/tests/` → 19 passed (154 steps) / 0 failed |
| Embedded asset parity (re-run by evaluator) | PASS | `deno task check:assets-barrel` exit 0 |
| New suppressions on added lines | PASS | grep over added diff lines in source templates/helpers: 0 hits for `deno-lint-ignore` / `ts-ignore` / `ts-expect-error` / `as unknown as` / `any` |
| `scaffold.runtime` full suite | ACCEPTED | generator worklog: 60 passed / 0 failed, cleanup completed; no code contradiction found |
| Commit trail | PASS | 3 implementation slices + plan + evidence commits, each pushed with a per-slice PR comment on draft #795 |
| Close-gate wiring | PASS | PR body carries `Closes #791`; `Part of #781` without a closing keyword; draft status honored |

## Findings (numbered, non-blocking)

1. **[observation] Aspire-launched service resources still lack `--unstable-no-legacy-abort`.**
   `generate-register-services.ts:71` emits `['run', '--minimum-dependency-age=0',
   '--node-modules-dir=none', ...perms, entrypoint]` with no legacy-abort flag, while the
   scaffolded service deno.json tasks (`generate-service-deno-json.ts:63-64`) and now plugin
   resources carry it. Finding 8's issue text scoped the fix to plugin resources (its "service
   tasks already carry it" premise holds only for the deno.json tasks, which Aspire bypasses), so
   this is out of the approved scope — but the same request-signal inconsistency remains for
   Aspire-run services. Recommend a follow-up under #781.
2. **[observation] SDK full-key lookup unaligned for hyphenated names.**
   `packages/sdk/src/discovery/browser-env.ts:22` builds `VITE_services__<raw-name>__…` from the
   raw name, so for hyphenated services the full-key lookup now misses the normalized producer
   key. Behavior is preserved because the lookup falls back to the shorthand
   (`browser-env.ts:51-53`), which both sides normalize identically — and the raw hyphenated full
   key was the invalid shape finding 3 exists to remove. Consider normalizing
   `createBrowserServiceEnvKey` in a follow-up for full/shorthand symmetry.
3. **[pre-existing, recorded] `quality:scan` baseline failure outside the slice.** Two findings at
   `plugins/streams/services/src/proxy.ts:180` and `plugins/triggers/streams/producer.ts:34`;
   both files are untouched by this diff (diffstat covers only `packages/aspire`, `packages/cli`,
   and the run dir). Recorded transparently in the worklog rather than hidden or scope-crept —
   correct handling. Ownership belongs to the #781 stabilization board, not this PR.
4. **[process, authorized] No `plan-eval.md` exists;** implementation proceeded on the
   supervisor's written Plan-Gate override, recorded in the run's `drift.md` (2026-07-16 entries)
   with evaluator dispatch retained by the supervisor. Recorded as a process note per protocol
   rule 2; the dispatch brief confirms the override was supervisor-issued, so it does not block.

None of the findings blocks: 1–2 are outside the approved #791 scope (plan valid as written),
3 is pre-existing and correctly recorded, 4 is an authorized, recorded override.
