# Worklog

## Owner routing override

> Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only. Feature-tier loop: at most 2 PLAN-EVAL rounds and 5 IMPL-EVAL rounds. The final IMPL-EVAL must review the exact pushed head and end with one line: VERDICT: MERGE <full sha> or VERDICT: CHANGES <full sha>.

## Bootstrap

Baseline equals current fetched main. No triage comment or existing PR referencing #2369; broader outbox-retention search returns older relay/projection PRs, not this delivery. Consulted committed environment/Postgres memories and shared memory index before source inspection. MCP find_guidance then search_docs consulted. RTK absent; focused raw commands and structured wrappers will be used. No local scaffold.runtime run: coordinator must arm CI gate.

## Design

1. Public surface: installed outbox model+declared constraint migration; independent relay pruneSettled and saga command retention factory/prune.
2. Vocabulary: settled=published or terminal outbox, unleased=no token/until; terminal saga=completed/failed/cancelled/compensated, replay marker=atomic instance/hash.
3. Ports: existing PostgresCommandClient + TransactionClientPort; separate optional retention contract preserves relay fakes.
4. Constants: default completed-retention seven days; one day=86400000ms; maximum page 100; finite terminal status set and fixed SQL identifiers.
5. Commit slices: S0 plan; S1 contribution/migration + install Postgres proof; S2 retention + real guard/negative tests; S3 docs/carriers/final gates. Gates and files are in plan.
6. Deferred scope: scheduling/canonical state cleanup/receipt-audit retention/engine path/local full E2E/merge; outside requested seam or owner prohibits.
7. Contributor path: prisma-saga-command-retention.ts plus linked schema/migration recipe.

Public additions use named typed exports on existing database commands/postgres and saga stores subpaths, explicit return annotations and JSDoc examples; no new entrypoints, dependencies or slow-type carveouts.

## Plan repair

Round 1 FAIL_PLAN recorded. Revised seven-item design follows plan.md: public cursor/scanned/deleted contracts; *.migration.sql sidecars installed by existing schema mechanism; migration runner appends pending immutable contributions before deploy; keyset scans bound examined records; TypeScript metadata validation; policy map and conservative outbox max; query-interception test seam; CI entry and copied-model adoption. Scope extension is within owner-authorized full delivery; no approval pause. Baseline quality:gate exit 0. Isolated native PostgreSQL startup/cleanup probe exit 0. Draft PR #2487 opened.

PLAN-EVAL round 2 PASS; implementation begins only after this verdict. Latest main command-postgres run is green: https://github.com/rickylabs/netscript/actions/runs/41152000845 . Prior memory of a provider failure is stale.

## S1 gates

- Structured migration/schema tests: 33 passed, 0 failed, exit 0.
- Structured real PostgreSQL installed schema: 1 outer conformance passed, exit 0. Actual contribution copy/dedup -> Prisma migrate diff with datasource config -> pending contribution append -> migrate deploy -> generated Prisma client. Catalog parity proves exact fixture columns/indexes/CHECKs; constraint rejection and idempotent existing-constraint adoption pass. Native database created/dropped by test, server cleaned by gate.
- Scoped database, CLI-configured, and saga type checks exit 0. Scoped lint and format exit 0 (CLI excludes removed only in temporary validation config, keeping canonical rules). Quality/architecture final slice gate running.
- Reconcile: issue remains open, draft PR #2487 targets main; no labels/milestones changed. Native diff exits zero without output if datasource config is omitted; proof now demands generated file and provides config. See memory-migration-delivery.md.

S1 sign-off: independent substantive supervisor review PASS after fresh-install and line-ending repairs. Final real PostgreSQL: 2 passed (fresh contribution and copied-model adoption); 33 unit regressions pass; scoped check/lint/fmt and quality:gate exit 0. CI registration/path filters included. No engine or lock changes.

## S1 CI repair

PR command-postgres run https://github.com/rickylabs/netscript/actions/runs/41163470858 passed both install modes and existing command/relay, then failed P1012 duplicate outbox model in the provider fixture. Compared latest main run 41152000845 (green). Provider fixture now omits only the final copied outbox model before appending shipped saga schema. Independent supervisor PASS; real native PostgreSQL atomic-transition conformance passes, exit 0; scoped format exit 0. Pushing isolated correction while S2 remains in progress.

Reconcile: read new PR activity and addressed CI finding; no review threads or external review comments yet.

## S2 bounded retention

Implemented independent relay retention contract and composed Prisma saga-command retention, with capped primary-key pages and resumable cursors, per-saga policy map, conservative shared outbox window, terminal completion anchoring, fail-closed metadata handling, ordered parent locks, fresh status/deadline/version checks and target-side rechecks. No engine edits. Independent slice review PASS. The review's numeric-precision observation was improved by comparing exact PostgreSQL envelope text; added a real integer-above-2^53 case.

Real fresh/adoption install scenarios pass; fresh case runs nine retention tests (ten child tests including schema parity), all pass. Twelve semantic PostgreSQL guard-removal controls pass the negative bar; see negative-controls.md. Every retention test goes red under its guard control; sources restored. Final full native PostgreSQL conformance and post-restoration gates are running before sign-off commit.

Reconcile: S1 CI repair now green at 1f07678, https://github.com/rickylabs/netscript/actions/runs/41163838807 . No unresolved review threads.

S2 sign-off: full canonical native PostgreSQL conformance script exit 0 (new install/retention, existing command/relay, atomic transitions, saga-relay cohort and runtime publisher); all seven outer tests passed, with nine new retention child tests. Post-restoration structured check/lint/format exit 0; quality:gate exit 0. Independent final slice confirmation PASS. JSR dry-runs are OK; audit surfaced pre-existing missing module tags on saga backend and plugin doctor entrypoints; repair those documentation tags in S3 before final audit. No accepted debt.

## S3 docs and public surface

Documented schema/SQL installation, normal migration and optional copied-model adoption, group policy map, persisted cursors, canonical parent lifetime, strict cutoff, leased/pending safety, bounded work and independent page commits in saga reference and database/service relay docs. READMEs/changelogs updated. Independent substantive S3 review PASS. Added missing module tags surfaced by JSR audit and a MigrationOptions summary. Re-exported the new referenced database result type to remove the one introduced doc-lint finding.

Docs exports coverage PASS. All 475 JSDoc examples compile (zero enforced failures). Documentation snippet gate exit 0. Database doc-lint clean; saga core/plugin full-export doc-lint matches isolated main baseline exactly (7/30 inherited private references), see doclint-baseline.md; these are not claimed green. Generated corpus/prose/assets refreshed with repository generators; final freshness checks follow. Baseline verification worktree cleaned.

S3 gate completion: structured source check/lint/format exit 0; quality:gate exit 0; docs:exports-drift PASS; docs snippet gate exit0; all 475 JSDoc examples PASS. JSR audits/dry-runs pass for database, saga core, saga plugin and affected CLI, with existing warnings only. Corpus freshness, prose freshness (253 rendered HTML pages), assets-barrel direct freshness and publish-assets checks pass. Corpus was generated with the explicit --allow-dirty development flag before commit; clean committed regeneration/regression follows. Review-thread gate PASS, zero threads/unanswered. S3 independent supervisor PASS; no newly introduced doc-lint errors; inherited findings remain explicitly unproven as documented.

Reconcile: PR remains draft while final evaluation is pending; no taxonomy changes or engine/lock churn. Required scaffold.runtime will be requested in READY for coordinator-controlled CI.
