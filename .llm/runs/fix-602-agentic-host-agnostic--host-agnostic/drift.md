# Drift Log: host-agnostic agentic WSL execution

## 2026-07-11 — Supervisor route observability

- **What:** The current Codex workspace exposes the model family but not the exact lane-policy model suffix/effort.
- **Source:** current session metadata.
- **Expected:** Explicit provider/model/effort in `supervisor.md`.
- **Actual:** Provider/family are known; suffix/effort are not observable.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md`; separate opposite-family evaluation remains mandatory.

## 2026-07-11 — Initial call-site audit was too narrow

- **What:** The first audit regex covered helper/capture calls but missed a direct streaming
  `Deno.Command('wsl.exe')` and an stdin-bearing `runWithStdin('wsl.exe')`.
- **Source:** PLAN-EVAL cycle 1 and a complete `wsl.exe` literal search.
- **Expected:** Only the shared helpers and token capture probe required conversion.
- **Actual:** Launcher streaming and token login must also consume the pure host plan.
- **Severity:** significant
- **Action:** fix
- **Evidence:** `plan-eval.md`, revised `research.md`, plan D1/D4/D5.
