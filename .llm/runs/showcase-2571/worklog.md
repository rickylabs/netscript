# Worklog

2026-11-01: resumed after #2572 merged. Inspected #2412 tracker and active owners;
selected unclaimed #2571 and opened draft #2577 with a plan-only commit.

Design checkpoint (seven items):
1. Public surface: explicit `init --from northwind`, both command modes; no default example.
2. Vocabulary: Northwind domain preset, persisted Order, stable reference, integer cents.
3. Ports: existing scaffold/file/template/process ports; no plugin installer in this leaf.
4. Constants: closed NORTHWIND_PRESET identifier/defaults in one domain module.
5. Slices: S1 complete selection/data/adapter source and tests; S2 runtime/visual evidence.
6. Deferred: #2571 full background/auth/chat assembly; #2581 independent MCP discovery.
7. Contributor entry: kernel/domain/scaffold/northwind-preset.ts plus CLI README.

Independent PLAN-EVAL round1: FAIL_PLAN. Correct findings identified nonexistent recipe
placement, missing ports/schema, MCP/client-only gap and unsafe/non-durable chat defaults.
No product code was written against that plan.

Owner already authorized picking a next subtask and sibling fan-out. Filed #2580 as the
complete orders foundation owned by this PR, and #2581 as independent plugin MCP discovery.
The remaining coupled showcase composition stays on #2571. Revised plan now uses the
existing --from option and existing init phases; it does not expose an unfinished showcase.
B4 decision: app-owned MCP server plus discovery client sibling, retaining actual MCP.
B5–B7 and all evidence limits recorded for the parent. Second plan review pending.

PLAN-EVAL round2 PASS (plan-eval-2.md). S1 implemented: existing --from selector, shared normalization before prompts/package sync, persisted Northwind assets and typed projection. Default 192/232-file hash baselines pass. New dry-run directory overlay required by auth discovery. Focused21 and broader177 tests PASS; source check/lint/fmt, quality:gate, release:preflight, docs:accuracy PASS. S1 independent implementation review pending.

S1 independent review PASS (s1-impl-eval.md). Nonblocking conditions addressed:
explicit existing dry-run suite receipt; direct-kernel conflicting-preset regression;
PresetRegistry documented as descriptive (register does not extend executor); snapshot
provenance/upkeep README. Baseline captured before source edits at product SHA4cb0298
(plan-only head68d3c76) by createInitCommand with --ci --no-agent --no-git --json for db
none/SQLite orders, hashing every emitted file with temp paths normalized. The fixture
README carries exact reconstruction and explicit opt-in update commands.

S1 sign-off reconciliation: source matches approved bounded plan;28 review-condition tests PASS including existing dry-run suite and direct-kernel negative. All14 check:* tasks other than assets-barrel PASS; assets-barrel must run after its generated output is committed. No lock changes.

S2 runtime: real SQLite generate/seed and182-file generated check PASS. Postgres
real code generation with fixture URL and183-file check PASS, runtime UNPROVEN.
Seed twice plus edit/reseed preserves count6 and held status. Focused runtime probe
PASS while running; after stopping orders unavailable PASS and ready FAIL(exit1);
restart/wait/recovered ready PASS. Browser12 cases PASS, no errors/overflow.

Visual round1 FAIL, retained. Implemented the approved contingency of a Northwind-only
column/CSS composition; no default output or shared component CSS changes. Final
screens reduce desktop rows to48px and mobile rows to130px; timestamps concise UTC.
Round2 independent visual review pending. Shared CSS budgets and17 S2 tests PASS.
Full scaffold.runtime attempted but blocked by absent Docker; UNPROVEN, not waived
as parent showcase completion. Final S2 independent code review and carriers pending.

Visual round2 PASS, all12 fidelity/quality scores >=8. Final local quality:gate, docs:accuracy, release:preflight and14 non-assets check:* tasks PASS. Default CSS prefix SHA matches the pre-edit snapshot; Northwind-only CSS adds1825 raw/338 gzip bytes (see css-size.json). No shared budget increase. S2 final independent review requested.

S2 final independent IMPL-EVAL PASS. Reviewed source and native runtime evidence
satisfy child2580; parent2571 remains open. Reconciliation: scoped source matches
plan plus documented visual contingency, no lock/sharedCSS changes, required local
gates PASS except assets-barrel awaiting committed carrier. Owned AppHost stopped,
confirmed absent in aspire ps; other resources untouched. Public runtime provenance
and source hashes added. Commit/push and mark ready after assets verification;
remote CI remains the merge gate, not a reason to idle the pipeline.
