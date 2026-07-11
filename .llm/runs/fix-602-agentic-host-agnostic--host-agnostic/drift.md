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

## 2026-07-11 — Delivery metadata and harness artifacts

- **What:** The requested `status:in-progress` label does not exist, and harness activation requires
  committed `.llm/runs/**` artifacts in addition to the requested `.llm/tools/**` product diff.
- **Source:** `.github/labels.yml`, `netscript-pr` lifecycle, and harness run-loop.
- **Expected:** `status:in-progress`; diff described as `.llm/tools/**` only.
- **Actual:** Lifecycle labels use `status:plan-eval` → `status:impl-eval`; product changes remain
  `.llm/tools/**`, with required harness evidence under this run directory.
- **Severity:** minor
- **Action:** accept
- **Evidence:** PR #614 labels and commit list.

## 2026-07-11 — Linux identity permission edge

- **What:** Under the requested `--allow-read --allow-run` invocation, Deno denies environment and
  UID APIs, so current-user discovery falls back to argv-only `id -un` before plan construction.
- **Source:** first native-WSL dry-run failure and focused permission probe.
- **Expected:** Environment or UID lookup would identify the current user.
- **Actual:** Both are permission-gated; `id -un` succeeds under existing `--allow-run`.
- **Severity:** minor
- **Action:** fix
- **Evidence:** `resolveWslCommand`; final shim-free dry-run PASS.
