# IMPL-EVAL — C1 / #1482, draft PR #2082 (same-session third review at the complete qualified head)

## Metadata

| Field          | Value |
| -------------- | ----- |
| Run ID         | `feat-command-c1-contracts--lane-d` |
| Target (this round) | C1 **qualification head** `e09a5692360d7c157032e04f97b51c81d43d16f8` on `feat/command-c1-contracts` at the active task-local C1 checkout. Transitive product commit `ddcd62d25253142ffa3a55b5ddb396440c1d7ffb` (two generated consumers) is its parent; `e09a5692…` is an artifact-only receipt commit. Head verified by `git rev-parse HEAD` on a clean tree; head remains frozen throughout. |
| Historical verdicts | Round 1 PASS at product head `e64c841bc9c1a9f967afa357b54f454445807db8` (immutable at `108b6930…`; preserved `evaluate-round-1.md` SHA `83d3f9b6…`); Round 2 PASS at `17e9ad075e595aa591b12e3b009c6aed6c482fbf` (downstream Fresh UI private-lock metadata; immutable at `b4ee0c343…`; preserved `evaluate-round-2.md` SHA `3363a72a…`). Both reports re-verified byte-exact at this head and are untouched by this evaluation. |
| Third-round attempt history | The first third-round attempt at `360165b45ae07b1a87671b14d09e990769687380` produced **no verdict** (interrupted after a directory relocation left a read pending; same session retained). This document is the only third-round verdict; nothing was invented for the interrupted attempt. |
| Scope | C1 only: unchanged S1–S3 product + the narrow generated-consumer freshness repair chain (docs-repair + transitive-assets). C2 has a separate planning/implementation checkout, which was **not accessed**; no later-leaf acceptance or source belongs to this target. Whole-chain PLAN-EVAL remains PASS. |
| Archetype / overlays / tier | contracts A1 + A4, service A4; SCOPE-service; complex tier with owner authorization on record (unchanged). |
| Evaluator | Same independent evaluator session as rounds 1–2 (per the brief), still separate from and opposite-family to the OpenAI generator/implementer lane. Requested route: OpenCode Go / `glm-5.3-flash` with CLI variant `max`; observed identity remains `opencode-go/glm-5.3-flash`; runtime reasoning effort is not independently attested and is not inferred from the flag. No fallback. |
| GitHub state (read-only) | Issue #1482 / PR #2082 milestone **0.0.8** (live REST readout); PR OPEN/draft; closing claim withheld, status not ready-merge while this review was pending — no circular requirement raised. Live CI at the qualification head assessed in the dedicated section below. |

## Change-scope verification (round-2 head `b4ee0c343…` → this head)

| Check | Result | Evidence |
| ----- | ------ | -------- |
| Commit trail | PASS | Exactly three commits after round 2: `360165b…` (three shared generated assets + artifacts), `ddcd62d…` (two transitive generated copies + artifacts), `e09a5692…` (receipt-only artifacts). No product commits beyond generated consumers; no tools/workflows/tests/locks changed. |
| Product delta between targets | **PASS** | Exactly five product files changed, all generated consumers listed below; `git diff b4ee…head --name-only` shows nothing else outside the run directory. |
| Framework/source/lock exact identity vs `b4ee…` | **PASS** | All 22 C1 product files re-hashed — byte-identical. Root `deno.lock` (`75404ed4…`) and `packages/fresh-ui/deno.lock` (`81453e4f…`) unchanged. `docs-repair-source-manifest.json` reports 6151 unchanged tracked files and `transitive-assets-source-manifest.json` 6158; my own name-only diff across the full range confirms both. The changed assets' SHA-256 values match the signed-off candidates in both manifests. |

The five generated product files:

1. `.llm/assets/agent-docs/prose.json.gz` — shared rendered-site corpus (1417093 → 1419827 bytes)
2. `.llm/assets/agent-docs/provenance.json` — shared corpus provenance
3. `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts` — MCP export corpus
4. `packages/cli/src/kernel/assets/agent-docs.generated.ts` — CLI embedded docs copy
5. `packages/mcp/src/publish-assets.generated.ts` — MCP publish-fallback provenance

