use harness

# Slice W4-C: OMB S10 evidence-gate acceptance of introspection receipts (F4a) — #1136 (epic #1126)

You are the implementation supervisor for the PR resolving #1136. Read the live issue body
first, then the design sources: RFC #1123 (`rfc.md` §2.7F, §9 F4) and
`design/canonical/05-activation.md` §2F (rev 2) under the epic's run artifacts.

## SKILL

- `.agents/skills/netscript-harness`
- `.agents/skills/netscript-pr`
- `.agents/skills/netscript-doctrine` (packages/mcp Archetype-2; #1078 evidence machinery)

## Milestone-run evaluator rule

Per `.llm/harness/workflow/milestone-run.md` § Evaluator protocol + ruling D6: no local formal
PLAN-EVAL — mark the gate row "composed per milestone-run.md (orchestrator waiver)", lock the
plan, implement in the same run.

## Dependency verification FIRST (the issue's hard block)

S8 (#1134, receipt-after-validation + truncation metadata) landed in wave 1. **Verify on
current main before implementing**: confirm the shipped path commits receipts only after output
validation and that a throwing flow leaves no stale green receipt. If you cannot demonstrate
that ordering on main, STOP and end BLOCKED with the evidence — do not land F4a on top of a
pre-validation receipt path under any sequencing pressure.

## Deliverable = the gate (F4a exactly, not F4b)

Introspection receipts become **accepted** diagnostic evidence alongside doctor/otel in the
#1078 evidence machinery. The issue's acceptance box verbatim: an introspection receipt written
after S8's ordering fix satisfies the evidence gate; a pre-validation-style receipt **cannot be
produced by the shipped path** (prove the negative through the public surface, not by mocking
internals). F4(b) — receipts *required* for endpoint-shape drift claims, per-evidence-class
receipt keys — is explicitly out of scope; do not build its machinery.

## Gates and PR

Archetype-2 column on touched packages; no new lint ignores; no `deno.lock` churn. Branch
`feat/openapi-mcp-evidence-receipts-s10`; body `Closes #1136`; labels `type:feat` + `area:sdk`
+ `epic:openapi-mcp` + `priority:p2` + exactly one `status:`; milestone 0.0.5. Draft while
implementing; ready when green; explicit-refspec pushes only. End DONE when ready, or
BLOCKED: <reason>.
