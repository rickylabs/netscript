# Drift — persisted quota fallback and restoration (#579)

Append-only record.

## 2026-07-10 — explicit fetch required [operational, minor]

- **Plan expectation:** `git fetch origin` succeeds.
- **Observed:** origin has a stale single fetch refspec for deleted branch
  `feat/fresh-ui-pixel-polish`; broad fetch exits 128.
- **Response:** fetched the locked integration and feature refs explicitly; both succeeded. Did not
  mutate repository/global git configuration.
- **Scope impact:** none.

## 2026-07-10 — archetype classification reconciled [design, minor]

- **Observed:** local `supervisor.md` records Archetype 6 while the parent phase registry assigns
  #579 Archetype 3.
- **Response:** preserve coordinator bootstrap identity; plan Archetype 6 tooling as primary with
  mandatory Archetype 3 state/lifecycle/failure/restart gates.
- **Scope impact:** additive validation only; no implementation expansion.

## 2026-07-10 — evaluator path owner override [process, significant]

- **Observed:** `supervisor.md` records external evaluator waived by owner and coordinator-owned
  Plan-Gate/Tier-A review.
- **Response:** Codex does not self-certify. Stop after the plan slice for coordinator Plan-Gate and
  after implementation for coordinator Tier-A review. This worker does not create an evaluator
  session or claim PASS.
- **Scope impact:** evaluator mechanics differ from harness default but separation/self-certification
  safety remains coordinator-owned.

