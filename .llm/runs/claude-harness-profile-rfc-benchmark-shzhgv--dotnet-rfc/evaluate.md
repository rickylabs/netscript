# IMPL-EVAL — claude-harness-profile-rfc-benchmark-shzhgv--dotnet-rfc

**Verdict: PASS** (`OPENHANDS_VERDICT: PASS`)

| Field | Value |
| --- | --- |
| Evaluator session | OpenHands cloud run 32311880502 (separate session) |
| Model / route | `openrouter/deepseek/deepseek-v4-flash-0731` (lane-policy relay route; owner-dispatched after draft→ready) |
| Trusted base | aac320d74a1a329d7d6578bf73e7892976dccda6 (main after #1683) |
| Evaluated head | 7806c7e9639278f181b9ecc22cf34b498aba6a71 |
| Verdict provenance | PR #1685 comment (2026-08-19T23:13Z) |

## Independently verified by the evaluator

- Every percentile in `results-dotnet.md` recomputed from raw JSONL (13 series + probe + H4;
  0 failures everywhere; H1 100 / others 300 measured) — exact match.
- `buildDotNetCommand` three-mode claim verified at `argv-builder.ts:41-64` ("cited line range is
  exact"); H3≡H3x seam control consistent.
- All pre-registered plan-L5 criteria confirmed fired: (a) NativeAOT recipe (within 2× of run-1
  natives, ≈8× RSS under JIT), (b) file-based dev-only (6.9×), (c) Bootsharp promoted (1.0× of
  wasmbuild). RFC recommendations match the criteria.
- Docs gates, link integrity, lock hygiene, `ci:skip-*` intent, PLAN-EVAL: N/A justification —
  all confirmed. No review threads pending.

## Non-blocking notes (no action required)

- Prior-series citations (Rust 53.1, wasmbuild 53.9, scriptc figures, Deno 108) are attributed
  cross-run references — the established series pattern, not a correctness gap.
- External maturity facts (Hyperlight, componentize-dotnet, Bootsharp LLVM) are explicitly
  scoped as cite-only.
- `area:plugins` label reflects the benchmark driving plugin read paths, not a framework change.

## Post-verdict head note

Commits after 7806c7e are run-artifact-only (this mirror + close bookkeeping); deliverables
unchanged since the evaluated head.
