# Research — hybrid semantic documentation retrieval RFC

## Cycle-2 re-baseline

- Author head `69d1f42b41d466cb36008fea863c57c81cacab80` was clean and fast-forwarded to evaluator
  head `37c6cff3e78a64e55cd69677bda1716d8aa1f811`. The evaluator's `plan-eval.md` is unchanged
  provenance.
- Fresh `origin/main` is `da40fbfe377a9e728f190056771298100297a8f8` (2026-08-10).
- PR #1404 merged as `51a58b4f52f53f9171666a22ffc839c152cae157`; #1416 activation followed as
  `08e4c761d`. Both are ancestors of current main.
- The current tree has 22 MCP tools: 18 read, two metadata, two mutate. `find_guidance` is one of 18
  reads. The embedded prose asset is 12 documents / 253,535 source bytes.
- The #1404 merge fixture contains five cases; current main contains eight after #1416. The
  historical full-corpus snapshot at #1404 is 174 documents / 3,777 headings. The RFC no longer
  presents that cardinality as timeless current state.

## Deterministic seam evidence

Current `GuidanceIndex` has one mutable scalar, not signal lists. `#rank` combines BM25,
title/heading/identity, exact phrase, and concept bonuses. `#applyLinkBoosts` mutates the scalar.
The final sort uses route-hint index, scalar score, then `localeCompare` identity. Current
normalization uses `toLocaleLowerCase()`.

Cycle 2 therefore specifies a real signal-decomposition refactor with five named producers,
protection-reason producers, NFKC + locale-independent lowercase, binary identity ordering, an
immutable five-case serialized #1404 golden, and the current eight-case smoke. The original merged
list remains a first-class baseline and the only fallback result.

## Public-contract evidence

Current main exports `GuidanceConfidence = 'high' | 'medium' | 'low'` and
`GuidanceResult.fallback?: string`. Cycle 1 collided with both. Cycle 2 retains them verbatim and
uses `HybridGuidanceConfidence`, `HybridGuidanceEnvelope`, and `semanticFallback`. Schema v2 is
explicit request negotiation; schema-v1 result fields/property ordering/JSON remain unchanged.

## Doctrine/debt verdict

Debt entry `MCP-A6-V2-SHAPE` classifies the package as an accepted horizontal Archetype-6
CLI/tooling and protocol-engine skeleton pending v2 migration or a subtype ruling. Cycle 2 no longer
calls the whole package Archetype 2. The semantic domain/ports/adapters form an A2-law integration
core folded into the larger A6 package. A6 owns MCP/CLI/resource/presentation/composition. The RFC
names semantic index, embedding, reranker, and resource-contributor extension axes without inventing
a DI container or prematurely claiming the A6 debt is closed.

## Turso native verification

- `deno info npm:@tursodatabase/database@0.7.2` resolved stable 0.7.2 and its native optional
  packages. The cache graph was 92.66 MB on Linux x64; no workspace source or lock changed.
- Shipped package metadata lists Linux glibc x64/arm64, macOS arm64, and Windows x64 only. There is
  no macOS x64 or musl/Alpine build.
- Shipped `database-common@0.7.2/dist/types.d.ts` defines `DatabaseOpts.readonly?: boolean`,
  `fileMustExist?: boolean`, and query timeouts.
- The first `deno doc` invocation put `--filter` after the module and failed with
  `Module not found .../DatabaseOpts`; this was a command-order error, not API evidence. Direct
  `deno doc npm:@tursodatabase/database@0.7.2` and shipped `.d.ts` inspection supplied the evidence.
- Current primary pages disagree in how they illustrate `vector8()` input. The code-indexing guide
  uses `F8_BLOB(384)`, JSON float input, and engine-owned quantization; the vector reference shows
  integer input. Cycle 2 makes vector32 BLOBs normative and vector8 experimental, pinned to the
  engine with test-vector and quality gates.

## Release/tooling findings

Current canary creates an ephemeral version branch, publishes, dispatches production E2E, and
records a green pair against source SHA. Current stable `publish.yml` checks that pair and publishes
JSR; it has no semantic artifact step. Current gates include `check:publish-assets`,
`release:preflight`, and `publish:readiness`.

Cycle 2 locks the missing lifecycle: canary builds/uploads once; stable promotes that exact Actions
artifact before JSR; the checked-in JSR manifest SHA is the trust root; stable never regenerates or
overwrites differing bytes. New named generator, relevance, benchmark, and promotion tools integrate
with the existing three gates. The RFC explicitly labels those tools as future deliverables rather
than current capabilities.

Download policy is also locked. `auto` is offline. CLI `download` permits exact immutable files and
revisions through a small HTTPS host/redirect allowlist for GitHub Releases and Hugging Face/Xet;
custom hosts require an injected downloader adapter.

## MCP, #1201, and oRPC

- Current MCP is handwritten 2025-11-25 JSON-RPC/stdio and imports no official MCP SDK.
- MCP does not use oRPC. The workspace's oRPC dependency/audit/migration work concerns service HTTP
  contracts and is explicitly independent of this RFC.
- Open issue #1201 owns export-surface discovery and is a collision risk for a single
  `resources/list` endpoint. Cycle 2 assigns one A6 resource catalog, distinct prose/export URI
  namespaces, root-only bounded listing, and no competing handlers.

## Evaluation migration

The existing eight-case `guidance-evaluation.json` remains deterministic smoke; the original five
cases seed the immutable #1404 serialized golden. A new checked JSONL schema carries graded 0–3
judgments, BCP-47 query/document languages, calibration/validation split, supported/unsupported,
ambiguity sets, poisoning expectations, adjudication, and corpus SHA. This makes nDCG, Recall,
multilingual/cross-lingual, abstention, ambiguity, and poisoning gates computable.

## Honest limits

- This docs lane did not build embeddings, a database, or a benchmark. Thresholds remain future
  acceptance gates.
- Exact model files/hashes from cycle 1 remain verified; cycle 2 changes storage/provider policy,
  not those model pins.
- The current branch intentionally remains based on the original RFC base plus evaluator/author docs
  commits. Facts are re-pinned to current main in prose; no product merge/rebase is needed for this
  RFC-only amendment.
