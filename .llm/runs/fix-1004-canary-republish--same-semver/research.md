# Research — fix-1004-canary-republish--same-semver

## Re-baseline

- Carried-in source: issue #1004 brief.
- Re-derived against `origin/main` at `3ab64720ffe06dedc80f12e8f7bb9fa281de37b9` on 2026-08-01.
- The causal account matches the current tree; no contradictory implementation behavior was found.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | The canary workflow has only `target-version`; its cut step invokes `release:canary`, whose `main()` always calls `deriveCanaryVersion` before preparing and creating refs. There is no existing-version input or alternate version source. | `.github/workflows/release-canary.yml`; `.llm/tools/release/canary.ts` |
| 2 | The canary workflow uses the same `run-publish.ts` dry-run, preflight, and publish commands as the stable publisher. `run-publish.ts` delegates unchanged to `publishWorkspace`, which runs root `deno publish --allow-dirty`; its documented and tested Deno 2.9 contract skips versions already registered and continues the missing set. | `.llm/tools/release/run-publish.ts`; `.llm/tools/release/publish-workspace.ts`; `.github/workflows/publish.yml` |
| 3 | `release/canary-pair` is written against the checkout's `source_sha`. `verifyGreenCanaryPair` first reads that status from `HEAD`, and may inherit it only from `HEAD^` for an exact coordinated version-only diff. Therefore a republish dispatched at the tag commit records evidence that unblocks stable publication for the same content without relaxing the gate. | `.github/workflows/release-canary.yml`; `.llm/tools/release/github-release.ts:167` |
| 4 | The required tree comparison is stronger and more direct than commit-message or working-tree checks: compare `v<republish>^{tree}` to `HEAD^{tree}` and report both resolved tree SHAs on mismatch. | issue #1004 acceptance and release same-semver doctrine |

## jsr-audit surface scan

- N/A: this changes GitHub Actions and internal release tooling, not a package/plugin export or publish surface.

## Open questions

- None. Priority is treated as `priority:p1` because a blocked canary recovery lane is release-critical but not an active production outage.

