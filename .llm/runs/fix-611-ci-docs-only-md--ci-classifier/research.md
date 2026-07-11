# Research — fix-611-ci-docs-only-md--ci-classifier

## Re-baseline

- Carried-in source: issue #611 and the user slice brief.
- Re-derived against `origin/main` @ `720fcb7e3b762c1e9ee5bf51a1371bfeeb6be22f` on 2026-07-11.
- The current classifier explicitly makes `packages/`, `plugins/`, and `apps/` Markdown impacting; current tests encode that old policy. The brief therefore requires a deliberate contract and regression-test reversal.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | `isDocsOnlyPath` currently applies `isImpacting` before the Markdown allowlist, so `packages/**/README.md` is full CI. | `.github/scripts/ci-classify-changes.ts` and its denylist test |
| 2 | Rename awareness is implemented by `parseNameStatus`, which returns both old and new paths for `R*`/`C*`. | `parseNameStatus` and rename regression tests |
| 3 | `deno.json*`, `deno.lock`, and workflow paths already force full classification. | `isImpacting` and impacting-surface tests |
| 4 | `netscript-pr` has path-filter guidance, but it does not proactively require both skip labels for eligible docs-only PRs. | `.agents/skills/netscript-pr/SKILL.md` |
| 5 | `netscript-harness` contains a draft-PR-opening section and therefore also needs the proactive-label reminder requested by the brief. | `.agents/skills/netscript-harness/SKILL.md` |

## jsr-audit surface scan

- N/A: this is repository CI tooling and agent guidance, not a package/plugin publish surface.

## Open questions

- Resolved: Markdown/MDX takes precedence over directory-impact prefixes, except the explicit critical files/workflows named by #611.
- Resolved: a rename is docs-only only when every old/new path returned by rename-aware parsing is Markdown/MDX or otherwise docs-only and no critical path is present.
