# PLAN-EVAL: issue #2367, PostgreSQL connection-option duplicate refusal

**Result: FAIL_PLAN, with one blocker.** It would ship a public reference page that is wrong, and the declared file surface doesn't allow fixing it. Everything else in the plan is sound.

## Checklist

1. **Research present and current: PASS.** `research.md` is checked against `main` at `4aa734e`. It confirms there is no covering PR and the acceptance criteria are prose only. It also finds the generated CLI consumers, and I confirmed the asset generator does regenerate the Postgres template (`.llm/tools/generate-cli-assets-barrel.ts:496-499`).
2. **Decisions locked: PASS.**
   - Duplicates are checked with `parts.has(option)` after the alias lookup and before the value is translated (`postgres-connection-string.ts:72-74`). So duplicates, alias collisions and case variants (keys are already lowercased) are refused before anything is overwritten, even when the second value is identical or invalid.
   - The error reports only the canonical key and has a fixed message.
   - `verify-ca` and `verify-full` are added to `SSL_MODES`.
   - A valid port is rewritten as a plain number after the existing range check.
   - URIs still pass through unchanged and the tokenizer is not modified.
3. **Open-decision sweep: PASS.** The plan says nothing is left open.
4. **Commit slices: FAIL.** See the blocker below.
5. **Risk register: PASS.** It covers quoted values that look like options, secret leaks (checked across message, key, reason, serialization and stack), the test that expects the old "last value wins" behaviour, and drift in the generated files.
6. **Gate set selected: PASS.**
   - Structured check/lint/fmt/test wrappers on the database package and the CLI generated-normalizer test.
   - A negative control for every refusal test: restore the old parser, watch the test fail, record the real exit codes.
   - `quality:gate` (which includes `arch:check`), `doc:lint`, `publish:dry-run --member packages/database`, the JSR audit, a check that regeneration is repeatable, and the review-thread gate.
   - The scaffold runtime suite is correctly left to coordinator-armed e2e-cli CI and is not run locally.
7. **Deferred scope explicit: PASS** for the scope it names (URI parsing, other engines, driver TLS behaviour, new aliases, existing package debt). The two files below are neither planned nor deferred.
8. **jsr-audit: PASS.** The export map doesn't change. `duplicate-key` extends an existing union. README and JSDoc updates are planned and no slow-type exception is needed.

## Blocker (item 4)

**`docs/site/reference/database/index.md:86-87` lists every error reason** for `PostgresConnectionStringErrorReason`: "`unsupported-key`, `unsupported-value`, or `invalid-format`". Once `duplicate-key` is added, that public page is wrong. The writable surface in `supervisor.md` (lines 13-21) doesn't include the file, so the implementer can't fix it without going outside scope.

**Required fix:** add `docs/site/reference/database/index.md` to the writable surface and to slice 2. That page should also mention duplicate refusal and the new SSL spellings.

In the same edit, either add `packages/database/CHANGELOG.md` to the surface or defer it explicitly with a reason. Its Unreleased section already describes this helper, and changing duplicates from "last value wins" to refusal is a behaviour change users will notice.

## Not blocking

- The Prisma probe in `postgres-normalizer_test.ts` only treats `unsupported-value` as an expected error. The implementer will need to extend it for `duplicate-key`. That file is already in scope and the plan commits to testing both generated paths.

VERDICT: FAIL_PLAN
