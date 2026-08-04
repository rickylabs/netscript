use harness

# Slice W3: OMB S6 three read tools — #1132

Implementation supervisor for the PR closing #1132 (epic #1126, RFC #1123). Read the issue +
RFC first. All dependencies are on main: S4 projection (`@netscript/mcp/openapi-projection`),
S5 directory (`ServiceEndpointDirectoryPort`, aspire-cli primary per F1(b)), S8 honest
truncation/receipts.

## SKILL

- `.agents/skills/netscript-harness`
- `.agents/skills/netscript-pr`
- `.agents/skills/netscript-doctrine` (packages/mcp Archetype-2)
- `.agents/skills/jsr-audit`

## Milestone-run evaluator rule

Per milestone-run.md § Evaluator protocol + orchestrator ruling D6: no local formal PLAN-EVAL;
evaluation composes draft→ready augment + OpenHands + the orchestrator pre-merge gate. Mark
your PLAN-EVAL row "composed per milestone-run.md (orchestrator waiver)"; plan then implement
in one run.

## Deliverable = the three issue boxes (all fixtures)

1. `truncated: true` iff rows were dropped (S8's central metadata — never a silent cap).
2. Operations count **absent, not zero**, when no spec was fetched.
3. S5's sources block surfaces verbatim in tool output.

Tools: `list_api_services`, `list_service_operations`, `get_operation_schema`; registry
17 → 20 (post-S4 registry state on main — verify the live count and record it); receipts per
S8 conventions. Compose S4's projection + S5's directory — do not re-derive either.

## Gates

Archetype-2 full column: `quality:gate`, scoped wrappers on packages/mcp, doc-lint + publish
dry-run for new exports, no new lint-ignores, no `deno.lock` churn. No AppHost/scaffold runs
needed — fixtures only (the live-scaffold path is S7's).

## PR contract

Branch `feat/openapi-mcp-read-tools`, target `main`. Labels: `type:feat`, `area:tooling`,
`priority:p1`, `epic:openapi-mcp`, one `status:`; milestone `0.0.5`. Body: `Closes #1132` only
with boxes truthfully ticked; authoritative `## Definition of Done`; tick ALL template DoD
boxes you can truthfully claim before handoff (unticked template boilerplate blocks close-gate);
no keyword-adjacent issue references in prose. Slice worklog/drift here; explicit-refspec push.
