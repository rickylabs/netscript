# Research — docs-changelog-0-0-7--1757

## Re-baseline

> Historical research snapshot: the facts in this section were derived for PLAN-EVAL at
> `13878a80`. Live triage currency is maintained in `worklog.md` and now covers 37 commits through
> `a5520e70`.

- Carried-in source: issue #1757 and the slice brief.
- Re-derived against `origin/main` at `13878a80a50c55b9662099fed64555f2310ae4a3` on 2026-08-30.
- `HEAD`, `origin/main`, and the merge-base are the same SHA; `v0.0.6..origin/main` contains exactly
  33 commits.
- `packages/cli/CHANGELOG.md` contains only `## 0.0.6`; `packages/cli/deno.json` remains `0.0.6`.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | Seventeen commits change behavior or published surface that a consumer can observe; sixteen are harness/CI-only, repository-only tooling, RFC/docs-only, generated-corpus maintenance, or non-behavioral refactors. | Triage table in `worklog.md`; focused `git show` diffs for every ambiguous commit and every commit touching shipped paths. |
| 2 | `01e09604` is consumer-visible despite its `ci:` subject: the generated workspace quality runner gains `--skip-apphost`. | `git diff 01e09604^ 01e09604 -- packages/cli/src/kernel/templates/workspace/quality-runner.ts`. |
| 3 | `c73d361e` intentionally changes the public SDK error channel: typed contract errors survive `safe()`/`isDefinedError`; failure data becomes `undefined`; the default error type becomes `Error`; non-Promise thenables are no longer accepted. | Commit body and diffs under `packages/sdk/src/client/errors.ts`, `packages/sdk/src/ports/service-client.ts`, and `packages/contracts/src/application/contract-primitives.ts`. |
| 4 | `3561bb64` is not merely prose: it tightens the published Prisma MySQL type surface, deprecates the misleading legacy TLS selector, and supplies an executable Prisma 7/mysql2 example. | Diff under `packages/prisma-adapter-mysql/{src,examples}`. |
| 5 | The changelog is not an agent-docs corpus input. The current builder lives at `.llm/tools/docs/build-agent-docs-bundle.ts` (the brief omitted `docs/`) and rebuilds site-owned entries only from rendered site `index.md` files. | Builder lines 254–310; task wiring at `deno.json:113`. |
| 6 | The publish-assets generator reads the checked-in agent-docs corpus and a closed list of package assets/metadata; it never reads the changelog. | `.llm/tools/generate-publish-assets.ts:14-54`, `287-358`, and `376-454`. |
| 7 | `docs:accuracy` is scoped to `docs/site`, `docs:links` is scoped to internal/contributor roots, and `docs:readme:check` checks publishable-unit READMEs. They do not validate the changelog, though the brief requires the latter two as regression gates. | `.llm/tools/docs/check-accuracy-and-discoverability.ts:140-158`; `.llm/tools/validation/check-internal-doc-links.ts:18-28,102-114`; `.llm/tools/validation/check-readme-standard.ts:16-23,179`. |
| 8 | The GitHub release introduction is a manual maintainer deliverable and must not be generated here. | `.llm/tools/release/github-release.ts:13-23`; `netscript-release` skill. |
| 9 | Five commits regenerate `agent-tools.generated.ts` with material tool changes installed by `agent init`; those are shipped CLI behavior even when their subjects say harness/tooling/CI. | PLAN-EVAL cycle 1 F1; `init-agent.ts:9-12,76-78`; `consumer-tools.json`; diffs for `f7ad44dc`, `01e09604`, `473e8d75`, `cf648f1f`, and `3b32d162`. |

## jsr-audit surface scan

- N/A: this is a docs-only changelog slice. No package/plugin implementation, manifest, export,
  dependency, or publish surface is changed.

## Open questions

- None that block implementation. The milestone is still merging, so the PR must state that this
  section is provisional and requires a top-up before the release cut.
