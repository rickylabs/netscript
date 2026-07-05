# Context Pack

## Current State

- Branch: `chore/307-stale-wave2-wave4`
- Base: `origin/main` at `1c175990`
- Scope: issue #307, Waves 2 and 4 only
- Wave 2 delete set currently limited to verified orphan files:
  - `packages/cli/src/kernel/adapters/deploy/compile/compile.test.ts`
  - `packages/plugin/src/public/mod.ts`
  - `packages/plugin-workers-core/src/public/mod.ts`
  - `packages/telemetry/src/public/mod.ts`
  - `packages/plugin-streams-core/src/domain/errors.ts`
- Wave 4: no tracked `.llm/tmp` files remain in this checkout.

## Next

1. Commit and push to `origin HEAD:refs/heads/chore/307-stale-wave2-wave4`.
2. Open draft PR with `Refs #307`, labels, and manifest summary.
3. Post per-slice evidence comments and final `SLICE-COMPLETE` comment.

## Validation Snapshot

- Affected package check: PASS, 927 files, 8 batches, 0 diagnostics.
- Affected non-CLI lint: PASS, 338 files, 2 batches, 0 findings.
- Raw CLI lint: PASS, 77 files.
- Affected package tests: PASS (`cli` 306, `plugin` 74, `plugin-workers-core` 25,
  `plugin-streams-core` 8, `telemetry` 12).
- Root check: PASS, 2101 files, 18 batches, 0 diagnostics.
- Root test: PASS, 1497 passed, 0 failed, 12 ignored.
- Wave 4: `git ls-files .llm/tmp` remains `0`; `.llm/tmp` tooling spot-check wrote an ignored
  scratch event successfully.

## Open Questions

- None for implementation scope.
