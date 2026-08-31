# Drift Log: canonical shipped skill references

## 2026-08-31 — Supervisor re-baseline after serial-queue correction

- **What:** The resumed slice base is `eaea940bea4c19593b97b9895b09f512039f4e13` rather than the
  original `65cd8a07787504b5ed94408510d4ab85260bc21a`.
- **Source:** Supervisor resume instruction and `git rev-parse HEAD`.
- **Expected:** Original issue brief base.
- **Actual:** Current `main` after an authorized reset; both defects remain live and unchanged.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md`, `research.md`, and re-baseline commands.
