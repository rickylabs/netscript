# Context Pack: coordinated bump test resilience

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1629-cut-version-derived-tests--w7` |
| Branch | `fix/1629-cut-version-derived-tests` |
| Current phase | `draft handoff` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` |

## Current State

Version-bearing diagnostic assertions derive from `NETSCRIPT_RELEASE_VERSION`. Cut-local workspace
mapping derives all first-party export aliases from manifests, carries root catalog/imports, and
fails on missing targets. Final gates are green, including a fresh disposable 0.0.7 release-cut
dry-run and full 3386-test suite with zero failures.

## Completed

- Harness/CLI/release/tools/PR/RTK/doctrine/JSR instructions loaded.
- Issue #1629 and requested baseline verified.
- Research, plan, and design recorded; PLAN-EVAL justified N/A.
- Pre-fix arbitrary-bump failures recorded and version assertions corrected.
- All cut-local plugin install fixtures use the shared manifest-derived workspace mapper.
- Requested gates and the final disposable 0.0.7 proof passed.

## In Progress

- Final evidence commit, PR body, and acceptance mirror validation.

## Next Steps

1. Commit and push final evidence.
2. Update the draft PR body and validate acceptance mappings.
3. Stop without changing draft state or labels.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Tree-derived expectations | plan D1 | No duplicate release constant. |
| Test-scoped local first-party resolution | plan D2 | Published behavior remains strict. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-1629-cut-version-derived-tests--w7/` | modified | Harness evidence and handoff artifacts. |
| `packages/cli/**/_test.ts` | modified | Active-version-derived closure expectations and cut-local install probes. |
| `packages/cli/tests/support/local-workspace-imports.ts` | new | Test-only manifest-derived local import mapper with fail-closed target validation. |
| `plugins/ai/tests/adapter/no-samples-install_test.ts` | modified | Applies local imports before install-time project config loading. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | check/lint/fmt and focused CLI check |
| Fitness | PASS | `quality:gate` exit 0 |
| Runtime | N/A | no runtime command/service behavior change |
| Consumer | PASS | targeted installs + disposable 0.0.7 full test |

## Open Questions

- None.

## Drift and Debt

- Drift: none.
- Debt: none introduced or deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments.
