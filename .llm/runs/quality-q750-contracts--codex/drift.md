# Drift Log: properly type `@netscript/contracts`

## 2026-07-12 — PR trail disabled by owner directive

- **What:** The harness normally opens a draft PR and comments each slice, but the owner explicitly
  prohibited PR creation.
- **Source:** Slice brief identity and ground rules.
- **Expected:** Draft PR commit list plus per-slice comments form the commit trail.
- **Actual:** Local run artifacts and force-pushed branch history are the only trail.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md`; final branch history.

## 2026-07-12 — Agentic thread is not remote-control visible

- **What:** The repository agentic launcher created the correct GPT-5.6 Sol/high WSL thread, but its
  startup event reported `remoteControl/status = disabled`.
- **Source:** beta-9 orchestrator launch output for thread
  `019f5663-09af-7070-a84f-286d1415cdd0`.
- **Expected:** A Tier-D mobile-visible launch would include remote-control proof.
- **Actual:** Thread identity and route are proven; mobile remote-control visibility is not.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md`; orchestrator `09e5ae68` launch record.

