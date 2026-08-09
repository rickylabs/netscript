# Context Pack: Hybrid semantic documentation retrieval RFC

## Run metadata

| Field               | Value                                                                                                |
| ------------------- | ---------------------------------------------------------------------------------------------------- |
| Run / branch        | `docs-rfc-mcp-hybrid-retrieval--hybrid-semantic-doc-retrieval-rfc` / `docs/rfc-mcp-hybrid-retrieval` |
| Lifecycle           | author handoff; separate PLAN-EVAL pending                                                           |
| Archetype / overlay | Archetype 2 Integration / docs                                                                       |
| Author thread       | `019fe54e-78aa-75c2-bb5e-9a2a6cebd1b0`, Codex GPT-5.6 Sol xhigh owner override                       |

## Review surface

- RFC: `rfcs/0000-deterministic-first-hybrid-mcp-doc-retrieval.md`
- Tracking: https://github.com/rickylabs/netscript/issues/1410 (`Backlog / Triage`)
- Draft PR: https://github.com/rickylabs/netscript/pull/1409
- Baseline: `origin/main@399f60185d5d01ae68764a8f48d1f716ca3a51aa`
- Incoming foundation: PR #1404 / issue #1102, inspected at `fd926790…` in read-only `ns005-w3b1`

## Architecture in one page

The PR #1404 deterministic lexical/concept/graph ranker stays always available and protects exact
symbols, routes, headings, and rare terms. A package-owned `SemanticDocumentIndexPort` has a
single-process read-only `@tursodatabase/database` adapter and bounded in-memory test adapter. A
query embedding port adapts the existing AI seam without treating docs as conversation memory.

Release generation chunks heading sections, embeds passages with pinned multilingual E5 small,
stores vector8 candidates after a vector32 accuracy comparison, and emits an immutable database plus
identity manifest. The database is a verified GitHub Release asset, not a JSR payload. Local query
inference uses pinned Transformers.js/ONNX; WASM is baseline, WebGPU optional. An English MiniLM
cross-encoder is top-12/off/experimental.

Hybrid mode uses protected exact tier + weighted RRF (`k=60`, lexical 1.00, concept .90, graph .35,
vector .80), bounded top-40 inputs/top-8 output, and stable ties. Any semantic failure returns the
original deterministic order. MCP retains `find_guidance`, adds resource links/list/read/templates,
and adds neither prompts nor subscriptions. Official SDK modernization is a separate compatibility
slice.

## Evidence and gates

`research.md` records repo/upstream/model/Turso/JSR findings. The RFC specifies a 120+-intent
held-out corpus, exact Recall@1 and byte-parity gates, nDCG/abstention/multilingual thresholds,
platform and fallback tests, download/artifact/latency/RSS limits, privacy/injection/poisoning
controls, and a reversible rollout. No product benchmark was run in this docs lane.

## Review priorities for Fable

1. Are ports/domain/presentation/composition boundaries doctrine-correct and sufficiently exact?
2. Are the Turso stable/experimental claims and read-only artifact design defensible for pre-1.0?
3. Are model pins, runtime, licensing, prefixes, hashes, size/CSP and fallback complete?
4. Can artifact publication/cache recovery be reproduced safely across release and package versions?
5. Does protected weighted RRF preserve exact truth while improving mismatch recall?
6. Are MCP resource/tool distinctions and protocol compatibility correct?
7. Are gates hard enough to prevent unsupported/multilingual/security regressions?

## Known unresolved decisions

Named in the RFC: SDK slice order, artifact promotion mechanism, encoder adapter physical package,
cache host/root conventions, language corpus ownership, vector8/weight graduation, and resource-list
granularity. Safe default for all is no default ranking change.

## Process caveat

Daemon capability flag exists, but launch metadata reported remote control disabled. Mobile proof is
pending owner confirmation; no repair/restart or competing writer was created. The author must stop
at `status:plan-eval`; only a fresh native Fable 5 medium evaluator may write a verdict.

## Changed files

Only the RFC and the six files in this run directory. `deno.lock` and all product/source files must
remain unchanged; use the final PR diff as authority.
