# Plan: Hybrid semantic documentation retrieval RFC

## Run metadata

| Field               | Value                                                                                                |
| ------------------- | ---------------------------------------------------------------------------------------------------- |
| Run / branch        | `docs-rfc-mcp-hybrid-retrieval--hybrid-semantic-doc-retrieval-rfc` / `docs/rfc-mcp-hybrid-retrieval` |
| Phase               | `plan-eval` handoff pending                                                                          |
| Target              | `rfcs/0000-deterministic-first-hybrid-mcp-doc-retrieval.md`                                          |
| Archetype / overlay | Archetype 2 Integration / `SCOPE-docs.md`                                                            |

## Goal and boundary

Ratify the package/MCP/release architecture for deterministic-first hybrid docs retrieval. This run
authors only RFC/harness evidence and GitHub metadata. It does not implement, benchmark, launch
resources, open implementation work, merge, or self-evaluate.

## Locked plan

1. Preserve PR #1404's deterministic result as exact/rare authority and byte-parity fallback.
2. Add MCP-owned semantic index and query-embedding ports, new-Turso and bounded in-memory adapters,
   application orchestration, explicit presentation schemas, and a pure composition root.
3. Release-build a pinned section-vector database; distribute it outside JSR as a verified immutable
   GitHub Release asset, with a small compatible manifest.
4. Use multilingual E5 small through pinned local Transformers.js/ONNX; WASM baseline, optional
   WebGPU. Keep the English MiniLM reranker top-12/off/experimental.
5. Protect exact results and fuse lexical/concept/graph/vector ranks using weighted RRF with stable
   ties. Missing semantics returns the untouched deterministic ordering.
6. Add MCP resources/resource links without prompts/subscriptions and isolate official SDK/protocol
   modernization as a compatibility slice.
7. Graduate only through the checked 120+-intent corpus, parity/relevance/abstention/platform,
   latency/RSS/artifact/permissions/security gates in the RFC.
8. Roll out through refactor → artifact/eval → shadow adapters → MCP resources → local encoder →
   gated cache-only default; reranking is separate.

## Doctrine verdict

The design is conforming if implemented as specified: package-owned domain contract, narrow ports,
one-technology adapters, inward dependencies, `AbortSignal`, pure composition, explicit testing
adapter, and CLI-only configuration/permissions. It must not route through Prisma database or
thread-memory abstractions. Existing `MCP-A6-V2-SHAPE` remains accepted debt; this RFC does not
authorize new layer-bypass or barrel debt.

## Open-decision sweep

No unresolved item blocks architecture review. Implementation-timing decisions have owners and safe
defaults: protocol order (MCP maintainer), release promotion (release maintainer), encoder adapter
placement (AI maintainer), allowlist/cache roots (security), language judgments (relevance owner),
vector8/weights (evidence + RFC owner), and resource-list granularity (MCP maintainer). Until
decided: deterministic remains default, vector8/weights do not graduate, resources stay bounded, and
no ranking change ships.

## Risks and mitigations

| Risk                          | Mitigation / gate                                                     |
| ----------------------------- | --------------------------------------------------------------------- |
| Exact-symbol regression       | protected tier; Recall@1 100%; byte-parity fallback                   |
| Pre-1.0 Turso maturity        | isolated adapter; immutable/rebuildable DB; stable features only      |
| Model/runtime size/cold start | explicit download; cache-only auto; hard byte/RSS/latency caps        |
| Multilingual overclaim        | stratified held-out gates; reranker off                               |
| Poisoning/injection           | inert text boundary, allowlisted public sources, adversarial corpus   |
| Supply-chain/corrupt cache    | immutable revisions/hashes, allowlisted URL, atomic cache             |
| Score false authority         | signal provenance and calibrated bands, never probability percentages |
| MCP compatibility             | additive schema, retained text JSON, separate official-SDK slice      |
| JSR portability/size          | external artifact; optional subpaths; no native browser claim         |

## Fitness / validation plan

- Author lane: source/link/terminology alignment, targeted Markdown format, RFC metadata, diff/lock
  hygiene, docs-only scope, GitHub labels/milestone/draft state, structured RESEARCH and PLAN notes.
- Future product lanes: contract/unit/generator/protocol/security/platform tests, offline relevance,
  exact parity, artifact sizes, latency/RSS, permissions, JSR dry-run and `deno doc --lint`.
- E2E/runtime is intentionally not run for this docs-only proposal; CI skip labels are required.

## Commit slices

1. `a526bbcc5` activation/evidence and draft review surface.
2. `058d730ab` transport correction plus architecture/API/fusion core.
3. Model/database/artifact/MCP/evaluation/security/rollout plus completed research plan.
4. Validation evidence, lifecycle metadata, and separate Fable 5 medium PLAN-EVAL handoff.

## Evaluator handoff

A fresh native Fable 5 medium session must apply the formal PLAN-EVAL protocol. It must challenge
the stable/experimental Turso boundary, exact API direction, cache/release reproducibility, MCP
compatibility, model/runtime/license pins, RRF protection, corpus/gates, security, and rollout. This
author must not create `plan-eval.md`, issue a verdict, or change `status:plan-eval` afterward.
