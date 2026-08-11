---
rfc: 0004
title: Deterministic-first hybrid semantic documentation retrieval for NetScript MCP
status: Accepted
authors: ['@rickylabs']
created: 2026-08-09
tracking-issue: https://github.com/rickylabs/netscript/issues/1410
target-milestone: Backlog / Triage
---

# Deterministic-first hybrid semantic documentation retrieval for NetScript MCP

## Summary

NetScript MCP will preserve the merged deterministic guidance ranker as its always-available result
and exact-term authority, then optionally add a release-built semantic recall channel. Before hybrid
ranking exists, the current scalar ranker will be split into explicit candidate producers behind a
frozen byte-parity gate. A package-owned semantic index port will have a native read-only
`@tursodatabase/database` adapter and a bounded in-memory adapter. The normative v1 database stores
float32 vectors; Turso `vector8()` remains experimental until its engine-owned quantization is
independently characterized.

Successful hybrid v2 responses fuse deterministic and vector rank lists with protected weighted
reciprocal-rank fusion (RRF), stable fixed-order arithmetic, citations, hashes, matched signals,
score provenance, and calibrated confidence bands. Legacy v1 output remains exactly the existing
`GuidanceResult`. Missing assets, unsupported native platforms, or any semantic failure take the
unchanged deterministic path. The default execution provider is WASM; WebGPU is shadow-only and is
outside the normative determinism claim. No chat or generative model enters the critical path.

## Motivation

