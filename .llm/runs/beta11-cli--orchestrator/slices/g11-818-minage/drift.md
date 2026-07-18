# Drift Log: issue #818 minimum-dependency-age lockstep

## 2026-07-18 — Parent orchestrator artifacts unavailable in worktree

- **What:** `.llm/runs/beta11-cli--orchestrator/plan.md` and sibling parent artifacts are absent
  from this worktree; only the nested slices directory exists.
- **Source:** direct filesystem `find .llm/runs/beta11-cli--orchestrator -maxdepth 2 -type f`.
- **Expected:** G11 brief says the locked `(a)+docs` direction is owner-visible in parent `plan.md`.
- **Actual:** The brief itself carries the complete locked direction, acceptance, lane, supervisor,
  branch, gates, and stop-lines, but the parent file cannot be cross-read locally.
- **Severity:** minor
- **Action:** accept for planning; treat the owner brief as authoritative and do not infer any
  additional parent decision.
- **Evidence:** `research.md#Re-baseline`; G11 task brief in the supervising session.
