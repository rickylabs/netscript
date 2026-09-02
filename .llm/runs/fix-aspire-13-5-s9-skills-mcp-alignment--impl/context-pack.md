# Context Pack: S9 Phase A

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-aspire-13-5-s9-skills-mcp-alignment--impl` |
| Branch | `fix/aspire-13-5-s9-skills-mcp-alignment` |
| Current phase | `authenticated Aspire MCP telemetry adapter — co-author audit` |
| Archetype | `6 - CLI / Tooling` |
| Scope overlays | `docs` |

## Current State

The telemetry gate layer now reads authenticated Aspire telemetry through `aspire agent mcp` stdio
instead of unauthenticated Dashboard HTTP. The shared `TelemetryQueryPort` shape is unchanged, the
private Flow-B reader uses the same adapter, and the unused compatibility reader was removed. Static
tests and scoped gates pass; no AppHost, Docker container, hosted runtime tier, workflow mutation,
or evaluator was started.

## Completed

- Harness/bootstrap, skill chain, doctrine/archetype selection, contract re-baseline.
- RED-first MCP gate test, one static MCP capture, and the injectable gate/lifecycle implementation.
- Both runtime tiers contain the gate after Aspire waits/describe and before cleanup; runtime absence
  produces a durable `SKIPPED` lifecycle receipt.
- Canonical Aspire prose, mirrors, embedded assets, MCP corpus, explicit upstream workflow skill
  installation, and deterministic dogfood bundle/check are implemented.
- The Codex Sol prose-audit request is drafted for supervisor dispatch, and all locally runnable
  Phase-A gates pass.
- Opposite-family docs audit cycle 1 returned `FAIL_FIX`; all H1/M1–M4/L1 changes are implemented in
  one prose/regeneration slice with exact non-runtime CLI-help receipts.
- D-148 completed the S9 un-stack with additive gate-list unions and a selective workflow artifact
  union that retains S8's narrow paths while adding only the two S9 MCP receipt paths.
- D-194 root cause is confirmed and the alternative gate-ordering/sqlite-routing hypotheses are
  eliminated with static suite evidence.
- D-213 converged the 12-commit S9 range onto S8 `d1c6d8b54`, recorded all three generated-only
  conflict resolutions, regenerated the barrel, and proved the non-generated product surface is
  blob-identical.
- Authenticated telemetry repair is RED/GREEN complete with realistic MCP output, all raw Dashboard
  readers removed, and the requested static suite green.
- Independent co-author audit confirmed all three shared-query consumers and Flow-B's former private
  reader use the MCP adapter, then made the observed HTTP 401 and HTTP-200/empty bypasses explicit in
  the focused regression names and assertions.

## In Progress

- Deliver the focused co-author evidence commit for supervisor cherry-pick and separate review.

## Next Steps

1. Do not dispatch PLAN-EVAL or IMPL-EVAL; the supervisor automatically owns the fresh IMPL-EVAL
   after evaluated bytes change.
2. Runtime remains parked host-wide; CI supplies the runtime verdict.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Phase A only | owner dispatch | Never start an AppHost or containers. |
| External evaluation | harness + supervisor | This session does not self-certify. |
| D-213 is convergence, not repair | owner dispatch | Do not chase `database.seed`; preserve product blobs and let CI supply runtime evidence. |
| MCP owns telemetry authentication | owner dispatch | Keep anonymous mode false; normalize stdio tool results behind the existing query port. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-aspire-13-5-s9-skills-mcp-alignment--impl/**` | new | Implementation run evidence |
| `packages/cli/e2e/src/application/gates/scaffold/**` | modified | Authenticated MCP telemetry adapter and raw-reader convergence |
| `packages/cli/e2e/tests/application/gates/**` | modified | Realistic adapter RED/GREEN coverage; obsolete URL-token test removed |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | focused PASS; upstream surface mismatch preserved | worklog + static receipt |
| Fitness | slice-1 PASS | `quality:scan`, `arch:check` |
| Runtime | Phase B deferred | owner contract |
| Consumer | PASS | generator checks and zero-state dogfood check |
| Exact dashboard classification | PASS | 16 focused tests plus scoped check/lint/fmt |
| D-148 un-stack | PASS | S8 ancestry, 10-commit range map, narrow workflow paths, 60 focused tests, scoped wrappers, repo check, parity, and quality gate |
| D-194 static repair | PASS | RED-first lifecycle config-path regression; 43 focused tests; 3-file scoped check/lint/fmt; quality gate; repo check with `failedBatches: 0` |
| D-213 convergence | PASS pending delivery | Exact S8 ancestry; 12-commit mapping; 23/23 non-generated blobs identical; generated barrel reproducible; 21-file scoped gates; 82 tests; parity `fail=0`; quality gate green |
| Authenticated telemetry static slice | PASS pending delivery | RED captured; focused 2/2; affected 73/73; requested suite 241/241; 6-file check/lint/fmt; quality gate green |
| Authenticated telemetry co-author audit | PASS pending delivery | Pre-adapter RED at `e72da5161`; focused 2/2 GREEN; 401 and silent-empty raw Dashboard guards each observed zero HTTP reads; one-file check/lint/fmt green |

## Open Questions

- How upstream Aspire intends `get_integration_docs` to become available remains unresolved; no
  Phase-A evidence permits claiming it was observed.
- Aspire's MCP projection omits some raw OTLP fidelity; the held hosted tiers must establish whether
  every later Flow-B/reconnect assertion can be satisfied through the projected surface.
- The owner has superseded the repository's skill-mirroring model. Global `.agents/skills` authority,
  the `.claude` bridge, and sync-tool removal belong to the separately coordinated bridge repair;
  this telemetry co-author branch intentionally does not overlap those files.

## Drift and Debt

- Drift: local `rtk` executable is absent; focused raw commands are used.
- Significant drift: static Aspire 13.5.3 MCP has only 14 tools; see `drift.md` and the receipt.
- Process drift: D-133 correctly aborted on an unauthorized workflow conflict; D-148 supplied the
  selective resolution and the resumed rebase completed.
- Mechanical drift: three D-213 `!` mappings are generated-only and fully explained in
  `d213-converge-onto-s8.md`.
- Significant drift: Aspire MCP trace/log output is a lossy projection; see the 2026-09-02 entry in
  `drift.md`.
- Debt: no new debt accepted.

## Commits

- `d81f5fd34` — MCP smoke receipt gate, including the S8/S9 gate-registration union.
- `06103eeef` — workflow receipt retention with D-148's narrow selective artifact union.
- `8d8c5e00b` — Aspire skills, corpora, agent init, and dogfood alignment; generated corpus conflict took upstream before final asset regeneration.
- `55791043e` — deterministic skills barrel regeneration after D-213 convergence.
- Draft PR #1759 contains a separate implementation comment for each commit.
