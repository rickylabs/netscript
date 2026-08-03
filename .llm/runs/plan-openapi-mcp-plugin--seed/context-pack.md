# Context Pack: plan-openapi-mcp-plugin--seed

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `plan-openapi-mcp-plugin--seed` |
| Branch | `plan/openapi-mcp-plugin` |
| Current phase | generator stage complete; adversarial pass pending |
| Archetype | 3 (`packages/mcp` extension); ARCHETYPE-5 evaluated → rejected (design/canonical/06) |
| Scope overlays | none |

## Current State

The seed design is complete at rev 1: an RFC (`rfc.md`) proposing three read MCP tools
projecting every scaffolded service's live `/api/openapi.json` into the existing
`netscript agent mcp` server, an endpoint-manifest discovery lane for Aspire dynamic ports, a
designed-but-deferred execution tool behind a deny-by-default policy, and an activation design
on the #1071/#1072 lineage. Core ruling: **extend `packages/mcp`; no plugin** (thinness law;
no provider variance; #1093 neither blocks nor is worsened). Nothing implemented; no PR opened
(brief stop-line); board placeholders OMB-1..13 not filed.

## Completed

- research.md (3-way fan-out + in-session ✔ verification; decisive find: oRPC defaults
  `operationId` to the dotted contract path — `@orpc/openapi@1.14.13`)
- plan.md (D1–D9, forks F1–F5), canonical design 00–06, examples ×2, rfc.md
- supervisor.md, drift.md, worklog.md

## Next Steps

1. Supervisor dispatches Codex GPT-5.6 Sol xhigh adversarial pass over the run dir (attack
   surface pre-named in `04-execution-and-security.md §6` and rfc.md §6).
2. Generator integrates findings → `adversarial-sol.md` + `adversarial-triage.md`, rev 2 of
   canonical docs + rfc.md.
3. RFC PR (labels per fork F5) for owner ratification; then board filing; then implementation
   per rfc.md §4 (Wave-0 proofs first).

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