The ranker merged by [PR #1404](https://github.com/rickylabs/netscript/pull/1404) is inspectable,
fast, offline, and strong for identifiers, curated concepts, and linked guidance. It deliberately
does not solve vocabulary mismatch, paraphrases, or cross-language queries. Semantic retrieval can
improve those cases, but replacing the deterministic result with opaque vector similarity would
weaken exact-symbol behavior and turn a model/runtime into an availability dependency.

This RFC treats semantics as a bounded recall channel rather than a new source of truth. It also
locks seams that otherwise invite accidental coupling: immutable release artifacts versus JSR,
documentation retrieval versus conversational memory, MCP JSON-RPC versus oRPC, and protocol
presentation versus database/model adapters.

## Guide-level explanation

### Compatibility modes

Existing callers send the same request and receive the existing `GuidanceResult` JSON. They do not
receive semantic metadata, even when the server internally falls back:

```json
{ "intent": "validated route-bound form" }
```

Callers that explicitly negotiate `responseSchemaVersion: 2` can receive a hybrid envelope:

```json
{
  "intent": "Wie füge ich Hintergrundarbeit mit Wiederholungen hinzu?",
  "responseSchemaVersion": 2
}
```

```json
{
  "schemaVersion": 2,
  "guidance": {
    "intent": "Wie füge ich Hintergrundarbeit mit Wiederholungen hinzu?",
    "confidence": "medium",
    "recommendations": [],
    "related": [],
    "truncated": false
  },
  "hybrid": {
    "mode": "hybrid",
    "policyVersion": "hybrid-retrieval/v1",
    "confidence": { "band": "medium", "calibrationVersion": "intent-corpus/v1" },
    "results": [{
      "uri": "netscript-docs://prose/packages/workers/readme#retries",
      "sourceSha256": "…",
      "matchedSignals": ["vector", "curated-concept", "link-graph"],
      "score": {
        "method": "weighted-rrf",
        "fusionScore": 0.0341,
        "rrfK": 60,
        "ranks": { "curated-concept": 1, "link-graph": 3, "vector": 2 }
      }
    }]
  }
}
```

The nested `guidance` object retains every legacy field and meaning. Raw lexical scores, cosine
similarity, and reranker logits are diagnostics, never probabilities. Hybrid confidence is a
versioned band calibrated on held-out judgments; it is not truth.

### Operating modes

| Mode                     | Network behavior                           | Returned ranking                                       |
| ------------------------ | ------------------------------------------ | ------------------------------------------------------ |
| `off`                    | none                                       | current deterministic result only                      |
| `auto` (initial default) | none                                       | verified cache if present; otherwise deterministic     |
| `download`               | fixed allowlisted artifact/model URLs only | hybrid after full verification                         |
| `shadow`                 | configured asset policy                    | deterministic result; hybrid evidence recorded locally |

An absent model/runtime, denied permission, corrupt cache, timeout, dimension mismatch, or database
error never prevents guidance. `AbortError` remains cancellation and is not converted to fallback.

### MCP surfaces

`find_guidance` remains the model-controlled ranking tool. Successful hybrid v2 results may include
MCP resource links. The application-controlled resource surface lists bounded document roots and
reads exact allowlisted sections. It adds neither prompts nor subscriptions because retrieval is not
a user-authored prompt and a release corpus is immutable during a process.

## Reference-level explanation

### Ratification baseline

The author re-baselined this cycle on `origin/main@da40fbfe377a9e728f190056771298100297a8f8`. PR
#1404 is merged there as `51a58b4f52f53f9171666a22ffc839c152cae157`; PR #1416 subsequently extended
its activation/evaluation behavior as `08e4c761d`. Current MCP exposes 22 tools: 18 read, two
metadata, and two mutating tools. `find_guidance` is one of those 18 read tools.

At the #1404 merge, the full generated corpus snapshot contained 174 documents and 3,777 heading
sections. That count is historical evidence, not a permanent constant. Current main's bounded
embedded release corpus contains 12 documents and 253,535 source bytes. The semantic generator must
recompute and manifest current document/section cardinality at every release; ratification does not
hard-code 3,777 as current forever.

The current guidance fixture began with five cases at #1404 and contains eight cases on current main
after #1416. Both roles are specified under Evaluation below.

### Existing scalar ranker and required deterministic seam

The merged `GuidanceIndex` does **not** currently produce independent rank lists. It:

1. normalizes the intent and activates curated concepts;
2. accumulates BM25-like term score, title/heading/identity boosts, exact-phrase bonus, and concept
   bonuses into one mutable scalar per section;
3. mutates those scalar scores with one-hop link boosts; and
4. sorts by route-hint index, merged scalar score, then section identity.

Hybrid work therefore begins with an explicitly named **deterministic signal-decomposition
refactor**, not a passive exposure of existing lists. It produces all of the following from one
canonical parse while retaining the original merged result:

| Producer                 | Exact source in the merged ranker                                                                            | Ordered output                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| `deterministic-baseline` | original post-link scalar list and route-hint primary sort                                                   | exact `GuidanceIndex.find()` order                                    |
| `lexical`                | BM25 term frequency plus title/heading/identity token contributions, excluding phrase/concept/link additions | score desc, binary section identity                                   |
| `curated-concept`        | activated aliases, required-any support, per-term concept bonuses, then declared `routeHints` order          | route index, contribution desc, binary identity                       |
| `link-graph`             | targets that actually receive the existing one-hop boost from positive source candidates                     | best source baseline rank, target baseline rank, binary identity      |
| protected tier           | route-hint hits; normalized full exact-phrase hits; exact activated concept-alias + required-any hits        | reason priority, declared route order, baseline rank, binary identity |

An exact symbol or rare term is protected only when it is an exact normalized identity/token match
in the lexical producer; semantic similarity alone never creates protection. The producer records
the protection reason (`route-hint`, `exact-phrase`, `exact-concept`, `exact-identity`) for tests
and provenance.

Before any hybrid ordering is enabled, tooling checks in a frozen #1404 golden fixture containing
the five original intents, corpus SHA, source commit, complete serialized `GuidanceResult` values,
and recommendation/related ordering. The decomposed implementation must reproduce those bytes from
the #1404 corpus. It must also reproduce the current eight-case smoke fixture on the ratification
baseline. The old scalar path remains callable until both gates pass; no vector work can waive or
update the golden to match new output.

Locale-dependent behavior is removed during this refactor: normalization is
`value.normalize('NFKC').toLowerCase()` and stable identity comparison is Unicode
code-point/code-unit ordering implemented without `toLocaleLowerCase()` or `localeCompare()`. The
golden records any intentional normalization delta separately; legacy serialization parity otherwise
remains binding.

### Architecture, archetype, and extension axes

The package is not reclassified wholesale as Archetype 2. The open debt entry `MCP-A6-V2-SHAPE`
records `@netscript/mcp` as a brief-locked horizontal **Archetype 6 CLI/tooling and protocol-engine
skeleton**, with a gate to migrate to the A6 v2 kernel/vertical shape or obtain a formal
protocol-engine subtype ruling. This RFC neither retires that debt nor silently declares its current
folders normative.

The semantic retrieval **integration core** folds Archetype 2 port/adapter laws into the larger A6
package, as doctrine requires when two archetypes apply. The A6 presentation/composition surface
owns stdio, MCP schemas, CLI flags, resource catalogs, permissions, and lifecycle. The folded A2
core owns retrieval domain policy, ports, use-case orchestration, and technology-specific adapters.

```text
Archetype 6 edge (existing accepted horizontal debt)
  MCP tool/resource schemas ─ CLI flags/env ─ stdio ─ resource catalog ─ composition
                                      │ injected options only
                                      ▼
Folded Archetype 2 semantic core
  deterministic decomposition ─ fusion ─ confidence
             │              │                 │
             ▼              ▼                 ▼
    SemanticIndexPort  QueryEmbeddingPort  CandidateRerankerPort
             ▲              ▲                 ▲
       Turso / memory   local AI adapter   optional local adapter
```

Named extension axes are: semantic-index adapter, query-embedding provider, optional reranker, and
MCP resource contributor. They are constructor/factory injected and typed; there is no global
registry, environment read, module-load client, or generic DI container. The resource contributor
axis exists because prose and export-surface resources have separate owners. If implementation
occurs before A6 v2 debt retirement, it uses the existing horizontal layers and records the same
accepted deviation; it does not invent half of the v2 kernel spine. If it occurs after retirement,
these axes must appear in the A6 extension manifest and pass the then-current A6 gates.

The MCP-owned semantic port is warranted by two adapters (Turso and bounded memory) and by
documentation-specific corpus/provenance semantics. `@netscript/database` remains Prisma application
storage. `@netscript/ai`'s embedding provider may be adapted at the edge, while its
thread/transcript memory and generic retriever remain outside this domain.

### Public contracts

All asynchronous I/O accepts `AbortSignal`. Ports do not download, read environment variables, or
select process-global defaults.

```ts
export type RetrievalSignal =
  | 'deterministic-baseline'
  | 'lexical'
  | 'curated-concept'
  | 'link-graph'
  | 'vector'
  | 'reranker';

export type ProtectedMatchReason =
  | 'route-hint'
  | 'exact-phrase'
  | 'exact-concept'
  | 'exact-identity';

export interface EmbeddingModelIdentity {
  readonly id: string;
  readonly revision: string;
  readonly dimensions: number;
  readonly normalization: 'l2';
  readonly queryPrefix: string;
  readonly passagePrefix: string;
  readonly executionProvider: 'wasm';
}

export interface CorpusIdentity {
  readonly docsContentSha256: string;
  readonly corpusSchemaVersion: string;
  readonly chunkerSchemaVersion: string;
  readonly model: EmbeddingModelIdentity;
  readonly vectorStorage: 'vector32' | 'vector8-experimental';
  readonly quantizer: 'none' | `turso-vector8@${string}`;
  readonly databaseEngineVersion: string;
  readonly documentCount: number;
  readonly sectionCount: number;
}

export interface DocumentSectionRef {
  readonly sectionId: string;
  readonly uri: `netscript-docs://prose/${string}`;
  readonly slug: string;
  readonly heading: string;
  readonly sectionOrdinal: number;
  readonly sourceSha256: string;
}

