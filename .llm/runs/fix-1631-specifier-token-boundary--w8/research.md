# Research — fix-1631-specifier-token-boundary--w8

## Re-baseline

- Carried-in source: issue #1631 and owner slice brief.
- Re-derived against `origin/main` @ `33418a6c834dd58b67751a9fe7b6b3f5360494b7` on 2026-08-13.
- The worktree is clean, the requested branch is checked out, and HEAD equals the supplied base.

## Findings

| # | Finding | How to verify |
| --- | --- | --- |
| 1 | The scanner matches only the scoped-package prefix, then derives the displayed token by forward scanning. | `.llm/tools/validation/check-netscript-jsr-specifiers.ts` |
| 2 | `publish-readiness.ts` already owns a semver-aware NetScript JSR matcher. | `.llm/tools/release/publish-readiness.ts` |
| 3 | `rewriteNetScriptVersion` already owns the safe version-token boundary used by release residue rewriting. | `.llm/tools/deps/bump-version.ts` |
| 4 | `publish:readiness` currently reports scanner range notes as details instead of failing them. | `.llm/tools/release/publish-readiness.ts` `versionless-specifiers` check |
| 5 | The generated MCP publish asset contains correct rendered prose and is an intended scanner input. | issue #1631; canary run 31658880683 |

## jsr-audit surface scan

- N/A: this slice changes internal release-validation tooling only; no package/plugin exports, manifests, or JSDoc surface changes.

## Open questions

- None. The owner supplied the seam, canonical precedents, negative controls, and gate set.
