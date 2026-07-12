# Plan: remove residual slow-type publish carve-outs

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `refactor-303-slow-types-elimination--codex` |
| Branch | `refactor/303-slow-types-elimination` |
| Phase | `plan` |
| Target | `packages/service`, `packages/plugin-triggers-core`, `packages/plugin`, `packages/contracts` |
| Archetype | 4 — Public DSL / Builder, with Archetype 3 runtime concerns in triggers core |
| Scope overlays | service (static-only; no runtime behavior changes) |

## Archetype and doctrine verdict

Doctrine explicitly assigns `service`, `contracts`, and `plugin` to Archetype 4. Trigger core owns
runtime behavior and a public trigger DSL, so Archetype 3 runtime gates inform it; this slice changes
neither runtime nor DSL. Current verdicts are Service: Refactor, Contracts: Keep, Plugin: Restructure;
none of those broader actions are expanded here.

## Goal and scope

- Remove `--allow-slow-types` from exactly the four package-local publish tasks.
- Remove the independently discovered workspace-wide waiver from the shared publish runner so the
  root acceptance task and real publish/preflight paths enforce the same bar.
- Close the four matching T4 debt entries with dated, command-backed evidence.
- Preserve every export and runtime behavior unchanged.

## Non-scope

- No source annotation: Deno 2.9 emits no annotation diagnostics.
- No public-surface redesign, consolidation work, dynamic-import remediation, release cut, PR, or
  issue closure.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| L1 | Make only config, release-argument, debt-registry, and run-artifact edits. | A1/A2 forbid unnecessary public-surface churn; current no-flag analysis is green. |
| L2 | Retain historical debt entries and mark them closed. | The registry is an auditable history; the stated F-6 close gate is now met. |
| L3 | Treat plugin dynamic-import warnings as out of scope. | They are pre-existing portability warnings, not slow-type diagnostics, and do not fail this acceptance gate. |

## Open-decision sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Whether annotations are required | resolved now | No: authoritative diagnostics are clean. |
| Whether to redesign a public surface | safe to defer | No diagnostic or acceptance need exists. |
| Whether the global release waiver may remain | resolved now | No: root acceptance explicitly requires no allowances. |

## Risk register

| Risk | Mitigation |
| --- | --- |
| A task passes only because a stale process/result was observed. | Re-run every package after edits and record exit status. |
| Config-only edits conceal test/type regressions. | Run scoped check/lint/fmt wrappers and all four package test tasks. |
| `deno.lock` changes during validation. | Inspect raw git diff/status and refuse lock churn. |

## Gates and debt

| Gate | Evidence |
| --- | --- |
| F-6 JSR publishability | Four package-local `deno publish --dry-run --allow-dirty` runs, no slow-type allowance |
| F-7 documentation bar | `deno task doc:lint --root <package> --pretty` for all four export maps |
| F-19 scoped source gates | Check, lint, and fmt wrappers over each touched package root |
| Semantic tests | Each package's `deno task test` |
| Lock hygiene | `git diff -- deno.lock` empty and raw `git status --short` reviewed |

Debt action: close the T4 slow-type carve-out entries for all four packages. No new debt.
