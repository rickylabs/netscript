# Completed implementation — Cockpit handoff

PR #2583 implements #2579, uses Refs #2579 and has no labels. Cockpit owns merging. After the original READY handoff, the owner explicitly authorized marking the PR ready. It is now ready for review. Do not add a closing keyword, merge manually, rebase or force-push.

Ready-for-review core CI exposed one stale static test in
packages/cli/e2e/tests/application/gates/generated-router-template_test.ts: it counts only
synchronous missingAsNull callbacks, whereas the evaluated adapter uses async callbacks
to schema-parse resolved Prisma rows. Follow-up work updates that syntax assertion while
preserving its call count, P2025 and rethrow requirements. No runtime source changes.
Test-4 also found the generated missing-record fixture still used removed status 'archived'.
Both fixture calls now use valid status 'cancelled', retaining the application's null result
and RPC NOT_FOUND/404 checks. Validate both memory and Prisma generated-service variants.

## Source and outcome

The evaluated implementation head is 2b1db077b01eb0c1f06b51d336280c0438f22866. Original delivery c688757 changed only this scoped run's evidence/context. The ready-mode follow-ups change five test files and run notes; production source and generated carriers remain identical. Resolve the current delivery head from Git or the latest PR comment.

Follow-up local validation under Deno 2.9.7: 5/5 focused E2E tests, including real memory
and SQLite Prisma generated-service checks; 14/14 sample/projection semantic tests including
both tie directions and a page boundary. Scoped check/lint/fmt processed all three changed
tests with no findings or dropped selections. Review-thread gate: zero unanswered threads.
The same independent Opus 5.5 high evaluator returned SLICE_REVIEW_PASS and IMPL_EVAL_PASS
for the final test-only slice (static review; local execution results are generator-owned).
Remote CI at the new commit remains required before publishing the new READY handoff.

Core run 41331736013 at b0b6326 passed the repaired test-1 (841/0) and test-4 (1,480/0),
plus all other checks except test-2, test-6 and their aggregator. The remaining failures
were stale fake Prisma query/row shapes in the four-variant auth-policy fixture and the
old one-row seed message in the no-Aspire lifecycle. Both modules now pass locally (6/6),
including real SQLite migration/generation/seeding, with scoped check/lint/fmt PASS.
The same independent evaluator approved this second test-only repair slice with both PASS
verdicts. Push normally and wait for every check at the new head before publishing READY.

Default models/contracts/clients now carry unique references, owners, six portable statuses, signed integer minor-unit amounts/currency, and timestamps. Forty deterministic rows span sixty UTC days; upserts preserve edits/IDs. Fresh databases insert oldest first for the generic ID-descending list. Memory uses the same sample source. Server projections expose adjacent 30-day metrics/deltas, 60 daily buckets, per-currency amounts/averages, status counts and latest records. Complete overview reads fail closed; absent/empty/unauthorized/unavailable remain distinct. Existing layouts/CSS are retained.

## Proof

- Deno 2.9.7; 219 focused tests. Four-engine model/contract generation tests; actual live SQLite and CI PostgreSQL/SQLite.
- All fifteen root check:* tasks, complete carrier chain, root check (4,140 files), lint/fmt and quality/architecture PASS.
- Live seeded records and projections; Chromium 153 cell assertions and records-desktop.png. Real generated SQLite/memory checks (133/125 files), emitted memory test, docs compile and standalone scaffold.service pass.
- CI 41327413127 SUCCESS: PostgreSQL 122/122, SQLite 115/115, no failures/skips in either suite, static/native jobs successful. Pages 41327353410 SUCCESS.
- Independent read-only Claude Opus 5.5 high IMPL-EVAL PASS; see evaluate.md and gate-evidence.md. Same evaluator re-steered throughout; model usage verified; no public session identifiers.

## Repairs and limits

Independent reviews repaired duplicate SQL Server sort keys, pagination control loss, client-writable references and raw status labels. CI repairs materialized a missing docs seed module, narrowed an emitted test union, and removed literal-boolean ternaries from emitted example routes without changing lint rules or layouts. All are documented in drift.md/slice-review.md. No live MySQL/MSSQL database run was claimed. The optional stale dogfood helper remains outside this change.

All four owned proof processes were stopped and foreign/unknown resources left untouched. No new architecture debt. Raw logs, CI report downloads and evaluator continuation metadata stay in private project run output; public artifacts use repository-relative paths only. The dated lesson and small memory notes retain extension and gate recipes. No requested source work remains.
