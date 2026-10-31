# Implementation evaluation

Same independent Anthropic Claude session as PLAN-EVAL, resumed for each round; read-only Read/Glob/Grep, MCP disabled, stdin closed. Requested model claude-opus-5-5 / high; observed model matches. Reviewer output transcribed without private launcher state.

## Round 1 — FAIL_FIX

Review is done; one blocker found. Writing up the verdict now.

**IMPL-EVAL round 1 for #2374: FAIL_FIX (1 blocker)**

I read the full staged diff, all the run files, the current sources in `plugins/sagas/src/cli/`, the shared source-selection helper, and the new plugin and CLI tests. I didn't re-run anything; the evidence below is from the code and the reports cited in evidence.md.

**What holds up:**
- **Static only.** Declarations are found by tokenizing source text; nothing is executed or imported. Both test files prove it: configs that throw if run, and a runtime module that writes a sentinel file only when imported.
- **Root config and companion files.** The inspector always reads the root `netscript.config.ts` plus every `.config.ts` under the scan roots. An excluded or ignored config is inactive, and a missing root config produces no declarations.
- **Path rules.** Absolute, drive-letter, URL, `?`/`#`, NUL, escaping, `.netscript/generated/`, non-`.ts`/`.tsx` and config-file targets are all rejected before `resolve` runs, so the ordering point from PLAN-EVAL is kept.
- **Exclusion conflicts.** A declaration pointing at a manifest-excluded or first-line-ignored module fails generation.
- **Failures happen before writes.** Missing targets, targets without a runtime export and conflicting ids all throw inside `renderSagaRegistry`, before anything is written. A source that disappears mid-run now throws instead of being silently dropped. Both installed paths (write and frozen dry-run) leave the previous registry bytes unchanged.
- **Doctor uses the same selection.** The new CLI test runs the real host generator and `checkRuntimeRegistryDrift`: a stale empty map reports an error, regeneration makes it healthy, and the root-config target outside the scan roots is healthy. Zero declarations give a warning, not an error.
- **Legacy discovery unchanged.** Native `defineSaga` discovery still applies the suffix and exclude rules. Config files now contribute no `sagaIds`, which closes the risk of a config being picked up as a runtime saga.
- **Export forms.** Aliases, export lists, `... from` re-exports and type-only rejection are all covered.
- **Duplicates.** Both directions are rejected (one id at two paths, two ids at one path), and identical declarations deduplicate after `./` normalization.
- **Dependencies.** There is no `@std/path` import in published source, and moving the test into the CLI package is correctly recorded in drift.md.

**Blocker (destructive regression in the existing saga commands)**

`inspectSagasProject` now always returns an entry for the root `netscript.config.ts`, with its declared ids in `configIds`. `sagaPaths` in `plugins/sagas/src/cli/local-runtime-backend.ts:223-231` picks the first entry whose `configIds` contains the id. Entries are sorted, so `netscript.config.ts` comes before `sagas/...`, and the root config wins even when a companion file also declares the same id.

As a result:
- **`ns-sagas remove-saga <id>`** passes that path to `removeFile` (`local-runtime-backend.ts:178-180`). It deletes the project's entire `netscript.config.ts`.
- **`ns-sagas update-saga <id>`** runs `upsertFluentCall` with anchor `defineSagaConfig` (`:219-221`) against the root config. That edits whichever `defineSagaConfig` call comes first, which may belong to a different saga, and then rewrites the file.

Before this change the root config was never scanned, so it was never a candidate for these commands.

**Required repair**, inside the approved write surface:
- `sagaPaths`, or the inspector metadata it reads, must never treat the root config as a deletable or editable companion. One way is to mark root-config entries in the inspector and have `sagaPaths` prefer a `.config.ts` companion.
- `remove-saga` should leave `netscript.config.ts` alone. It should say the root declaration has to be edited by hand.
- `update-saga` should refuse to edit the root config (or edit only that id's call) and say so.
- Add regression tests: one where only the root config declares the id, and one where both the root config and a companion declare it. Assert that `netscript.config.ts` still exists byte-identical after both commands.

**Advisories (not blocking)**
- The regex-literal branch of the tokenizer has no context check. A line with two divisions (for example `a / b / c`), or a division followed by a quote, can be misread and shift the token boundaries. That could hide a declaration in a large root config. Only treat `/` as starting a regex after operator or punctuation tokens, or `return`.
- The `X as Y` alias scan also matches `defineSagaConfig as unknown` in a type assertion.
- `ns-sagas inspect` (offline fallback), `update-saga` and `remove-saga` now throw if any active config has an invalid declaration. Note this in the README, or make inspect report the error instead of throwing.

VERDICT: FAIL_FIX

## Repair

Shared-root declarations now refuse local update/remove before any mutation. Four tests cover both commands, with/without companion, and compare the entire source map. Reverting only the backend makes all four fail. Context-aware regex recognition and import-only alias detection address both tokenizer advisories; offline error behavior is documented. Updated 81-test suite and source gates are rerun before round 2.

## Round 2 — PASS

No blockers remain. I read the repaired source and tests; the pass counts and gate results below come from your reports, not from re-running anything.

**Round-1 blocker: fixed.**
- `sagaPaths` (`plugins/sagas/src/cli/local-runtime-backend.ts:224-236`) throws when the root `netscript.config.ts` actively declares the id. It does this before `update-saga` reads anything and before `remove-saga` calls `removeFile`.
- The error names `netscript.config.ts`, asks for a manual edit, and states that no files were changed.
- It refuses even when a companion file also declares the id, so the root config can never be picked as the file to edit or delete.
- The new tests in `plugins/sagas/tests/cli/local-runtime-backend_test.ts:113-149` cover update and remove, with and without a companion. The fixture has a second, unrelated root declaration, which catches edits to the wrong `defineSagaConfig` call.
- Each test checks the exit code, the message, and that every file is byte-identical afterwards. Your negative-control report shows all four fail on the old backend.
- If the root config starts with the registry-ignore line, it is inactive. Its ids are then dropped, so `sagaPaths` falls back to the companion, which is correct.

**Advisories: addressed.**
- **Regex vs. division:** a `/` is now read as a regex only at the start of the source or after a regex-prefix token. Otherwise divisions stay separate tokens. Test `declared-runtime_test.ts:231` puts two chained divisions on one line, then a division and a declaration on the same line, and the declaration is still found.
- **Aliases:** they are now read only from named import lists (`import { … }`). The same test has `defineSagaConfig as unknown` followed by an unrelated `unknown('other', 'sagas/missing.ts')` call. A false alias would make that a declaration with a missing target, so the test would fail.
- **Docs:** the README now covers declaration errors in the offline commands and the root-config refusal.

**Scope and evidence.**
- No host source changed, and the repair adds no public type.
- Per your reports: 81 tests passed with zero failures, check/lint/fmt are clean, and the full `quality:gate` exited 0.
- The earlier JSR audit and baseline-matched doc-lint still apply, because the repair doesn't change the public type surface.

The full scaffold.runtime run is still unproven. It stays with the coordinator's exact-head CI, as the owner directed.

VERDICT: PASS

## Final head review

The same evaluator will review the exact pushed head after this commit and the ready transition. Its full-SHA MERGE/CHANGES verdict is recorded in PR #2526 phase comments and the READY issue reply; do not append another commit solely to transcribe that verdict and invalidate its head. Full scaffold.runtime remains an external coordinator-owned merge gate.
