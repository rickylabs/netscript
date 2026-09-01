# Worklog: fixture app identifier collision

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-readiness-fixture-app-identifier-collision--1898` |
| Branch | `fix/readiness-fixture-app-identifier-collision` |
| Archetype | `6 — CLI / Tooling` (CLI-owned E2E harness) |
| Scope overlays | `none` |

## Design

### Public Surface

- No published surface changes.
- Harness seam under test: `injectReadinessFixtureApps(source, includeListenerFaultController?)`.

### Domain Vocabulary

- **host app block** — real positional block already present in the generated module.
- **fixture app block** — isolated generated block inserted by the readiness harness.
- **fixture identifier namespace** — prefix disjoint from `app_<n>` and applied to all derived identifiers.

### Ports

- None introduced. The compile assertion invokes the current Deno executable as a test boundary.

### Constants

- Product namespace prefix: `readiness_fixture_` applied before each generated `app_<n>` root.
- Test host resource: `app` with workdir `apps/app`.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | RED: prove realistic generated-host collision and require emitted-module compilation | focused structured test wrapper must fail exactly the new test | test file + run artifacts |
| 2 | GREEN: namespace every identifier in injected fixture blocks | focused gates test suite, scoped check/fmt/lint wrappers | fixture injector + test/run artifacts |

### Deferred Scope

- Hosted full runtime proof — supervisor-owned contended lane; explicitly prohibited here.
- Generator naming changes — #1837 contract and outside the ceiling.

### Contributor Path

Future fixture apps are added to the isolated `generateRegisterApps` input and the fixture name list;
the block-local namespace rewrite and realistic-host compile test apply without host-count changes.

### Archetype-6 checkpoint applicability

The five CLI spine abstracts, vertical feature catalog, registries, ports, command constants, and
composition root are unchanged and therefore N/A for this E2E-harness-only repair. Generated output
and semantic test strategy are the applicable A6 checkpoint fields and are specified above.

## Plan-Gate

`PLAN-EVAL: N/A` — issue #1898 and the leaf brief fully lock the defect, solution boundary, ceiling,
RED/GREEN protocol, semantic acceptance, and exact gates. No architecture, sequencing, or open
trade-off decision remains.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-09-01 | 1 | bootstrap/design | Baseline and issue verified; RED test designed over real generator output. |
| 2026-09-01 | 1 | RED | Wrapper exit 1: passed 4, failed 1, unique failures 1. Duplicate bindings observed: `app_0_workdir`, `app_0`, `app_0_otel`. Product files remained unchanged. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Fixture-specific block namespace | Stable disjointness without host-count coupling | issue #1898 / plan D1 |
| Real emitted-module `deno check` | Detects dangling suffixed references after partial renames | issue acceptance / plan D3 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| None | N/A | N/A |

## Gate Results

### RED

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Focused regression | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/e2e/tests/application/gates/prepare-readiness-fixture_test.ts` | EXPECTED FAIL (exit 1) | passed 4, failed 1, unique failures 1; three duplicate const bindings observed. |

RED SHA: pending commit.
GREEN SHA: pending.

## Handoff Notes

- Evaluator should inspect the realistic one-app generator input, the identifier-boundary rewrite,
  and the emitted-module compile helper first.