export interface RankedSectionCandidate {
  readonly section: DocumentSectionRef;
  readonly rank: number;
  readonly signal: RetrievalSignal;
  readonly rawScore?: number;
  readonly protectedBy?: readonly ProtectedMatchReason[];
}

export interface DeterministicCandidateLists {
  readonly baseline: readonly RankedSectionCandidate[];
  readonly lexical: readonly RankedSectionCandidate[];
  readonly curatedConcept: readonly RankedSectionCandidate[];
  readonly linkGraph: readonly RankedSectionCandidate[];
  readonly protectedSectionIds: ReadonlyMap<string, readonly ProtectedMatchReason[]>;
}

export interface SemanticCandidate {
  readonly section: DocumentSectionRef;
  readonly rank: number;
  readonly cosineSimilarity: number; // diagnostic, never probability
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
  readonly model: EmbeddingModelIdentity;
  embedQuery(text: string, options?: { readonly signal?: AbortSignal }): Promise<Float32Array>;
}

export interface RerankCandidate {
  readonly section: DocumentSectionRef;
  readonly query: string;
  readonly passage: string;
}

export interface CandidateRerankerPort {
  rerank(
    candidates: readonly RerankCandidate[],
    options?: { readonly signal?: AbortSignal },
  ): Promise<readonly { readonly sectionId: string; readonly score: number }[]>;
}

export type SemanticFallbackReason =
  | 'artifact-missing'
  | 'artifact-corrupt'
  | 'unsupported-platform'
  | 'runtime-unavailable'
  | 'permission-denied'
  | 'model-mismatch'
  | 'dimension-mismatch'
  | 'timeout'
  | 'database-unavailable';

export interface HybridRetrievalPolicy {
  readonly version: string;
  readonly candidateLimitPerSignal: number;
  readonly resultLimit: number;
  readonly rerankerLimit: number;
  readonly rrfK: number;
  readonly weights: Readonly<Record<Exclude<RetrievalSignal, 'reranker'>, number>>;
  readonly fusionDecimalPlaces: number;
}

export interface GuidanceScoreProvenance {
  readonly method: 'weighted-rrf' | 'reranked-rrf';
  readonly fusionScore: number;
  readonly rrfK: number;
  readonly ranks: Partial<Record<RetrievalSignal, number>>;
  readonly raw: Partial<Record<'lexical' | 'cosine' | 'reranker', number>>;
}

export interface HybridGuidanceConfidence {
  readonly band: 'high' | 'medium' | 'low' | 'insufficient';
  readonly calibrationVersion: string;
  readonly basis: readonly string[];
}

export interface HybridGuidanceMetadata {
  readonly mode: 'hybrid' | 'shadow';
  readonly policyVersion: string;
  readonly corpus: CorpusIdentity;
  readonly confidence: HybridGuidanceConfidence;
  readonly results: readonly {
    readonly section: DocumentSectionRef;
    readonly matchedSignals: readonly RetrievalSignal[];
    readonly score: GuidanceScoreProvenance;
  }[];
}

export interface HybridGuidanceEnvelope {
  readonly schemaVersion: 2;
  readonly guidance: GuidanceResult; // existing public type, unchanged
  readonly hybrid: HybridGuidanceMetadata | null;
  readonly semanticFallback?: { readonly reason: SemanticFallbackReason };
}

export interface RetrievalTelemetryPort {
  record(event: RetrievalTelemetryEvent): void;
}

export interface RetrievalTelemetryEvent {
  readonly mode: 'off' | 'deterministic' | 'hybrid' | 'shadow';
  readonly policyVersion: string;
  readonly fallbackReason?: SemanticFallbackReason;
  readonly latencyBucket: string;
  readonly candidateCountBucket: string;
  readonly provider: 'none' | 'wasm' | 'webgpu-shadow';
}

