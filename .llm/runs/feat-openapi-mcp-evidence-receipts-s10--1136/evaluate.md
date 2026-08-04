# Evaluation handoff — F4a introspection receipt evidence gate

## Boundary

Per `milestone-run.md` and owner ruling D6, this run does not launch a local formal PLAN-EVAL or
IMPL-EVAL and does not self-issue a formal verdict. The plan row is recorded as
`composed per milestone-run.md (orchestrator waiver)`. Per-PR evaluation composes the draft→ready
automation with the milestone orchestrator's pre-merge gate.

The required code review remains independent: an opposite-family Claude Opus session reviewed the
complete S1 working-tree diff before sign-off and returned PASS. Its full findings, commands, and
receipt-order trace are in `reviews/s1-claude.md`.

## Candidate

- PR: `rickylabs/netscript#1233`
- Issue: `#1136`; epic `#1126`
- Commit: `e3a5c0ef4`
- Archetype: 2 — Integration (`packages/mcp`); hand-authored docs overlay
- Scope: F4a only; F4b receipt keys and endpoint-shape predicates remain deferred

## Gate evidence ready for composition

| Gate | Result |
| --- | --- |
| S8 dependency on current main | PASS — success settles after both validations and bounding; focused baseline suite 14/0 |
| Public F4a acceptance | PASS — `list_api_services` receipt authorizes public `record_drift` |
| Public pre-validation negative | PASS — central output rejection writes exit 1 and public `record_drift` refuses |
| Focused / package tests | PASS — 11/0 and 109/0 |
| Scoped check / lint / fmt | PASS — 103 files each, zero findings |
| Quality | PASS — root gate exit 0; focused MCP scan zero findings and allowances |
| Doctrine | PASS — no changed-file violation; documented baseline reporter false positive only |
| JSR | PASS — doc lint exit 0; raw publish dry-run succeeds with no slow types |
| Opposite-family review | PASS — F1 site-reference finding actioned before sign-off |
| Hygiene | PASS — no F4b type/storage machinery, lint ignore, dependency, generated asset, or lock inclusion |

## Acceptance mapping

1. `a public introspection receipt satisfies the shared drift gate` calls `list_api_services`
   through `createMcpCliServer()`, observes the shipped green receipt, then records drift through
   the same public JSON-RPC server.
2. `a public introspection output rejection cannot leave green evidence` first creates successful
   evidence for `catalog`, then submits a valid oversized `get_operation_schema` result to the
   shipped runner. Its post-flow byte-limit rejection replaces green evidence with exit status 1;
   the following public `record_drift` call is refused.
3. A pre-validation settlement implementation would leave the prior green receipt usable and make
   the second assertion sequence fail, so the negative distinguishes PASS from did-not-run.

## Remaining composed checks

- Draft→ready CI and review automation on PR #1233.
- Read-only unanswered-thread gate against the final head.
- `status:ready-merge` acceptance mirror and close-gate rerun after every required check is green.
