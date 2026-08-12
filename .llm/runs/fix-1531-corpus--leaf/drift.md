# Drift Log: shipped agent-docs corpus freshness

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-08-12 — owner-selected evaluator fallback

- **What:** The milestone prohibits Fable and assigns native Opus 5 as a read-only evaluator
  fallback dispatched by the orchestrator per immutable head.
- **Source:** User implementation brief for PR-F / #1531.
- **Expected:** `lane-policy.md` normally pairs Codex Sol medium implementation with Fable.
- **Actual:** Owner-authorized native Opus 5 separate-session fallback; no paid retrigger or label
  cycle is permitted.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md` route table and owner directive.

## 2026-08-12 — pre-existing doctrine debt links fail `docs:links`

- **What:** `deno task docs:links` exits 1 for two anchors in
  `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md` that no longer resolve in
  `.llm/harness/debt/arch-debt.md`.
- **Source:** Requested docs gate.
- **Expected:** The docs link gate passes.
- **Actual:** Lines 72 and 75 reference missing `packages/triggers` and `packages/workers` doctrine
  verdict anchors. Both the referring and target files are byte-unchanged from base
  `0551ff592`.
- **Severity:** pre-existing
- **Action:** defer; docs content is outside this leaf and the brief forbids editing `docs/site`.
- **Evidence:** Raw gate exit 1; `git diff --quiet 0551ff592 -- <both files>` exits 0.

## 2026-08-12 — refreshed corpus changes one MCP guidance ranking

- **What:** The locked release-corpus guidance test now ranks
  `pages/explanation/plugin-system#a-plugin-is-a-thin-layer-over-a-core-package` in the top three
  for direct application ownership, while the existing fixture expects
  `pages/data-persistence/how-to/use-a-second-database#connect-an-external-database-by-hand`.
- **Source:** `deno task test` after regenerating the shipped corpus.
- **Expected:** Existing locked ranking fixture remains green.
- **Actual:** Corpus freshness changes the score-only top three, so the test fails deterministically
  for both adapters after they agree with each other.
- **Severity:** surfaced/out-of-scope
- **Action:** defer to #1260, which owns corpus content selection; do not modify docs content,
  ranking behavior, or the fixture in this stale-snapshot leaf.
- **Evidence:** Root test exit 1; named failure in `packages/mcp/tests/guidance-evaluation_test.ts`.

## 2026-08-12 — pre-existing published JSDoc codename

- **What:** The root fitness test finds internal codename `#1589` in published JSDoc at
  `packages/cli/src/kernel/domain/dependency-closures/netscript-web-runtime-closure.ts:6`.
- **Source:** `deno task test`.
- **Expected:** Published JSDoc contains no internal workstream codenames.
- **Actual:** The finding exists at base and the file is unchanged on this branch.
- **Severity:** pre-existing
- **Action:** defer; unrelated package source is outside this leaf.
- **Evidence:** `git diff --quiet 0551ff592 -- <source file>` exits 0.
