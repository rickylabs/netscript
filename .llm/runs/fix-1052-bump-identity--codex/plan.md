# Plan — constrain release version rewrites to NetScript identities

## Scope and gates

- Surface: Archetype 6 internal release/dependency tooling.
- Doctrine: no package/plugin source or layering change; no new/deepened architecture debt.
- JSR: preserve exact `@netscript/*` release pins while leaving all third-party `npm:`/`jsr:` pins
  byte-identical.
- Gates: focused regression suite in stable and canary directions, genuine blind-substitution RED,
  restored GREEN, pre/post real-tree differential proof, requested scoped check, and lint/format on
  the two touched TypeScript files.
- Evaluator waiver: the owner waived the open-model Plan-Gate on 2026-08-01 and directed immediate
  implementation. No `plan-eval.md` or evaluator dispatch will be created.

## Locked decisions

1. Export one `rewriteNetScriptVersion(text, oldVersion, newVersion)` helper.
2. Build its three regexes from the escaped old version: JSON `"version"` key only; scoped
   `jsr:`/`npm:` `@netscript/*` specifiers with a semver-token boundary; and values under scoped
   `"@netscript/*"` keys only. Manifest dependency rules preserve an optional supported range
   operator as part of the captured prefix; package-own versions remain exact.
3. Derive residue detection by asking whether the same rewrite helper changes the text with a probe
   replacement. There will be no second pattern set.
4. Keep discovery, version validation, CLI parsing, JSON output, and all repository version-bearing
   data unchanged.

## Open-decision sweep

- Safe to defer: none.
- Must resolve now: none; all load-bearing match and verification decisions are locked above.

## Commit slice

1. **Identity-constrained coordinated bump** — change `bump-version.ts`, extend
   `bump-version_test.ts`, and complete this run directory. Prove with stable/canary token-specific
   tests, a temporary blind-rewrite RED, restored GREEN, the real-tree differential comparison, and
   scoped static gates. Commit once as `fix(deps): constrain version bump to NetScript identities`.

## Risks and mitigations

- Missing a first-party surface could half-publish a release. Mitigation: fixtures cover exact and
  ranged manifest shapes, the authoritative release-cut test must pass, the root suite is required,
  and the real-tree differential requires all first-party output to match pre-fix.
- Matching a longer or prerelease version could corrupt unrelated text. Mitigation: escape the old
  version and require a non-version-token boundary after specifier versions.
- Rewrite/residue logic could drift. Mitigation: residue delegates to the exported rewrite helper.
- Scratch execution could contaminate the worktree. Mitigation: copies live under `/tmp`, are
  diffed, and are removed before handoff.

## Deferred scope

Release cuts, workflow dispatches, canary reruns, version data changes, discovery changes, and all
package/plugin/workflow changes are excluded.
