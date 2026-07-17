Review implementation slice 3 for issue #811 in `/home/codex/repos/b10-canary` as the separate
opposite-family reviewer. Use the native Claude Opus 4.8 medium fallback because Fable 5 is
unavailable in this environment. Do not delegate and do not edit any file.

Review the uncommitted diff, especially:

- `.llm/tools/release/publish-readiness.ts` and tests
- `.llm/tools/release/preflight-release.ts` and tests
- `.llm/tools/release/prepare-release.ts` and tests
- `.llm/tools/release/jsr-provision-packages.ts`
- reusable validator exports and `deno.json`

Check issue #811's enterprise gate requirements: effective publish-set completeness from workspace
globs, lockstep/residue, unsafe versionless JSR specifiers, JSR-metadata new-package detection,
first-publish README/tagline/license/exports/docs checks only for absent packages, credential-free
provisioning dry-check, and calling (not duplicating) PR #810's canonical `release:preflight` with
the denoland/deno#35546 sunset. Verify ordered structured evidence, fail-closed behavior,
permissions, and that each new check has a seeded negative proof. Inspect whether skipping fixture
versions can hide real release residue.

Return concise findings ordered by severity with file/line references. End with exactly
`SLICE_REVIEW_PASS` if there are no blocking findings, otherwise `SLICE_REVIEW_FAIL`.
