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
| 2026-09-01 | 2 | GREEN | Block-local binding namespace implemented; final wrappers pass. |
| 2026-09-01 | 2 | slice review | Native Claude Fable 5 low session `3ae23fa3-f6fd-4d57-a7fa-11b1a5151c88` returned PASS after static review of the full uncommitted diff. |
| 2026-09-01 | 2 | IMPL-EVAL | Native Claude Fable 5 medium session `230754ce-4127-481d-9dc6-b728a1e95b0a` returned PASS at pushed head `09e7b24b5fd2d4c2b24d018be81e93bc295afa89`. |

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

RED SHA: `ad53835ee0b10d23274ae687ffbbc03cd39357a5`.
GREEN SHA: `38dab6c7932a76b83822902688e61e26dab4ed1c`.

### Final Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Gates tests | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/e2e/tests/application/gates` | PASS (exit 0) | passed 120, failed 0, ignored 0. |
| Scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli/e2e --ext ts` | PASS (exit 0) | 190 files, 2 batches, 0 diagnostics. |
| Scoped format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli/e2e --ext ts` | PASS (exit 0) | 190 files, 0 findings. An earlier pre-format run exited 1 on the touched test import; the owned files were formatted and the final wrapper passed. |
| Focused lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli/e2e/src/application/gates/scaffold/runtime --root packages/cli/e2e/tests/application/gates --ext ts` | PASS (exit 0) | 36 files, 0 findings. Root E2E lint not run; the brief identifies its detached-fixture refusal baseline and requires focused lint. |
| Full `e2e:cli` | prohibited | NOT RUN | No runtime lease; explicitly excluded by the leaf brief. |

### Slice Review

- Route: `review_codex` — native Claude Fable 5, effort low (opposite-family review of Sol-medium implementation).
- Session: `3ae23fa3-f6fd-4d57-a7fa-11b1a5151c88`.
- Verdict: PASS. Reviewer could read the complete diff but its allowlisted Bash re-run requests were
  denied; it relied on the structured wrapper evidence above for dynamic gates and performed the
  required substantive static review independently.

### Hygiene

- Ceiling respected.
- `generate-register-apps.ts` unchanged.
- `listener-unreachable-fixture.ts` and `REPORT_DEADLINE_MS` unchanged.
- `deno.lock` unchanged.

### IMPL-EVAL

- Verdict: PASS.
- Route: `formal_impl_evaluation` — native Claude Fable 5, effort medium.
- Session: `230754ce-4127-481d-9dc6-b728a1e95b0a`.
- Evaluated head: `09e7b24b5fd2d4c2b24d018be81e93bc295afa89`.
- Independent evidence: reproduced RED in a disposable worktree; mutation-tested a partial rename
  to an expected `TS2552`; reran tests/check/fmt/focused-lint at exits 0; verified ceiling and
  unchanged lock hash.
- Non-blocking handoff: hosted two-tier runtime acceptance and issue/PR acceptance mirroring remain
  supervisor-owned. The PR stays draft with DoD unticked.

## Handoff Notes

- Evaluator should inspect the realistic one-app generator input, the identifier-boundary rewrite,
  and the emitted-module compile helper first.
