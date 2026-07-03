# Worklog: Deploy-S7 — Aspire Docker/Compose adapter (#343)

## Design checkpoint (Plan & Design phase — 2026-07-03)

- **Archetype:** 7 (composite A2 core + A6 router). Deploy core stays in `packages/cli` for beta;
  `@netscript/deploy` extraction deferred (arch-debt).
- **Contract:** targets the LOCKED 7-op uniform contract (`plan`/`emit` · `up` · `down` · `status` ·
  `logs` · `rollback` · `secrets`); adapter declares its supported subset; delegates `plan`/`up` to
  the Aspire CLI (A7).
- **Design locked** in `plan.md` §Design + §Locked Decisions (L1–L8). Open decisions swept — none
  force rework when deferred (port-expansion ownership is merge-order only; E2E depth + key-count
  resolved now).
- **Slices:** 8 ordered slices (config → port → core conventions → apphost gen → adapter → router →
  docs/debt → e2e), all < 30, each with a proving gate.
- **State:** PLANNING-ONLY. No product code written. Awaiting **PLAN-EVAL** (separate session,
  OpenHands / minimax M3 per harness rule) before any implementation slice.

## Gate results

_None yet — implementation has not started (hard stop at Plan-Gate)._
