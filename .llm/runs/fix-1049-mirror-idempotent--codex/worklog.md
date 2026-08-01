# Worklog

## Bootstrap and research

- 2026-08-02: Read the requested harness, tools, PR, and RTK skills plus harness activation,
  run-loop, archetype matrix, Plan-Gate, archetype-selection, and PLAN-EVAL protocol.
- Confirmed clean branch `fix/1049-mirror-idempotent` at baseline `8b69d78f0`.
- Confirmed supplied root cause in `validateEvidenceMapping()` and verified the unchanged mirror
  builds mutations only for unchecked boxes that have mapping entries.
- Recorded the owner-authorized PLAN-EVAL waiver; did not invoke an evaluator and will not create
  `plan-eval.md`.

## Design

- Public surface: preserve the existing `validateEvidenceMapping()` signature and unchecked-only
  returned map contract.
- Domain vocabulary: existing `AcceptanceCheckbox` and `AcceptanceEvidence`; add local `known` and
  `seen` sets only.
- Ports: none.
- Constants: none required; no new finite domain values.
- Commit slices: one slice, “idempotent evidence validation,” proved by focused tests, revert RED,
  restored GREEN, and scoped check/lint/fmt wrappers.
- Deferred scope: mirror API code and all unrelated repository surfaces.
- Contributor path: behavior and edge cases are colocated in `acceptance-evidence.ts` and its
  adjacent test module.

## Progress

- Plan written. Implementation starting under the explicit evaluator waiver.
- Implemented `known`/`seen` validation with an unchecked-only returned mapping and expanded strict
  regression coverage.
- The requested `--allow-none` flag is unsupported by the installed Deno CLI, so the focused test
  was rerun without permission flags; this test module requires none.

### Initial focused test output

```text
$ deno test --allow-none .llm/tools/validation/acceptance-evidence_test.ts
error: unexpected argument '--allow-none' found

  tip: a similar argument exists: '--allow-net'
  tip: to pass '--allow-none' as a value, use '-- --allow-none'

Usage: deno test [OPTIONS] [files]... [-- [SCRIPT_ARG]...]
exit: 1

$ deno test .llm/tools/validation/acceptance-evidence_test.ts
Check .llm/tools/validation/acceptance-evidence_test.ts
running 8 tests from ./.llm/tools/validation/acceptance-evidence_test.ts
maps verbatim unchecked acceptance boxes and preserves checked boxes ... ok (4ms)
rejects mismatched text and missing boxes ... ok (2ms)
rejects extra unchecked issue boxes ... ok (984µs)
already-ticked boxes need no evidence and supplied evidence is a no-op ... ok (381µs)
rejects empty evidence for unchecked and already-checked boxes ... ok (1ms)
rejects duplicate evidence for unchecked and already-checked boxes ... ok (938µs)
re-running the mirror against already-ticked boxes is a no-op ... ok (419µs)
umbrella reference without closing keyword is untouched ... ok (2ms)

ok | 8 passed | 0 failed (32ms)
exit: 0
```

## Revert sanity-check

Temporarily changed the membership condition back to the old
`if (!unchecked.has(entry.text))` behavior and ran only the named re-run regression. It went RED:

```text
$ deno test --filter 're-running the mirror against already-ticked boxes is a no-op' .llm/tools/validation/acceptance-evidence_test.ts
Check .llm/tools/validation/acceptance-evidence_test.ts
running 1 test from ./.llm/tools/validation/acceptance-evidence_test.ts
re-running the mirror against already-ticked boxes is a no-op ... FAILED (13ms)

 ERRORS

re-running the mirror against already-ticked boxes is a no-op => ./.llm/tools/validation/acceptance-evidence_test.ts:76:6
error: Error: Evidence names no unchecked box: exact acceptance text
  if (errors.length) throw new Error(errors.join('\n'));
                           ^
    at validateEvidenceMapping (file:///home/codex/repos/fix-1049/.llm/tools/validation/acceptance-evidence.ts:91:28)
    at file:///home/codex/repos/fix-1049/.llm/tools/validation/acceptance-evidence_test.ts:85:25

 FAILURES

re-running the mirror against already-ticked boxes is a no-op => ./.llm/tools/validation/acceptance-evidence_test.ts:76:6

FAILED | 0 passed | 1 failed | 7 filtered out (39ms)

error: Test failed
exit: 1
```

Restored the `known` membership condition. The full focused suite then went GREEN (8 passed), as
shown in the final validation output below.

## Gate evidence

```text
$ deno test .llm/tools/validation/acceptance-evidence_test.ts
running 8 tests from ./.llm/tools/validation/acceptance-evidence_test.ts
maps verbatim unchecked acceptance boxes and preserves checked boxes ... ok (4ms)
rejects mismatched text and missing boxes ... ok (1ms)
rejects extra unchecked issue boxes ... ok (868µs)
already-ticked boxes need no evidence and supplied evidence is a no-op ... ok (1ms)
rejects empty evidence for unchecked and already-checked boxes ... ok (4ms)
rejects duplicate evidence for unchecked and already-checked boxes ... ok (2ms)
re-running the mirror against already-ticked boxes is a no-op ... ok (479µs)
umbrella reference without closing keyword is untouched ... ok (1ms)

ok | 8 passed | 0 failed (38ms)
exit: 0

$ deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/validation --ext ts
{"source":{"mode":"selection","cwd":"/home/codex/repos/fix-1049"},"command":"deno check --quiet --unstable-kv <files>","selection":{"filesSelected":14,"batches":1,"failedBatches":0},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueCodes":0,"uniquePaths":0},"groups":[]}
exit: 0

$ deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .llm/tools/validation --ext ts
{"source":{"mode":"command","cwd":"/home/codex/repos/fix-1049","exitCode":0},"selection":{"filesSelected":14,"batches":1},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueRules":0,"uniquePaths":0},"groups":[]}
exit: 0

$ deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .llm/tools/validation --ext ts
{"command":"deno fmt --check","cwd":"/home/codex/repos/fix-1049","mode":"check","summary":{"filesSelected":14,"batches":1,"failedBatches":0,"findings":0,"ignoredFindings":0},"findings":[]}
exit: 0
```

## Reconcile

- Issue #1049 remains assigned to milestone 0.0.3 per the owner brief. The supervisor owns the PR,
  labels, milestone, closing keyword, push, and IMPL-EVAL; no GitHub state was mutated here.
- No scope, plan, doctrine, dependency, or lockfile drift was found.

## DONE

### Files changed

- `.llm/tools/validation/acceptance-evidence.ts`
- `.llm/tools/validation/acceptance-evidence_test.ts`
- `.llm/runs/fix-1049-mirror-idempotent--codex/{supervisor,research,plan,worklog,context-pack,drift}.md`

### Tests added or rewritten

- Rewrote `already-ticked boxes need no evidence and supplied evidence is a no-op`.
- Added `rejects empty evidence for unchecked and already-checked boxes`.
- Added `rejects duplicate evidence for unchecked and already-checked boxes`.
- Added `re-running the mirror against already-ticked boxes is a no-op`.
- Updated `rejects mismatched text and missing boxes` for the new unknown-box message.
- Preserved the existing missing-evidence regression `rejects extra unchecked issue boxes`.

### Final result

- Revert sanity-check: RED under the old unchecked-only membership condition (0 passed, 1 failed).
- Restored implementation: GREEN (8 passed, 0 failed).
- Scoped check, lint, and format wrappers: PASS, exit 0, zero findings.
- Raw validation output is recorded above.
