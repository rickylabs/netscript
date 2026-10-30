# Plan & Design — READY FOR REVIEW

Issue #2438 / H01. Archetype 2 integration dependency maintenance, with archetype 3 saga and archetype 5 plugin test consumers. No production implementation redesign.

## Locked decisions

Move the shared API catalog to ^1.10.0 instead of constraining a transitive oRPC peer. Existing ^1.9.x consumer ranges admit 1.10.0; prove one resolved API in the new lock. Keep all other resolved dependency versions unchanged. Freeze generated-client fixtures against private copies of the committed lock and explicitly select --lock with --frozen. Do not mutate the repository lock from a test. Reuse local file URL source mapping. For missing fixture-only exact specifiers, add legitimate needed resolution to the committed lock with native Deno and review the delta rather than silently resolve at test time.

## Slices

1. Bootstrap run artifacts and draft PR (this plan; PLAN-EVAL required before source changes).
2. Update API catalog and necessary lock resolution, add shared frozen fixture policy and negative controls, adopt in all four generated-client config writers; record inventory of other temp-config writers. Files: deno.json, necessary maintained locks, .llm/tools/testing/locked-fixture.ts and tests, database command tests, saga provider fixture and run artifacts. Gates: structured check/test/lint/fmt, native command-postgres script, deps checks, quality:gate, publish:dry-run, JSR audit as applicable.
3. Evidence handoff: record exact pushed head review, review-thread check, CI snapshot and dated lesson. Keep PR draft. No merge/tag/release.

## Risks and mitigations

- Native lock migration may rewrite peer IDs: inspect versions and integrities; avoid unrelated upgrades.
- Temp configs differ from workspace metadata: private lock copy can omit workspace metadata, while preserving exact external graph; frozen missing entries must fail closed.
- Generated Prisma dependencies may not be in lock: verify actual provider gate and populate reviewed fixture dependencies only if needed.
- Main acceptance cannot be proven before merge: leave it explicitly unproven; coordinator owns merge and post-merge main run.
- Root quality/publish may expose baseline failures: report accurately and compare with main when needed.

## Open decisions

No unresolved architecture decision. Inventory may reveal other external-resolving fixture configs; safe bounded follow-up within this test-only scope. No unrelated dependency upgrades, scaffold output changes, local scaffold.runtime, labels or milestones. No new architecture debt planned.
