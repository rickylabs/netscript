**Design pre-step update** (owner-ratified, 2026-07-06).

DDX-15 (#425) is superseded-in-execution by a dedicated design run (tracking issue #507; branch `feat/dashboard-design-prototype`). Three epic-level consequences:

1. **Sequencing:** DDX-5 (#415) and all panel slices (#416–#422, #427–#431) are blocked on the design run's delivery — a full E2E Claude Design prototype + `tools/design-sync/` system + sync-back spec — not on the narrower DDX-15 as filed.
2. **DDX-0 (#410) edge inverted:** the prototype's pass 1 validates/amends the L3 promote-set (breadcrumbs, context-rail, plugin-gated-view, activity-feed, connector, entity-rail, tree-nav) *before* DDX-0 implementation. DDX-0 implementers should treat the run's sync-back spec as the authoritative promote-set input.
3. **No board restructuring:** all DDX issue numbers, milestones, and the telemetry co-land contract are unchanged. GitHub remains the source of truth; this is an execution-lane note, not a re-plan.

Run dir: `.llm/runs/feat-dashboard-design-prototype--design/` on the run branch.