## Provenance and semantic proof (independent, not inherited)

| Asset | Independent verification |
| ----- | ------------------------ |
| Shared prose corpus | Provenance `sourceCommit: b4ee0c343` = the commit whose tree the corpus was generated from (content semantics verified against that tree's reference pages); `version 0.0.7`; compressed/`uncompressedBytes`/`sha256` recomputed from the committed gzip — all match. Corpus decodes to **182 entries** before and after; **exactly 3 entries changed** (`llms-full.txt`, `pages/reference/contracts/index.md`, `pages/reference/service/index.md` — the C1-owned docs); both **non-site context entries byte-preserved** vs the round-2 corpus. Gzip transport is content-stable: the generator reuses the committed compressed transport when the plaintext is unchanged (`existingEquivalentTransport`), which is why prose freshness passes under both CI and local runtimes (verified below). |
| MCP export corpus | Regenerated the corpus myself into a private copy: the **uncompressed text is byte-identical** to the committed corpus; committed cardinality 7908 → **7947 symbols** (+39 C1 command symbols) with `packageCount 35 / subpathCount 277` and **+2 surfaces** (`@netscript/contracts ./commands`, `@netscript/service ./commands`); no existing surface removed. The committed compressed transport is **canonical under the exact CI runtime** (see freshness gates). Provenance `sha256` (over the compressed transport) matches the committed bytes. |
| CLI embedded copy | Imported the actual generated module in Deno and compared values: embedded gzip bytes **equal the shared corpus bytes**; embedded provenance object **equals the shared `provenance.json`**; `EMBEDDED_AGENT_DOCS_PACKAGE_EXPORTS` adds only `./commands` to `@netscript/contracts` and `@netscript/service` (33 of 35 package keys unchanged, nothing removed). |
| MCP publish fallback | Diff vs round-2 head shows **exactly one field changed**: `sourceCommit` `60fc4fb06` (stale) → `b4ee0c343`, now equal to the shared provenance; documents, README, framework version and all other metadata unchanged. |
| No `--allow-dirty` shortcut | The corpus generator refuses to write from an uncommitted `packages`/`plugins` read set unless `--allow-dirty` is explicitly supplied. **No recorded native refresh command in either repair carries `--allow-dirty`** (checked every gate command), so all generation ran from clean committed read sets. |

## Independent gates at the exact head

| Gate | Runtime | Result | Evidence |
| ---- | ------- | ------ | -------- |
| Prose freshness (`check:agent-docs-prose`) | exact CI 2.9.5 and local 2.9.7 | **exit 0 both** | My own runs (durable receipts under the task-private setup). |
| MCP corpus freshness (`check:mcp-export-corpus`) | exact CI **2.9.5** | **exit 0** | My own run with the exact CI runtime binary. |
| Stale→fresh controls (shared corpora) | exact CI 2.9.5 | **nonzero → 0 reproduced** | Transiently restoring the round-2 (`b4ee…`) versions of the three shared assets reproduces `prose freshness exit 1` and `mcp freshness exit 1` with **no lock rewrite**; byte-exact restoration returns both to 0. Tree verified clean after. |
| Stale→fresh control (MCP publish fallback) | exact CI 2.9.5 | **nonzero → 0 reproduced** | With the `360165b…` versions of the two embedded consumers restored, the `publish-assets` gate exits **1** (stale `sourceCommit`); restored bytes return it to **0**. |
| Assets barrel (`check:assets-barrel`, Git-diff based) | exact CI 2.9.5 and local 2.9.7 | **exit 0 both**, checkout clean | Runs regeneration over all seven targets then `git diff --exit-code`. The recorded pre-repair `assets-baseline` exit 1 is a commit-relative control (regenerated fresh content vs the *committed* stale barrel at `360165b…`; durable receipt verified) and is reproduced semantically by my byte-identity proofs plus the post-commit receipt `assets-barrel PASS` at `ddcd62d…` with a clean checkout. |
| Publish-assets gate | exact CI 2.9.5 and local 2.9.7 | **exit 0 both** | My own runs. |
| Rendered-site/actual docs build (`check:rendered-output`) | exact CI 2.9.5 | **exit 0** | My own run. |
| Existing regression suites | exact CI 2.9.5 | bundle **4/0**, source-format **6/0**, MCP safe-generator **5/0**, generator/CLI docs **12/0** | My own runs; the 12 matches the recorded `generator-and-cli-regressions` selection exactly (barrel, publish-assets, CLI agent-docs generator tests). No new tests exist in the diff (metadata/doc-asset repair; the nonzero→0 baselines qualify the assets themselves). |
| JSR specifier scan / CLI materialized publish / MCP materialized publish / quality:scan / arch:check / `git diff --check` | exact CI 2.9.5 | **all exit 0** | My own durable receipts; quality/arch show the same pre-existing baseline warnings as rounds 1–2. |

## Runtime-portability finding (honest, non-blocking)

My local **Deno 2.9.7** run of `check:mcp-export-corpus` reports the committed corpus stale while the same **2.9.5** run passes. I decompressed both payloads: the **plaintext corpora are byte-identical** — the divergence is purely the gzip transport (326911 vs 326917 compressed bytes; the MCP generator always recompresses, unlike the prose generator's reuse-transport, so its committed bytes are pinned to the runtime that generated them — CI's 2.9.5). Related evidence-accuracy issue: the recorded `docs-repair-gate-evidence.json` labels two MCP rows `2.9.7`, but their retained runtime logs show `deno 2.9.5`, and `docs-repair.md`'s "MCP also passes under local2.9.7" is not supported by my measurement. Classification: **medium (evidence-accuracy), non-blocking** — every relevant gate is defined to run (and ran, locally and in CI) under the CI-pinned 2.9.5, and the enforced publication bar is the CI runtime. Recommended follow-ups (owner action, outside C1 product): correct the two row labels and the 2.9.7 sentence; optionally make the MCP transport runtime-pinned or adopt the prose transport-reuse pattern so future local-runtime checks cannot flag a content-fresh corpus.

## Live CI at the qualification head (assessed by provenance; skipped draft jobs are not executed gates)

| Finding | Head | Assessment |
| ------- | ---- | ---------- |
| `Fresh UI package quality` **success**, `Code quality` **success** | `360165b…` and current | The shared-corpus freshness lanes that failed at round-2-era CI are green after the docs repair. |
| `ci` run at current head: `check-test` **Repo-wide check/test PASS — 5437 passed / 0 failed / 14 ignored** | `e09a56923…` (jobs checked out the PR merge composition of this head; workflow receipts record `gitHead 30eb2a67…`) | The unchanged MCP generator and committed-worktree fixture suites — which the user layout rule prohibits running locally — **executed in native repository CI and passed**, including the two fixtures that failed `5435pass/2fail/14ignored` at the `b4ee…`-era state. Recorded by exact PR head with its merge-ref provenance; no local execution is claimed. |
| `close-gate` **failure** | current | Expected working state, not a repair defect: the PR body deliberately carries two **unchecked** DoD boxes ("third opposite-family IMPL-EVAL passes at exact qualification head `e09a5692…`" and "box5/closing evidence reconciled after that verdict") while the closing claim is withheld; the gate itself confirms `closing issues: none`. It clears when the supervisor reconciles after this verdict. |
| `quality` → `audit-critical` **failure**: `proxy-addr` GHSA-jqcg-44mw-7w3h (1 critical in an unchanged 39-advisory graph) | current | **Unowned by C1 by provenance**: the root lock is byte-identical to the heads evaluated in rounds 1–2, and this repair changes no manifest/lock/dependency; the advisory set is registry-side state surfaced on the first completed `quality` job. Dependency remediation is a maintainer dependency decision outside this qualification. Recorded, not suppressed. |
| Draft-skipped lanes | current | Not treated as executed gates, per the brief. |

## No bypass / no unrelated-change verification

- No freshness bypass: every freshness gate is satisfied by actual regeneration (my controls reproduce the failing states and their repair); the barrel's Git-diff design was **not** defeated — the post-commit zero at `ddcd62d…`/current comes from committed fresh assets, not from suppression.
- No handrolled gzip: the committed gzips are the verbatim outputs of the existing native generators (transport/provenance byte-proofs above).
- No new tests, tool rewrites, dependency upgrades, or unrelated docs edits: the product diff is exactly the five generated assets; locks/tools/tests/workflows and both historical reports are byte-identical.

## C1 acceptance status at this SHA

All four C1 acceptance evidence rows remain satisfied: the C1 product sources are byte-identical to the round-1- and round-2-evaluated heads, and round 3 adds only generated documentation/agent-tooling qualification artifacts whose every relevant freshness, regression, publication, quality and architecture gate is independently green here. Box 5 is this third same-session independent-opposite-family verdict, recorded at the exact qualification head; the PR's two pending DoD boxes deliberately await supervisor reconciliation of this verdict and are not included circularly.

## Findings

| Severity | Finding | Required action |
| -------- | ------- | --------------- |
| medium | MCP corpus freshness is runtime-pinned at the compressed-transport level (passes CI 2.9.5; my local 2.9.7 run regenerates byte-identical plaintext with a 6-byte-different transport and fails); recorded evidence mislabels two MCP rows as 2.9.7 (retained logs show 2.9.5) and `docs-repair.md` asserts an unsupported 2.9.7 pass. | Owner correction of the two labels and the sentence; optional transport-pinning or reuse-transport for the MCP generator. Non-blocking for C1 (CI-pinned bar verified green). |
| low | Live CI `close-gate` failure reflects the two intentionally unchecked PR DoD boxes pending this verdict and supervisor reconciliation. | Supervisor ticks/evidences after reconciliation. |
| low | Live CI `audit-critical` failure on `proxy-addr` (GHSA-jqcg-44mw-7w3h) in an unchanged dependency graph. | Maintainer dependency decision; unowned by C1, recorded by provenance. |

## Arch-Debt Delta

| Metric | Count | Evidence |
| ------ | ----- | -------- |
| New entries | 0 | No doctrine violation introduced by generated-asset regeneration; `debt/arch-debt.md` untouched. |
| Resolved / deepened / unrecorded | 0 / 0 / 0 | Verified in the commit diff; rounds' baseline warnings unchanged (quality/arch receipts). |

## Verdict

| Field | Value |
| ----- | ----- |
| **Verdict** | **PASS** |
| Rationale | The complete qualification head `e09a5692360d7c157032e04f97b51c81d43d16f8` differs from the round-2 independently-PASSED head only by five generated documentation/agent-tooling assets, regenerated with the existing native generators from clean committed read sets (no `--allow-dirty`), whose semantic deltas are exactly the C1-owned reference-page/corpus content (182-entry prose with 3 owned entries and preserved non-site context; MCP +39 C1 symbols/2 surfaces with 7908 entries preserved; CLI embedded bytes and provenance equal to the shared source; MCP fallback sourceCommit synchronized). All C1 product sources, both historical evaluator reports, and all locks are byte-identical. Prose/temporal and MCP/document-corpus freshness gates independently reproduce nonzero before and zero after under the exact CI Deno 2.9.5 runtime; the rendered-site build, all existing regression suites (4+6+5+12), specifier scan, materialized CLI/MCP publish, quality:scan and arch:check pass independently; the Git-diff-based barrel passes at the committed head with a clean checkout. The un-run-able worktree-based MCP fixtures are evidenced by native repository CI executing the unchanged suites (5437 passed / 0 failed) at this head's PR merge composition, recorded without local-execution claims. Live CI residual failures are owned elsewhere by design (pending DoD boxes) or by dependency-registry provenance (unchanged-graph advisory), and are recorded, not suppressed. C1 acceptance evidence remains complete at the new SHA; later leaves are neither required nor certified. |
| Scope of certification | C1 only, at `e09a5692360d7c157032e04f97b51c81d43d16f8`. No merge, publication, release, issue closure, or later-leaf claim; closing-evidence/DoD reconciliation remains supervisor work. |