export interface DocumentResourceRoot {
  readonly uri: `netscript-docs://${'prose' | 'exports'}/${string}`;
  readonly name: string;
  readonly mimeType: string;
}

export interface DocumentResource extends DocumentResourceRoot {
  readonly text: string;
  readonly sourceSha256: string;
}

export interface DocumentResourcePage {
  readonly resources: readonly DocumentResourceRoot[];
  readonly nextCursor?: string;
}

export interface McpResourceContributorPort {
  readonly namespace: 'prose' | 'exports';
  listRoots(options: {
    readonly cursor?: string;
    readonly limit: number;
    readonly signal?: AbortSignal;
  }): Promise<DocumentResourcePage>;
  read(uri: string, options?: { readonly signal?: AbortSignal }): Promise<DocumentResource>;
}

export type FindDocumentationGuidance = (
  intent: string,
  options?: { readonly responseSchemaVersion?: 1 | 2; readonly signal?: AbortSignal },
) => Promise<GuidanceResult | HybridGuidanceEnvelope>;

export interface DocumentRetrievalOptions {
  readonly mode: 'off' | 'auto' | 'download' | 'shadow';
  readonly deterministic: GuidanceIndex;
  readonly semanticIndex?: SemanticDocumentIndexPort;
  readonly queryEmbedding?: QueryEmbeddingPort;
  readonly reranker?: CandidateRerankerPort;
  readonly policy: HybridRetrievalPolicy;
  readonly telemetry?: RetrievalTelemetryPort;
}

export function createDocumentRetrieval(
  options: DocumentRetrievalOptions,
): FindDocumentationGuidance;
```

`DocumentResourceRoot` and `DocumentResource` are presentation DTOs aligned with the selected MCP
SDK/protocol schema; they are not domain entities and are finalized in the resource compatibility
slice. The contributor port's bounded list/read behavior and namespace are the stable seam.

`GuidanceConfidence` remains the existing `'high' | 'medium' | 'low'` export.
`GuidanceResult.fallback?: string` remains the existing human-readable field. The new names do not
collide: `HybridGuidanceConfidence` describes hybrid calibration and `semanticFallback` describes a
v2 semantic-channel failure. No breaking slice is implied.

The v1 policy validates `dimensions === 384`, `rrfK === 60`, and the exact E5 identity at factory
construction, but the public ports use numbers/strings so a future model requires a new policy and
corpus identity rather than a type-breaking edit. The testing adapter rejects more than 1,024
sections and enforces the supplied identity's dimensions.

### Determinism and fusion

There are two distinct guarantees:

1. **Deterministic-off/fallback parity.** Schema-v1 `find_guidance` calls the preserved merged
   deterministic path. Recommendation and related arrays, every legacy field, property order, and
   serialized JSON bytes equal `GuidanceIndex.find()` on the same corpus. Semantic state contributes
   no additive v1 field. A schema-v2 fallback nests that exact object under `guidance` and may
   expose `semanticFallback`; it makes no whole-envelope byte-parity claim.
2. **Provider-scoped hybrid determinism.** Given identical corpus/database/model/policy/runtime
   versions, the WASM execution provider, architecture family, and query bytes, repeated runs must
   return the same section order. Floating-point embeddings are not claimed bit-identical across
   providers or architectures.

Hybrid v1 iterates signals in the fixed order `deterministic-baseline`, `lexical`,
`curated-concept`, `link-graph`, `vector`. Each list is pre-sorted and deduplicated by section id.
It accumulates IEEE-754 terms only in that order and rounds the sum to 12 decimal places before any
comparison:

```text
roundedScore(d) = round12(Σ weight(signal) / (60 + rank(signal, d)))

