## Summary

Plans a dual exclusion for the scaffolded `/design` developer reference: Fresh omits the route group from production builds, and route middleware independently refuses outside literal development. This head contains planning artifacts only; implementation is blocked on separate-session PLAN-EVAL.

## Scope

- Archetype / area: Archetype 6 CLI/tooling + frontend overlay · `packages/cli` scaffold assets and CLI E2E
- Refs #1481

## Slices

- [x] Plan and design dual production exclusion — this plan commit
- [ ] Implement structural Fresh ignore and fail-safe route middleware
- [ ] Add mutation-proved hosted `scaffold.design-production-exclusion` gate
- [ ] Complete scoped validation and separate-session IMPL-EVAL

## Validation

- Implementation gates — not run in PLAN phase by instruction
- Hosted `scaffold.runtime` — deferred to `ci:full`; never local without a coordinator lease
- PLAN-EVAL — pending on this plan commit

## Harness

- Run dir: `.llm/runs/design-route-prod-gate--plan/`
- Phase: plan — ready for separate-session PLAN-EVAL
- Decision: repository evidence positions `/design` as a local developer reference/gallery, not a production-user surface
- Do not merge until the selected Plan-Gate and mandatory final evaluator pass are complete.

## Drift / Debt

- No planned RFC divergence: both independent exclusions are in the slice.
- Existing `scaffold-runtime-a8-f16-1333` debt remains open and is not deepened; the plan extends an existing gate family instead of adding another top-level scaffold-gate child.

## Definition of Done

- [ ] A default production build contains no `(design)` route-module output, with a mutation proving the detector fails when the route is planted back.
- [ ] The `(design)` route middleware refuses all runtime modes other than literal development.
- [ ] Development `/design/composition` remains reachable in the hosted runtime probe.
- [ ] Embedded template assets are regenerated through the canonical generator and pass freshness checking.
- [ ] Required scoped, quality, doctrine, hosted E2E, and separate-session IMPL-EVAL gates pass.
