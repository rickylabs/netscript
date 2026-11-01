## Summary

Replace the default scaffold's placeholder pages with the Figma Utility dashboard, records, settings, sign-in and command-palette compositions. Features must use generated capabilities or show designed empty states with the exact add command.

**Implementation in progress.** PLAN-EVAL passed. S1 shell and absent-capability pages are implemented and independently reviewed. S2 live wiring, visual evaluation and full gates remain; do not merge.

## Scope

- CLI scaffold templates; Archetype 6 with frontend scope.
- Refs #2570
- Refs #2566
- Reuses current main components; will adopt #2488 when merged. Showcase plumbing belongs to #2571.

## Slices

- [x] Research, screen mapping, design checkpoint and plan.
- [x] Shell and absent-capability pages.
- [ ] Live service, auth and plugin capability wiring.
- [ ] Desktop/mobile, light/dark renders and independent visual audit.
- [ ] Generated carriers, required checks and independent implementation evaluation.

## Validation

Deno 2.9.7: 11 focused tests, generated app check (47 files), scoped lint/format, quality gate and CSS budget test pass. Browser matrix passes 16 no-service page/width/scheme cases plus settings persistence and palette dismissal/focus return. Broader required gates, live variants and independent visual/final implementation evaluations remain unproven.

## Harness

Run: `.llm/runs/orch-divybot-6557001595--2570/`. Plan, research, slice reviews, browser proof and scoped gate evidence are retained here. Public artifacts use repository-relative paths and omit session identifiers.

## Drift / Debt

No new accepted debt. The owner-specified routing and Refs-only/no-label process override generic dispatcher defaults. #2488 is still open.

## Definition of Done

- [ ] All requested pages derive content from actual generated capabilities.
- [ ] No static placeholder business rows or misleading capability claims.
- [ ] Independent visual fidelity and quality scores >=8/10 on every page.
- [ ] Required checks pass or have documented workflow-policy skips; runtime result is explicit.
- [ ] Independent IMPL-EVAL passes.