deterministic-baseline = 1.00   lexical = 1.00
curated-concept = 0.90          link-graph = 0.35
vector = 0.80
```

The baseline channel keeps the merged ranker represented in fusion; the decomposed channels explain
and supplement it. Candidate lists are capped at 40 and output at eight. Protected sections form the
first tier. Remaining ties resolve by rounded RRF descending, baseline rank, lexical rank, concept
rank, graph rank, vector rank, then binary slug and numeric section ordinal. Missing semantic
capability bypasses RRF entirely and returns the baseline result.

Initial weights are a preregistered v1 candidate and do not graduate until held-out evaluation.
WebGPU is never selected by `auto` or `download` in v1. It may run in `shadow` under a distinct
execution-provider identity; it cannot affect returned ranking or claim normative determinism until
separate equivalence, quality, and platform gates are ratified.

An optional cross-encoder may rerank only the top 12, cannot cross the protected-tier boundary, and
uses the pre-rerank stable order as its final tie-break. Failure restores the pre-rerank RRF order.

### Corpus, model, and vector representation

Sections longer than 448 model wordpieces split at paragraph or fenced-code boundaries with 48-token
maximum overlap. Child chunks keep the section citation and collapse to the best child before
fusion. NFKC normalization, splitting, prefixes, ordering, and serialization are versioned chunker
inputs.

| Property                  | Normative v1 value                                                                            |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| Model                     | `intfloat/multilingual-e5-small`                                                              |
| Upstream revision         | `614241f622f53c4eeff9890bdc4f31cfecc418b3`                                                    |
| ONNX conversion           | `Xenova/multilingual-e5-small@761b726dd34fb83930e26aab4e9ac3899aa1fa78`                       |
| Quantized ONNX            | SHA-256 `f80102d3f2a1229f387d3c81909990d8945513e347b0eab049f7de3c6f98c193`, 118,308,185 bytes |
| Tokenizer                 | SHA-256 `0b44a9d7b51c3c62626640cda0e2c2f70fdacdc25bbbd68038369d14ebdf4c39`, 17,082,730 bytes  |
| Runtime/provider          | `@huggingface/transformers` 4.2.0 / WASM                                                      |
| Inputs                    | `passage:` at build time; `query:` at query time                                              |
| Pooling / normalization   | mean / L2                                                                                     |
| Dimensions / license      | 384 / MIT                                                                                     |
| Normative database vector | float32 BLOB produced and queried with `vector32(?)`                                          |

The [model card](https://huggingface.co/intfloat/multilingual-e5-small) supports the prefixes and
multilingual selection; it does not guarantee equal quality per language. Runtime assets and WASM
workers are self-hosted. CDN execution is forbidden.

The optional reranker remains
`cross-encoder/ms-marco-MiniLM-L6-v2@c5ee24cb16019beea0893ab7796b1df96625c6b8` (Apache-2.0), using
Xenova revision `a09144355adeed5f58c8ed011d209bf8ee5a1fec` and ONNX SHA-256
`e9d8ebf845c413e981c175bfe49a3bfa9b3dcce2a3ba54875ee5df5a58639fbe` (23,143,499 bytes). Its English
orientation keeps it experimental/off.

#### Vector8 disposition

Vector8 is **not normative v1 storage**. Turso's code-indexing guide uses `F8_BLOB(384)` and passes
a JSON float array to `vector8(?)`, stating that Turso quantizes internally. Another current vector
reference illustrates integer inputs. Because the engine does not publish a stable scale/offset
contract across those pages, NetScript does not invent one.

An experimental vector8 artifact records `vectorStorage: 'vector8-experimental'`,
`quantizer: 'turso-vector8@0.7.2'`, exact engine/native package hashes, input float serialization,
dimensions, normalization, and a quantizer test-vector digest in `CorpusIdentity`. Both build and
query sides call the same pinned engine's `vector8(?)`; NetScript performs no independent scaling.
Graduation requires primary-source reconciliation, byte-stable test vectors on every supported
native target, query/build compatibility, no overflow/NaN behavior, artifact reproducibility, and
≤0.005 held-out nDCG@5 loss against the normative vector32 artifact. Until all pass, vector32 ships
even if vector8 is smaller.

At the historical 3,777-section snapshot, raw 384-dimension payload arithmetic is approximately 1.38
MiB for one byte/dimension and 5.53 MiB for four bytes/dimension, before vector headers, database
pages, text, and indexes. Budgets use binary MiB (`1 MiB = 1,048,576 bytes`).

### New Turso adapter and platform matrix

The reviewed current stable package is `@tursodatabase/database` 0.7.2 (MIT; `next` is pre-release).
The RFC pins 0.7.2 for the first implementation review, never a floating stable tag. Native Deno
inspection confirms `DatabaseOpts.readonly?: boolean`; production opens the verified artifact with
`readonly: true`, `fileMustExist: true`, and bounded query timeouts.

```sql
CREATE TABLE corpus_metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE document_sections (
  section_id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  heading TEXT NOT NULL,
  section_ordinal INTEGER NOT NULL,
  uri TEXT NOT NULL UNIQUE,
  source_sha256 TEXT NOT NULL,
  passage TEXT NOT NULL,
  embedding BLOB NOT NULL
);

