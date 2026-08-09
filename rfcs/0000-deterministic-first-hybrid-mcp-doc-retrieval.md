---
rfc: 0000
title: Deterministic-first hybrid semantic documentation retrieval for NetScript MCP
status: Draft
authors: ["@rickylabs"]
created: 2026-08-09
tracking-issue: https://github.com/rickylabs/netscript/issues/1410
target-milestone: Backlog / Triage
---

# Deterministic-first hybrid semantic documentation retrieval for NetScript MCP

## Summary

NetScript MCP will retain its deterministic lexical, curated-concept, and link-graph documentation
ranker as the always-available authority for exact symbols and rare terms, and optionally augment it
with release-built section embeddings. A package-owned semantic retrieval port will have a native,
read-only `@tursodatabase/database` adapter and a bounded in-memory adapter. Query-time embeddings
will run locally when a pinned model is available; otherwise the result is byte-for-byte compatible
with deterministic retrieval. Rank lists will be fused with deterministic weighted reciprocal-rank
fusion (RRF), exact matches will remain protected, and every result will expose citations, hashes,
matched signals, score provenance, and calibrated confidence bands rather than probability-like
claims. No chat or generative model enters the retrieval path.

## Motivation

The intent-aware deterministic ranker in [PR #1404](https://github.com/rickylabs/netscript/pull/1404)
is the correct foundation: it is inspectable, fast, offline, and strong for identifiers, rare terms,
curated concepts, and linked guidance. It cannot, by construction, fully bridge paraphrases or
cross-language vocabulary when query and documentation share few tokens. Semantic retrieval helps
those cases, but replacing deterministic search with opaque vector similarity would regress the
queries developers most need to trust and would turn an optional model/runtime into an availability
dependency.

This RFC therefore treats semantics as a bounded recall channel, not as a new source of truth. The
design must work in local and embedded MCP deployments, stay useful with no network or model cache,
fit NetScript's publish and architecture constraints, and be measurable against unsupported or
ambiguous requests such as “add a capability NetScript does not ship.” Without a ratified boundary,
database, model, MCP presentation, and AI-memory concerns are likely to become coupled in ways that
are hard to remove.

## Guide-level explanation

### User experience

`find_guidance` remains the primary model-controlled discovery tool. Existing callers continue to
send an intent and receive bounded guidance. When a verified semantic artifact and local encoder are
available, the server adds semantic candidates before returning the same kind of citations. Exact
symbols remain first even when a looser semantic match has a high cosine score.

```json
{
  "intent": "Wie füge ich Hintergrundarbeit mit Wiederholungen hinzu?",
  "limit": 5
}
```

The additive result shape explains the answer without presenting any score as authoritative:

```json
{
  "mode": "hybrid",
  "policyVersion": "hybrid-rerieval/v1",
  "confidence": { "band": "medium", "calibrationVersion": "intent-corpus/v1" },
  "results": [{
    "title": "Workers",
    "uri": "netscript-docs://packages/workers/readme#retries",
    "sourceSha256": "…",
    "matchedSignals": ["vector", "curated-concept", "link-graph"],
    "score": {
      "fusion": { "method": "weighted-rrf", "value": 0.0341, "k": 60 },
      "ranks": { "concept": 1, "graph": 3, "vector": 2 }
    }
  }],
  "fallback": null
}
```

Raw lexical scores and cosine similarity may be present as diagnostics, but are labelled by signal
and are never converted to a percentage. Confidence is a coarse, versioned band calibrated on the
checked intent corpus; it describes observed ranking behavior, not truth.

### Operating modes

The CLI composition root maps explicit configuration to the core factory:

| Mode | Network behavior | Ranking behavior |
| --- | --- | --- |
| `off` | none | deterministic only; kill switch |
| `auto` (initial default) | none | use verified cached assets, otherwise deterministic |
| `download` | allowlisted artifact/model fetch when missing | hybrid after integrity verification |
| `shadow` | same asset policy as configured | compute hybrid metrics, return deterministic ordering |

An absent runtime, unsupported platform, denied permission, timeout, dimension mismatch, corrupt
cache, or unsupported database feature causes a bounded fallback reason and the original
deterministic result. Cancellation remains cancellation and is not hidden as fallback.

### MCP surfaces

The existing tool is retained because tools are model-controlled in the
[MCP server model](https://modelcontextprotocol.io/specification/2026-07-28/server). Each returned
document also has a stable `netscript-docs:` resource URI and a resource link. Applications can
list/read those resources and render citations without invoking another tool. NetScript will not
add a prompt: prompts are user-controlled templates, not a retrieval transport. The release corpus
is immutable for a server process, so resource subscriptions and list-changed notifications are
also intentionally absent.

## Reference-level explanation

### Baseline and scope

This RFC is designed on top of PR #1404 rather than the older `origin/main` behavior. That change
adds the 22nd read tool, `find_guidance`, and a shared guidance index used by filesystem and embedded
corpora. Its ranking policy combines a BM25-like lexical signal, exact phrase and heading boosts,
curated concepts, and one-hop internal-link boosts with stable slug/section tie-breaks. Its release
asset is generated and byte-checked in the existing publish workflow. Those behaviors remain the
normative deterministic baseline.

The RFC changes no product code. A future implementation may refactor that index to expose
individual ranked candidate lists, but must keep its public deterministic result and serialization
unchanged when semantic retrieval is unavailable or disabled.

### Architecture and dependency direction

`@netscript/mcp` remains an Archetype 2 integration package. The docs overlay applies because this
document changes public contracts and package boundaries; the Archetype 2 overlay applies because
the future implementation has a package-owned external database/model integration. The dependency
direction is the doctrine's domain → ports → application flow, with adapters depending inward on
ports and a pure factory composition root:

```text
MCP presentation / CLI edge
          │ maps schema + configuration
          ▼
application: FindDocumentationGuidance
     │          │               │
     ▼          ▼               ▼
deterministic  SemanticIndexPort  QueryEmbeddingPort
domain policy       ▲                  ▲
     │               │                  │
     └──── fusion / confidence ─────────┘
                     ▲                  ▲
       new-Turso or in-memory     local AI-seam adapter
```

The semantic index contract belongs to `@netscript/mcp`, because its records, citations, corpus
identity, and fallback semantics are documentation-retrieval concepts. `@netscript/database` is a
Prisma application-database abstraction and is not reused. `@netscript/ai`'s narrow embedding
provider may be adapted at the edge, but its thread/transcript memory ports and generic retriever do
not own MCP citation or corpus contracts. This avoids disguising document retrieval as “memory.”

Proposed future placement (names are normative; physical directories may follow the package's
existing horizontal skeleton until its recorded shape debt is retired):

```text
packages/mcp/src/
  domain/document-retrieval.ts
  ports/semantic-document-index.ts
  ports/query-embedding.ts
  application/find-documentation-guidance.ts
  adapters/turso-semantic-document-index.ts
  adapters/in-memory-semantic-document-index.ts
  adapters/ai-query-embedding.ts
  presentation/mcp/document-resources.ts
  composition/create-document-retrieval.ts
```

### Public contracts

All asynchronous I/O accepts `AbortSignal`; ports do not read environment variables, perform
downloads, or choose global defaults.

```ts
export type RetrievalSignal = "lexical" | "curated-concept" | "link-graph" | "vector" |
  "reranker";

export interface CorpusIdentity {
  readonly docsContentSha256: string;
  readonly corpusSchemaVersion: string;
  readonly chunkerSchemaVersion: string;
}

export interface DocumentSectionRef {
  readonly sectionId: string;
  readonly uri: `netscript-docs://${string}`;
  readonly slug: string;
  readonly heading: string;
  readonly sectionOrdinal: number;
  readonly sourceSha256: string;
}

export interface SemanticCandidate {
  readonly section: DocumentSectionRef;
  readonly vectorRank: number;
  /** Cosine similarity for diagnostics, not probability or final relevance. */
  readonly cosineSimilarity: number;
}

export interface SemanticDocumentIndexPort {
  readonly identity: CorpusIdentity;
  search(
    embedding: Readonly<Float32Array>,
    options: { readonly limit: number; readonly signal?: AbortSignal },
  ): Promise<readonly SemanticCandidate[]>;
  close(): Promise<void>;
}

export interface QueryEmbeddingPort {
  readonly model: {
    readonly id: string;
    readonly revision: string;
    readonly dimensions: 384;
    readonly normalization: "l2";
    readonly queryPrefix: "query: ";
  };
  embedQuery(text: string, options?: { readonly signal?: AbortSignal }): Promise<Float32Array>;
}

export interface DeterministicCandidateLists {
  readonly lexical: readonly RankedSection[];
  readonly concepts: readonly RankedSection[];
  readonly graph: readonly RankedSection[];
  readonly protectedExact: ReadonlySet<string>;
}

export type SemanticFallbackReason =
  | "disabled"
  | "artifact-missing"
  | "artifact-corrupt"
  | "unsupported-platform"
  | "runtime-unavailable"
  | "permission-denied"
  | "model-mismatch"
  | "dimension-mismatch"
  | "timeout"
  | "database-unavailable";

export interface GuidanceScoreProvenance {
  readonly method: "deterministic" | "weighted-rrf" | "reranked-rrf";
  readonly fusionScore?: number;
  readonly rrfK?: 60;
  readonly ranks: Partial<Record<RetrievalSignal, number>>;
  readonly raw: Partial<Record<"lexical" | "cosine" | "reranker", number>>;
}

export interface GuidanceConfidence {
  readonly band: "high" | "medium" | "low" | "insufficient";
  readonly calibrationVersion: string;
  readonly basis: readonly string[];
}

export interface HybridGuidanceResult {
  readonly mode: "deterministic" | "hybrid" | "shadow";
  readonly policyVersion: string;
  readonly corpus: CorpusIdentity;
  readonly results: readonly (GuidanceSection & {
    readonly matchedSignals: readonly RetrievalSignal[];
    readonly score: GuidanceScoreProvenance;
  })[];
  readonly confidence: GuidanceConfidence;
  readonly fallback: null | { readonly reason: SemanticFallbackReason };
}
```

The bounded testing adapter is exported from a testing-only subpath and rejects more than 1,024
sections or dimensions other than 384. The native Turso adapter is an optional adapter subpath. The
core export must not make a native database or model runtime mandatory for deterministic consumers.

The composition root is explicit and side-effect free:

```ts
export interface DocumentRetrievalOptions {
  readonly mode: "off" | "auto" | "download" | "shadow";
  readonly deterministic: DeterministicGuidanceIndex;
  readonly semanticIndex?: SemanticDocumentIndexPort;
  readonly queryEmbedding?: QueryEmbeddingPort;
  readonly reranker?: CandidateRerankerPort;
  readonly policy?: HybridRetrievalPolicy;
  readonly telemetry?: RetrievalTelemetryPort;
}

export function createDocumentRetrieval(
  options: DocumentRetrievalOptions,
): FindDocumentationGuidance;
```

The CLI alone maps flags/environment and grants filesystem/network permissions. Library core and
the in-memory adapter require none. A remote embedding adapter, if ever supplied, must be selected
explicitly and disclose that query text leaves the process.

### Deterministic fusion policy

For hybrid mode, each channel emits at most 40 candidates. Duplicate chunks are collapsed to their
best rank for a source section. Version `hybrid-retrieval/v1` uses weighted RRF with `k = 60`:

```text
score(d) = Σ signal weight(signal) / (60 + rank(signal, d))

lexical = 1.00   curated-concept = 0.90
link-graph = 0.35   vector = 0.80
```

These initial weights are a ratified candidate, not magic constants: the checked intent corpus must
confirm them against a preregistered grid without changing the gates. RRF is selected because it
combines ranks whose raw BM25-like, graph, and cosine values are not calibrated to a shared scale.

Exact symbol, exact heading, exact route hint, and protected rare-term matches identified by the
deterministic ranker form a protected tier; semantic candidates cannot move above that tier.
Results are bounded to eight. Ties resolve by protected tier, descending RRF, deterministic baseline
rank, vector rank, slug, then section ordinal. The same corpus, policy, and runtime therefore produce
the same ordering. If the vector channel cannot run, the application returns the original
deterministic ranking directly rather than applying RRF to the remaining lists.

An optional cross-encoder can rerank only the top 12 fused candidates, preserve the protected tier,
and use the same stable tie-breaks. It is experimental and off by default; absence or failure returns
the pre-rerank RRF order.
