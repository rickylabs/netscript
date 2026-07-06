# #402 T1 Telemetry Context Pack

## Current State

- Branch: `feat/402-telemetry-t1`.
- Base observed in `git log --oneline -5`: `1c175990`.
- No upstream configured.
- Draft PR: #489, `feat(telemetry): #402 T1 telemetry convention`.
- Latest implementation commit: `bf25aee9`.
- Slice evidence comment posted on PR #489 with `SLICE-COMPLETE`.

## Implemented

- Added telemetry convention domain constants and `TelemetryConventionChecklist` under
  `packages/telemetry/src/domain/`.
- Extended `SpanNames` for saga, trigger ingress, execution, RPC, GenAI, and task spans.
- Added canonical `netscript.*` job/execution attributes while keeping existing aliases stable.
- Added saga and GenAI attribute vocabularies.
- Extended builders for job, messaging, saga, trigger, execution, and GenAI coverage.
- Builders emit canonical keys plus deprecated aliases during the beta.5 `dup` window where old keys
  already shipped.
- Added `OTEL_SEMCONV_STABILITY_OPT_IN` config support and default value
  `messaging,rpc,gen_ai_latest_experimental`.
- Published TC-1..TC-14 in `docs/site/reference/telemetry/convention.md` and linked it from
  telemetry docs/README.

## Validation

- Focused telemetry checks/tests, full export-map doc lint, package publish dry-run, full package
  check, `deno task check`, and `deno task test` all passed.

## Process Completed

- Downstream telemetry issue acceptance bodies #403 through #409 reference the #402 TC convention.
- Branch was pushed with `git push origin HEAD:refs/heads/feat/402-telemetry-t1`.
- PR #489 is open as a draft against `main`.
- PR #489 has milestone `0.0.1-beta.5` and `status:impl`.
- No remaining T1 code scope is known in this checkout.
