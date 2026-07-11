# Drift

## D1 — PLAN-EVAL owner waiver

- Severity: process override, owner-authorized.
- The slice brief explicitly says `PLAN-EVAL owner-waived (carried drift D1)`.
- Plan and Design artifacts were still completed before implementation.

## D2 — carried request-level generation contract

- Severity: implementation drift from issue acceptance.
- Baseline already contains AI-494 `ChatClientRequest.options: GenerationOptions` and provider mappers.
- Issue #460 specifically contracts a per-call `modelOptions` bag on `ChatClientPort.stream`.
- Reconciliation: retained AI-494's neutral request options as a compatible lower-priority mapping and added the required per-call bag as the final override. Removing AI-494 would have introduced unrelated breakage; the two surfaces serve neutral agent-loop tuning versus provider-native call overrides.
