## Summary

Coordinate the complete 0.0.7 milestone through the milestone-cluster harness: freeze scope,
schedule four topic lanes, retain structured gate/evaluator evidence, publish meaningful canaries,
and cut stable only from exact-main green evidence.

## Scope

- Archetype / area: release orchestration and harness evidence
- Evidence-only coordinator PR; closes no product issue.

## Slices

- [ ] Step 0 owner-ratified inventory and dependency DAG validated
- [ ] Composed milestone plan independently approved
- [ ] All leaf PRs independently evaluated and merged to `main`
- [ ] Coherent canary checkpoint(s) published and production-E2E proven
- [ ] Stable 0.0.7 publication and exact artifact-pinned production E2E proven

## Validation

- `deno task harness:milestone:render -- .llm/runs/release-0.0.7--orchestration` — pending Step 0 freeze
- `deno task harness:milestone:validate -- .llm/runs/release-0.0.7--orchestration` — pending Step 0 freeze

## Harness

- Run dir: `.llm/runs/release-0.0.7--orchestration/`
- Phase: research / intake

## Drift / Debt

- none accepted

## Definition of Done

- [ ] Every frozen 0.0.7 issue is closed with evidence or explicitly moved with owner-ratified reason.
- [ ] Every merged leaf has current-head IMPL-EVAL PASS and required CI/gate receipts.
- [ ] Canary and stable publication evidence is pinned to exact content and artifact identities.
- [ ] WSL, Aspire, Docker, worktrees, and harness scratch are clean at handoff.
