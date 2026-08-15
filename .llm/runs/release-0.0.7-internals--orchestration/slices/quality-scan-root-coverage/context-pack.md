# Context Pack: quality-scan-root-coverage

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `release-0.0.7-internals--orchestration/slices/quality-scan-root-coverage` |
| Branch | `fix/quality-scan-root-coverage` |
| Current phase | `impl` — slice 2 awaiting Tier-A |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `service`, `docs` |
| Draft PR | `#1656` |
| Thread | `01a003d2-61ee-7ec0-8c74-075b3d631168` |

## Current state

PLAN-EVAL cycle 1 passed at `3b95a004fe8bc5c022c7a2601fafef9a1216be68`. Slice 1 was signed off
by the topic supervisor at `a258bcc8c6365e12ee33b7e6a4657f52140f6308`. Slice 2 now binds the
checker before both scanners, broadens `quality:scan` to `packages`, and has durable RED/GREEN
forwarding plus all four planned S2 gate receipts. Work stops for Tier-A before S3.

## Completed

- Preserved a reachable RED configuration commit `98360da7b`: the checker executes under a real
  changed-file task invocation and rejects the 29 configured-root gaps before scanner execution.
- Landed the green S2 binding at `15d894740`: both scan tasks invoke the checker first and
  `quality:scan` uses `packages`, `plugins`, and `docs/site`.
- Preserved `--max-allow 7`, all prior roots, and the scanner permissions
  `--allow-net=api.github.com --allow-env=GITHUB_TOKEN,GH_TOKEN` byte-for-byte.
- Rebound the live integration test to zero gaps/`ok:true`; moved structured CLI failure to an
  intentionally incomplete temporary repository fixture.
- Proved real forwarding: appended changed-file args reach the scanner, whose output reports
  `mode:"changed-files"` and the exact single traversed path, after the checker reports green.

## Current coverage facts

- Census: 37 workspace members, 37 inside the named boundary, 35 publishable.
- Named non-publishable exclusions: `packages/bench`, `packages/cli/e2e`.
- `quality:scan`: configured roots `docs/site`, `packages`, `plugins`; zero uncovered.
- `quality:scan:repo`: configured roots `.llm/tools/fitness`, `.llm/tools/quality`, `docs/site`,
  `packages`, `plugins`; zero uncovered.
- Doctrine: 36 roots with all 35 publishable members covered.
- Repository scans: zero findings, allowance count 7, no allowance failures.

## Exact edit surface status

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/tools/quality/check-root-coverage.ts` | S1 complete; unchanged in S2 | Fail-closed coverage report. |
| `.llm/tools/quality/check-root-coverage_test.ts` | S2 rebound | Green live binding plus permanent fixture-backed CLI failure. |
| `deno.json` | S2 implemented | Checker-first task chains and broad package root. |

Everything else in the frozen outer bound remains deliberately untouched.

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Plan-Gate | PASS cycle 1 | `plan-eval.md`, evaluator commit `3b95a004f` |
| S1 | Tier-A signed off | supervisor commit `a258bcc8c` |
| S2 forwarding | RED 1; GREEN 0 | `receipts/slice-2/{red-forwarding,forwarding}.json` |
| S2 focused test | PASS 0, 9/9 | `receipts/slice-2/test.json` |
| S2 proving gates | all PASS 0 | `receipts/slice-2/{quality-scan,quality-scan-repo,arch-check,quality-gate}.json` |
| Publish/JSR | Empty touched-member denominator | No publishable member changed; final dry run remains S3 |
| S3 frozen final gates | NOT FIRED | Awaiting S2 Tier-A |

## Next steps

1. Topic supervisor performs Tier-A review of S2 and its receipts.
2. Only after a fresh resume, run the frozen S3 final gate set and handoff checks.
3. Stop before coordinator-granted formal IMPL-EVAL.

## Drift and debt

- Drift: launcher pre-seed, historical doctrine omission already repaired, evaluator route failure
  and amendment, plus the accepted report-field naming drift are recorded in `drift.md`.
- The supervisor corrected an over-constrained S2 dispatch; the implemented test rebinding was
  already inside the approved plan and therefore is not scope drift.
- Debt: none created, closed, or modified.

## S2 commits

- `98360da7b` — checker-first RED task wiring.
- `15d894740` — broad-root binding, live test rebinding, fixture-backed CLI failure, RED receipt.
- Final S2 evidence/run-artifact commit follows.
