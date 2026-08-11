# Context Pack: Hybrid semantic documentation retrieval RFC — cycle 2

## State

- Draft PR: https://github.com/rickylabs/netscript/pull/1409
- Tracking issue: https://github.com/rickylabs/netscript/issues/1410
- RFC: `rfcs/0000-deterministic-first-hybrid-mcp-doc-retrieval.md`
- Run: `.llm/runs/docs-rfc-mcp-hybrid-retrieval--hybrid-semantic-doc-retrieval-rfc/`
- Author thread: `019fe54e-78aa-75c2-bb5e-9a2a6cebd1b0`
- Cycle-1 evaluator provenance: `plan-eval.md` at `37c6cff3e78a64e55cd69677bda1716d8aa1f811`
- Current factual baseline: `origin/main@da40fbfe377a9e728f190056771298100297a8f8`, merged #1404
  `51a58b4f5`

## Cycle-2 architecture

The current scalar ranker is not mislabeled as signal lists. A required decomposition refactor
derives baseline, lexical, curated-concept, link-graph, and protected producers and must pass a
frozen five-case #1404 full-serialization golden plus current eight-case smoke before hybrid work.
Locale-stable NFKC/default lowercase and binary identity ordering replace locale-dependent calls.

The package remains under accepted Archetype-6 horizontal-shape debt. A narrow A2-law semantic core
is folded inward; A6 retains MCP/CLI/resources/permissions/composition. Existing public
`GuidanceConfidence` and `fallback` remain. Explicit schema v2 uses non-colliding hybrid names.

Provider-scoped determinism is WASM-only with fixed signal order, round12 RRF, and complete ties.
WebGPU is shadow-only. Normative storage is vector32; vector8 is engine-pinned experimental. Turso
0.7.2 native support is Linux glibc x64/arm64, macOS arm64, Windows x64; macOS x64 and musl/Alpine
deterministically fall back.

Canary generates/uploads the database once. Stable promotes that exact artifact before JSR. The JSR
manifest SHA is the trust root. Host/redirect allowlists and new generator/evaluator/benchmark/
promotion tools are fixed. Current eight-case fixture remains smoke; a new graded JSONL corpus owns
nDCG/Recall/language/unsupported/ambiguity/poisoning gates. One bounded resource catalog coordinates
prose with #1201 export discovery. MCP SDK and oRPC v2 migrations are explicitly independent.

## Cycle-2 review map

`plan.md` maps every F-C1–F-C8 finding to exact RFC sections. `research.md` holds re-baseline and
native Deno evidence. `worklog.md` holds raw author gate outcomes. `plan-eval.md` must remain
cycle-1 evaluator-authored provenance.

## Remaining boundary

No implementation, evaluator launch, ready transition, merge, or release. After the single author
amendment commit/push/comment, the root supervisor launches a fresh separate Fable cycle 2. Safe
defaults keep deterministic current behavior until ratification and measured graduation.

## Transport caveat

Same existing thread only. Earlier launch metadata reported remote control disabled despite the
daemon capability flag; no repair/restart or rival thread is authorized. Return control to the root
supervisor after handoff.
