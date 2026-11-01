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
