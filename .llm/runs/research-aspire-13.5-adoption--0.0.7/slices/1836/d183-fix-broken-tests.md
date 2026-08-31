use harness

## D-183 — #1836 is NOT green: two pre-existing test files fail. Repair before any evaluation.

Your gate evidence reported green, but running the full generator test directory fails:

```
FAILED | 28 passed (213 steps) | 2 failed (5 steps)
```

Failing:
1. `packages/cli/src/kernel/templates/aspire/helpers/tests/generators-pipeline_test.ts:231`
   — `HelpersGeneratorPipeline › should pass populated config through to Tier 1 generator content`
2. `packages/cli/src/kernel/templates/aspire/helpers/tests/service-environment_test.ts:242`
   — `declared plugin environment parity (#1447)` (4 failing steps)

**Neither file is in your changed-file list.** They assert on generated output, and your hardening
changed that output — so they broke and were not updated. Note the failures appear only in a
**directory-wide run**; `generators-service-plugin_test.ts` alone exits 0, which is likely why the
per-file check looked clean. Always run the whole directory before claiming green.

## Required work

1. **First determine, per failure, whether the new output is CORRECT or whether the fix broke
   behaviour.** Do not simply rewrite expectations until tests pass — that would convert a real
   regression into a green build. State your conclusion for each with evidence.
2. If the output is correct (ordinal bindings + `JSON.stringify` escaping are intended), **update the
   stale expectations** in those two files to the new correct output, and say explicitly what changed
   and why it is right.
3. If any failure reveals the hardening broke real behaviour — e.g. declared plugin environment
   ordering, the `#1447` parity contract, or PORT refusal semantics — **fix the generator, not the
   test.**
4. Re-run **`deno test --allow-all packages/cli/src/kernel/templates/aspire/helpers/tests/`** (the
   whole directory) and confirm **0 failed**.

## Constraints

- Preserve everything already achieved: ordinal bindings in all four sibling generators
  (`safeIdentifier` count is now 0 in each — keep it that way), universal `JSON.stringify` escaping,
  and the hostile-input tests with parse-checking and mutation proof.
- **Do not remove or weaken any existing assertion to make a test pass.** If an assertion is genuinely
  obsolete, say so and justify it.
- `safeIdentifier` must remain exported from `_utils.ts` — `generate-register-background.ts` on `main`
  still depends on it (#1747 fixes that generator separately).

## Gates

Full generator test directory (0 failed); scoped check/lint/fmt on changed files; **repo-wide
`deno task check`** expecting `failedBatches: 0`; `deno task quality:scan`; `deno task arch:check`;
`check:assets-barrel` (regenerate via `gen:assets-barrel` if the emission change affects snapshots).

**No runtime.** No self-dispatched evaluator. Do not change lifecycle labels.

Push with `--force-with-lease` against a freshly read `git ls-remote` SHA. Report old/new head, your
correct-vs-broken determination per failure, and every gate's exit code.
