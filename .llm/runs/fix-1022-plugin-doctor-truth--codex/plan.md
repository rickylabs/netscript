# Plan: plugin doctor runtime truth

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1022-plugin-doctor-truth--codex` |
| Branch | `fix/1022-plugin-doctor-truth` |
| Phase | `plan-eval` |
| Target | `packages/cli`, `packages/plugin`, workers and sagas plugins |
| Archetype | `6 — CLI/Tooling` and `5 — Plugin Package` |
| Scope overlays | none |

## Goal and locked decisions

- Throw a kernel `CliExitError` after rendering whenever any plugin report is `error`.
- Delete the tautological runtime-config check.
- Extend the manifest with a module-valued doctor contribution, load it relative to the plugin root,
  and map its existing `DoctorReport` checks into host reports. Domain checks stay plugin-owned.
- Workers and sagas check generated registry presence, non-emptiness, and declared-item coverage,
  with one-line remediation commands.
- Convert visible `ZodError` issues into named config checks; do not fabricate fields if the child
  loader has flattened the error.
- Defer live AppHost/resource checks (acceptance boxes 4 and 6).

## Open-decision sweep

| Decision | Status | Notes |
| --- | --- | --- |
| AppHost probing | safe to defer | Explicit owner non-scope; needs a larger live-runtime slice. |
| Top-level doctor command | safe to defer | Issue retains `plugin doctor`. |

## Commit slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Manifest doctor contribution and host bridge | scoped check + plugin/CLI tests | plugin config/builder/registry/use case |
| 2 | Workers/sagas registry truth | plugin tests | two plugin doctor modules/contracts |
| 3 | Exit propagation and regression fixture | CLI command tests | doctor command/tests |
| 4 | Scoped validation and harness evidence | requested commands | run artifacts |

## Risk register

| Risk | Mitigation |
| --- | --- |
| Dynamic import path differs for copied plugins | Carry module path plus `rootDir`; resolve with file URLs. |
| Plugin checks duplicate registry rules | Reuse plugin-owned constants/readers and runtime loader shape. |
| Config error is flattened by child process | Only expand an actual `ZodError`; otherwise report honest generic failure. |
| New public surface harms JSR | Explicit return types, JSDoc examples, export through existing manifest types. |

## Gates and deferred scope

- Run the four requested scoped check wrappers, touched-root lint/fmt, and targeted doctor tests.
- Run framework code-quality/doctrine gates if compatible with the user's exact scoped gate limit.
- Do not run scaffold runtime E2E; no scaffold output is planned.
- Deferred: triggers, streams, AppHost existence/health differentiation, queue/backend reachability.

## IMPL-EVAL round 3 correction plan (2026-08-01)

1. Restore metadata-only plugin discovery so doctor never imports project jobs or sagas.
2. Persist a static doctor module specifier during plugin-owned scaffold and import only that module.
3. Convert malformed metadata and doctor import failures into plugin-local reports; keep siblings running.
4. Prove isolation with a healthy-sibling regression and run the scaffold.plugins lane against local sources.
5. Preserve a truthful non-zero e2e result when #1010 emits zero registries; do not weaken doctor.

The owner waived a separate Plan-Gate evaluator for this round. No evaluator verdict was created or
claimed by the implementation session.
