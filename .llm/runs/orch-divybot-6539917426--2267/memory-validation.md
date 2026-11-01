# KV validation recipe

`deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all --unstable-kv --frozen packages/kv`
passes 160 tests with 41 conditional backend skips for this fix. Without the new
regression file the baseline is 148 passed / 41 skipped. Focused regression file
has 12 tests, no skips; original-file control gives 12 semantic failures.

`run-deno-check.ts --root packages/kv --ext ts,tsx` covers package and tests.
Use `run-deno-lint.ts` / `run-deno-fmt.ts` with repeatable `--file` flags for the
adapter and focused test. Source check already supplies unstable KV. All wrappers
need `--allow-write` with `--output`. Read processFailure as well as TAP summary:
an initial union-iterator typing error had zero parsed tests and nonzero exit;
that was corrected before counting the semantic negative control.
