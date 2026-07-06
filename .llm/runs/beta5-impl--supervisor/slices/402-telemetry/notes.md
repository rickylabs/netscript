# #402 T1 Telemetry Slice Notes

## Scope Verification

- Issue source: `gh issue view 402 --repo rickylabs/netscript --json title,body`.
- Issue title:
  `[telemetry T1] Framework telemetry convention (TC-1..14) + attribute-namespacing law`.
- Literal design source named by the issue, `design/B-telemetry/epic-and-issues.md`, is not present
  in this checkout.
- Matching source exists at
  `.llm/runs/plan-roadmap-expansion--seed/design/B-telemetry/epic-and-issues.md`; implementation
  used it only where it matched the GitHub issue body.

## Drift / Stop Items

- The issue body says the design source is `design/B-telemetry/epic-and-issues.md`; that path is
  absent on this branch. The prior seed-run copy was used as corroborating context, not as an
  independent scope expansion.
- No supervisor root run artifacts were present in this checkout at start. Per the brief, this slice
  wrote artifacts only under `.llm/runs/beta5-impl--supervisor/slices/402-telemetry/`.

## Adversarial Review Follow-up

- PR #489 adversarial review found three false-done risks against `Closes #402`: near-miss messaging
  semconv keys, missing `netscript.correlation.id`, and an incomplete domain root list.
- Current OpenTelemetry messaging registry checked: semantic conventions 1.43.0 lists
  `messaging.operation.name`, `messaging.operation.type`, and
  `messaging.message.conversation_id`; it does not list the prior generic delivery/priority/destination
  kind keys.
- The fix preserves TC-5 as a strict rule instead of weakening it with undocumented NetScript
  extensions.
