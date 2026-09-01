# Plan: refresh the MCP export-surface corpus

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-mcp-export-corpus-refresh--1859` |
| Branch | `fix/mcp-export-corpus-refresh` |
| Phase | `plan` |
| Target | `packages/mcp` generated export corpus |
| Archetype | `2 — Integration` |
| Scope overlays | `none` |

## Archetype and Doctrine

`@netscript/mcp` is classified as Archetype 2 / Keep. This slice preserves its token-bounded
transport and adapter boundaries; it only refreshes an infrastructure corpus from the authoritative
workspace public exports. A1, A2, A9, and A14 matter because the corpus mirrors published contracts
and its freshness check is the protecting fitness function.

## Goal

Regenerate the stale MCP export-surface corpus so the exact-base RED becomes GREEN without changing
SDK source, generator logic, CI wiring, or any other product artifact.

## Scope

- Run `deno task gen:mcp-export-corpus`.
- Accept only `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts`
  as the generated product change.
- Preserve and commit this run's required `.llm/runs/**` context artifacts.

## Non-Scope

- No changes under `packages/sdk`, `.llm/tools/agentic`, `packages/ai`, or `.github/workflows`.
- No root-cause change to #1841 and no new merge gate or CI wiring.
- No hand edits to the generated corpus.
- No PLAN-EVAL or IMPL-EVAL per coordinator/owner direction.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Generator output is authoritative. | Hand-patching a generated payload would be a defect. |
| D2 | Stop on any second product file or unexpectedly broad corpus diff. | The issue authorizes only the #1841 surface refresh. |
| D3 | Capture every command's real exit without pipelines. | Prevents false-green evidence. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Generator and output path | resolved | Explicit in the coordinator brief. |
| Evaluation routing | safe to defer | Owner retains independent review/waiver and explicitly forbids evaluation here. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Generator touches extra files | Inspect raw `git status` immediately and stop if found. |
| Broad drift in payload | Inspect diff stat and the expected metadata/payload lines before gates. |
| Validation mutates `deno.lock` | Run `git diff --exit-code -- deno.lock`; never commit lock churn. |

## Anti-Patterns and Debt

- Avoid AP-18-style hand-maintained generated snapshots by using the checked-in generator.
- Existing `MCP-A6-V2-SHAPE` and `mcp-tool-contracts-a8-1102` debt are unaffected.
- No debt entry is created, deepened, or closed.

## Commit Slice and Validation Plan

One slice: regenerate the corpus, prove RED→GREEN, run the coordinator-specified Tier-A gates plus
the package quality/JSR fitness gates required by harness, and commit the generated file with the
run artifacts. PLAN-EVAL: N/A because this is a mechanical regeneration with no open design choice.
