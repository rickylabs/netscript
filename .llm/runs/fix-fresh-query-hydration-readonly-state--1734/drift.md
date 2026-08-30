# Drift Log: Fresh query hydration readonly/mutable type correction

Drift is append-only.

## 2026-08-30 — Fresh doc-lint baseline differs from historical resolved note

- **What:** The current structured Fresh doc-lint reports 45 diagnostics.
- **Source:** `deno task doc:lint --root packages/fresh --pretty` at base `21d516224`.
- **Expected:** The historical Fresh F-7 debt entry says the package returned zero diagnostics in 2026-06.
- **Actual:** 28 private-type-ref and 17 missing-jsdoc diagnostics across current exported entrypoints.
- **Severity:** minor
- **Action:** accept as inherited baseline; do not expand #1734.
- **Evidence:** `worklog.md` baseline table; no source change was present when measured.

## 2026-08-30 — Review/evaluation occur after leaf push

- **What:** Tier-A slice review and independent exact-head IMPL-EVAL are not performed by this session.
- **Source:** Owner delivery instruction.
- **Expected:** The generic harness loop places supervisor review before the sign-off commit.
- **Actual:** The owner explicitly scheduled both independent passes after this leaf's push.
- **Severity:** minor
- **Action:** accept owner-authorized lane ordering; leave the PR draft and do not self-certify.
- **Evidence:** `supervisor.md` routes and owner brief.

## 2026-08-30 — Colocated test crossed Fresh query folder cardinality

- **What:** The first S2 test location made `src/application/query` the thirteenth immediate child.
- **Source:** `deno task arch:check` during the S2 loop.
- **Expected:** No new/deepened doctrine finding.
- **Actual:** Fresh temporarily moved from 3 to 4 warnings with a new F-16 query-folder warning.
- **Severity:** minor
- **Action:** fix; moved the cross-cutting hydration behavior test to `packages/fresh/tests/`.
- **Evidence:** Re-run returns Fresh `FAIL=0 WARN=3 INFO=1` with no query-folder finding.

## 2026-08-30 — Repair session moved to the NAS worktree

- **What:** The original supervisor artifact named a retired `/home/codex/repos/...` checkout.
- **Source:** Owner FAIL_FIX brief.
- **Expected:** Continue the exact branch/head from its recorded checkout.
- **Actual:** The old path no longer exists; the same branch and evaluator-artifact head are present at `/home/agent/projects/netscript/worktrees/007-leaf-1736`.
- **Severity:** minor
- **Action:** update `supervisor.md` to the live path; preserve commit history and base unchanged.
- **Evidence:** raw `git rev-parse HEAD` returned `ed8a8e9ca9be2e72da4a00bff830caf260ee94ea` before S4.

## 2026-08-30 — Shared-host agentic tests exhaust watcher/cancellation resources

- **What:** The required root test fires but fails on two `.llm/tools/agentic/**` host-lifecycle tests.
- **Source:** three structured `deno task test` attempts at the unchanged S5 product tree, including an isolated run and `DENO_JOBS=1`.
- **Expected:** Entire root suite green.
- **Actual:** Each attempt reports 4,251 passed / 2 failed / 19 ignored. `codex-follow_test.ts` cannot create `Deno.watchFs` (`Too many open files`, host inotify instance limit 128); `hybrid-launcher_test.ts` observes its stubborn worker after cancellation. The same two fail when run alone.
- **Severity:** significant gate-environment drift; not product rescope.
- **Action:** record the command RED and leave foreign supervisor sessions untouched. The exact-head evaluator/CI must rerun on a host with watcher capacity; do not describe this receipt as green.
- **Evidence:** `worklog.md` FAIL_FIX gate table; no scope diff under `.llm/tools/agentic/**`.

## 2026-08-30 — Cycle-3 owner brief materialized as an untracked run artifact

- **What:** `cycle3-brief.md`, an exact copy of the owner-authorized cycle-3 prompt, was present as an
  untracked file before this session changed source.
- **Source:** initial raw `git status --short` at
  `eb765629206092f97b3dd8f76a64fa0c3769bcb8`.
- **Expected:** the owner brief described the inherited worktree as clean.
- **Actual:** local and remote heads matched exactly, but the brief file was untracked inside the
  authorized leaf run directory.
- **Severity:** minor artifact-state drift; no product or scope drift.
- **Action:** preserve the brief as cycle-3 run evidence in the RED slice; do not delete it or treat
  the initial worktree as clean.
- **Evidence:** the file content is byte-for-byte the current owner brief; initial status listed no
  other change.
