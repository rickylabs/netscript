# Drift Log: #1732 background reference-name validation / source safety

## 2026-08-30 — Current scaffold is looser than Aspire

- **What:** The current scaffold regex accepts consecutive/trailing hyphens and lacks a service-name
  64-character cap, while Aspire's default resource policy rejects those values.
- **Source:** `scaffold-validation.ts`, `validate-init.ts`, Microsoft Aspire upstream validation.
- **Expected:** A platform-aligned grammar could be applied mechanically without rejecting any
  scaffold-produced name.
- **Actual:** An exact grammar changes observable scaffold/config acceptance.
- **Severity:** significant
- **Action:** owner approved an observable fail-fast correction; preserve it in plan/PR and require
  separately certified PLAN-EVAL before implementation.
- **Evidence:** `research.md` findings 3–7.

## 2026-08-30 — RTK unavailable

- **What:** The requested `rtk` command is not installed or not on PATH.
- **Source:** shell exit 127: `/bin/bash: rtk: command not found`.
- **Expected:** The `rtk` skill states the binary is available machine-wide.
- **Actual:** Focused raw read commands are required.
- **Severity:** minor
- **Action:** accept for this run; keep durable verdicts on structured wrappers.
- **Evidence:** research command transcript in the active session.

## 2026-08-30 — Initial rule location contradicted the JSR-surface claim

- **What:** The first plan placed an exported grammar constant in `packages/aspire/constants.ts`
  while research incorrectly described the change as having no published-symbol effect.
- **Source:** `packages/aspire/deno.json` exports `./constants` from `./constants.ts`.
- **Expected:** Published-surface analysis and the planned path agree.
- **Actual:** The planned path would have permanently added a JSR API symbol.
- **Severity:** significant
- **Action:** keep the grammar module-private under `packages/aspire/src/domain/`; add attributable
  doc-lint and JSR-audit baselines to the plan.
- **Evidence:** `research.md` JSR section and `plan.md` D3/gate table.
