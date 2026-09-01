# Research — fix-aspire-sibling-generator-name-safety--issue-1836

## Re-baseline

- Carried-in source: issue #1836 and the source-safety treatment on draft PR #1747.
- Re-derived against `main` @ `71d5fb8e079cae74249dd7d314874a3a18e7ab28` on 2026-08-31.
- What changed vs the carried-in version:
  - Nothing in the four named sibling generators; all still derive bindings through
    `safeIdentifier(...)` and interpolate user strings into single-quoted source literals.
  - PR #1747 remains open. Its current branch diff, rather than `main`, is the authoritative
    implementation example for ordinal bindings and `JSON.stringify` emission.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | `generateRegisterApps` derives resource and remote endpoint bindings from user text. | `generate-register-apps.ts:68,217` |
| 2 | `generateRegisterPlugins` derives service/plugin reference bindings from user text. | `generate-register-plugins.ts:185,220` |
| 3 | `generateRegisterTools` derives every resource binding from the tool name. | `generate-register-tools.ts:37` |
| 4 | `generateRegisterInfrastructure` derives database and cache bindings from resource names, including cross-kind collisions in one function scope. | `generate-register-infrastructure.ts:109,227` |
| 5 | All four generators interpolate resource names and other user strings into emitted source without uniform JSON literal encoding. | Focused search of the four generator files for template interpolations |
| 6 | The #1747 repair uses `bg_<ordinal>` and `ref_<kind>_<ordinal>_<ordinal>`, removes user text from identifier/comment positions, and JSON-stringifies every emitted user string. | `git diff origin/main..2032d4ed7 -- generate-register-background.ts` |
| 7 | Deno lint can parse the generated modules without resolving imports when invoked with `--no-config` and only the pre-existing non-semantic lint rules excluded. | Diagnostic render of all four generators; exit 0 for each safe-name control |
| 8 | `packages/cli` is Doctrine Archetype 6 with current verdict `Keep`; this slice changes an existing kernel template feature without changing package shape or public exports. | doctrine files 06 and 10 |

## jsr-audit surface scan

- Surface scanned: N/A. This slice does not touch `mod.ts`, an export map, JSDoc, or any published
  symbol signature.
- Slow-type / surface risks: none introduced; the generated-source contract is private CLI kernel
  behavior.

## Open questions

- None. Prefixes, source-literal policy, hostile-input matrix, mutation requirement, and gate set are
  supplied by issue #1836 and the owner prompt.

