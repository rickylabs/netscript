**Verdict: PASS** (round 2 of the test-fixture repair)

The new fixture in `packages/fresh-ui/tests/token-build.test.ts` fixes both causes, keeps every negative control, and follows the rule that temporary files go in `$TMPDIR`. I only read the file and the evidence; I ran nothing.

## Both causes are fixed

- **Lock context.** `--config` is back to the original `packages/fresh-ui/deno.json`, and `--lock packages/fresh-ui/deno.lock --frozen` is unchanged. The standalone temp `deno.json` is gone, so Deno checks the lock against the same workspace graph it was written for. That removes the frozen prune failure from round 1.
- **Alias scope.**
  - `--import-map ${root}/imports.json` maps only `zod`, the one bare specifier this PR added to the copied modules.
  - The range comes from the root `catalog.zod` (`^4.6.5`), so no version is pinned by hand and the catalog stays the single source.
  - The resolved specifier `npm:zod@^4.6.5` already exists in the frozen lock.
  - Copied code with inline `npm:` specifiers needs no mapping.
  - If a future copied module adds another bare alias, the run fails loudly rather than silently.
- **Not the rejected variant.** This keeps the workspace config, unlike the `--no-config` option I ruled out in round 1.

## Gate strength is unchanged

Lines 116–152 are the same as before:
- the clean check;
- appending to every declared output, then asserting each name in stderr and the file unchanged;
- deleting every output, then asserting each name in stderr and no file recreated;
- the final write, with byte-exact equality against every original.

## Path rule and hygiene

- `Deno.makeTempDir` uses the default system temp directory. `imports.json` lives inside that root and is removed in `finally`.
- No ignored directory inside the source tree, no copied caches, no generated config in the repository.
- No product, dependency or lock changes.

## Evidence

- `ci-scope-token-test-fixed.json`: exit 0, 1/0/0 (filter "frozen token check", about 107 s).
- `ci-scope-fixed-check.json`, `ci-scope-fixed-lint.json` and `ci-scope-fixed-fmt.json`: 1 file each, 0 findings.

## Before READY

- The full Fresh UI test job must be green on the next pushed head, and every required check must be green on that exact head, named in the READY report. This test takes about 107 s, so watch the job's timeout.
- The earlier IMPL-EVAL and merged-tree PASS verdicts stand. `scaffold.runtime`, optional Chromium and the real Figma host remain UNPROVEN.

OPENHANDS_VERDICT: PASS
