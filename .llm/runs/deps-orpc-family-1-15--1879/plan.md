# Plan: move the complete oRPC v1 family to stable 1.15.0

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `deps-orpc-family-1-15--1879` |
| Branch | `deps/orpc-family-1-15` |
| Phase | `plan` |
| Target | oRPC dependency declarations, upstream fixture pins, scaffold catalog, and `deno.lock` |
| Archetype | N/A — dependency maintenance only |
| Scope overlays | none |

## Goal

Resolve the complete `@orpc/*` v1 family at stable `1.15.0`, with exactly one resolved
`@orpc/shared` copy.

## Scope

- Update every owned `@orpc/*` manifest range to `^1.15.0`.
- Update the two exact upstream-tracking SDK fixture imports to `1.15.0`.
- Absorb only direct stale oRPC dependency-catalog fallout in the scaffold catalog.
- Regenerate `deno.lock` without deleting it or reloading caches.
- Integrate then-current `main` once at final freeze and regenerate/re-capture lock proofs there.

## Non-Scope

- No behavioral source changes, transport-policy work (#1351), oRPC v2 adoption, Zod
  deduplication (#1320), or removal of the `Symbol.hasInstance` workaround.
- Do not edit any `@netscript/plugin-streams-core` key owned by #1876.

## Hidden Scope

- Member manifests beyond the six named minimum locations, including fixtures and benchmark/logger
  packages, must be enumerated and kept compatible with the single-copy lock.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Use `deps:latest` as stable authority. | Repo toolchain contract and issue requirement. |
| D2 | Move only oRPC v1 ranges to `^1.15.0`. | Prevents v2 adoption and preserves declared semver policy. |
| D3 | Preserve #1876-owned streams-core keys untouched. | Corrected key-level coordinator boundary. |
| D4 | Preserve `Symbol.hasInstance`. | Removal requires a separate follow-up and evidence. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Target version and range | resolved | Stable authority says `1.15.0`; use `^1.15.0`. |
| Final integration timing | resolved | Exactly once, after local gates, before final proofs. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Mixed oRPC versions remain | Enumerate exact lock package keys and assert one version per name. |
| Shared lock conflicts with #1876 | One final integration from then-current `main`, then regenerate. |
| False-green shell pipeline | Capture every required command with `out=$(cmd 2>&1); rc=$?`. |
| Scope drift into source | Verify changed paths before commit. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | stable authority | `deno task deps:latest --filter '@orpc/*'` | exit 0, stable `1.15.0` |
| 2 | graph before/after | `deno why @orpc/shared` | two copies before, one after |
| 3 | frozen install | `deno ci` | exit 0 without lock mutation |
| 4 | no mixed versions | lock-key version audit | one version per `@orpc/*` name |
| 5 | exact lock delta | anchored `rg` over `deno.lock` package keys | exact before/after lines |
| 6 | root gates | `deno task check`, `test`, `publish:dry-run`, `arch:check` | exits 0 |

## Drift Watch

- Final `main` integration content, especially #1876 lock/manifests.
- Any package not resolving to exactly `1.15.0` after regeneration.
