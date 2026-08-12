# Plan — exact canary plugin install

## Profile

- Archetype: 6 — CLI / Tooling
- Overlays: none
- Current doctrine verdict: `@netscript/cli` is recorded as Restructure, with the bounded Archetype-6 promotion debt already tracked separately.
- In-scope anti-patterns: AP-18 (semantic negative-control tests), AP-24 (retain typed flow rather than package-name branches), AP-25 (network remains in the JSR adapter).

## Locked decisions

1. Parse an optional exact version into `ResolvedPluginPackageSpec`; keep package identity unversioned and make the fully qualified `jsrSpecifier` exact when requested.
2. Select the explicit requested version before CLI-release/latest fallback and reject it if absent or yanked.
3. Preserve the validated exact descriptor into scaffold dispatch, appsettings, persisted manifest metadata, and the generated root import entry for the selected plugin package.
4. Prove the fix with a negative-control fixture where requested `0.0.6-canary.2` differs from `latest: 0.0.5`.

## Open-decision sweep

No open decisions. Version ranges/tags are deferred: #1456 requires exact `@version` spellings only, and accepting ranges would introduce separate selection semantics.

## Commit slices

1. Exact-version contract and negative control — change resolver, JSR validator, generated-import threading, and focused tests. Gates: focused tests red-before/green-after, required root gates, scoped CLI check, quality gate, and diff scan.

## Risk register

- Unversioned installs regress: retain existing fallback path and test it.
- Version accepted but dropped at dispatch: assert the actual Deno scaffold target.
- Exact version replaced in generated imports: assert generated `deno.json` and appsettings/manifest evidence.
- Lock churn: inspect and exclude `deno.lock`.

## Deferred scope

- Version ranges and distribution tags.
- `scaffold.runtime` (explicitly prohibited without orchestrator approval).
- Existing unrelated Archetype-6 debt.

## Gates

The six commands in the slice brief, focused red/green tests, JSR/package surface review, and a changed-diff scan for `deno-lint-ignore`, `as unknown as`, and `@ts-ignore`.

