# Research — fix-agent-docs-corpus-determinism--w5-b-corpus

## Re-baseline

- Carried-in source: W5-B defect report and release PR #1624 evidence supplied by the owner.
- Re-derived against `origin/main` @ `9a7cadcaa9066970e931ed6abf1e61b65fcef20e` on 2026-08-12.
- The worktree is clean, is on the requested branch, and starts exactly at the supplied baseline.
- A local pre-fix `deno task check:agent-docs-prose` happened to pass, confirming that one green run
  cannot distinguish a correct freshness contract from a lucky encoder. The discriminating red will
  come from a regression test that substitutes content-identical gzip transport bytes.

## Findings

| # | Finding | How to verify |
| --- | --- | --- |
| 1 | `writeCorpus` hashes the bytes returned by `CompressionStream('gzip')`, then writes those bytes and their size into provenance. | `.llm/tools/docs/build-agent-docs-bundle.ts:80-103` |
| 2 | `check:agent-docs-prose` regenerates in place and uses `git diff --exit-code` on both the gzip and provenance, so compressed transport bytes define freshness. | root `deno.json` task `check:agent-docs-prose` |
| 3 | The checked-in payload has 178 files; unchanged local regeneration currently reports the same canonical corpus but local success is environment-dependent. | `.llm/assets/agent-docs/provenance.json`; pre-fix command output |
| 4 | The CLI currently verifies provenance `sha256` against compressed bytes before decompression, so moving that field to canonical content identity requires updating the consumer and its tests. | `packages/cli/src/public/adapters/agent/deno-agent-docs-generator.ts:162-175` |
| 5 | Stable-cut inheritance semantically compares decompressed payloads for version replacement, but provenance validation still carries the current `sha256` field contract. | `.llm/tools/release/github-release.ts` agent-docs helpers |

## jsr-audit surface scan (package/plugin waves)

- N/A: this run changes repository tooling, generated corpus provenance, and the existing CLI asset
  consumer test surface; it does not change a package export map or publishable public API.

## Open questions

- None that force design rework. The owner has locked content identity, real-staleness detection,
  double-run stability, and the coordinated version-only release constraint.
