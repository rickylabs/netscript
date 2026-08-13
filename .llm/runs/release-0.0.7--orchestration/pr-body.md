## Summary

Coordinate the complete 0.0.7 milestone through the milestone-cluster harness: freeze scope,
schedule four topic lanes, retain structured gate/evaluator evidence, publish meaningful canaries,
and cut stable only from exact-main green evidence.

## Scope

- Archetype / area: release orchestration and harness evidence
- Evidence-only coordinator PR; closes no product issue.

## Slices

- [x] Step 0 owner-ratified inventory and dependency DAG validated
- [ ] Composed milestone plan independently approved
- [ ] All leaf PRs independently evaluated and merged to `main`
- [ ] Coherent canary checkpoint(s) published and production-E2E proven
- [ ] Stable 0.0.7 publication and exact artifact-pinned production E2E proven

## Validation

- `deno task harness:milestone:render -- .llm/runs/release-0.0.7--orchestration` — PASS
- `deno task harness:milestone:validate -- .llm/runs/release-0.0.7--orchestration` — PASS (`ok: true`)
- `deno task harness:milestone:test` — PASS (15 tests)

## Harness

- Run dir: `.llm/runs/release-0.0.7--orchestration/`
- Phase: plan evaluation

## Drift / Debt

- #1453 moved to Backlog / Triage because its cited surface has never existed in this repository.
- #1384/#1385 remain in 0.0.8; no partial credential-only workaround is accepted for #1384.

## Definition of Done

- [ ] Every frozen 0.0.7 issue is closed with evidence or explicitly moved with owner-ratified reason.
- [ ] Every merged leaf has current-head IMPL-EVAL PASS and required CI/gate receipts.
- [ ] Canary and stable publication evidence is pinned to exact content and artifact identities.
- [ ] WSL, Aspire, Docker, worktrees, and harness scratch are clean at handoff.
