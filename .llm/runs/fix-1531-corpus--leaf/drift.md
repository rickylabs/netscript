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
- **Action:** defer to #1615, which now tracks corpus-wide term-statistics coupling and the locked
  ranking regression. #1260 is closed after addressing corpus presence; do not modify docs
  content, ranking behavior, or the fixture in this stale-snapshot leaf.
- **Evidence:** Root test exit 1; named failure in `packages/mcp/tests/guidance-evaluation_test.ts`.
  `git diff --quiet 0551ff592 HEAD -- packages/mcp/tests/` exits 0.

## 2026-08-12 — pre-existing published JSDoc codename

- **What:** The root fitness test finds internal codename `#1589` in published JSDoc at
  `packages/cli/src/kernel/domain/dependency-closures/netscript-web-runtime-closure.ts:6`.
- **Source:** `deno task test`.
- **Expected:** Published JSDoc contains no internal workstream codenames.
- **Actual:** The finding exists at base and the file is unchanged on this branch.
- **Severity:** pre-existing
- **Action:** defer to #1612 / PR #1614; unrelated package source is outside this leaf.
- **Evidence:** `git diff --quiet 0551ff592 -- <source file>` exits 0.

## 2026-08-12 — cycle-2 moving-base regeneration

- **What:** `origin/main` moved from `0551ff592` to `6aee2b414` and changed the triggers reference
  page after the first corpus snapshot.
- **Source:** Exact-head native Opus 5 IMPL-EVAL cycle 1.
- **Expected:** The committed snapshot matches the tree it will merge with.
- **Actual:** Before cycle 2, the source page had two `TriggerEventSubscriptionMessage` occurrences
  while its committed corpus entry had one; rebasing and regenerating restored two in both.
- **Severity:** expected/moving-base
- **Action:** regenerate again whenever `docs/site` changes before merge; this is not a one-time
  migration.
- **Evidence:** Rebase base `6aee2b414`; regenerated corpus SHA-256
  `105b8e0a081249ae5b93d58fc87ca3dbdbe79de7aa2ef140d0629b29e8757908`.

## 2026-08-12 — failed `--check` mutates the worktree

- **What:** `buildAgentDocsProseFromSite` writes regenerated corpus/provenance bytes before the
  task runs `git diff --exit-code`.
- **Source:** Exact-head native Opus 5 IMPL-EVAL cycle 1.
- **Expected:** A command named `check` is commonly read as non-mutating.
- **Actual:** A failing freshness check leaves fresh content in the worktree with the preserved,
  stale check-mode provenance stamps; those bytes are committable.
- **Severity:** non-blocking/tooling
- **Action:** record only for this PR; do not redesign the confirmed gate mechanism in #1531.
- **Evidence:** Generator control flow and negative-control worktree behavior.

## 2026-08-12 — provenance fields are not independently freshness-gated

- **What:** Check mode pins `version`, `sourceCommit`, and `extractionTimestamp` from committed
  provenance to make byte comparison deterministic.
- **Source:** Exact-head native Opus 5 IMPL-EVAL cycle 1.
- **Expected:** Readers may infer that provenance fields continuously prove freshness.
- **Actual:** A `deno.json` version-only bump or an advancing HEAD can leave old provenance values
  while the content gate stays green. `sourceCommit` describes the last normal regeneration; it is
  not an ongoing freshness guarantee.
- **Severity:** non-blocking/tooling
- **Action:** record the semantic limitation; do not redesign determinism in this PR.
- **Evidence:** Check-mode metadata selection in `build-agent-docs-bundle.ts`.
