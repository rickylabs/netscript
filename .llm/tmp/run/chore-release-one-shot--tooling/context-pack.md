# context-pack.md — chore-release-one-shot--tooling

## Status

IMPLEMENTATION completed S1-S5 on `chore/release-one-shot` for PR #164. PLAN-EVAL cycle 2 was PASS
before implementation began.

## Commits

- `f07613d5` — S1, `chore(release): fix prod install args`
- `d74ba7c2` — S2, `chore(release): add text import preflight`
- `0b2d1aa5` — S3, `chore(release): add release cut orchestrator`
- `307981d8` — S4, `chore(release): order prod e2e after publish`
- `e2a6a2f5` — S5, `docs(release): add release workflow skill`

## Implemented

- `deps:prod-install` now runs `deno ci --prod` without the Deno 2.9-rejected extra flag, with unit
  coverage and toolbelt docs cleaned.
- `release:preflight` scans publishable `@netscript/*` source for import-meta-relative
  `Deno.readTextFile` / `Deno.readFile` calls, including cross-line identifier resolution and inline
  read calls. Fixtures cover positive, negative, and allowlist cases.
- `release:cut` validates exact semver, bumps root/member/nested workspace `deno.json` files and
  `deno.lock` `@netscript/*` ranges, checks residue, runs release gates, and creates the release PR
  outside dry-run mode.
- `e2e-cli-prod` now runs from successful `publish` workflow completion and downloads the published
  version artifact from the triggering run.
- `netscript-release` skill was added and mirrored to `.claude/skills/`; `AGENTS.md` points release
  work to it.

## Gate Notes

- Focused S1-S5 type-check, unit, format, sync, and workflow sanity gates passed as recorded in
  `worklog.md`.
- `actionlint` was not installed; S4 used YAML parsing plus manual sanity read.
- Broad `.llm/tools` check has a pre-existing unrelated failure in
  `.llm/tools/fitness/check-manifest-integrity.ts` importing missing
  `packages/fresh-ui/registry/manifest.ts`.
- `deno task release:preflight` and `release:cut --dry-run` correctly fail on a true package-source
  finding: `packages/service/src/primitives/openapi.ts:155` reads `scalarJsUrl`, declared from
  `new URL(..., import.meta.url)` on line 29. This was recorded and not suppressed because this run
  is SCOPE-tools only.

## Next

Hand off to IMPL-EVAL in a separate OpenHands qwen3.7-max session. The evaluator should treat the
`packages/service` preflight finding as a real blocker outside this implementation scope rather than
a hidden tooling failure.
