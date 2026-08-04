## Summary

Adds an app-wide `host.shutdown()` composition root over the existing service, worker, queue, and
database drain paths. One deterministic order and one deadline now govern the whole in-process app.

## Scope

- Archetype / area: runtime behavior in `@netscript/service`, service + docs overlays
- Closes #1231

## Slices

- [x] S0 research and locked design
- [x] S1 host contract, one-budget orchestration, and deterministic tests
- [x] S2 caveat/debt burn-down and final evidence

## Validation

- Focused runtime-host tests — 3 passed, 0 failed
- Scoped check/lint/fmt — 45 files, zero findings
- `packages/service` tests — 90 passed, 0 failed
- JSR/doc/publish gates — audit PASS, 3-entrypoint doc lint clean, publish dry-run successful
- Archetype quality gates — quality gate exit 0; focused doctrine zero failures

## Harness

- Run dir: `.llm/runs/feat-runtime-shutdown-orchestrator--1231/`
- Phase: formal IMPL-EVAL PASS; D6 `COMPOSED_WAIVER` for local PLAN-EVAL
- Separate-session evaluator: Claude Code + OpenRouter `qwen/qwen3.7-max` · high

## Drift / Debt

- D6 waiver recorded. Runtime shutdown debt is closed and removed; no new debt accepted.

## Caveat re-judgment

- **Removed as invalidated:** the “No single app-wide shutdown orchestrator yet” planned call-out,
  its manual-only composition text, its marker, and the matching debt entry.
- **Retained as true:** service signal automation, standalone-worker signal wiring, Windows
  `SIGBREAK`, hook-failure reporting, platform kill-grace guidance, and storage teardown after
  ingress drains. The combined-app wording now routes those facts through `host.shutdown()`.

## Definition of Done

- [x] Existing service, worker, queue, and database drains compose under one host budget.
- [x] Deterministic tests prove ordering, budget exhaustion, and partial-failure reporting.
- [x] The invalidated caveat marker/call-out and debt entry are removed; remaining warnings stay.
- [x] Required Archetype-3, service, docs, JSR, and consumer gates pass.

```acceptance-evidence
issue: 1231
entries:
  - box: "A composed shutdown orchestrator drains all app resources under a single budget, wrapping the existing per-resource drains (no new drain logic)."
    evidence: "createRuntimeHost root export; runtime-host_test.ts ordering and controlled-budget tests."
  - box: "Deterministic tests: ordering, budget exhaustion, partial-failure reporting."
    evidence: "runtime-host_test.ts: 3 passed, covering stable phase order, unresolved-drain budget exhaustion, and failure continuation/reporting."
  - box: "Caveat marker + call-out removed; debt entry closed."
    evidence: "graceful-shutdown.md uses createRuntimeHost as Step 5; retired marker/title/debt id search returns zero matches; arch-debt entry deleted."
  - box: "Archetype gates green."
    evidence: "90 service tests; wrapper gates clean; quality gate exit 0; JSR audit and publish dry-run pass; separate-session formal IMPL-EVAL PASS."
```
