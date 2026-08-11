# PLAN-EVAL — docs-rfc-mcp-hybrid-retrieval (PR #1409) — cycle 2 of 2

| Field | Value |
| --- | --- |
| Verdict | **PASS** (PR vocabulary: APPROVE) — cycle 2 of 2 |
| Evaluator | Native Claude Fable 5 (`claude-fable-5`), requested medium effort / bypass permissions / Remote Control; observed `claude-fable-5` at medium in Claude Code session `18e7e4ee-d970-4553-ac58-c8f1b7426883` (`session_01NDiSZqoDHZg99zjKKbHa4N`), host `YogaBook9i` WSL user `codex` |
| Session separation | This is a fresh Claude Code session, a different product/provider from the Codex GPT-5.6 Sol author thread `019fe54e-78aa-75c2-bb5e-9a2a6cebd1b0`; no shared context. It is also not the cycle-1 evaluator session. Generator ≠ evaluator holds. |
| Evaluated content | RFC `rfcs/0000-deterministic-first-hybrid-mcp-doc-retrieval.md` at immutable author head **`6f352c7633e51bd2f245f120b03bc3090c99fd9e`**; run artifacts; PR #1409 body/comments; issue #1410 |
| Target verification | local `HEAD` = remote branch head (`FETCH_HEAD`) = PR head = `6f352c763…`; worktree clean at evaluation start; diff vs `origin/main@da40fbfe3` touches only the RFC + seven run files — `deno.lock`, `packages/`, `plugins/` diffs empty |
| Cycle-1 provenance | Evaluator commit `37c6cff3e78a64e55cd69677bda1716d8aa1f811` preserved in history (author branch fast-forwards from it); verdict comment `5231992247` intact in the PR timeline; this file supersedes the cycle-1 text as the authoritative verdict, with cycle 1 retained verbatim in git history at `37c6cff3e` |
| Delegation | None. No subagent was launched; every load-bearing claim was verified directly in this session. |

## Independent evidence base (this session, not author-relayed)