-- Build: INSERT ... vector32(?)
-- Query: vector_distance_cos(embedding, vector32(?))
```

The adapter uses local/in-memory databases and bounded linear cosine search. It does not use
`@libsql/client`, Turso Cloud, experimental FTS/index methods, multiprocess WAL, MVCC writes, or a
browser package. Metadata/open checks validate schema, row count, dimensions, storage encoding,
model/chunker identity, and SHA before queries.

Package 0.7.2 ships native binaries for Linux glibc x64/arm64, macOS arm64, and Windows x64. It does
not ship macOS x64 or Linux musl/Alpine binaries. Those targets, and any native-load failure, take
the deterministic fallback arm; macOS x64 and Alpine are not allowed to masquerade as tested native
support. Browser/WASM would be a separate adapter and RFC slice.

Primary maturity sources are the [TypeScript reference](https://docs.turso.tech/sdk/ts/reference),
[vector functions](https://docs.turso.tech/sql-reference/functions/vector),
[code-indexing guide](https://docs.turso.tech/guides/code-indexing),
[experimental feature list](https://docs.turso.tech/sql-reference/experimental-features), and
[multiprocess warning](https://docs.turso.tech/sql-reference/multiprocess-access).

### Immutable artifact and release lifecycle

The database is a GitHub Release asset, not a JSR file. The checked-in generated TypeScript manifest
is the **trust root**: GitHub Release assets are mutable by repository writers, so runtime accepts
an asset only when its bytes match the SHA and length published inside the immutable,
provenance-backed JSR package version. Release metadata, filenames, or GitHub checksums cannot
override that SHA.

The lifecycle is locked:

1. `.llm/tools/docs/generate-mcp-semantic-artifact.ts` generates the database and manifest from
   canonical corpus/model inputs. `--check` regenerates in scratch and compares normalized database
   content plus manifest identity. The database excludes package/canary version so identical source
   content produces identical bytes.
2. `check:publish-assets` calls that checker. New `.llm/tools/fitness/evaluate-mcp-guidance.ts` and
   `.llm/tools/fitness/benchmark-mcp-semantic.ts` enforce relevance, fallback, native-platform,
   download, latency, RSS, and database-size reports against versioned thresholds.
3. The canary workflow builds the database once from the exact canary-pair source SHA, verifies it
   against the checked-in manifest, and uploads an immutable Actions artifact named by database SHA.
   The canary label/status records its run id and artifact SHA.
4. Stable publication **promotes that exact successful canary Actions artifact**. New
   `.llm/tools/release/promote-mcp-semantic-artifact.ts` resolves the green canary run for the
   stable content parent, downloads the named artifact, verifies manifest SHA/length and source
   identity, then uploads it to the target GitHub Release before any JSR operation. Stable never
   regenerates the database.
5. `publish.yml` runs promotion and verification **before** `publish:readiness`, dry-run, preflight,
   or JSR publication. `publish:readiness` gains a semantic-artifact check that verifies the release
   asset against the checked-in trust root. `release:preflight` remains the text-import guard and is
   not substituted for artifact integrity.
6. Only after those gates pass may JSR publish. Retry is idempotent because release asset name and
   SHA must either match or the workflow refuses; it never overwrites differing bytes.

The generator/checker enforces ≤24 MiB raw database, ≤8 MiB compressed database, ≤140 MiB required
encoder download, ≤25 MiB optional reranker, ≤256 KiB generated manifest delta, and ≤2 MiB packed
`@netscript/mcp`. Benchmark tooling enforces latency/RSS. `publish:readiness` consumes signed JSON
reports from those tools and rejects missing, stale-source, or over-budget reports. These are new
implementation deliverables; the RFC does not pretend current tooling already enforces them.

Cache keys are database SHA + model SHA + policy version, not mutable release tag alone. Downloads
stream to a temporary file, enforce declared and observed size, hash, fsync/close, and atomically
rename. Corruption removes/quarantines only the proven cache entry and falls back.

#### Network allowlist

`auto` never performs network I/O. `download` permits HTTPS GET only for:

- semantic artifact: exact `rickylabs/netscript` release path on `github.com`, with redirects only
  to `release-assets.githubusercontent.com`;
- model/tokenizer/reranker: exact `Xenova` repository, immutable revision, and allowlisted filenames
  on `huggingface.co`, with redirects only to `cdn-lfs.hf.co` or `cas-bridge.xethub.hf.co`.

Every redirect hop is revalidated, redirect count is at most three, credentials/cookies are never
sent, URL overrides are rejected by default, and model/database hashes remain mandatory. A custom
host requires an explicit library-supplied downloader adapter and is outside CLI `download` mode.

### MCP presentation, #1201, and protocol independence

The current tree hand-writes MCP 2025-11-25 JSON-RPC over stdio and imports no official MCP SDK.
This RFC does not assume otherwise. Retrieval core, artifact, and adapter slices do not require an
SDK migration. A future move to the current MCP specification or official TypeScript SDK is a
separate compatibility proposal with dual-era fixtures.

Likewise, this design has no relationship to oRPC v2. MCP stdio does not use the workspace's oRPC
service packages, and accepting this RFC neither upgrades oRPC 1.x dependencies nor changes service
contracts, OpenAPI projection, HTTP routing, or slow-type policy. Prior oRPC-v2 audit work remains
independent.

Issue [#1201](https://github.com/rickylabs/netscript/issues/1201) owns generated export-surface
discovery and could also need resources. There must be one `resources/list` handler, not competing
feature handlers. This RFC contributes only prose document roots under
`netscript-docs://prose/{slug}`. Export resources, if #1201 adopts them, use a distinct
`netscript-docs://exports/{package}/{subpath}` namespace. The A6 presentation resource catalog
merges typed contributors, sorts by URI, paginates at most 100 roots, and never lists all section
URIs. `resources/read` may address an allowlisted section fragment. No subscriptions, list-changed
notifications, or prompts are added.

Schema-v1 `find_guidance` text JSON and `structuredContent` remain unchanged. Schema v2 is explicit
input negotiation and returns `HybridGuidanceEnvelope`; old clients never receive it accidentally.

### Evaluation corpus and gates

`packages/mcp/tests/fixtures/guidance-evaluation.json` remains a fast deterministic smoke fixture.
Its original five #1404 cases seed the immutable byte-parity golden; its current eight cases
continue to exercise `exact`, `required-set`, and `rank-one` expectations. It is not silently
converted to graded relevance and cannot compute nDCG.

A new checked `packages/mcp/tests/fixtures/guidance-relevance-v1.jsonl` carries at least 120
records:

