# Plan & Design — READY FOR REVIEW

Archetype 2 Integration; no structural rewrite. Doctrine verdict Refactor is existing debt.

## Locked decisions

1. Preserve URI byte-for-byte pass-through. Duplicate refusal applies to parsed ADO.NET options.
2. Check `parts.has(option)` after alias lookup and before translation/set. Reject all duplicates,
   including identical values and aliases; expose `duplicate-key` with the canonical lowercase key.
   Never include values or original connection strings in the error.
3. Add explicit `verify-ca`/`verify-full` SSL map entries (case-insensitive); canonicalize valid decimal
   ports using numeric conversion after the existing range check.
4. Preserve shared tokenizer unchanged. Test quoted delimiters, escaped quotes, empty passwords,
   URI pass-through, duplicate invalid second values, and credential-safe failures.
5. Regenerate the CLI copies and exercise both generated consumption paths. No hand-edited assets.

## Slices

1. Bootstrap: run records, plan and draft PR. Gate: plan checklist + independent PLAN-EVAL.
2. One cohesive implementation: database normalizer/error, README and tests; generated CLI template
   and embedded barrel plus `postgres-normalizer_test.ts`; run worklog/context/evidence.
   Public reference `docs/site/reference/database/index.md` updates the error-reason table, duplicate
   policy and TLS spellings; `packages/database/CHANGELOG.md` records the behavior change under Unreleased.
   Gate: scoped structured test/check/lint/fmt, negative control, docs, package publish dry-run,
   JSR audit and `quality:gate`; independent slice review before commit.
3. Review handoff: run records, dated lesson and gate summary. Push, ready PR after blocker-free
   IMPL-EVAL, review CI and threads; final same-session IMPL-EVAL on exact pushed head. Final
   verdict is published outside Git so recording it cannot invalidate its target SHA.

## Gates

- Structured wrappers: check `packages/database` plus CLI normalizer test; lint/fmt owned TS;
  tests database normalizer and CLI generated-normalizer suites.
- Every new duplicate refusal test must fail with the original parser restored temporarily; restore
  the fixed parser and rerun. Record the per-test negative control and real exit codes.
- `deno task quality:gate`; `deno task doc:lint --root packages/database --pretty`;
  `deno task publish:dry-run --member packages/database`; package JSR fitness audit.
- Regeneration idempotence; review-thread gate. Full scaffold.runtime local gate prohibited by owner;
  e2e-cli CI remains required and must be reported truthfully if not armed/completed.

## Risks and mitigations

- Duplicate detection could treat quoted option-like values as options: preserve tokenizer and cover
  quoted secrets with delimiters and quote escapes.
- Duplicate error might leak secrets: use canonical allowlisted key, fixed message, assert message,
  key, reason, serialization and stack contain no raw or encoded test secrets.
- Shared tests may encode last-wins semantics: update only PostgreSQL expectations, keep MSSQL intact.
- Generated code drift: run canonical generator and assert same behavior in both generated contexts.
- Repo-wide gates may expose baseline failures: record failures as unproven, diagnose against baseline,
  never weaken acceptance. CI snapshot is reported at the exact head without claiming pending gates pass.

## Open decisions / deferred scope

No decisions remain open. URI parsing, other database engines, new settings/aliases, driver TLS
behavior, and existing package architecture debt are deferred because they are outside #2367.
No runtime resources are started locally. No lockfile change is needed or authorized.
