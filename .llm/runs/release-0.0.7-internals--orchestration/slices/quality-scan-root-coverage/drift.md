# Drift Log: quality-scan-root-coverage

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state documentation.

## 2026-08-15 — Launcher metadata pre-seeded the run directory

- **What:** The initial worktree check found the target run directory untracked because the agentic launcher had written `codex-thread-ids.md` before this session began.
- **Source:** Initial `git status --short --branch` and the launcher-authored file.
- **Expected:** A clean worktree before harness bootstrap.
- **Actual:** Only the target run directory was untracked; its sole file matched the requested thread, worktree, branch, baseline, and route.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `.llm/runs/release-0.0.7-internals--orchestration/slices/quality-scan-root-coverage/codex-thread-ids.md`

## 2026-08-15 — Historical doctrine-root omission is already repaired

- **What:** Live base research found that the issue's historical hand-maintained `arch:check` root omission no longer exists.
- **Source:** `deno.json:163-164`; `.llm/tools/fitness/check-doctrine.ts:26-42,86-104`; `.llm/tools/fitness/check-doctrine_test.ts:23-32`.
- **Expected:** Carried-in evidence named `packages/plugin-streams-core` as absent from an `arch:check` root list.
- **Actual:** Both doctrine tasks use dynamic `--all-roots`; tests require 36 top-level units and explicitly require Streams. The live defect is the narrow `quality:scan` task plus the lack of a published-member coverage invariant.
- **Severity:** minor
- **Action:** accept and narrow the plan
- **Evidence:** `research.md` findings F1, F3, and F5.
