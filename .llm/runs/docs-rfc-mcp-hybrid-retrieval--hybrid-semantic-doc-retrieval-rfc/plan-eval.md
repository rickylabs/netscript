# PLAN-EVAL — docs-rfc-mcp-hybrid-retrieval (PR #1409)

| Field | Value |
| --- | --- |
| Verdict | **FAIL_PLAN** (PR vocabulary: CHANGES_REQUESTED) — cycle 1 of 2 |
| Evaluator | Claude Fable 5 — owner-designated separate evaluator session (requested identity: Fable 5 · medium; session runs at the owner-overridden high effort recorded in its own run charter); cross-family to the generator (Codex GPT-5.6 Sol · xhigh, thread `019fe54e-78aa-75c2-bb5e-9a2a6cebd1b0`) |
| Evaluated content | RFC `rfcs/0000-deterministic-first-hybrid-mcp-doc-retrieval.md` at immutable head **`69d1f42b41d466cb36008fea863c57c81cacab80`** (base `main@399f60185`), run artifacts, PR #1409 comments, companion issue #1410 |
| Delegation | Workflow `wf_bb5f06d2-9a2` (script committed pre-execution on `plan/fable5-remediation-roadmap`): one Opus 5 · xhigh read-only deep dive; all adopted evidence re-reviewed by this evaluator |
| Hygiene | `git diff --stat 399f60185..69d1f42b4`: 7 files, +1,173/−0 — RFC + six run artifacts only; no `deno.lock`, package, or generated-asset change. **Clean.** |

## Plan-gate walk

| Box | Status | Note |
| --- | --- | --- |
| Research present/current | ✓ | `research.md` re-baselines against `399f60185`, PR #1404 @ `fd92679`, primary Turso/model/MCP sources; honest-limitations section is exemplary |
| Decisions locked | ✓ | 8-point locked plan + doctrine verdict + per-owner deferred decisions |
| Open-decision sweep | **✗** | Three FCP items force rework as posed (release-asset ordering, encoder host allowlist, vector8 graduation before its quantization contract exists) and six undeclared open decisions were found (findings below) |
| Commit slices | ✓ | Author slices evidenced; implementation rollout staged 1–8 |
| Risk register | ✓ | Present with gates |
| Gate set selected | ✓/− | Extensive; two gate-tooling gaps folded into F-C6/F-C8 |
| Deferred scope explicit | ✓ | Non-goals precise |
| jsr-audit | ✓ | Dry-run + budgets + external-asset decision; E3 verified compatible with the release text-import ban |

## Verdict: FAIL_PLAN — findings (severity-ranked)

**What is verifiably strong** (independently confirmed): every model/tokenizer/reranker pin is
byte-exact against the HuggingFace API (sizes and SHA-256 match to the digit);
`@huggingface/transformers` 4.2.0 is current; the 3,777-section corpus count is exact
(recomputed from the merged asset); the release-asset-not-JSR decision respects the text-import
preflight scanner; the security/injection posture (local-by-default, egress disclosure, inert-text
law, poisoning strata) is unusually good; telemetry is bounded with an explicit deny-list; rollout
gating and the 2025-11-25→2026-07-28 MCP protocol baseline are accurate; source/lock hygiene is
clean. The deterministic-first thesis itself is sound. The failures below are specification
defects, not a wrong direction.

### F-C1 (critical) — The baseline seam the RFC builds on does not exist in #1404

`DeterministicCandidateLists { lexical, concepts, graph, protectedExact }` (§Public contracts) has
no producer. The merged ranker (`packages/mcp/src/domain/docs/guidance-index.ts` @ `51a58b4f5`)
accumulates BM25 + identity + exact-phrase + concept boosts into **one scalar score** and
`#applyLinkBoosts` mutates that scalar in place — there are no per-signal rank lists to expose.
`protectedExact` has no concept at all in the baseline: route hints are a primary sort key and
exact-phrase is a score bonus, not a tier. Consequently rollout slice 2 ("refactor … with no
output change") cannot deliver this contract — deriving per-signal lists and a protected tier *is*
a ranking re-architecture. **Repair:** respecify the baseline refactor honestly — name the
re-architecture, give it its own byte-parity gate against frozen #1404 fixtures, and define the
protected tier's producer from surfaces the ranker actually has (route-hint hits, exact-phrase
hits, curated-concept exact matches), or narrow the protected-tier claim to what exists.

