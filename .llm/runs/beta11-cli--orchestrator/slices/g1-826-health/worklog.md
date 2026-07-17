# Worklog: issue #826 aggregate health

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `beta11-cli--orchestrator/slices/g1-826-health` |
| Branch | `fix/826-aggregate-health` |
| Archetype | `4 - Public DSL / Builder` |
| Scope overlays | `service` |

## Design

### Public Surface

- `HealthCheck` — gains one optional aggregate-participation property; existing literals remain
  valid.
- `createHealthHandler` — unchanged signature; aggregate behavior ignores explicitly unconfigured
  checks.
- `healthChecks.database|kv|service|custom` — unchanged factory signatures and default inclusion.

### Domain Vocabulary

- configured check — a declared `HealthCheck` that belongs to the running app's active composition.
- excluded check — a declared check explicitly marked unconfigured; it is not invoked or reduced.
- aggregate health — status and detail list computed only from configured checks.

### Ports

- None added. Existing health-check closures are the dependency seams; unit tests provide inert
  fakes/sentinels.

### Constants

- No new finite vocabulary is required. Existing `HEALTH_STATUS` remains authoritative.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 0 | Research, plan, and Design checkpoint | supervisor PLAN-EVAL | nested run-dir artifacts |
| 1 | Aggregate predicate contract plus per-adapter-class regression coverage and consumer compile proof | focused service tests + scoped service wrappers | `packages/service/src/primitives/health.ts`, service tests, run artifacts |
| 2 | `scaffold.runtime` health-path assertion | narrow E2E harness test/source gate; full suite deferred to supervisor | `.llm/tools/e2e/scaffold-e2e-test.ts`, owning test(s), run artifacts |

### Deferred Scope

- Health response schema versioning — no response shape is added.
- Adapter auto-discovery/config inference — configuration remains composition-owned.
- Full `scaffold.runtime` execution — supervisor merge-readiness call.

### Contributor Path

Add a dependency health adapter by returning the existing `HealthCheck` shape. Hosts that declare
optional adapters mark inactive instances unconfigured; `createHealthHandler` automatically omits
them from execution, status, and details.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-07-17 | 0 | research | Re-baselined branch and issue; located aggregate and four built-in adapter classes. |
| 2026-07-17 | 0 | plan | Contract-first plan recorded before package edits. Awaiting supervisor PLAN-EVAL. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Archetype 4 + service overlay | Matches doctrine verdict and live HTTP consumer impact. | doctrine 10; archetype profile |
| No evaluator dispatch from this lane | Explicit implementation-agent brief. | owner/supervisor instruction |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| None | minor | no |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Plan artifact review | pending supervisor PLAN-EVAL | NOT_RUN | Implementation hard stop. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| F-1..F-19 applicable set | NOT_RUN | pending implementation | No package edit yet. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| focused service health | NOT_RUN | pending implementation | |
| full `scaffold.runtime` | NOT_RUN | supervisor-owned | Expensive merge-readiness call. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| existing `@netscript/service` consumer literal | NOT_RUN | pending implementation | |

## Handoff Notes

- PLAN-EVAL should verify the locked `configured` name and explicit-false semantics.
- First implementation review should verify filtering occurs before check invocation.
