Review implementation slice 2 for issue #811 in `/home/codex/repos/b10-canary` as the separate
opposite-family reviewer. Use the native Claude Opus 4.8 medium-effort fallback because the
prescribed Fable 5 route returned `model_not_found` before evaluation. Do not delegate and do not
edit any file.

Scope is the uncommitted diff for:

- `.llm/tools/release/prepare-release.ts` and test
- `.llm/tools/release/canary.ts` and test
- `.llm/tools/release/cut.ts`
- `.llm/tools/release/config/endpoints.ts`
- `deno.json`

Check that stable and canary cuts share the full existing preparation sequence, canary N is the
maximum across all effective JSR package metadata plus the local tag collision guard, 404 is the
only new-package case, the target is stable semver, refs are branch/tag only with no PR, and tests
cover failures. Also inspect security, permissions, command injection, semver edge cases, and
regressions in stable `release:cut`.

Return concise findings ordered by severity with file/line references. End with exactly
`SLICE_REVIEW_PASS` if there are no blocking findings, otherwise `SLICE_REVIEW_FAIL`.
