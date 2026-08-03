# Context Pack: plan-openapi-mcp-plugin--seed

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `plan-openapi-mcp-plugin--seed` |
| Branch | `plan/openapi-mcp-plugin` |
| Current phase | rev 2 complete (adversarial integrated 25/25); awaiting owner ratification |
| Archetype | **2 — integration** (S-20 reclassification); ARCHETYPE-5 evaluated → rejected (design/canonical/06) |
| Scope overlays | none |

## Current State

The design is complete at **rev 2, adversarially hardened**: rfc.md proposes three read MCP
tools projecting every scaffolded service's live `/api/openapi.json` into the existing
`netscript agent mcp` server; discovery is an identity-bound endpoint manifest whose producer
mechanism is **[P1]-arbitrated** (S-7: the helper body runs pre-allocation; `aspire-cli` is a
first-class fallback source); execution is designed-but-deferred behind a fail-closed
`.netscript/agent-mcp.json` policy with canonical-identity evaluation; activation follows
#1071/#1072 with the S-18 exact-pin migration correction. Core ruling **unchanged through
review**: extend `packages/mcp`; no plugin — now argued on the named `EndpointSource` axis
(S-21), not on denied variance. Stage 2: Codex GPT-5.6 Sol xhigh found 25 (10 blockers);
**25/25 accepted and integrated**. Nothing implemented; no PR opened (brief stop-line); board
placeholders OMB-1..14 not filed.

## Completed

- research.md (3-way fan-out + in-session ✔ verification; decisive find: oRPC defaults
  `operationId` to the dotted contract path — `@orpc/openapi@1.14.13`)
- plan.md rev 2 (D1–D9, forks F1–F5), canonical design 00–06 rev 2, examples ×2 rev 2, rfc.md
  rev 2
- adversarial pipeline: brief (with the three 0.0.4 orchestrator learnings as required attack
  surface) → dispatch via `agentic:launch-codex-slice` (thread in `codex-thread-ids.md`) →
  `adversarial-sol.md` (25 findings) → `adversarial-triage.md` (25/25) → integration
- supervisor.md, drift.md (2 entries), worklog.md

## Next Steps

1. Owner ratification of forks F1–F5 (rfc.md §9).
2. ~~RFC PR~~ — **done**: draft PR #1123 (owner-directed, labels + Backlog / Triage applied).
3. Board filing (OMB-1..14 placeholders), then implementation per rfc.md §4 — Wave-0 proof
   artifacts (`proofs/P<n>-verdict.md`) before any contract freezes.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| D1 extend core, no plugin | plan.md / 06-doctrine-fit.md | the brief's central question |
| D2 meta-tool triad | plan.md / 01 | closed registry + prior-art consensus |
| D3 endpoint manifest lane | plan.md / 02 | [P1] proof; MCP process has no `services__*` env |
| D5 introspection v1, execution gated v2 | plan.md / 04 | fork F2 |
| D7 activation designed | plan.md / 05 | #1071/#1072 lineage; observation → #1090 |

## Files Changed

All new, all inside `.llm/runs/plan-openapi-mcp-plugin--seed/` (briefs/ was pre-existing).

## Gates

N/A — design-only run (see worklog.md).

## Open Questions

- [P1] helpers seam for resolved endpoints; [P2] real spec sizes vs truncation; [P3]
  auth-guarded spec route behavior; the four named execution uncertainties (04 §6).

## Drift and Debt

- Drift: brief-mandated overrides only (drift.md, 1 entry).
- Debt: candidates listed in 06 §5 — none filed.
