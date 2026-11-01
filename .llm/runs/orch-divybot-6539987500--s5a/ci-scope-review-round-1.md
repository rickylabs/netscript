**Verdict: FAIL_FIX** (bounded CI test-fixture repair)

The targeted test fails with this repair applied. The scoped check, lint and fmt wrappers pass and product code is untouched, but the fix swaps one CI failure for another.

## Evidence

- **The original CI failure.** The Fresh UI job (`tests.report.json`) had 327 passed and 1 failed. The failure is in `frozen token check rejects every stale and missing SD artifact without repair` (`packages/fresh-ui/tests/token-build.test.ts:75`): an import resolution error on the copied sources. That fits your diagnosis.
  - The test copies `src/tokens/` into a temp directory outside the workspace.
  - That code imports bare `zod`, which this PR introduced (`domain/figma/figma-snapshot.ts`, `adapters/figma/*`).
  - The package's scoped import map, reached through `--config packages/fresh-ui/deno.json`, doesn't cover modules outside the package directory.
- **The repair itself.** `ci-scope-token-test.json` shows the targeted test still fails (exit 1, 0/1): `The lockfile is out of date. Run deno install --frozen=false …`. The diff Deno prints wants to remove a long list of entries (`jsr:@cliffy/*`, `@david/*`, `@fedify/*`, `@fresh/*`, `@std/*`, …). The cause:
  - The temp `deno.json` makes the temp directory a separate, standalone config root.
  - `packages/fresh-ui/deno.lock` records the dependency graph and workspace section of the real workspace configuration.
  - Under `--frozen`, Deno checks the lock against the new root's much smaller graph and refuses the prune.
  - Copying `catalog`/`catalogs` does expand the catalog alias. It can't make this lock agree with a different config root. (`catalogs` is absent from root `deno.json`, so it serializes away harmlessly.)
- **Scoped wrappers.** `ci-scope-check.json`, `ci-scope-lint.json` and `ci-scope-fmt.json` each processed 1 file with 0 findings. They pass, but they don't prove the behaviour.

## Required fix (keep the frozen lock and every negative control)

Keep the real workspace context and move the fixture inside it:

- Create the temp root inside the package directory, for example `Deno.makeTempDir({ dir: fileURLToPath(new URL('<ignored tmp dir>/', PACKAGE)), prefix: 'fresh-ui-token-check-' })`. Use a git-ignored location, created if missing.
- Restore `--config` to the original `packages/fresh-ui/deno.json`.
- Keep `--lock packages/fresh-ui/deno.lock --frozen`.
- Drop the generated temp `deno.json` entirely.

The copied modules then fall inside the member's import scope, `zod: "catalog:"` resolves natively, and the lock matches the graph it was generated for. Nothing needs pinning and no caches are copied.

Keep the rest of the test exactly as it is:
- the clean check;
- appending to every declared output and asserting each name in stderr and the file unchanged;
- deleting every output and asserting each name in stderr and no file recreated;
- the final write, with byte-exact equality against the originals.

`finally` must still remove the temp root. Make sure that directory is git-ignored and outside source globs so a crashed run can't leave files for check or publish to pick up.

Rejected alternatives:
- `--frozen=false`, or a temp copy of the lock: these weaken the gate.
- Inline `npm:zod@…` specifiers in source: these change product code and the dependency policy.
- `--no-config` plus `--import-map`: this hits the same mismatch between the lock and its config.

## Needed before the commit, then READY

1. `ci-scope-token-test.json`: the targeted test (filter "frozen token check") passes 1/0/0, with `--frozen` and the real lock.
2. Re-run scoped check, lint and fmt on the changed test file, and confirm `.gitignore` covers the fixture directory.
3. Full Fresh UI test job green on the next pushed head, then every required CI check green on that exact head before READY. The earlier IMPL-EVAL and merged-tree PASS verdicts stand. This failure is in the fixture design only; product semantics are unaffected.

OPENHANDS_VERDICT: FAIL_FIX
