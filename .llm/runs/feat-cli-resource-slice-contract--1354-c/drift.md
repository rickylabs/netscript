# Drift Log: Slice C resource contract and safe reconciler

## 2026-09-02 — owner-directed PR lifecycle override

- **What:** Open the implementation PR non-draft with `status:impl` rather than opening a draft at
  the bootstrap commit.
- **Source:** Owner's Slice C prompt.
- **Expected:** Generic harness guidance opens a draft PR with the first run-artifact commit.
- **Actual:** The owner requires non-draft status and complete metadata in the same opening action.
- **Severity:** minor process override.
- **Action:** accept; preserve the separate-session IMPL-EVAL requirement.
- **Evidence:** `supervisor.md`; final PR creation receipt.

## 2026-09-02 — RTK unavailable

- **What:** The repository's preferred exploratory output proxy is absent from `PATH`.
- **Source:** `rtk ls packages/cli/src/kernel/application` exited 127.
- **Expected:** `.agents/skills/rtk/SKILL.md` states that RTK is machine-installed.
- **Actual:** `bash: rtk: command not found`.
- **Severity:** minor tooling drift.
- **Action:** accept for this run; use focused raw reads and structured Deno wrappers for verdicts.
- **Evidence:** worklog bootstrap command output.

## 2026-09-02 — concurrent #1664 no-overlap authorization

- **What:** Slice C starts while #1664 remains open because its live intersection is empty.
- **Source:** Owner's “Why C runs now” directive and live `git ls-remote`/`git diff`.
- **Expected:** The master plan's earlier D9 prose serialized all work until #1664 merged.
- **Actual:** #1664 head `d155db116` has no path under the ten-file Slice C touch set.
- **Severity:** significant sequencing amendment, zero file-collision risk for this leaf.
- **Action:** accept under explicit owner authorization; stop if any product file outside the ten is needed.
- **Evidence:** `research.md` live D9 record.