- `origin/main` fetched fresh: `da40fbfe377a9e728f190056771298100297a8f8`; `51a58b4f5` (#1404) and
  `08e4c761d` (#1416) confirmed ancestors via `git merge-base --is-ancestor`.
- Ranker source read at `FETCH_HEAD:packages/mcp/src/domain/docs/guidance-index.ts`: single mutable
  scalar, `#applyLinkBoosts` (l.80/169), `toLocaleLowerCase()` (l.70/154), `routeHints` sort
  (l.192), `exactPhraseBoost: 10`, `titleBoost: 4`, `headingBoost: 6`, `conceptBoost: 8`,
  `linkBoost: 2`, `requiredAnyTerms` (l.125), identity tokens (l.132–137).
- Public surface: `GuidanceConfidence` exported at `packages/mcp/mod.ts:148`, defined at
  `guidance-contract.ts:41`; `GuidanceResult.fallback?: string` at `guidance-contract.ts:95`.
  `git grep` over `FETCH_HEAD:packages/mcp` finds **no** existing `HybridGuidanceConfidence`,
  `HybridGuidanceEnvelope`, or `semanticFallback` symbol.
- Tool census from `FETCH_HEAD:packages/mcp/src/application/tool-registry.ts` kinds map: 22 tools =
  18 `read` + 2 `meta` (`doctor`, `list_commands`) + 2 `mutate` (`execute_command`,
  `record_drift`).
- Fixture counts parsed from JSON: `guidance-evaluation.json` has **8** cases on current main and
  **5** at merge commit `51a58b4f5`.
- Embedded corpus provenance parsed from `FETCH_HEAD:packages/mcp/src/publish-assets.generated.ts`:
  `documentCount: 12`, `sourceBytes: 253535`, 12 paths — matches the RFC's "12 documents and
  253,535 source bytes" exactly.
- npm registry read this session: `@tursodatabase/database` `dist-tags` = `latest: 0.7.2`,
  `next: 0.8.0-pre.3`; 0.7.2 `optionalDependencies` are exactly `darwin-arm64`, `linux-x64-gnu`,
  `win32-x64-msvc`, `linux-arm64-gnu`; license MIT. No macOS x64, no musl — the RFC platform
  matrix and fallback claim are correct.
- Gate tooling exists on main: `deno.json` defines `check:publish-assets` (l.110),
  `release:preflight` (l.114), `publish:readiness` (l.115); `.github/workflows/publish.yml` and
  `release-canary.yml` exist.
- Debt entry `MCP-A6-V2-SHAPE` present at `.llm/harness/debt/arch-debt.md:2069` with the A6
  brief-locked classification the RFC cites.
- Issue #1201 is OPEN, milestone 0.0.6, titled export-surface MCP work — matching the RFC's
  coordination section.
- Model/hash pins byte-identical between the cycle-1 RFC (`69d1f42b4`, byte-exact-verified against
  HuggingFace in cycle 1) and the cycle-2 RFC: `614241f62…`, `761b726dd…`,
  `f80102d3…`/118,308,185 B, `0b44a9d7…`/17,082,730 B, `c5ee24cb…`, `a09144355…`,
  `e9d8ebf8…`/23,143,499 B. Diff noise was line wrapping only.

## F-C1–F-C8 verification matrix

| Finding | Cycle-2 resolution | Independent verification | Status |
| --- | --- | --- | --- |
| F-C1 seam | RFC §"Existing scalar ranker and required deterministic seam" now states the merged ranker produces **no** rank lists and names a signal-decomposition refactor with five producers, each mapped to a real code surface, a protected tier with recorded reasons, and exact-match-only protection. | Every producer source named in the table exists in `guidance-index.ts` (scalar, link boosts, route hints, exact-phrase/concept/identity boosts, `requiredAnyTerms`). The frozen five-case **full-serialization** #1404 golden + current eight-case smoke are both required to pass before any hybrid ordering, the old scalar path stays callable, and no vector work may update the golden. Falsifiable parity gate: present. | RESOLVED |
| F-C2 collisions | `GuidanceConfidence` and `GuidanceResult.fallback?: string` retained verbatim; new `HybridGuidanceConfidence`, `HybridGuidanceEnvelope`, `semanticFallback`; schema v2 is explicit request negotiation. | Existing exports confirmed at `mod.ts:148` / `guidance-contract.ts:41,95`; no name in the new contract block collides with any existing `packages/mcp` symbol on main. Additive claim in §Breaking changes is now true. | RESOLVED |
| F-C3 determinism | Two-guarantee split: (1) v1/fallback parity binds ordered arrays, every legacy field, property order, and serialized JSON bytes to `GuidanceIndex.find()`, with **no additive v1 field**; v2 fallback nests that exact object and claims no whole-envelope parity. (2) Hybrid determinism scoped to corpus/model/policy/runtime **/WASM provider/architecture family**. Fixed signal iteration order, round-12 before any comparison, complete tie chain ending in binary slug + ordinal. WebGPU shadow-only, outside the normative claim, cannot affect returned ranking. Reranker can't cross the protected tier and falls back to pre-rerank order. | The three cycle-1 incompatible statements are gone; the two guarantees are mutually consistent and each is testable (byte fixture / 50-repeat / per-tuple determinism gates in §Evaluation). Locale-dependent calls are removed in the refactor (NFKC + `toLowerCase`, code-point ordering). | RESOLVED |
| F-C4 vector8 | vector32 BLOB via `vector32(?)` is normative build+query storage (schema shown); vector8 is experimental with honest acknowledgment that Turso's own pages disagree (`F8_BLOB` float-JSON engine-quantized vs integer illustration), engine-owned quantization pinned in `CorpusIdentity` (`quantizer: turso-vector8@0.7.2`, test-vector digest), build/query symmetry via the same pinned engine, and graduation gates: primary-source reconciliation, per-target byte-stable test vectors, compatibility, overflow/NaN, reproducibility, ≤0.005 nDCG@5 loss. | vector32 storage is implementable exactly as written; the nonexistent `VECTOR8(384)` schema token is gone; the graduation gate now has a defined contract to run against. NetScript invents no scale/offset. | RESOLVED |
| F-C5 archetype | §Architecture keeps the package under `MCP-A6-V2-SHAPE` (A6 brief-locked skeleton), folds A2 port/adapter laws into a semantic core inward of the A6 edge, names four typed injected extension axes, and states behavior both before and after A6 debt retirement without claiming to close the debt. | Debt entry verified at `arch-debt.md:2069`; the edge/core split assigns MCP schemas/CLI/stdio/resource catalog/composition to A6 and domain/ports/adapters to the folded A2 core — consistent with the doctrine's fold rule and the cycle-1 required repair. No DI container/global registry/env-reading core. | RESOLVED |
| F-C6 lifecycle | Locked 6-step lifecycle: canary builds once from the canary-pair SHA, uploads SHA-named Actions artifact; stable **promotes that exact artifact** to the GitHub Release **before** `publish:readiness`/dry-run/preflight/JSR; stable never regenerates; retry idempotent (match-or-refuse). Trust root stated explicitly: release assets are writer-mutable, so the checked-in JSR manifest SHA/length is the only authority. Exact hosts (`github.com` → `release-assets.githubusercontent.com`; `huggingface.co` Xenova exact revision/filenames → `cdn-lfs.hf.co`/`cas-bridge.xethub.hf.co`), ≤3 revalidated redirects, no credentials, overrides rejected. `auto` offline; cache keyed on database+model SHA+policy version; atomic write; quarantine-and-fallback. New tools named (`generate-…`, `evaluate-…`, `benchmark-…`, `promote-mcp-semantic-artifact.ts`) and honestly labeled future deliverables; `publish:readiness` gains the semantic check; `release:preflight` not repurposed. | Existing gates/workflows verified present on main (`deno.json` 110/114/115, `publish.yml`, `release-canary.yml`); cycle-1's FCP Q2/Q4 are now decided in-text, not deferred. Ordering, trust root, allowlist, offline/cache behavior, and enforcement tooling are all locked. | RESOLVED |
| F-C7 corpus roles | Three non-overlapping roles: 8-case fixture stays deterministic smoke (explicitly cannot compute nDCG and is not converted); the original 5 cases seed the immutable byte-parity golden; a new ≥120-record graded JSONL (`guidance-relevance-v1.jsonl`) with 0–3 judgments, BCP-47 languages, calibration/validation split, strata minima (30/25/15/15/20/15), adjudication, corpus SHA. | Fixture counts verified (5 at `51a58b4f5`, 8 on main). Every promised gate is computable from the schema: nDCG@5 (grades), protected Recall@1 (`requiredRankOne`), abstention (`supported` + `insufficient` band), ambiguity (`ambiguitySet`), poisoning (`poisoningExpectation`), language strata (BCP-47 fields), parity/50-repeat (golden + smoke). | RESOLVED |
| F-C8 batch | All corrections landed. | Independently re-verified this session: Turso 0.7.2 latest / `next` pre-release / exact 4-target platform matrix / `DatabaseOpts.readonly` claim; macOS-x64+musl deterministic-fallback statement; baseline re-pinned to `da40fbfe3` with 3,777 framed as historical merge-snapshot evidence; 22/18 tool census exact; 12-doc/253,535-byte corpus exact; guide `ranks` keys are now valid `RetrievalSignal` members; `hybrid-retrieval/v1` typo fixed; `dimensions`/`rrfK` are `number` with construction-time validation (parameterization future-proof); aux types (`RankedSectionCandidate`, `HybridRetrievalPolicy`, `CandidateRerankerPort`, `RetrievalTelemetryPort`) all fully defined; locale-independent folding required in the refactor slice; #1201 named, verified open, distinct URI namespaces + single `resources/list`; MiB arithmetic correct (3,777×384 = 1,450,368 B = 1.38 MiB; ×4 = 5.53 MiB); model pins unchanged from cycle-1 byte-exact verification. | RESOLVED |

## Plan-Gate walk

| Box | Status | Evidence |
| --- | --- | --- |
| Research present and current | ✓ | `research.md` re-baselined on `da40fbfe3` fetched 2026-08-10; load-bearing findings spot-checked against the tree this session (ranker surfaces, exports, fixtures, tool census, corpus provenance, debt entry, registry) — all exact |
| Decisions locked | ✓ | `plan.md` 9-point locked plan + RFC normative sections; storage, provider, lifecycle, trust root, allowlist, archetype, corpus roles all decided with rationale |
| Open-decision sweep | ✓ | See below — the four declared unresolved questions are all safe to defer; independent sweep found no undeclared rework-forcing decision |
| Commit slices | ✓ | Author docs slices 0–5 (worklog) delivered; implementation rollout slices 1–8 ordered, < 30, each names its proving gates (§Rollout + §Testing and tooling + future-lane gate set in `plan.md`) |
| Risk register | ✓ | §Drawbacks + fallback/security/error design + per-risk graduation gates (platform, corruption, latency, RSS, budget, poisoning) |
| Gate set selected | ✓ | Docs-overlay author lane executed (worklog cycle-2 gate table, all PASS); future deterministic/semantic/release lanes enumerated; cycle-1's missing `release:preflight`/`publish:readiness` naming fixed and tools verified present |
| Deferred scope explicit | ✓ | §Non-goals precise (no implementation authorization, no debt closure, no SDK/oRPC migration, no vector8/WebGPU/reranker graduation) |
| jsr-audit | ✓ | Release-asset-not-JSR boundary retained and consistent with the text-import preflight (verified in cycle 1, unchanged); packed `@netscript/mcp` ≤2 MiB budget; optional adapter subpaths never become root-export dependencies; `deno doc --lint`/packed-size/dry-run named in the release lane |

## Independent open-decision sweep

Declared unresolved questions (§Unresolved questions) — all verified safe to defer: MCP SDK
proposal ordering (default: handwritten current protocol, verified true on main — no SDK import),
encoder adapter physical placement (the contract fixes behavior either way; no root dependency),
relevance strata/adjudicator owner (default: no semantic graduation), RRF weight freeze
(preregistered candidate; shadow/opt-in until held-out validation). Cycle-1's rework-forcing Q2
(promotion) and Q4 (allowlist) are now locked in-text, as is vector storage.

Hunted for undeclared open decisions: resource DTO finalization is explicitly slice-scoped with the
contributor port declared the stable seam; chunking parameters are versioned chunker inputs;
confidence banding is versioned and calibration-gated; cache-key and corruption policy decided.
None found that would force rework. The oRPC boundary was checked: the RFC claims independence and
current-tree truth (handwritten 2025-11-25 JSON-RPC, no oRPC in MCP) matches the tree; no v2
behavior is claimed.

Non-blocking editorial notes for ratification (do not affect the verdict, may be fixed at
ratification): (a) the guide-level v2 JSON example flattens `uri`/`sourceSha256` onto the result
where the reference contract nests them under `section`, and its illustrative `fusionScore: 0.0341`
is not exactly the round-12 sum of the ranks shown (≈0.0332); (b)
`EmbeddingModelIdentity.executionProvider` is the literal `'wasm'` — coherent since only WASM-built
corpora ship and shadow-WebGPU identity lives in telemetry (`webgpu-shadow`), but worth one
clarifying sentence when v2 types land.

## Validation / hygiene evidence

- Immutable target: `HEAD` = `FETCH_HEAD`(branch) = PR head = `6f352c763…`; `rtk git status` clean.
- `deno.lock`, `packages/`, `plugins/`: zero diff against both the author head and `origin/main`.
- Cycle-1 provenance: commit `37c6cff3e` in history; PR comment `5231992247` verified by API
  (author `rickylabs`, `[PHASE: PLAN-EVAL] [VERDICT: CHANGES_REQUESTED]`); the author's cycle-2
  `[PHASE: PLAN] [CYCLE: 2]` comment follows it.
- PR state at evaluation: draft, `status:plan-eval`, `type:docs`, `rfc`, `ci:skip-e2e`,
  `ci:skip-scaffold`, `area:tooling`, `area:ai-core` — docs-only skip lane is intentional and
  recorded.
- No product code executed or mutated by this evaluator; the single registry read and `deps:latest`
  run were read-only and left the lock untouched.

## Verdict

**PASS** — cycle 2 of 2. Every cycle-1 finding (F-C1–F-C8) is resolved in the RFC text and
independently verified against current `origin/main`, primary registries, and the PR timeline. All
Plan-Gate boxes are satisfied. Lifecycle transition: PR #1409 and issue #1410 move
`status:plan-eval` → `status:review`; the PR remains draft and the RFC number remains `0000`.
Ratification (RFC number assignment, merge, implementation authorization) is owner business and is
explicitly not exercised by this evaluator.
