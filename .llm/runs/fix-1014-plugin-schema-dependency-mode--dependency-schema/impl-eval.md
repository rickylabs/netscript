# IMPL-EVAL — fix-1014-plugin-schema-dependency-mode--dependency-schema

Evaluator: Opus 5 supervisor (owner-waived open-model lane, 2026-08-01)

Implementation commit reviewed: `8e1a03970` `fix(cli): install published plugin Prisma schemas`.
All gate output below was produced by the evaluator in `/home/codex/repos/fix-1014`, not copied from
the slice's report.

## What actually changed

| File | Change |
| --- | --- |
| `kernel/adapters/plugin/db-integration.ts` | `PluginSchemaCopyOptions` (`packageFragments`, `schemaDeclared`, `packageSearchPath`); source ladder package→copied; extracted `writeSchemaFragment`; typed failure on declared-but-unresolved. |
| `public/infra/jsr/verify-jsr-package-integrity.ts` | `fetchJsrPackageSchemaFragments()` filters `versionMetadata.files` to `database/**/*.prisma` and fetches bytes; `jsrPackageSchemaSearchPath()`; `normalizeJsrPackagePath()` shared with the existing URL builder. |
| `public/features/plugins/install/install-plugin.ts` | Resolves fragments when `source.kind === 'jsr' && dbDetection.requiresDb`; passes fragments + declaration signal + search path to the copier. |
| `db-integration_test.ts` (+3 cases), `install-plugin_test.ts` (+2 cases) | Precedence, filename rule, no-DB non-widening, dependency-mode happy path, declared-but-missing rejection. |

Diff read in full; no drive-by edits, no unrelated files, no `packages/`/`plugins/` source outside
the named CLI paths.

## Gates — run by the evaluator

| Gate | Command | Result |
| --- | --- | --- |
| Focused units | `deno test -A packages/cli/src/kernel/adapters/plugin/ packages/cli/src/public/features/plugins/` | **46 passed (56 steps), 0 failed** |
| db-integration | `deno test -A .../db-integration_test.ts` | **6 passed, 0 failed** — incl. `prefers package fragments over copied placeholders`, `keeps the bare schema filename rule`, `validates declared schemas without widening no-DB behavior` |
| Dependency-mode install | `deno test -A .../install-plugin_test.ts` | **21 steps passed, 0 failed** — incl. both new cases by name |
| Local-flow regression | `deno test -A packages/cli/src/local/features/plugins/` | **passed, 0 failed** |
| Scoped check | `run-deno-check.ts --root packages/cli --ext ts,tsx` | 742 files, **0 occurrences** |
| Scoped lint | `run-deno-lint.ts --root packages/cli` | 742 files, **0 occurrences**, exit 0 |
| Scoped fmt | `run-deno-fmt.ts --root packages/cli` | 1 finding, `packages/cli/e2e/README.md` — **pre-existing**, reproduced on unmodified `main`; untouched by this branch |
| Fitness | `deno task quality:gate` | **exit 0, FAIL=0**; residual WARN/INFO are pre-existing and in unrelated packages |

## Acceptance criteria

| # | Box | Verdict |
| - | --- | --- |
| 1 | Contributions resolve from installed package/manifest, not copied source | **MET** — `fetchJsrPackageSchemaFragments` reads `versionMetadata.files`; test asserts the exact fetch URLs `https://jsr.io/@netscript/plugin-sagas/<v>/database/sagas.prisma`. |
| 2 | Fragments copied into the root schema in dependency mode | **MET** — test asserts `/workspace/alpha/database/postgres/schema/plugins/sagas/sagas.prisma` with byte-exact published content. |
| 3 | Install fails when a schema is declared but zero files resolve | **MET for dependency mode; NOT extended to local-path** — see below. |
| 4 | Clean public-install test asserts fragments present in the root schema | **MET in substance, not as a clean-room e2e** — see below. |

### Box 3 — narrower than the box reads

`install-plugin.ts` gates `schemaDeclared` on `resolvedPlugin.source.kind === 'jsr'`.
`install-local-plugin.ts` was not touched and still passes no declaration signal, so a **local-path
or monorepo install of a plugin that declares `hasDatabaseMigrations` with no copied source still
silently resolves zero fragments** — the exact silent-skip shape the issue objects to, surviving on
the other install path. Defensible (it avoids regressing contributor flows mid-release-train, and the
issue is scoped to dependency mode), but it is a deliberate behaviour boundary, not a completed box.

### Box 4 — substance met, clean-room lane deferred

My PLAN-EVAL sent this to `scaffold.runtime --source jsr`. The slice correctly pushed back with a
point I had missed: that lane installs the **published 0.0.2 CLI**, which cannot contain this fix, so
it cannot evidence the box today. The delivered substitute drives the real `installPlugin` flow end
to end with a JSR-shaped descriptor and an injected `JsrPackageFileFetcher`. That is a true
dependency-mode assertion, but it is an in-process integration test, not a clean-room public install.
The genuine clean-room proof is only available after 0.0.3 publishes.

Note this reverses the direction of my own PLAN-EVAL correction. I accept the reversal: the slice's
reasoning is sound and I verified it (`plugin-install-gates.ts` JSR branch runs the published CLI).

## Residual findings, not fixed

- `InstallSpec.prismaContract` (`packages/plugin/src/adapter/contract.ts:76`, set by
  `plugins/auth/src/adapter/plugin.ts:24`) still has **zero consumers**. Correctly reported and left
  alone; it is the natural home for an explicit declaration if box 3 is ever widened.
- The userland suite's `plugins/workers/database/schema.prisma` expectation remains stale (logged in
  `drift.md`). Not load-bearing for this fix.

## Verdict

**PASS_WITH_RESERVATIONS** — the implementation is correct, scoped, and genuinely evidenced for the
reported defect; boxes 1 and 2 are fully met and independently verified. Boxes 3 and 4 are met only
within a narrower boundary than their text states, and both boundaries are behaviour/scope judgments
rather than gaps in the code.

Because two acceptance boxes are only partly evidenced and the change alters install failure
behaviour on a release train, this **stays a draft for human sign-off** (`draft_needs_human`) rather
than being marked ready. The specific questions for the human: (a) accept that box 3 stays
dependency-mode-only for 0.0.3, and (b) accept the integration-test substitute for box 4 with the
clean-room e2e deferred to post-0.0.3 publication.