```ts
interface GuidanceRelevanceCaseV1 {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly split: 'calibration' | 'validation';
  readonly intent: string;
  readonly queryLanguage: string; // BCP 47
  readonly documentLanguage: string; // BCP 47
  readonly strata: readonly (
    | 'exact-rare'
    | 'paraphrase'
    | 'unsupported'
    | 'ambiguous'
    | 'multilingual'
    | 'cross-lingual'
    | 'poisoning'
  )[];
  readonly supported: boolean;
  readonly judgments: readonly {
    readonly sectionId: string;
    readonly grade: 0 | 1 | 2 | 3;
    readonly rationale: string;
  }[];
  readonly requiredRankOne?: readonly string[];
  readonly ambiguitySet?: readonly string[];
  readonly poisoningExpectation?: 'ignore-instructions' | 'abstain';
  readonly adjudication: {
    readonly assessorIds: readonly string[];
    readonly decidedBy: string;
    readonly decidedAt: string;
    readonly revision: number;
  };
  readonly corpusSha256: string;
}
```

Calibration cases may tune weights/bands; validation cases remain untouched until a candidate is
frozen. Corpus distribution is at least 30 exact/rare, 25 paraphrase/task, 15 unsupported, 15
ambiguous, 20 multilingual/cross-lingual, and 15 poisoning/adversarial cases; multi-label cases are
allowed but every minimum is independently satisfied. Unsupported abstention means v2 confidence
`insufficient` plus no capability-inventing recommendation. Ambiguity metrics credit the declared
set rather than one arbitrary answer.

Graduation requires:

- frozen #1404 serialized parity and current eight-case deterministic smoke pass;
- v1/fallback legacy bytes equal `GuidanceIndex.find()` across 50 repeats;
- protected exact/rare Recall@1 = 100%, with no deterministic regression;
- validation nDCG@5 improves ≥0.05 overall with 95% bootstrap lower bound >0;
- multilingual/cross-lingual nDCG@5 improves ≥0.10 and no declared language stratum drops >0.02;
- unsupported abstention precision ≥0.95 and zero invented capability;
- vector8, if reconsidered, loses ≤0.005 nDCG@5 versus vector32 plus all quantizer gates;
- warmed WASM embedding p50 ≤300 ms / p95 ≤750 ms; cached cold start p95 ≤2.5 s; semantic failure
  adds ≤50 ms before deterministic fallback; optional reranking adds p95 ≤250 ms;
- incremental RSS ≤384 MiB encoder, ≤128 MiB reranker, ≤512 MiB combined; and
- native success on Linux glibc x64/arm64, macOS arm64, Windows x64; deterministic fallback on macOS
  x64, Linux musl/Alpine, browser, and every native-load failure.

Reference hardware, architecture, OS/libc, Deno, model/runtime/provider, Turso, warm/cold state,
iterations, corpus SHA, and raw samples are recorded. WASM hybrid determinism is tested per
supported architecture/provider tuple; no cross-provider bit-identity claim is made.

### Confidence, telemetry, security, and errors

Hybrid confidence derives from held-out precision and margin/protected-match features. “High” is
allowed only when its validation lower bound reaches the published threshold; “insufficient” is
preferred over guessing. Legacy `GuidanceResult.confidence` retains its current thresholds and type.

Telemetry is optional and low-cardinality: mode, bounded semantic-fallback reason, count/latency
buckets, platform/runtime/provider family, cache outcome, policy version, and confidence band. It
never contains query/passage text, headings, URIs, section ids, local paths, private-corpus hashes,
or unbounded errors.

Documentation is inert untrusted text. Retrieval/reranking never executes code, follows embedded
links, invokes tools, or treats instructions in passages as policy. Generation permits only
canonical public documentation paths, rejects symlink escape and duplicate ids, and records source
hashes. Custom corpora are disabled by default and require a separate allowlist/identity namespace.

Bad caller input remains a typed error. `AbortError` propagates. Semantic availability, integrity,
runtime, database, and timeout failures map to internal telemetry and, only for negotiated schema
v2, `semanticFallback`; schema v1 returns the untouched deterministic result. Programmer invariants
fail generation/tests rather than being swallowed.

### Rollout

1. Re-pin implementation to current main and check in the immutable #1404 five-case serialized
   golden plus current eight-case smoke evidence.
2. Land the deterministic signal-decomposition refactor, locale-stable folding, producer contract,
   and protected tier while the old scalar result remains authoritative. Pass both parity gates.
3. Add public non-colliding v2 types, pure fusion policy, bounded in-memory adapter, and
   unit/contract tests. Default remains `off`.
4. Add vector32 release generation, manifest trust root, graded corpus/evaluator, budgets, canary
   artifact production, and stable promotion tooling. No runtime download yet.
5. Add the pinned new-Turso native adapter in `shadow`; prove platform and corruption fallback.
6. Add the pinned WASM query encoder and explicit `download`; keep `auto` cache-only and ranking
   opt-in.
7. Coordinate the single MCP resource catalog with #1201; add prose resource roots/read/links. SDK
   modernization and oRPC remain out of scope.
8. Change default to cache-only `auto` only after every gate passes and the RFC owner ratifies the
   evidence. Evaluate vector8, WebGPU, and the reranker only as separate experimental graduations.

