# Plan: coordinated bumps keep CLI tests registry-independent

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1629-cut-version-derived-tests--w7` |
| Branch | `fix/1629-cut-version-derived-tests` |
| Phase | `plan` |
| Target | `packages/cli` tests and test support |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` |

## Archetype

Archetype 6 applies because the affected surface is the published/maintainer CLI's plugin install
and generated-workspace verification flow. The implementation is bounded to semantic tests and
their fixture resolution; it does not change the CLI command vocabulary or public exports.

## Current Doctrine Verdict

`packages/cli` is **Keep**: preserve the Archetype-6 kernel/surface split.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A2 | Published consumers keep exact, registry-backed package semantics. |
| A7 | Reuse Deno workspace/import-map resolution instead of inventing a registry fallback. |
| A14 | Tests and gates must survive the coordinated version transition they protect. |

## Goal

Make coordinated release bumps testable before publication by deriving version expectations from
the active tree and resolving cut-CI first-party imports locally, while retaining published-case
strictness for range pins, split identities, and missing packages.

## Scope

- Add discriminating regression coverage that is red on the baseline.
- Replace only expectations whose corresponding fixture inputs already come from the active tree
  version; preserve fixed historical/mismatch fixture versions.
- Make cut-like real plugin-install/import probes resolve first-party modules from local workspace
  sources in an explicitly test-scoped way.
- Preserve published-consumer strictness and prove it with negative assertions.
- Record the requested full gate and disposable `0.0.7` rehearsal evidence.

## Non-Scope

- #1597 package-backed plugin-doctor behavior and #1625 service-entrypoint doctor paths.
- Agent-docs corpus.
- Publication, tags, a real release cut, or any `0.0.6` release branch.
- Product-level relaxation of missing-package or dependency-closure validation.

## Hidden Scope

- The control-plane module import probe is part of the same registry window as the AI install tests.
- Both public and local contributor AI install fixtures perform real `deno check` resolution.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Derive a diagnostic expectation from `NETSCRIPT_RELEASE_VERSION` only when its corresponding input is already derived from that active version. | It avoids a second source of truth without erasing intentional historical, mismatch, or canary fixture data. |
| D2 | Localize first-party resolution only in cut/test fixtures. | The release tree exists locally before publication; published-consumer behavior must remain registry-strict. |
| D3 | Keep explicit negative tests for range, split, and missing identities. | A green bump alone cannot distinguish a fix from disabled validation. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Fixture helper placement | safe to defer | Choose the narrowest existing test support location after the red tests identify shared callers. |
| Product fallback for unpublished packages | safe to defer | Explicitly rejected for this slice; local cut CI has workspace sources. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Local import mapping hides a genuine missing package. | Build mappings from actual workspace manifests/exports and retain a missing-package negative case. |
| Tests become coupled to this checkout path. | Derive the repository root from `import.meta.url` and write normalized file/relative targets. |
| Release rehearsal mutates the live worktree. | Run `release:cut -- 0.0.7 --dry-run` only in a disposable copy. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-18 | risk | Assert semantic version-bearing diagnostics and resolution outcomes, not giant snapshots. |
| AP-25 | avoid | Keep filesystem/network effects in existing test edges; do not add product-side hidden fallback. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| Static + focused CLI | yes | Requested check/test/lint/fmt and focused CLI wrapper |
| F-1..F-19 / F-CLI-1..31 | yes where applicable | `quality:gate`; no production structure changes; manual unchanged-surface review |
| JSR/release | yes | Disposable `release:cut -- 0.0.7 --dry-run` and full `deno task test` |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `packages/cli` | none | Test correctness fix introduces no new or deepened doctrine debt. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Red discriminators | targeted new/changed tests against baseline | Fail for derived bump, unpublished local resolution, and strictness guard assertions as documented in `evidence.md` |
| 2 | Targeted | affected CLI test files | All pass after implementation |
| 3 | Static | requested check, lint, fmt, focused CLI check | Exit 0 |
| 4 | Full | `deno task test` and `deno task quality:gate` | Exit 0 |
| 5 | Decisive | disposable `release:cut -- 0.0.7 --dry-run`, then full `deno task test` | Exit 0; all formerly failing cases green |

## Risks

- Registry/network variance is removed only for first-party cut fixtures; external dependencies
  remain registry-resolved and therefore still exercise genuine resolution.

## Dependencies

- Deno workspace manifests and existing package export maps are the sole local-resolution authority.

## Drift Watch

- Any required production behavior change, package-doctor edit, or agent-doc change triggers rescope.
