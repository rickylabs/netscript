# Drift Log: plan-openapi-mcp-plugin--seed

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-08-03 — Run operates under brief-mandated overrides

- **What:** No draft PR, no board mutations, no runtime validation (shared machine: release
  orchestrator active — no AppHost/docker/scaffold), generator-only stage.
- **Source:** `briefs/generator-brief.md`
- **Expected:** `seed-run.md` stage A opens a draft PR; run-loop expects runtime gates.
- **Actual:** Direct commits on `plan/openapi-mcp-plugin`; design claims cite source lines instead
  of live runs; adversarial pass is supervisor-dispatched (Codex GPT-5.6 Sol xhigh).
- **Severity:** minor
- **Action:** accept (owner-directed)
- **Evidence:** `supervisor.md` § Recorded lane/eval overrides
