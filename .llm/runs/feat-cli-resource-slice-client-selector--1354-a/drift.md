# Drift — Slice A client selector

## 2026-09-02 — informational

- The fixed #1664 baseline has 10, not 12, direct children in `application/resource-slice/`.
  Slice A therefore reaches 12. The 14-child WARN belongs to the eventual combined state after
  Slice D and does not alter this slice.
- `rtk` is unavailable on the host; direct Git commands are used for authoritative inspection.
- No product-scope or behavior drift.

## 2026-09-02 — environment-only test reruns

- `/ephemeral/tmp` is `noexec`, causing two browser-probe fixture failures in the first full suite.
- A worktree-local temp root avoided that but caused eight unrelated Deno workspace-warning
  assertions. The neutral executable root `/home/agent/.tmp/netscript-slice-a` produced the
  authoritative green full-suite result, 1663/1663.
- No fixture or expectation was changed.
