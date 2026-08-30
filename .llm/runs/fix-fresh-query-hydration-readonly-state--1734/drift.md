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

## 2026-08-30 — Cycle-4 owner brief is a local artifact commit above the stated inherited head

- **What:** local HEAD includes `88dac4ebfab4393d945db691b3cbd32ca331e8e3`, which adds only
  `cycle4-brief.md`, above the brief's stated local/remote head
  `069913e79c60018786eed683b9ab02896a2e405d`.
- **Source:** initial raw local/remote/log verification in the cycle-4 session.
- **Expected:** local, remote, and PR all equal `069913e7…`.
- **Actual:** the worktree is clean and the remote remains `069913e7…`, while the local owner brief
  has already been committed as one run-artifact-only child.
- **Severity:** minor artifact-state drift; no product scope drift.
- **Action:** preserve the owner artifact and build cycle 4 on top; do not reset or rewrite it.

## 2026-08-30 — Live main advanced beyond the owner-pinned rebase target

- **What:** `origin/main` is `2a65a8cd0f3872c2b95b00fe0a9edae10531921b`, newer than the
  explicitly pinned cycle-4 target `24f6642f040617de573c7cef1140eed1ac0efd6d`.
- **Source:** raw `git ls-remote origin refs/heads/main` during cycle-4 intake.
- **Expected:** the brief describes `24f6642f…` as current main.
- **Actual:** main advanced after the brief was prepared; the pinned commit exists locally, and the
  interval from the evaluator's prior main through `24f6642f…` changes zero `packages/fresh` files.
- **Severity:** minor coordination drift.
- **Action:** obey the exact owner-pinned rebase target instead of silently moving to newer main.

## 2026-08-30 — Hostile coercion hooks cannot survive the JSON transport

- **What:** functions and symbol-keyed properties are removed by `JSON.stringify`, so a hostile
  `toString`/`Symbol.toPrimitive` hook cannot be present after `QueryHydrationScript` is parsed.
- **Source:** JSON semantics and cycle-3 F2's in-memory-only reproduction.
- **Expected:** the cycle-4 brief asks all three RED cases to cross the real script transport.
- **Actual:** mutation/query omitted-key cases cross that boundary exactly; the hostile value can
  only remain hostile on the documented direct-state path.
- **Severity:** minor test-shape reality, not product rescope.
- **Action:** build the hostile value through a real mutation, round-trip the same dehydrated state
  through `QueryHydrationScript`, then also hydrate the original direct state. Do not fabricate a
  JSON payload that cannot exist.