### F-C2 (critical) — Public-export name collision makes the change breaking, contradicting the RFC's own compatibility claim

`GuidanceConfidence` is already exported from `@netscript/mcp` (`mod.ts:148`) as the string union
`'high'|'medium'|'low'`; the RFC redefines the same name as an interface with a fourth band.
`GuidanceResult.fallback?: string` (human message) is retyped to
`null | { reason: SemanticFallbackReason }` on the same tool. Both contradict §Breaking changes
("additive… must not carry a `breaking` label"). **Repair:** rename the new types (e.g.
`HybridGuidanceConfidence`, a distinct `semanticFallback` field) and reconcile the band vocabulary
with the existing export, or declare an explicit breaking slice with its own migration window.

### F-C3 (critical) — The deterministic-fallback law is stated three incompatible ways, and WebGPU silently breaks the determinism claim

§Summary says "byte-for-byte compatible"; §Baseline says "public deterministic result **and
serialization** unchanged"; the graduation gate says "byte-identical **ordering** and schema
compatibility" — while §MCP presentation adds fields (`mode`, `policyVersion`, `corpus`,
`matchedSignals`, `score`, retyped `fallback`) that change serialization even in `off`.
Separately, §Corpus permits WebGPU after capability detection, but WASM and WebGPU do not produce
bit-identical float32 embeddings, so "same corpus, policy, and runtime produce the same ordering"
is false across execution providers, and the 50-run per-platform gate cannot detect it. RRF
summation order is also unspecified while the tie chain sorts on the fused float first.
**Repair:** restate the law falsifiably (in `off`/fallback the ordered result arrays and every
legacy field are identical to `GuidanceIndex.find()`; no additive field may vary with semantic
state), scope determinism claims to (corpus, policy, runtime, **execution provider**) or exclude
WebGPU from any deterministic claim, and fix signal accumulation order (or quantize the fused
score before comparison).

### F-C4 (critical) — The `vector8` quantization contract does not exist, and the normative schema uses a nonexistent type

`embedding VECTOR8(384)` is not a Turso type — the rewrite's column types are `FLOAT8`/`F8_BLOB`
(Turso vector-function reference; the code-indexing guide the RFC itself cites writes
`F8_BLOB(384)`). Deeper: two current primary Turso pages disagree on `vector8()` input (integer
0–255 array vs float array with internal quantization), and the RFC never defines who quantizes,
with what scale/offset, or how query-side vectors are made bit-compatible with build-side storage
— yet pins `vector8` storage and gates it at ≤0.005 nDCG@5. The gate cannot be run against an
undefined contract. **Repair:** fix the schema token; specify the quantization contract as
corpus-identity material (`chunkerSchemaVersion`-class), including query-side conversion; make
FCP Q6's vector8 half contingent on that contract being resolved empirically in slice 3.

### F-C5 (major) — Archetype claim contradicts the recorded debt ledger

§Architecture asserts "`@netscript/mcp` remains an Archetype 2 integration package". The repo's
debt registry says the opposite: `MCP-A6-V2-SHAPE` (`arch-debt.md:2069`) records the package as a
brief-locked **Archetype-6** skeleton with a gate requiring migration or a doctrine subtype
ruling; the doctrine's A2 definition ("wraps exactly one external system") also strains against a
package that would wrap the MCP protocol + Turso + an ONNX runtime, and `arch:check` does not
cover `packages/mcp` so nothing enforces either answer. **Repair:** settle the archetype (A2
ruling, A6 retirement plan, or explicit doctrine subtype) in the RFC's architecture section with
a pointer to the debt entry, before the port/adapter layout is ratified.

### F-C6 (major) — Release/artifact lifecycle: two FCP questions force rework as posed

