Refs https://github.com/rickylabs/netscript/issues/2151

## Summary

Restore failed trigger file watches after their roots return, expose per-trigger watch availability through child health, and add an explicit native watcher strategy that reports errors without polling fallback.

## Scope

Archetype 3 runtime behavior across watchers, triggers-core, and trigger plugin runtime. Coordinated under #2474, group A3. Preserve sibling file-event identity and dedup changes.

## Slices

- [x] S1 Bounded recovery, lifecycle events, and processor error wiring.
- [ ] S2 Per-trigger watch health through the existing child health endpoint.
- [ ] S3 Native-only strategy, error diagnostics, and documentation.

## Validation

PLAN-EVAL passed on round 2; S1 independent repair review passed. S1 has 32 passing focused tests, green structured check/lint/fmt and quality:gate, and four behavioral negative controls. Remaining gates: focused real-watcher and runtime tests, structured check/lint/format wrappers, quality/architecture scan, export doc lint, JSR audits, publish dry-runs, and negative controls.

Generated runtime wiring requires the e2e-cli CI verdict; the coordinator owns enabling its gate label. Full local scaffold runtime is excluded by the assignment.

## Harness

Run: `.llm/runs/orch-divybot-6537103305--2151/`. Do not merge until the selected PLAN-EVAL, implementation, and mandatory independent IMPL-EVAL are complete. Coordinator owns labels, milestones, and merging.

## Drift / Debt

No new architecture debt planned. Existing watcher console-warning debt and baseline doc-lint private references (3 core, 27 plugin) remain outside scope. Four lockfiles carry only required workspace metadata for the two new imports; no dependency versions or integrity hashes changed. Assignment requests Refs-only linkage.

## Definition of Done

- [x] Real root deletion/recreation reports failure and recovery, then delivers later file changes.
- [ ] Health shows each trigger as watching or unavailable and a missing root is visible without blocking unrelated trigger processing.
- [ ] Native strategy reports actual watcher failures and never switches to polling.
- [ ] Focused local gates and negative controls recorded; documentation updated.
- [ ] Independent evaluation attests the exact pushed head; CI state reported honestly.
- [x] Assignment file excluded; no unrelated lock churn.
