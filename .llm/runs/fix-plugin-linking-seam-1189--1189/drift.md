# Drift Log: declared plugin linking seam

## 2026-08-05 — carried brief absent from train base

- **What:** The requested brief path is absent from `canary/0.0.5-canary.13`.
- **Source:** `find`/`git ls-tree`; historical commit `dd627fe3b` contains `implement.md`.
- **Expected:** Brief present at the named orchestration path.
- **Actual:** Recovered it read-only from history; live issue remains authority.
- **Severity:** minor
- **Action:** accept

## 2026-08-05 — predecessor fixture unavailable

- **What:** Historical brief expected reuse of a #1093 third-party fixture.
- **Source:** #1093 is open; no corresponding fixture exists on the canary.13 base.
- **Expected:** Reuse/extend predecessor fixture.
- **Actual:** #1189 must carry one fixture third-party plugin of its own.
- **Severity:** minor
- **Action:** accept