(a) *Ordering:* "stable uploads the artifact before publishing the JSR package that references
it" has no step in the release skill's ordered cut, the ordering class is already a live failure
mode (#1419), and FCP Q2 (upload directly vs promote the canary artifact) decides whether the JSR
manifest can carry the artifact SHA at bump time — that is a design input, not a deferral.
(b) *Allowlist:* the ~135 MiB encoder download has no named allowlisted host anywhere; `download`
mode is unspecifiable as written (FCP Q4). Also state the implied trust law explicitly: a GitHub
Release asset is mutable by repo-write holders, so **the JSR manifest's SHA is the trust root**.
(c) The invented budgets (packed ≤ 2 MiB etc.) have no existing enforcer, and the named gates
omit `release:preflight`/`publish:readiness` — name the new gate tooling as a deliverable.

### F-C7 (major) — Evaluation-corpus discontinuity with the shipped fixture

The checked-in corpus from #1102/#1404 is `packages/mcp/tests/fixtures/guidance-evaluation.json`
(schemaVersion 1, exactly 5 cases, `exact`/`required-set` modes, no graded judgments). The RFC
specifies a ≥120-intent graded corpus with adjudication history and nDCG/Recall gates — which are
not computable from the existing fixture — and never names it or decides
supersede/absorb/keep-as-smoke. **Repair:** one migration paragraph in §Evaluation.

### F-C8 (minor batch — cheap, do all)

(a) Pin staleness: `@tursodatabase/database` 0.7.1 → 0.7.2 is already latest (`next` 0.8.0-pre.3);
also cite read-only mode from the shipped `.d.ts` (`DatabaseOpts.readonly`) — it is absent from
the docs page. (b) Platform truth: no `x86_64-apple-darwin` and no musl builds exist in the npm
package — state that macOS-x64/Alpine can only ever take the deterministic-fallback arm of the
platform gate. (c) Baseline pin: #1404 merged as `51a58b4f5` *after* this RFC's base; the
3,777-section count is only true post-merge — rebase or re-pin the normative baseline at
ratification. (d) Contract self-consistency: the guide example's `ranks: { concept, graph }` keys
are not members of `RetrievalSignal` (`curated-concept`/`link-graph`); `"hybrid-rerieval/v1"`
typo vs `hybrid-retrieval/v1`; literal types `dimensions: 384` / `rrfK?: 60` contradict the
"additional embedding models behind the same port" future — parameterize or scope to v1
explicitly; auxiliary types (`RankedSection`, `HybridRetrievalPolicy`, `CandidateRerankerPort`,
`RetrievalTelemetryPort`) are referenced but never sketched. (e) "22nd read tool" → 18th read
tool of 22 total. (f) The baseline's `toLocaleLowerCase()` is locale-dependent (Turkish-İ class)
— pre-existing in #1404 but newly load-bearing under cross-lingual gates; note it and require
locale-independent folding in the refactor slice. (g) Name **#1201** (export-surface MCP corpus,
open, 0.0.6) as a design collision on `resources/list` and cross-reference it. (h) Vector-payload
arithmetic uses decimal MB in two places (≈1.42/5.53 MiB actual).

## FCP-question adjudication

Q1 (protocol-slice order), Q3 (encoder adapter placement — `EmbeddingProviderPort` verified
present in `packages/ai`), Q5 (language strata), Q7 (resource-list granularity; note 3,777
sections makes "every section" a real listing-size concern): **safe to defer**. Q2 (release
promotion) and Q4 (host allowlist): **force rework** — resolve in the RFC (F-C6). Q6: weight
freezing defers safely; the vector8 half is blocked by F-C4 until the quantization contract
exists.

## Required for PASS (cycle 2 — the escalation boundary)

Resolve F-C1–F-C7 in the RFC text (F-C6a/b may alternatively become fully-specified FCP questions
with the option space and consequences enumerated); land F-C8 as a batch edit. No change of
direction is requested: deterministic-first, RRF, protected exactness, release-built artifacts,
and the security posture all survived adversarial verification.
