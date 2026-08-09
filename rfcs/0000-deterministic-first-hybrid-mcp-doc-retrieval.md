---
rfc: 0000
title: Deterministic-first hybrid semantic documentation retrieval for NetScript MCP
status: Draft
authors: ['@rickylabs']
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

The intent-aware deterministic ranker in
[PR #1404](https://github.com/rickylabs/netscript/pull/1404) is the correct foundation: it is
inspectable, fast, offline, and strong for identifiers, rare terms, curated concepts, and linked
guidance. It cannot, by construction, fully bridge paraphrases or cross-language vocabulary when
query and documentation share few tokens. Semantic retrieval helps those cases, but replacing
deterministic search with opaque vector similarity would regress the queries developers most need to
trust and would turn an optional model/runtime into an availability dependency.

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

| Mode                     | Network behavior                              | Ranking behavior                                      |
| ------------------------ | --------------------------------------------- | ----------------------------------------------------- |
| `off`                    | none                                          | deterministic only; kill switch                       |
| `auto` (initial default) | none                                          | use verified cached assets, otherwise deterministic   |
| `download`               | allowlisted artifact/model fetch when missing | hybrid after integrity verification                   |
| `shadow`                 | same asset policy as configured               | compute hybrid metrics, return deterministic ordering |

An absent runtime, unsupported platform, denied permission, timeout, dimension mismatch, corrupt
cache, or unsupported database feature causes a bounded fallback reason and the original
deterministic result. Cancellation remains cancellation and is not hidden as fallback.

### MCP surfaces

The existing tool is retained because tools are model-controlled in the
[MCP server model](https://modelcontextprotocol.io/specification/2026-07-28/server). Each returned
document also has a stable `netscript-docs:` resource URI and a resource link. Applications can
list/read those resources and render citations without invoking another tool. NetScript will not add
a prompt: prompts are user-controlled templates, not a retrieval transport. The release corpus is
immutable for a server process, so resource subscriptions and list-changed notifications are also
intentionally absent.

## Reference-level explanation

### Baseline and scope

This RFC is designed on top of PR #1404 rather than the older `origin/main` behavior. That change
adds the 22nd read tool, `find_guidance`, and a shared guidance index used by filesystem and
embedded corpora. Its ranking policy combines a BM25-like lexical signal, exact phrase and heading
boosts, curated concepts, and one-hop internal-link boosts with stable slug/section tie-breaks. Its
release asset is generated and byte-checked in the existing publish workflow. Those behaviors remain
the normative deterministic baseline.

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
export type RetrievalSignal = 'lexical' | 'curated-concept' | 'link-graph' | 'vector' | 'reranker';

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
    readonly normalization: 'l2';
    readonly queryPrefix: 'query: ';
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
  | 'disabled'
  | 'artifact-missing'
  | 'artifact-corrupt'
  | 'unsupported-platform'
  | 'runtime-unavailable'
  | 'permission-denied'
  | 'model-mismatch'
  | 'dimension-mismatch'
  | 'timeout'
  | 'database-unavailable';

export interface GuidanceScoreProvenance {
  readonly method: 'deterministic' | 'weighted-rrf' | 'reranked-rrf';
  readonly fusionScore?: number;
  readonly rrfK?: 60;
  readonly ranks: Partial<Record<RetrievalSignal, number>>;
  readonly raw: Partial<Record<'lexical' | 'cosine' | 'reranker', number>>;
}

export interface GuidanceConfidence {
  readonly band: 'high' | 'medium' | 'low' | 'insufficient';
  readonly calibrationVersion: string;
  readonly basis: readonly string[];
}

export interface HybridGuidanceResult {
  readonly mode: 'deterministic' | 'hybrid' | 'shadow';
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
  readonly mode: 'off' | 'auto' | 'download' | 'shadow';
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

The CLI alone maps flags/environment and grants filesystem/network permissions. Library core and the
in-memory adapter require none. A remote embedding adapter, if ever supplied, must be selected
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
deterministic ranker form a protected tier; semantic candidates cannot move above that tier. Results
are bounded to eight. Ties resolve by protected tier, descending RRF, deterministic baseline rank,
vector rank, slug, then section ordinal. The same corpus, policy, and runtime therefore produce the
same ordering. If the vector channel cannot run, the application returns the original deterministic
ranking directly rather than applying RRF to the remaining lists.

An optional cross-encoder can rerank only the top 12 fused candidates, preserve the protected tier,
and use the same stable tie-breaks. It is experimental and off by default; absence or failure
returns the pre-rerank RRF order.

### Corpus, embedding, and artifact contract

The generator consumes the same release corpus and canonical section parser as deterministic
retrieval. A section is the citation unit. Sections longer than 448 model wordpieces are split at
paragraph or fenced-code boundaries with at most 48 tokens of overlap; child chunks retain the same
source citation and are collapsed to the best-ranked child before fusion. Chunk ordering, Unicode
normalization, prefixing, and content serialization are part of `chunkerSchemaVersion`, not
implementation detail.

Build-time passage embeddings and query-time embeddings use the same pinned model contract:

| Property                | Ratified value                                                                                                             |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Model                   | `intfloat/multilingual-e5-small`                                                                                           |
| Upstream revision       | `614241f622f53c4eeff9890bdc4f31cfecc418b3`                                                                                 |
| ONNX conversion         | `Xenova/multilingual-e5-small@761b726dd34fb83930e26aab4e9ac3899aa1fa78`                                                    |
| Quantized ONNX          | `onnx/model_quantized.onnx`, SHA-256 `f80102d3f2a1229f387d3c81909990d8945513e347b0eab049f7de3c6f98c193`, 118,308,185 bytes |
| Tokenizer               | `tokenizer.json`, SHA-256 `0b44a9d7b51c3c62626640cda0e2c2f70fdacdc25bbbd68038369d14ebdf4c39`, 17,082,730 bytes             |
| License / dimensions    | MIT / 384                                                                                                                  |
| Inputs                  | `passage:` at generation; `query:` at query time                                                                           |
| Pooling / normalization | mean pooling / L2                                                                                                          |
| Stored vector           | `vector8`, with accuracy gate against `vector32`                                                                           |

This model is selected because its
[model card](https://huggingface.co/intfloat/multilingual-e5-small) documents 100-language training,
the required prefixes, 384 dimensions, and MIT license. The RFC does not claim equal quality for
low-resource languages; evaluation is stratified and may keep semantic ranking opt-in for weak
strata.

Generation uses the pinned ONNX files through
[`@huggingface/transformers`](https://github.com/huggingface/transformers.js) 4.2.0 (Apache-2.0).
Query inference uses that same runtime and files: WASM is the portable default, WebGPU is an
optional acceleration selected only after capability detection. Browser assets, workers, and WASM
must be self-hosted for CSP and supply-chain control; CDN execution is forbidden. WebGPU requires a
secure context and a successful adapter/device probe. Deno native operation must work with WASM
alone.

The optional reranker is
[`cross-encoder/ms-marco-MiniLM-L6-v2`](https://huggingface.co/cross-encoder/ms-marco-MiniLM-L6-v2)
at upstream revision `c5ee24cb16019beea0893ab7796b1df96625c6b8`, using
`Xenova/ms-marco-MiniLM-L-6-v2@a09144355adeed5f58c8ed011d209bf8ee5a1fec` and quantized ONNX SHA-256
`e9d8ebf845c413e981c175bfe49a3bfa9b3dcce2a3ba54875ee5df5a58639fbe` (23,143,499 bytes). It is
Apache-2.0, 22.7M parameters, and English-oriented. That language limitation is why it cannot
graduate with the base hybrid feature and must pass a separate multilingual/no-regression gate.

#### Release asset

The production semantic index is a generated database uploaded as a GitHub Release asset, not
embedded in the JSR package. A small generated TypeScript manifest may be published with
`@netscript/mcp`; it contains no vectors and names:

- package and corpus versions, docs content SHA-256, corpus and chunker schema versions;
- model id, upstream and conversion revisions, exact file hashes, dimensions, prefixes, pooling,
  normalization, and vector encoding;
- generator source version, Transformers.js version, Turso engine/package version;
- database byte length, compressed length, and SHA-256; and
- the allowlisted release asset name and compatibility range.

The release generator produces a temporary database in a deterministic section order, verifies row
cardinality/metadata, closes it, hashes it, and regenerates it in CI to detect drift. Canary
publishing validates the artifact before stable publication; the stable release uploads the artifact
before publishing the JSR package that references it. The database is compatible only when package,
corpus schema, chunker schema, dimensions, encoding, and model identity all match. There is no
best-effort schema migration: an incompatible cache is replaced atomically.

Cache keys contain package version and database SHA-256. Download mode accepts only the generated,
allowlisted HTTPS release URL, enforces declared and streaming byte caps, hashes to a temporary
file, and atomically renames after verification. A corrupt or partial file is quarantined/deleted
and the request falls back; repeated requests use bounded backoff rather than download storms.
Corpus updates publish a complete immutable artifact in v1. Delta updates are deferred until they
can preserve reproducibility and recovery simplicity.

Initial hard budgets are:

| Asset                        | Gate                                             |
| ---------------------------- | ------------------------------------------------ |
| Semantic database            | ≤ 24 MiB raw and ≤ 8 MiB compressed              |
| Required encoder files       | ≤ 140 MiB total download                         |
| Optional reranker            | ≤ 25 MiB additional download                     |
| Generated JSR manifest delta | ≤ 256 KiB; total packed `@netscript/mcp` ≤ 2 MiB |

The incoming corpus has 3,777 heading sections. Its vector payload is approximately 1.5 MiB as
384-dimensional `vector8`, versus approximately 5.8 MiB as `vector32`, before database/text/index
overhead. The accuracy gate, not this estimate, decides whether `vector8` ships.

### New Turso database adapter

The production adapter uses only
[`@tursodatabase/database`](https://www.npmjs.com/package/@tursodatabase/database), initially pinned
to reviewed stable 0.7.1. It does not use `@libsql/client`, legacy libSQL, Prisma's libSQL adapter,
or Turso Cloud. The database rewrite provides native local and in-memory operation and
[`vector32`/`vector8` functions](https://docs.turso.tech/features/ai-and-embeddings) with cosine
distance. The v1 adapter opens the verified local file read-only in one process and performs bounded
linear vector search. This is appropriate for a few thousand sections and keeps the deterministic
ranker authoritative for lexical retrieval.

The adapter deliberately avoids experimental features:

| Capability                                          | RFC disposition                                                             |
| --------------------------------------------------- | --------------------------------------------------------------------------- |
| Local file and in-memory database                   | use; stable production path                                                 |
| `vector8`, `vector32`, cosine distance              | use after vector8 accuracy gate                                             |
| Vector indexes / DiskANN                            | do not assume; linear scan at this corpus size                              |
| Full-text `USING fts`, `fts_match`, `fts_score`     | do not use; requires experimental index method                              |
| Multiprocess WAL                                    | do not use; experimental and unnecessary for immutable single-process reads |
| MVCC/concurrent writes                              | do not enable; artifact is immutable                                        |
| Browser/WASM package                                | future separate adapter; not the native production adapter                  |
| Encryption, materialized views, PostgreSQL frontend | out of scope / experimental or foundational                                 |

This separation follows Turso's own
[experimental feature guidance](https://docs.turso.tech/database/experimental-features),
[multiprocess warning](https://docs.turso.tech/database/multiprocess), and the project's
[rewrite status report](https://turso.tech/blog/we-are-a-year-into-rewriting-sqlite). The
[PostgreSQL-in-Rust announcement](https://turso.tech/blog/a-new-modern-version-of-postgres-in-rust)
describes a foundation rather than a client surface needed here. New Turso remains pre-1.0, so the
adapter is isolated, backed up by a rebuildable artifact, and guarded by an exact dependency and
compatibility test rather than treated as the system of record.

Schema sketch:

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
  embedding VECTOR8(384) NOT NULL
);
```

At open, the adapter validates every metadata field, schema table/column, section cardinality,
dimension, and source identity before it can serve a query. SQL inputs are parameters. The query
selects no more than 40 rows and always applies the stable section tie-break after distance. The
in-memory adapter implements the same observable contract with a bounded linear scan and is used for
tests, small fixtures, and environments in which native Turso is unavailable.

### MCP presentation and compatibility

`find_guidance` remains the only ranking entry point. Its existing text JSON remains available and
its `structuredContent` grows additively after a schema/version negotiation. Results include MCP
resource links to stable URIs. The server adds:

- `resources/list` for bounded public documentation metadata;
- `resources/templates/list` for `netscript-docs://{slug}{#section}`;
- `resources/read` for exact, allowlisted corpus sections with MIME type and annotations; and
- resource annotations for audience, priority, and source last-modified metadata when known.

The server does not expose local paths, model cache files, database rows, or arbitrary URI reads.
`resources/subscribe` and `notifications/resources/list_changed` are omitted because a release
corpus cannot change during a process. Prompts are left alone. Search and direct document-get tools
are retained; they share canonical citations but are not silently reinterpreted as semantic search.

NetScript currently hand-writes the 2025-11-25 protocol with tool-only capabilities, whereas the
[current 2026-07-28 MCP server specification](https://modelcontextprotocol.io/specification/2026-07-28/server)
and [official MCP sources](https://github.com/modelcontextprotocol/modelcontextprotocol) distinguish
model-controlled tools, application-controlled resources, and user-controlled prompts. A protocol
modernization to the official v2 TypeScript server SDK is a separate rollout slice. Retrieval domain
and adapter work must not depend on that migration, and the MCP slice must include interoperability
fixtures for both the currently supported client era and the selected modern protocol before old
behavior is deprecated.

### JSR and permission fitness

The current package dry-run is roughly 385 KiB of exported source plus a 100 KiB generated publish
asset. Shipping the database or 135 MiB model cache in JSR would be disproportionate and is
forbidden. The core and testing adapter remain browser-portable TypeScript with no permissions. The
native Turso and local encoder adapters are explicit optional subpaths; the CLI composition edge
documents and requests only the filesystem/network permissions implied by the selected mode.

Every exported function and class must carry an explicit return type and pass `deno doc --lint` and
JSR dry-run checks with zero newly introduced slow types. The native adapter cannot be advertised as
browser-compatible. A future `@tursodatabase/database-wasm` adapter would be a different subpath
with its own CSP, worker, size, and browser fitness gates.

### Evaluation and fitness gates

No default ranking changes until a versioned, reviewed intent corpus and runner are checked in. The
first corpus contains at least 120 independently judged intents:

| Stratum                      | Minimum | Required coverage                                           |
| ---------------------------- | ------: | ----------------------------------------------------------- |
| Exact symbols and rare terms |      30 | APIs, routes, flags, error codes, uncommon package names    |
| Tasks and paraphrases        |      25 | vocabulary mismatch and multi-step goals                    |
| Negative / unsupported       |      15 | includes “add a capability NetScript does not ship”         |
| Ambiguous                    |      15 | multiple plausible packages or meanings                     |
| Multilingual / cross-lingual |      20 | multiple language families and mixed-language queries       |
| Adversarial / poisoning      |      15 | instruction-like docs, injected headings, malformed content |

Judgments use grades 0–3 and retain assessor, rationale, corpus SHA, and adjudication history. Query
sets used for tuning are separated from held-out acceptance queries. Baseline, vector32, vector8,
RRF-weight candidates, and optional reranker are evaluated from the same frozen inputs. Reports
include per-stratum results and bootstrap confidence intervals so aggregate gains cannot conceal a
critical regression.

The v1 graduation gates are:

- deterministic, `off`, and every forced fallback path produce byte-identical ordering and schema
  compatibility across 50 repeated runs on each supported platform;
- protected exact/rare Recall@1 is 100%, with zero regression from the deterministic baseline;
- overall nDCG@5 improves by at least 0.05 and the 95% bootstrap confidence-interval lower bound is
  above zero;
- multilingual/cross-lingual nDCG@5 improves by at least 0.10 and no declared language stratum drops
  more than 0.02;
- unsupported-intent abstention precision is at least 0.95 and no response invents an unavailable
  capability;
- vector8 loses no more than 0.005 nDCG@5 relative to vector32; otherwise vector32 ships subject to
  artifact gates;
- warmed local embedding latency is p50 ≤ 300 ms and p95 ≤ 750 ms; cold start with assets already
  cached is p95 ≤ 2.5 s; semantic-failure overhead before deterministic fallback is ≤ 50 ms;
- optional reranking adds p95 ≤ 250 ms for at most 12 candidates;
- incremental RSS is ≤ 384 MiB for the encoder, ≤ 128 MiB for the optional reranker, and ≤ 512 MiB
  combined, in addition to the artifact/download budgets above; and
- Linux x64/arm64, macOS x64/arm64, and Windows x64 either pass native adapter/inference fixtures or
  demonstrate the clean deterministic fallback. Browser support is not a v1 production claim.

Reference hardware, OS, Deno, model/runtime, Turso, warm/cold state, iterations, and raw samples are
recorded with every benchmark. A median from an unspecified maintainer laptop is not a gate.

### Confidence and observability

Confidence bands are derived from held-out precision at the returned depth plus protected-match and
margin features. The calibration table is versioned with the policy. “High” is allowed only when its
held-out precision lower bound meets the published threshold; “insufficient” is preferred over
guessing for unsupported or low-margin queries. The UI/tool output never calls cosine, RRF, or
reranker logits confidence percentages.

Telemetry is optional and low-cardinality: mode, fallback-reason enum, candidate-count buckets,
latency buckets, platform/runtime family, cache outcome, policy version, and confidence band. It
must not contain query text, passage text, headings, URIs, section ids, paths, hashes that
fingerprint private corpora, or unbounded error strings. Structured local debug output may expose
score provenance only when explicitly requested.

### Security, privacy, and recovery

Documentation is untrusted content, not instructions. Retrieval and reranking treat it as inert
text; neither may invoke tools, interpolate it into system policy, follow embedded URLs, execute
code, or allow instruction-like text to affect anything except relevance. Resource consumers must
retain the citation boundary rather than present retrieved prose as server authority.

Only repository-public documentation paths from the release manifest are indexed. Generation
resolves canonical paths, rejects symlink escape, secrets/private patterns, duplicate identifiers,
and sources outside the allowlist. A custom corpus is rejected by default and requires a separately
configured allowlist, identity namespace, and telemetry-off default. Poisoning fixtures cover
keyword stuffing, hidden/instruction headings, duplicate passages, oversized content, malformed
Unicode, and adversarial links.

Queries run locally by default. Download mode transmits only fixed artifact/model requests to
allowlisted hosts, never the user's query. Files are content-hash verified before parsing. Size,
row, dimension, schema, and timeout ceilings precede database use. Corruption closes the adapter,
removes/quarantines only the proven cache entry, and falls back. The deterministic kill switch is
always available and does not require opening the database or loading the model.

### Error semantics

Bad public input (empty/oversized intent or invalid limit) remains a typed caller error. An aborted
request propagates `AbortError`. Semantic availability, cache, runtime, database, and timeout errors
map to the bounded fallback enum and return deterministic results. Integrity and schema mismatches
also emit a local diagnostic suitable for operator action, without leaking paths through MCP.
Programmer invariants such as impossible ranks or duplicate canonical section IDs fail tests and
generation rather than being swallowed at runtime.

### Rollout and migration

Each slice is independently reversible and ships no default ranking change until its gates pass:

1. Land PR #1404 and freeze its deterministic fixtures as the parity baseline.
2. Refactor package-owned domain lists/ports/application orchestration with no output change; add
   bounded in-memory fixtures and score-provenance schemas.
3. Extend release generation with the reproducible semantic artifact, manifest, integrity checks,
   JSR budgets, and offline evaluation runner. No runtime download.
4. Add the optional new-Turso adapter in `off`/`shadow` modes and prove corrupt/missing/unsupported
   fallback on the platform matrix.
5. Add MCP resource URIs/links and application-controlled resource reads while retaining existing
   tool/text behavior; modernize the SDK/protocol only through its explicit compatibility slice.
6. Add the pinned local query encoder and explicit `download`; keep `auto` cache-only and ranking
   opt-in while acceptance evidence accumulates.
7. Change the default from deterministic to cache-only `auto` only after all gates pass, the RFC is
   accepted, artifacts exist for the release, and maintainers approve the evidence.
8. Evaluate the tiny reranker separately. It stays experimental/off unless it passes its additional
   language, latency, memory, license, and CSP gates.

Old clients continue receiving text JSON and deterministic-compatible fields. New fields are
additive and policy-versioned. A future deprecation of legacy MCP framing requires its own announced
compatibility window; accepting this RFC does not authorize it. Cache incompatibility is handled by
replacement, not migration. Rolling back package configuration to `off` restores deterministic
behavior without deleting user data.

### Testing strategy

The future implementation requires:

- pure policy unit tests for RRF, protected tiers, deduplication, stable ties, bounded output,
  confidence lookup, and every fallback reason;
- contract tests shared by new-Turso and in-memory adapters, including dimensions, cancellation,
  lifecycle, parameterization, corruption, and deterministic ordering;
- generator golden tests for section boundaries, prefixes, hashes, database metadata, reproducible
  bytes or normalized dumps, and release-manifest compatibility;
- protocol fixtures for tools, structured content, resource links, list/read/templates, annotations,
  legacy-client compatibility, invalid URIs, and absence of subscriptions/prompts;
- offline relevance/abstention/adversarial evaluation with raw versioned reports;
- download/cache security tests with a local fake transport, never live network; and
- JSR dry-run, `deno doc --lint`, permissions, platform, artifact-size, latency, and RSS gates.

No test requires Aspire, Docker, a daemon database, or Turso Cloud. The database is an embedded
rebuildable fixture.

## Drawbacks

This adds a roughly 135 MiB encoder download, native/WASM runtime complexity, an external release
asset, and a pre-1.0 database dependency to a package whose deterministic ranker is comparatively
simple. Cross-platform inference and native adapter testing increase maintenance cost. Semantic
quality depends on a curated judgment corpus that itself needs review. Cache-only `auto` means some
users see deterministic behavior until they explicitly fetch assets, and multilingual claims remain
bounded by measured strata rather than the model card's headline.

The design also grows the public contract with score provenance, resources, and adapter subpaths.
Those costs are accepted only because each optional layer has a narrow port, strict budgets, and a
complete deterministic exit path.

## Rationale and alternatives

Weighted RRF is chosen over a scalar blend because lexical, concept, graph, cosine, and
cross-encoder scores have unrelated scales. Rank fusion is simple to reproduce, tolerates missing
candidates, and exposes intelligible provenance. Protected deterministic matches solve the remaining
failure mode: semantic similarity must not displace exact API truth.

The new Turso rewrite is chosen for the production embedded index because it supplies local,
in-memory, vector32/vector8, Deno-compatible operation behind a small adapter. Linear scan is chosen
over experimental vector indexes because the corpus has only thousands of sections. NetScript's own
deterministic ranker remains the lexical engine, avoiding experimental Turso FTS.

Rejected alternatives:

- **Replace deterministic search with vectors:** worsens exact-symbol authority and makes model
  availability critical.
- **Blend raw BM25/cosine scores:** calibration is corpus-dependent and falsely suggests a shared
  numerical meaning.
- **Use `@libsql/client` or legacy libSQL/Turso Cloud:** contradicts the selected database rewrite,
  adds a network service, and is unnecessary for local MCP.
- **Reuse `@netscript/database`:** its Prisma application-store contract does not describe immutable
  document vectors.
- **Reuse AI memory/retriever ports directly:** thread memory and generic citations omit corpus,
  source-hash, release, and deterministic-fallback semantics. Only the narrow embedding provider is
  adapted.
- **Put vectors/models in JSR:** would multiply the package size and force assets on deterministic
  users.
- **Generate embeddings on first query:** destroys reproducibility, creates severe cold starts, and
  requires write/model availability in the critical path.
- **Use remote embeddings by default:** leaks query text and introduces network
  latency/availability.
- **Use a generative LLM:** adds nondeterminism, cost, injection surface, and no necessary retrieval
  capability.
- **Adopt browser/WASM Turso as the first production adapter:** increases CSP, worker, and
  portability scope before the native local MCP use case is proven.
- **Enable experimental Turso FTS, multiprocess, or vector indexes:** no v1 requirement justifies
  the maturity risk.
- **Do nothing:** retains an excellent exact-term ranker but leaves systematic paraphrase and
  cross-language recall gaps.

## Breaking changes and migration

The proposed domain and MCP fields are additive. Deterministic-only consumers and existing clients
remain supported. Optional adapter exports and release assets introduce new surface but no mandatory
dependency. The eventual modern MCP SDK/protocol transition could be breaking and therefore cannot
be inferred from this RFC; it needs compatibility evidence and an independently approved migration
window. The RFC and issue must not carry a `breaking` label unless that later slice is incorporated
as a concrete breaking proposal.

## Prior art

PR #1404 and [issue #1102](https://github.com/rickylabs/netscript/issues/1102) supply the
deterministic intent-aware baseline. The read-only `eis-chat` implementation demonstrates the new
Turso TypeScript API, dimension validation, vector search, and lexical fallback, but this RFC
rejects its ASCII `LIKE` fallback and raw alpha score blend in favor of NetScript's richer ranker
and RRF.

Turso's [code-indexing guide](https://docs.turso.tech/guides/code-indexing) independently uses
vector8 and RRF with `k = 60`, supporting the selected storage/fusion direction while not replacing
NetScript-specific gates. Existing issues [#317](https://github.com/rickylabs/netscript/issues/317)
and [#455](https://github.com/rickylabs/netscript/issues/455) concern other libSQL/Turso application
and desktop seams. [#499](https://github.com/rickylabs/netscript/issues/499) is conversational agent
memory, and [#238](https://github.com/rickylabs/netscript/issues/238) deliberately leaves
application knowledge bases outside the generic AI package. None owns MCP documentation retrieval.

## Unresolved questions

- **MCP maintainer:** should the resource/official-v2-SDK compatibility slice ship before or after
  shadow semantic retrieval? Retrieval core does not depend on the answer.
- **Release maintainer:** should stable release publication upload the database directly or promote
  the exact canary workflow artifact? Either must preserve the same verified SHA and ordering.
- **AI maintainer:** after benchmarks, does the local encoder adapter live in `@netscript/mcp` or a
  narrow optional `@netscript/ai` adapter subpath? The MCP-owned query/corpus contract is fixed.
- **Security maintainer:** which host allowlist and cache root conventions are portable across the
  supported CLI installations?
- **Relevance owner:** which languages form the required v1 strata, and who adjudicates judgments?
- **RFC owner:** may vector8 graduate, and may the v1 RRF candidate weights be frozen? Both answers
  require held-out reports and cannot be decided from estimates.
- **MCP maintainer:** should `resources/list` expose every section or only document roots while
  templates/read address sections? The choice must remain bounded and mobile-reviewable.

## Non-goals

- implementing or accepting the feature through this RFC PR;
- replacing exact search, answering questions generatively, or executing retrieved content;
- indexing private repositories, arbitrary filesystem paths, chat transcripts, or application data;
- Turso Cloud sync, multiprocess writers, mutable runtime ingestion, delta indexes, or a vector DB
  service;
- promising browser support for the native adapter or equal quality across all languages;
- adding prompts/subscriptions, changing unrelated MCP tools, or resolving the package's existing
  horizontal-shape debt; and
- opening implementation epics/sub-issues before ratification.

## Future possibilities

After v1 evidence, separate RFCs or implementation proposals may add a browser-specific WASM
adapter, signed artifact attestations, reproducible delta artifacts, application-owned custom public
corpora, additional embedding models behind the same port, or a multilingual reranker. None may
weaken deterministic fallback, corpus identity, explicit permissions, or score provenance.
