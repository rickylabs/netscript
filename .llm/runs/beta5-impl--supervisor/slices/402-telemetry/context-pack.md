# #402 T1 Telemetry Context Pack

## Current State

- Branch: `feat/402-telemetry-t1`.
- Base observed in `git log --oneline -5`: `1c175990`.
- No upstream configured.
- Draft PR: #489, `feat(telemetry): #402 T1 telemetry convention`.
- Initial implementation commits: `bf25aee9`, `65de8dca`.
- PR #489 adversarial review returned CAVEATS; this context pack now includes the follow-up
  caveat-fix slice before final push/comment.
- Slice evidence comment posted on PR #489 with `SLICE-COMPLETE`; caveat-fix evidence will be
  posted with `SLICE-COMPLETE-2`.

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
- Caveat fix aligned messaging keys with current OpenTelemetry messaging semconv where keys exist
  and moved queue-only concepts below `netscript.messaging.*`.
- Added the exported `netscript.correlation.id` floor and threaded correlation inputs through the
  attribute builders.
- Extended `NetScriptAttributeDomains` so every canonical `netscript.*` attribute root emitted by
  the telemetry package is derivable from the domain contract.
- Added invariant tests for TC-5 messaging key verbatim behavior and canonical attribute-domain root
  derivation.

## Validation

- Focused telemetry checks/tests, scoped check/lint/fmt wrappers, full export-map doc lint, docs-site
  verify, root `deno task publish:dry-run`, full package check, `deno task check`, and
  `deno task test` all passed.

## Process Completed

- Downstream telemetry issue acceptance bodies #403 through #409 reference the #402 TC convention.
- Branch was pushed with `git push origin HEAD:refs/heads/feat/402-telemetry-t1`.
- PR #489 is open as a draft against `main`.
- PR #489 has milestone `0.0.1-beta.5` and `status:impl`.
- No remaining T1 code scope is known in this checkout after the adversarial-review caveats.
