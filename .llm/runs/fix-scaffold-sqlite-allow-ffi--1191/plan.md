# Plan: generated SQLite/libsql service `--allow-ffi`

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-scaffold-sqlite-allow-ffi--1191` |
| Branch | `fix/scaffold-sqlite-allow-ffi` |
| Phase | `plan` |
| Target | `packages/cli` scaffold service-command emission |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `service` (generated service + Aspire runtime proof) |

## Archetype

Archetype 6 applies because `@netscript/cli` emits user-run scaffold and AppHost command flows. The
slice changes an existing command builder and its semantic generated-output test; it introduces no
new port, abstraction, command, export, or folder.

## Current Doctrine Verdict

`@netscript/cli`: **Restructure** — historical package-wide debt. This narrow correction stays in
the existing vertical generator feature and does not deepen the verdict or create new debt.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A2 | The generated permission contract must be explicit and minimal. |
| A8 | The correction stays at the existing service-command emission seam. |
| A11 | SQLite/libsql is the named permission-varying engine axis. |
| A14 | A semantic generated-output RED/GREEN test and real scaffold evidence lock behavior. |

## Goal

Generated SQLite/libsql-backed services start with `--allow-ffi`, while every other database
template retains its existing permission set, with real RED/GREEN Aspire evidence and the unblocked
P2 DB measurement recorded.

## Scope

- Capture the unmodified generator's real SQLite scaffold exit-1/unhealthy RED.
- Add a generated-output regression test for SQLite and a cross-engine permission audit.
- Change the existing service command builder to append `--allow-ffi` only for SQLite.
- Re-run the same scaffold to Running + Healthy with populated `healthReports`, capturing OTEL/live
  artefacts where claims are made.
- Append `P2-db.json` and comment the S4/S6 contract impact on epic #1126.
- Maintain harness, PR, acceptance-evidence, and resource-hygiene records.

## Non-Scope

- No user-edit workaround, libsql replacement, database adapter redesign, or S4/S6 code change.
- No global addition of `--allow-ffi` to non-SQLite resources.
- No package export/dependency/version changes and no `deno.lock` churn.
- No concurrent `scaffold.runtime` run; live verification queues behind any active AppHost.

## Hidden Scope

- Generated templates are embedded, so any source-template change would require freshness
  regeneration; the selected command-builder-only fix avoids unrelated embedded asset churn.
- A live-health claim requires exact AppHost identity, state, health status, populated health
  reports, console/OTEL evidence, and exact process-tree stop.
- The P2 script consumes a captured live OpenAPI JSON path and produces the evidence artefact; a
  zero exit code alone is not proof.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Append FFI in generated service argv only when `config.Databases[config.PrimaryDatabase].Engine === 'Sqlite'`. | This is the actual libsql consumer and preserves least privilege. |
| D2 | Keep defaults and per-entry permission precedence intact, de-duplicating `--allow-ffi`. | Explicit user permissions must not lose required runtime capability or gain duplicates. |
| D3 | Test semantic argv output for SQLite and every other supported DB axis. | Proves both the fix and the unaffected audit in one stable seam. |
| D4 | Use one real scaffold for RED then regenerate its AppHost after the fix for GREEN. | Holds project inputs constant while proving generator causality. |
| D5 | Treat P2 as evidence/impact assessment only. | Epic #1126 owns S4/S6 re-scope decisions. |
| D6 | PLAN-EVAL gate is `composed per milestone-run.md (orchestrator waiver)`. | Explicit owner and milestone-run evaluator direction. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Which resource classes gain FFI? | resolved now | Services only; this issue's observed libsql consumer. |
| Whether other engines need FFI | resolved now | No; generated-output audit proves absence for container DBs. |
| S4/S6 contract re-scope | safe to defer | Orchestrator decision after the required epic impact comment. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| AppHost collision with #1184 | Check `aspire ps`; queue until empty; never overlap. |
| False-green health | Require Running, Healthy, non-empty `healthReports`, endpoint/live artefact, and logs/OTEL. |
| Broad permission regression | Cross-engine semantic test and emitted-command audit. |
| Resource leak | Exact `appHostPath` stop, process-tree verification, final `agentic:leak-check`. |
| Lock/generated churn | Inspect raw git status/diff after every gate; reject unrelated `deno.lock` changes. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-18 | risk | Assert semantic permission membership/non-membership, not a giant snapshot. |
| AP-19 | existing defect | Make emitted runtime permissions match actual libsql requirements. |
| AP-25 | avoided | No new side-effect site; generator remains pure string emission. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1/F-3/F-5/F-9/F-10/F-11/F-12/F-15–F-19 | yes | `quality:gate`, scoped wrappers, manual diff review. |
| F-6/F-7 | yes | CLI JSR audit, doc-lint, publish dry-run. |
| F-CLI-1…31 | yes | Existing `arch:check` plus manual no-new-structure review; unchanged gates noted. |
| Runtime/Aspire | yes | Serialized real SQLite scaffold RED/GREEN and exact health artefacts. |
| Consumer/generated output | yes | Focused generator test and real scaffold command inspection. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| Existing `packages/cli` Restructure verdict | none | Narrow fix does not deepen it. |
| New debt | none | No violation is deferred. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | RED runtime | Real local-source SQLite scaffold + isolated Aspire start/describe/logs | Service Finished/Unhealthy, exit 1, missing FFI captured. |
| 2 | RED test | Focused generated-service test before source fix | New SQLite assertion fails. |
| 3 | Focused GREEN | Focused generator tests | SQLite contains one FFI; other engines contain none. |
| 4 | Static | Scoped check/lint/fmt wrappers on owned CLI paths | PASS with selected-file evidence. |
| 5 | Fitness | `deno task quality:gate` | PASS; no new ignores/casts. |
| 6 | Runtime GREEN | Same scaffold regenerated + Aspire describe/logs/OTEL | Running, Healthy, populated health reports. |
| 7 | P2 | `p2-measure-live-spec.ts <live-spec> .../P2-db.json` | Evidence JSON exists and is inspected. |
| 8 | Publishability | CLI doc-lint + publish dry-run | PASS or only pre-declared unrelated baseline debt. |
| 9 | Hygiene | `agentic:leak-check` with owned root | No owned leaks; foreign entries untouched. |

## Drift Watch

- Any need to change global defaults, app/plugin/background permission output, public contracts, or
  the P2 measurement code is significant drift and requires re-scope.

