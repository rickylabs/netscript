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

Make every stable/canary preparation regenerate and stage both version-coupled agent-docs corpus
files so a cut commit is fresh for its bumped version.

## Scope

- Add the real `gen:agent-docs-prose` task to the ordered post-bump generator sequence.
- Add prose and provenance outputs to the shared staged generated-output set.
- Add three discriminating tests and record their pre-fix failures.
- Prove the real `release:cut -- 0.0.7 --dry-run` path in a disposable copy.

## Non-Scope

- No freshness-gate weakening, publication, live release cut, release branch, tag, or merge.
- No package/plugin framework changes and no hand-edited corpus.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Run `gen:agent-docs-prose` immediately after the bump, before all existing generators. | The docs render uses bumped manifests; `gen:publish-assets` and the final barrel both consume the freshly generated corpus, so placing it later would leave derived MCP/CLI assets stale. |
| D2 | Give the prepared-release module an explicit corpus-output constant and deduplicate those paths from its inherited publish-output set. | Direct ownership prevents staging drift while preserving one occurrence per file. |
| D3 | Keep the freshness check unchanged and mandatory. | The reported mismatch is genuine content drift. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Generator and staging placement | resolved now | Locked by D1/D2. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Docs build makes the cut materially slower. | Required behavior; exercise the real dry-run path. |
| Generator order leaves the CLI barrel stale. | Run agent-docs generation before the final assets barrel. |
| Rehearsal dirties the live worktree. | Use a disposable copy and version `0.0.7`. |
| Lockfile/generated drift exceeds coordinated version-only scope. | Inspect explicit diff paths and assert both named lockfile stats are empty in this fix branch. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | discriminating red | focused `prepare-release_test.ts` tests before source fix | each new assertion fails |
| 2 | focused | `deno test -A .llm/tools/release/prepare-release_test.ts` | pass |
| 3 | required quality | `rtk proxy deno task check`, `test`, `lint`, `fmt:check` | pass |
| 4 | freshness | `deno task check:agent-docs-prose` twice | pass twice |
| 5 | decisive rehearsal | disposable `deno task release:cut -- 0.0.7 --dry-run` plus freshness check | pass; corpus fresh at 0.0.7 |

## Deferred Scope

None.
