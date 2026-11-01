# PLAN-EVAL round 2: issue #2367

**Result: PASS.** Both round-1 fixes are in the plan and the declared file surface. No new blockers.

## Round-1 blocker resolved

- **Public reference page:** `docs/site/reference/database/index.md` is now in the writable surface (`supervisor.md:22-23`) and in slice 2 (`plan.md:22-23`). The planned edit covers the error-reason table, the duplicate policy and the TLS spellings, so the page won't list only three reasons once `duplicate-key` exists.
- **Changelog:** `packages/database/CHANGELOG.md` is in scope, with an Unreleased entry for the change from "last value wins" to refusal.
- **Records:** the correction is logged in `worklog.md:34-40` and `drift.md:8-9`, with no API change beyond the new refusal reason. No source edits have begun.

## Checklist

1. **Research present and current: PASS.** It is checked against `main` at `4aa734e`. The worklog records baseline results: parser tests 10/10, generated-consumer tests 3/3, and `quality:gate` exit 0.
2. **Decisions locked: PASS.**
   - Duplicates are refused before anything is overwritten, whatever the case, alias or value (including an identical or invalid second value).
   - The error reports only the canonical key and never includes values.
   - `verify-ca` and `verify-full` are accepted in any case.
   - A valid port is rewritten as a plain number after the range check.
   - URIs and the tokenizer stay unchanged.
3. **Open-decision sweep: PASS.** Nothing is left open, and nothing deferred would force rework.
4. **Commit slices: PASS.** There are three ordered slices. Each one names what it proves, the gate that proves it, and its files, now including the reference page and the changelog.
5. **Risk register: PASS.** Quoted values that look like options, secret leaks, the obsolete "last value wins" test, and generated-file drift each have a mitigation.
6. **Gate set selected: PASS.**
   - Structured check/lint/fmt/test wrappers, plus a negative control for every refusal test.
   - `quality:gate` (which includes `arch:check`), `doc:lint`, `publish:dry-run --member packages/database` and the JSR audit.
   - A check that regeneration is repeatable, and the review-thread gate.
   - The e2e-cli suite runs only in coordinator-armed CI and must be reported truthfully; it is not run locally.
7. **Deferred scope explicit: PASS.** URI parsing, other engines, driver TLS behaviour, new aliases and existing package debt are deferred.
8. **jsr-audit: PASS.** The export map doesn't change, the reason union only gains a member, and the README and JSDoc updates are planned. No slow-type risk.

VERDICT: PASS
