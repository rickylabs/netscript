# Plan: release cut regenerates agent-docs prose

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-cut-regenerates-agent-docs-prose--w6` |
| Branch | `fix/cut-regenerates-agent-docs-prose` |
| Phase | `plan` |
| Target | release tooling |
| Archetype | N/A — repo-internal release preparation, not package/plugin architecture |
| Scope overlays | none |

## Goal

Make every stable/canary preparation regenerate the version-coupled agent-docs corpus, reject a
semantically stale result locally, and let a genuine version-derived rebuild inherit parent canary
evidence without authorizing content drift.

## Scope

- Add the real `gen:agent-docs-prose` task to the ordered post-bump generator sequence.
- Prove the already-existing staging coverage for prose and provenance without adding entries.
- Add discriminating writer-order, real-render differential, semantic freshness, and strict
  inheritance tests and record their pre-fix failures.
- Accept rebuilt provenance metadata only when canonical corpus identity is valid and HEAD
  reproduces from the rendered site; refuse actual content drift.
- Prove the real `release:cut -- 0.0.7 --dry-run` path in a disposable copy.

## Non-Scope

- No freshness-gate weakening, publication, live release cut, release branch, tag, or merge.
- No package/plugin framework changes and no hand-edited corpus.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Run `gen:agent-docs-prose` immediately after the bump, before all existing generators. | The docs render uses bumped manifests; `gen:publish-assets` and the final barrel both consume the freshly generated corpus, so placing it later would leave derived MCP/CLI assets stale. |
| D2 | Keep staging ownership in `PUBLISH_ASSET_OUTPUTS`; assert `collectPreparedReleaseFiles` contains both corpus paths exactly once. | The paths already belong to that writer and duplicating/reclassifying them obscures the actual contract. |
| D3 | Keep the freshness check unchanged and mandatory. | The reported mismatch is genuine content drift. |
| D4 | Run `check:agent-docs-prose` after all post-bump writers and include the same semantic check in stable-publish writer reproduction. | The cut must fail before commit when rendered content and checked-in corpus diverge, and inheritance must prove the committed HEAD derives from its site. |
| D5 | Allow provenance `sourceCommit` and `extractionTimestamp` to change, but require each revision's `version`, canonical uncompressed SHA-256, file list, and uncompressed byte count to match its corpus; semantic HEAD reproduction is the final content guard. | Metadata volatility is expected from a rebuild; canonical identity plus site reproduction rejects self-consistent injected drift. |
| D6 | Remove `rebaseAgentDocsProse` from publish-asset generation call sites. | Literal rewriting demonstrably cannot reproduce the rendered corpus. Release preparation owns the real render; downstream generators consume it. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Generator and staging placement | resolved now | Locked by D1/D2. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Docs build makes the cut materially slower. | Required behavior; exercise the real dry-run path. |
| Generator order leaves the CLI barrel stale. | Run agent-docs generation before the final assets barrel. |
| Relaxed provenance metadata admits unverified content. | Validate canonical identity on both revisions and require semantic HEAD reproduction; test both acceptance and rejection. |
| Rehearsal dirties the live worktree. | Use a disposable copy and version `0.0.7`. |
| Lockfile/generated drift exceeds coordinated version-only scope. | Inspect explicit diff paths and assert both named lockfile stats are empty in this fix branch. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | discriminating red | focused preparation + canary inheritance tests before source fix | writer/check sequence and genuine-render inheritance fail |
| 2 | focused | release preparation, publish-asset, docs-bundle, and GitHub-release tests | pass, including accepted rebuild + refused drift |
| 3 | required quality | `rtk proxy deno task check`, `test`, `lint`, `fmt:check` | pass |
| 4 | freshness | `deno task check:agent-docs-prose` twice | pass twice |
| 5 | decisive rehearsal | disposable `deno task release:cut -- 0.0.7 --dry-run` plus freshness check | pass; corpus fresh at 0.0.7 |
| 6 | inheritance proof | disposable parent→HEAD genuine render and drift companion | genuine render inherits; content drift returns blocked-publication error |

## Deferred Scope

None.
