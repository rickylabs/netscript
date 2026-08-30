# Worklog: Aspire 13.5 S5 literal ports

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-aspire-13-5-s5-literal-ports--impl` |
| Branch | `fix/aspire-13-5-s5-literal-ports` |
| Archetype | `5 - Plugin` + `6 - CLI/tooling` |
| Scope overlays | Aspire contribution, scaffold, E2E, JSR |

## Design

### Public Surface

- `SAGAS_API_DEFAULT_PORT` — retained compatibility export, deprecated and removed from runtime use.
- `AUTH_API_DEFAULT_PORT` and `TRIGGERS_API_DEFAULT_PORT` — retained compatibility exports,
  deprecated and restricted to public re-export surfaces.
- `SagaPublisherResult` — unchanged existing union; no-endpoint uses its rejected member.

### Domain Vocabulary

- allocated port — `ctx.port(resource)` value selected without a runtime literal fallback.
- service reference — host-provided URL keyed by a composed Aspire resource.
- host-port pin — explicit configuration that prevents Aspire host-port allocation.

### Ports

- No runtime literal port is introduced. `8092`, `8093`, and `8094` remain only as deprecated
  compatibility data.
- Infrastructure container target ports remain protocol facts; host ports are opt-in.

### Constants

- `SAGAS_API_DEFAULT_PORT = 8092` — compatibility-only; removal planned for 0.0.8.
- `AUTH_API_DEFAULT_PORT = 8094` and `TRIGGERS_API_DEFAULT_PORT = 8093` — compatibility-only;
  removal planned in the same 0.0.8 draft. No workers default-port export exists.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | RED host-port fitness contract | checker test + RED receipt | validation tool/run artifacts |
| 2 | Sagas endpoint discovery | sagas tests + JSR gates | `plugins/sagas` |
| 3 | Contribution resource wiring | contribution tests | four official plugins |
| 4 | Opt-in generated pins | generator tests + fitness gate | CLI generators/config |
| 5 | Describe-derived E2E probes | E2E unit/static gates | CLI E2E scaffold gates |
| 6 | Generated assets and merge evidence | full requested gate set except runtime | generated/run artifacts |
| 7 | Tier-A evidence correction | honest grep + full slice-6 gate set | generator, compatibility constants/tests, run artifacts |

### Deferred Scope

- Health-check registration is S6.
- Resource commands are S8.
- AppHost runtime verdict is CI `scaffold.runtime` after ready; this lane has no runtime lease.
- Deprecated constant removal is 0.0.8 and is drafted for the supervisor.

### Contributor Path

Contributions declare service resources, consume `ctx.port(resource)` only when a numeric target is
required, and expose cross-resource URLs through resource-reference environment sources.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-30 | 1 | RED contract | Extended checker and added exact S5 grep invariant. |
| 2026-08-30 | 1 | push | `e83659d78` pushed with the explicit required refspec; draft PR #1740 opened. |
| 2026-08-30 | 2 | D-14 implementation | Removed sagas runtime fallback; retained four deprecated exports. |
| 2026-08-30 | 2 | push | `24817a404` pushed with JSR and consumer-import evidence. |
| 2026-08-30 | 3 | contribution wiring | Four contributions allocate ports and publish resource references. |
| 2026-08-30 | 3 | push | `aae91586b` pushed with contribution and consumer-stub evidence. |
| 2026-08-30 | 4 | opt-in pins | Plugin manifests/entries and five infrastructure engines default to allocation. |
| 2026-08-30 | 4 | push | `8aee17462` pushed with plugin/infrastructure opt-in evidence. |
| 2026-08-30 | 5 | live probes | Runtime and OTEL gates resolve resource URLs from live Aspire describe output. |
| 2026-08-30 | 5 | push | `732337435` pushed with describe-derived probe evidence. |
| 2026-08-30 | 6 | generated assets | Preserved embedded bytes while removing forbidden generated-source spellings. |
| 2026-08-30 | 6 | final gates | Static, doctrine, JSR, plugin, and `scaffold.plugins` gates are green/baseline. |
| 2026-08-30 | 7 | Tier-A fixes | Reverted grep-driven source respelling; aligned generated exclusions; deprecated auth/triggers constants. |
| 2026-08-30 | 7 | full gates | Static, asset, doctrine, plugin, JSR, and `scaffold.plugins` gates are green/baseline. |
| 2026-08-30 | 7 | handoff | Explicit branch refspec and PR evidence comment carry the immutable slice SHA. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Return existing rejected result on missing endpoint | D-14 is ratified and core type is already sufficient | parent plan D-14 |
| Treat database/cache host pins as explicit-only | consecutive isolated S2 runs reused PostgreSQL 14428 | S2 V3 receipts |
| Do not start Aspire locally | implementation lane has no runtime lease | owner boundary |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Parent plan's D-16 label differs from owner shorthand for infrastructure ports | minor | yes |
| Generated barrels contain non-runtime embedded prose and follow the checker's generated-source exclusion | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| S5 literal grep | exact issue command | FAIL / raw exit `1` | RED-first test lists shipped literals. |
| corrected S5 literal grep | excludes `*.generated.ts` | PASS / exit `0` | Six compatibility-contract hits only. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| host-port allocation | FAIL (expected RED) | `receipts/01-aspire-host-ports-red.raw.txt` | Names all current contribution fallbacks/URLs. |
| contribution allocation | PASS / exit `0` | `receipts/03-contributions.txt` | 957 files; no contribution fallback/URL findings. |
| generated host-port opt-in | PASS / exit `0` | `receipts/04-opt-in-host-ports.txt` | Plugin and infrastructure cases covered. |
| describe-derived probes | PASS / exit `0` | `receipts/05-describe-derived-probes.txt` | 57 tests plus 9 nested smoke steps passed. |
| final host-port/static gates | PASS / exit `0` | `receipts/06-final-gates.txt` | Exact grep has only the two D-14 compatibility assertions. |
| Tier-A correction gates | PASS / exit `0` | `receipts/07-tier-a-fixes.txt` | Honest generated exclusion and six explicit compatibility paths. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `scaffold.runtime` | NOT_RUN | CI after ready | No runtime lease in this lane. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| sagas JSR dry-run | PASS / exit `0` | `receipts/02-sagas-jsr-audit.txt` | Three baseline dynamic-import warnings only. |
| sagas doc lint | BASELINE / exit `1` | `receipts/02-sagas-jsr-audit.txt` | Only pre-existing #1708 private-type-ref. |
| four-entry consumer import | PASS / exit `0` | `receipts/02-sagas-jsr-audit.txt` | Deprecated export present at all locked paths. |
| sagas unit suite | PASS / exit `0` | `receipts/02-sagas-jsr-audit.txt` | 33 passed, 0 failed. |
| all official plugin suites | PASS / exit `0` | `receipts/06-final-gates.txt` | 204 passed, 13 intentionally ignored, 0 failed. |
| auth/triggers deprecation contracts | PASS / exit `0` | `receipts/07-tier-a-fixes.txt` | Values, retained entrypoints, and surface-only reference censuses proven. |
| affected plugin JSR dry-runs | PASS / exit `0` | `receipts/07-tier-a-fixes.txt` | Auth/sagas/triggers green with baseline dynamic-import warnings only. |
| affected plugin doc surfaces | BASELINE | `receipts/07-tier-a-fixes.txt` | No missing JSDoc; existing private-type-ref diagnostics only. |
| all official plugin suites (S7) | PASS / exit `0` | `receipts/07-tier-a-fixes.txt` | 215 passed, 13 intentionally ignored, 0 failed. |

### Scaffold Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `scaffold.plugins` | PASS / exit `0` | `receipts/06-final-gates.txt` | 17 passed, 0 failed, 0 skipped. |
| `scaffold.plugins` (S7) | PASS / exit `0` | `receipts/07-tier-a-fixes.txt` | 17 passed, 0 failed, 0 skipped. |

## Handoff Notes

- All seven implementation slices are complete. The supervisor owns the slice-7 rereview, IMPL-EVAL, ready-state transition,
  and CI `scaffold.runtime`; this lane does not self-certify.
