# Drift Log: #754 deeper type-erasure elimination tail

## 2026-07-12 — Owner-authorized no-PR harness variant

- **What:** No draft PR or per-slice PR comments will be created.
- **Source:** Slice identity ground rule: “Do NOT open PRs.”
- **Expected:** Harness V3 normally uses a draft PR as the commit trail.
- **Actual:** Local commits, pushed branch state, worklog, and evaluator artifacts are the trail.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md` recorded override.

## 2026-07-12 — Remote target branch absent

- **What:** `origin` did not advertise `refs/heads/quality/q754-tail-h` during preflight.
- **Source:** `git ls-remote` / fetch attempt.
- **Expected:** Slice brief described a prior pushed attempt to supersede.
- **Actual:** Rejected commit was only recoverable as unreachable local object `f656c0ca`.
- **Severity:** minor
- **Action:** accept
- **Evidence:** final push will create or update the owner-specified ref with force-with-lease.
