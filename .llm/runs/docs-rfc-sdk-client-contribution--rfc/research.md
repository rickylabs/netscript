# Research — docs-rfc-sdk-client-contribution--rfc

## Re-baseline

- Carried-in source:
  `/home/codex/repos/netscript-fable5-remediation-plan/.llm/runs/plan-fable5-remediation-roadmap--seed/fable-5-remediation-plan/rfcs/RFC-A-sdk-client-composition.md`
- Re-derived against `origin/main` @ `fac9e339042c5394bf882311657d8981d353a1c3` on 2026-08-08.
- Status: in progress. The 755-line proposal has been read as a challengeable design pack, not as
  repository truth. Current exports, consumers, tests, issues/PRs, and upstream oRPC sources remain
  to be re-verified before decisions are locked.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | The requested branch starts exactly at the requested baseline, and freshly fetched `origin/main` remains at that SHA. | `git rev-parse HEAD origin/main`; `git merge-base HEAD origin/main` |
| 2 | The RFC process requires a `rfcs/0000-*.md` draft; a maintainer assigns a number only at acceptance. | `rfcs/README.md`; `rfcs/0000-template.md` |
| 3 | This RFC describes Archetype 2, 4, 5, and 6 consequences under the docs overlay; the PR itself will not change framework source. | doctrine 06/11; selected harness profiles; task brief |
| 4 | Current doctrine treats `@netscript/sdk`, `@netscript/contracts`, `@netscript/service`, and `@netscript/plugin` as Archetype 4; telemetry/auth cores as Archetype 2; first-party plugins as Archetype 5; CLI/scaffolding as Archetype 6. | `docs/architecture/doctrine/06-archetypes.md` |

## jsr-audit surface scan (package/plugin waves)

- Surface to scan: the current full export maps and docs for `packages/sdk`, `packages/contracts`,
  `packages/service`, `packages/plugin`, the selected auth/telemetry consumer packages, and any
  RFC-proposed new subpaths.
- Slow-type / surface risks: generic tuple-to-intersection inference, exported upstream-bound oRPC
  types, `isolatedDeclarations`, entrypoint documentation, consumer import stability, and publish
  file/subpath boundaries.
- Status: pending `deno doc`, export-map inspection, and focused publish-surface audit.

## Open questions

- Which smallest contribution contract survives both an auth and a structurally different non-auth
  consumer without exposing unstable upstream or experimental types?
- Which proposal claims are stale or over-broad on current `main` and live GitHub state?
- Which choices must be ratified now versus remain safe FCP questions without implementation
  rework?

