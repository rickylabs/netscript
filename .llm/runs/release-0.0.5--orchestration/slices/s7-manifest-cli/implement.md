use harness

# Slice W3: OMB S7 — re-scoped to the aspire-cli adapter path per F1(b) — #1133

Implementation supervisor for the PR closing #1133. Read the issue, RFC #1123 §F1, and the P1
verdict (`.llm/runs/test-openapi-mcp-wave0-proofs--wave0/proofs/P1-verdict.md`) first. **F1
resolved to (b)**: no template manifest emission; your scope is the `aspire-cli` query
adapter's production hardening as the primary live EndpointSource (S5 shipped its first cut on
main — extend, don't fork).

## SKILL

- `.agents/skills/netscript-harness`
- `.agents/skills/netscript-pr`
- `.agents/skills/netscript-doctrine` (packages/mcp Archetype-2)
- `.agents/skills/aspire` (CLI spawn/describe surface)
- `.agents/skills/netscript-cli`

## Milestone-run evaluator rule

Per milestone-run.md § Evaluator protocol + orchestrator ruling D6: no local formal PLAN-EVAL;
composed evaluation; mark the row accordingly; plan then implement in one run.

## Deliverable (re-scoped, per issue F1(b) arm + P1 evidence)

1. The aspire-cli adapter's spawn/parse/failure-state handling hardened for the real CLI:
   version/format drift tolerance, CLI-absent, non-zero exit, partial/torn output — each an
   explicit status row (P3's `spec_unavailable` vocabulary), never silent.
2. Identity binding per the P1 evidence: projectRoot/runId checks; a stale or foreign describe
   result must not read as live endpoints.
3. `scaffold.runtime` evidence that a scaffolded app's live ports resolve through the adapter
   end to end (`list_api_services` path once S6 lands — coordinate: rebase on S6 if it merges
   first, else fixture the directory call).

## Gates

Archetype-2 full column + framework-wave law. **Expensive-gate serialization: the sagas joint
verification holds the AppHost slot first — check with the orchestrator-visible state (no
scaffold.runtime/AppHost run while another is live) and queue yours after.**

## PR contract

Branch `feat/openapi-mcp-manifest-cli`, target `main`. Labels: `type:feat`, `area:tooling`,
`area:aspire`, `priority:p1`, `epic:openapi-mcp`, one `status:`; milestone `0.0.5`.
`Closes #1133` only with truthfully-ticked boxes reflecting the F1(b) re-scope (record the
re-scope in your slice drift.md); tick all truthful template DoD boxes before handoff; no
keyword-adjacent issue references. Explicit-refspec push.
