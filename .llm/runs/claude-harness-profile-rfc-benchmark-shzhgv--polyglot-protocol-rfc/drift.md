# Drift Log: polyglot-protocol RFC (run 5)

## 2026-08-20 — R5-D-1: PLAN-EVAL cycle-1 FAIL_PLAN (checklist-form)
- Three plan-gate boxes + jsr-audit line missing; six fixes applied (f4ae089), cycle-2 PASS.
  **Severity:** minor (process). **Action:** applied; mirrored in plan-eval.md.

## 2026-08-20 — R5-D-2: fd-3 frame channel infeasible on Deno host (K1)
- `Deno.Command` exposes stdin/stdout/stderr only; the pre-registered fd-3 fallback branch
  cannot exist on this host API. Sentinel-stdout adopted (passed); sockets are the escape
  hatch. **Severity:** minor (criteria branch resolved by measurement). **Action:** accept;
  RFC documents it.

## 2026-08-20 — R5-D-3: K6 runs on a replica, not the plugin mutation path
- Two hard constraints: `KvExecutionState` has no progress mutation today (D-12 confirmed at
  API level), and the durable-stream producer requires the Aspire-hosted streams service URL
  (not bootable in-container; run-1 D-2 hosting lineage). The replica used the real demux,
  real throttle shape, real Deno KV store tech, and a loopback HTTP sink whose transport cost
  K3 bounds (~0.5 ms). RFC marks the chain MEASURED-ON-REPLICA. **Severity:** moderate
  (recorded per plan risk register). **Action:** accept; implementation wave validates
  in-plugin.

## 2026-08-20 — R5-D-4: UDS constraints (K3)
- Deno `fetch()` cannot speak UDS (deno-type tasks excluded as clients) and SUN_LEN (~108
  chars) forbids sockets at deep workspace paths. UDS demoted to optional capability; TCP
  127.0.0.1 canonical. **Severity:** minor. **Action:** accept; RFC states both facts.

## 2026-08-20 — R5-D-5: Container/Aspire/Windows environments untested for K3
- No Docker/Aspire/Windows in-container; loopback survival in those environments is a design
  argument (Aspire itself injects service URLs via env) rather than a measurement.
  **Severity:** minor. **Action:** accept; listed in RFC unresolved questions.

## 2026-08-20 — R5-D-6: zod import from run-dir modules
- Bare `zod` is not in the root import map for run-dir modules; spike imports `npm:zod@4`
  directly (same major the workspace pins). **Severity:** trivial. **Action:** accept.