Every slice is reversible. `off` bypasses semantic initialization. Cache incompatibility causes
replacement, never in-place migration. No implementation slice starts before PLAN-EVAL approval.

### Testing and tooling

Future implementation must add and wire:

- deterministic producer/protected-tier/parity unit and golden tests;
- shared Turso/in-memory adapter contract tests, including read-only open, dimension, timeout,
  cancellation, corruption, and stable ordering;
- `generate-mcp-semantic-artifact.ts --check` reproducibility and identity tests;
- `evaluate-mcp-guidance.ts` graded metrics/abstention/parity report;
- `benchmark-mcp-semantic.ts` platform, download, database, latency, and RSS report;
- `promote-mcp-semantic-artifact.ts` canary-source/SHA/length/idempotence tests;
- MCP schema-v1 byte fixtures, explicit v2 negotiation, resource catalog/#1201 coexistence, URI
  allowlist, pagination, and no-prompt/subscription tests;
- `check:publish-assets`, `release:preflight`, `publish:readiness`, dry-run, `deno doc --lint`, JSR
  packed-size, permission, and host/redirect allowlist gates.

No test needs Aspire, Docker, a database daemon, Turso Cloud, or product runtime resources.

## Drawbacks

The design adds a roughly 135 MiB encoder cache, native/WASM complexity, an external release asset,
a pre-1.0 database dependency, and a maintained graded corpus. It also requires changes to release
workflows before runtime semantics can ship. Unsupported native targets remain deterministic-only.
The explicit v2 response avoids breaking callers but creates a second presentation schema to
document and test.

## Rationale and alternatives

RRF combines ranks whose BM25-like, graph, and cosine values have unrelated scales. The preserved
baseline channel and protected tier prevent semantic recall from outranking exact truth. Float32 is
the normative database representation because its query/build contract is explicit; vector8's space
saving does not justify guessing at a changing quantizer contract.

Rejected alternatives:

- replace deterministic search with vectors;
- blend raw lexical/cosine scores;
- use `@libsql/client`, Turso Cloud, or experimental FTS/multiprocess/index methods;
- route documentation through Prisma database or conversational-memory ports;
- embed databases/models in JSR or generate embeddings on first query;
- use remote embeddings or a generative LLM by default;
- claim WebGPU/provider-independent determinism; or
- couple retrieval to MCP SDK, oRPC v2, or #1201 export-surface implementation.

## Breaking changes and migration

This is additive. Existing `GuidanceConfidence`, `GuidanceResult`, `fallback`, default input, text
JSON, and schema-v1 structured output remain unchanged. Schema v2 is explicit opt-in. Optional
adapter subpaths do not become dependencies of the root deterministic export. Any future removal of
schema v1 or handwritten MCP framing requires a separate breaking proposal and migration window.

## Prior art

PR #1404/#1416 supply deterministic guidance. The read-only `eis-chat` implementation validates
new-Turso local APIs, dimension checks, and fallback, but its ASCII `LIKE` and scalar alpha blend
are not adopted. Turso's code-indexing guide demonstrates F8 storage and RRF, while this RFC
deliberately chooses the safer vector32 production contract.

Issues [#317](https://github.com/rickylabs/netscript/issues/317) and
[#455](https://github.com/rickylabs/netscript/issues/455) concern other Turso seams;
[#499](https://github.com/rickylabs/netscript/issues/499) is conversational memory;
[#238](https://github.com/rickylabs/netscript/issues/238) leaves application knowledge bases outside
generic AI; and [#1201](https://github.com/rickylabs/netscript/issues/1201) owns export-surface
discovery/resource coordination.

## Unresolved questions

These questions do not change safe defaults or artifact trust:

- **MCP maintainer:** order a future official-SDK compatibility proposal relative to shadow
  retrieval. Default: handwritten current protocol remains.
- **AI maintainer:** place the local encoder adapter physically in MCP or an AI optional subpath.
  Default: MCP-owned contract and no root dependency either way.
- **Relevance owner:** select language strata/adjudicators. Default: no semantic graduation.
- **RFC owner:** freeze RRF candidate weights after validation. Default: opt-in/shadow only.

Release promotion, network allowlists, vector32 production storage, vector8 experimental status,
resource namespace/list bounds, and trust-root semantics are no longer open questions.

## Non-goals

- product implementation, acceptance, merge, or implementation issue creation in this RFC lane;
- private/arbitrary filesystem corpora, mutable ingestion, deltas, Turso Cloud, or database writers;
- browser/native parity, WebGPU defaulting, vector8/reranker graduation, or equal language quality;
- resolving `MCP-A6-V2-SHAPE`, migrating the MCP SDK/protocol, or upgrading oRPC; and
- changing unrelated tools, prompts, subscriptions, service HTTP contracts, or release policy.

## Future possibilities

Separately ratified work may add a browser Turso WASM adapter, signed artifact attestations, delta
artifacts, custom public corpora, another embedding policy, WebGPU, vector8, or a multilingual
reranker. None may weaken legacy parity, explicit negotiation, provider-scoped determinism, corpus
identity, artifact trust, permissions, or provenance.
