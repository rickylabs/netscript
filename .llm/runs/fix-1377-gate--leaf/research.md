# Research — #1377 gate half

## Re-baseline

- Carried-in source:
  `/home/codex/repos/netscript-006-docs/.llm/runs/release-0.0.6-docs--orchestration/slices/1377-content/research.md`, live issue #1377, and merged PR-C #1541.
- Re-derived against dispatched `main` baseline
  `fa5d0d411054ba8aea272df392eb4e85b57c0d41` on 2026-08-12.
- PR-C merge commit `db1d79c68f7861a43902313f5d7a68274b0ef12a` is an ancestor of the baseline.
- The carried-in measurements remain authoritative except where the dispatch amendment supplied a
  newer state. This run performed only the requested arrival checks and focused design inspection;
  it did not redo the completed corpus audit.

## Findings

| # | Finding | How to verify |
| --- | --- | --- |
| 1 | The branch and baseline match dispatch, with no upstream assumed. | `git branch --show-current`; `git rev-parse HEAD` |
| 2 | PR-C recorded the current path convention in `docs/site/reference/index.md`: name-exact after stripping `@netscript/`, except four deployable-plugin aliases (`plugin-{sagas,streams,triggers,workers}` → short segment). | `docs/site/reference/index.md` § Page paths |
| 3 | Applying those four aliases gives 35/35 effective publish members a reference page at the baseline. | `auditPublishSet(Deno.cwd())` plus existence check; result `effective=35 present=35 missing=[]` |
| 4 | `docs-reference` is still inside `auditFirstPublishPackages`; `collectPublishReadiness` invokes that audit only with registry-absent `newPackages`. All effective members being published therefore leaves the check inert. | `.llm/tools/release/publish-readiness.ts:159-204,264-319` |
| 5 | Release readiness is composed and fail-closed. A new whole-publish-set reference check belongs directly after `publish-set`, before registry discovery; first-publish README/tagline/manifest/export checks remain registry-dependent. | `.agents/skills/netscript-release/SKILL.md`; `collectPublishReadiness()` |
| 6 | The existing `firstPublishFixture()` can seed a missing reference page. Tests can reuse it after reference existence is separated from first-publish policy. | `.llm/tools/release/publish-readiness_test.ts:369-415` |
| 7 | The live public command tree already has a recursive, tree-derived catalog: `PublicCliCommandCatalog` walks `getCommands()` and emits paths. No source parser or literal command list is needed. | `packages/cli/src/public/features/agent/mcp/cli-mcp-adapters.ts:7-51` |
| 8 | The live catalog currently has 15 root entries, 91 root-or-immediate-child entries, and 149 recursive entries. The five `ui:*` commands are colon-form root entries, not nested `ui` children. | focused `deno eval --unstable-kv` against `createPublicCommandRegistry()` and `PublicCliCommandCatalog` |
| 9 | A literal full-path search across the exhaustive and curated CLI pages finds 87/91 root-or-immediate-child paths. Four real immediate children (`deploy start`, `deploy stop`, `deploy status`, `deploy uninstall`) have no exact public-doc occurrence. This is a PR-C content finding, not permission for PR-D to write prose. | focused catalog evaluation plus `rg -F` over `docs/site`; see plan dependency D-7 |
| 10 | The command-reference checker is naturally part of `docs:accuracy`, whose implementation and tests already own textual command-policy checks. | `deno.json:82`; `.llm/tools/docs/check-accuracy-and-discoverability.ts` and `_test.ts` |
| 11 | PR-C's short sagas path remains consumed by `docs:accuracy`. Choosing aliases preserves it; moving the IA would widen scope and change published URLs. | `.llm/tools/docs/check-accuracy-and-discoverability.ts`; PR-C drift DR-3 |
| 12 | `publish:dry-run` is a required final gate but may rewrite catalog-backed manifests under #1417. Status must be inspected immediately and incidental manifest/lock churn restored without committing it. | dispatch boundary; `.agents/skills/netscript-tools/SKILL.md` lock hygiene |

## jsr-audit surface scan

- N/A: this slice changes repository release/docs tooling and tests, not a package/plugin export,
  manifest, JSDoc surface, or publish payload.
- Release risk still applies: a false positive in the new reference check blocks canary and stable
  readiness. The plan therefore preserves first-publish semantics and makes the whole-set check a
  separate evidence row.

## Open questions resolved by the plan

- Alias map versus IA move: locked to a four-entry alias map.
- Missing-page unblock path: add the canonical page; a clearly marked stub linked to a tracking
  issue is the bounded release escape hatch, while content/export fidelity remains #1108's gate.
- Command coverage level: root entries plus immediate child commands, derived from the materialized
  public tree, with a census assertion over that exact set. Recursive grandchildren are deferred
  because the reference intentionally documents generated deploy families compactly rather than as
  every cross-product path.
- Four missing deploy lifecycle strings: orchestrator/PR-C follow-up dependency, not prose authored
  by this implementation agent.
