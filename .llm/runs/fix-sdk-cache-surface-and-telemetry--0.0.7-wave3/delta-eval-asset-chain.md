# Delta IMPL-EVAL — four-link generated-asset chain (PR #1665)

**Verdict: `PASS`** — no blocking items. Advisories (non-blocking) listed at the end.

## Identity

| Field | Value |
| --- | --- |
| Role | formal delta evaluator, fresh session (not the Codex author `01a00516-…`, not the Tier-A orchestrator) |
| Session id | `262ef8e1-1907-4c83-a2cd-4af142b8a95a` |
| OS PID | `200529` (`claude bg-spare`), session file `~/.claude/sessions/200529.json` |
| bridgeSessionId | `session_01E3QfD1wkvb1naZKS6m7bp2` (`cse_01E3QfD1wkvb1naZKS6m7bp2` in job state) — Remote Control URL `https://claude.ai/code/session_01E3QfD1wkvb1naZKS6m7bp2` |
| Job id | `262ef8e1`; `respawnFlags`: `--permission-mode bypassPermissions --remote-control --name "NetScript 0.0.7 #1665 CHAIN-EVAL" --effort medium --model claude-fable-5` |
| Requested route | native Claude `claude-fable-5` · effort `medium` · Remote Control on |
| Observed route | `claude-fable-5` · `medium` · `--remote-control` — **matched** |
| cwd | `/home/codex/repos/netscript-007-leaf-sdk-cache` (`git rev-parse HEAD` = `9a2c74c41990c1e2a56c9714834fff97feb63466` ✔) |
| Scratch worktrees | detached `…/jobs/262ef8e1/tmp/wt` @ `9a2c74c41`, `…/tmp/base` @ `baf1cdf67` — all regeneration ran there; the shared checkout was never regenerated |

Preserved, not re-litigated: product IMPL-EVAL PASS at `9a26c107a`, corpus delta PASS at `7549d9fc0`.
Nothing found below invalidates either.

## 1. Simultaneous freshness — CONFIRMED

Executed in the detached worktree at `9a2c74c41`, in this order:

```text
deno task check:agent-docs-prose   EXIT 0  {"fresh":true,"stalePaths":[],"provenance":{"sourceCommit":"0fed4d7ff",
                                             "extractionTimestamp":"2026-08-15T15:32:16.221Z","uncompressedBytes":4753909,
                                             "compressedBytes":1363396,"sha256":"6df99eb856eb…853fe"}}
deno task check:assets-barrel      EXIT 0  (gen:assets-barrel ran; git diff --exit-code over 7 generated targets clean)
deno task check:publish-assets     EXIT 0
git status --porcelain             (empty)
```

Three generators reproduced byte-identical checked-in output at one content head. Nothing left dirty.

## 2. Convergence, not coincidence — CONFIRMED

- `.llm/tools/generate-publish-assets.ts:34-45` `PUBLISH_ASSET_OUTPUTS` lists prose.json.gz,
  provenance.json, `agent-docs.generated.ts` **and** `publish-assets.generated.ts` — link 4 reads link 3.
- Same provenance triple everywhere: `.llm/assets/agent-docs/provenance.json` `sourceCommit "0fed4d7ff"`;
  CLI barrel `'sourceCommit': '0fed4d7ff'`, `extractionTimestamp 2026-08-15T15:32:16.221Z`; MCP
  `MCP_EMBEDDED_DOCS_PROVENANCE.sourceCommit '0fed4d7ff'`.
- Independently decoded the base64-gzip payload in `agent-docs.generated.ts`: 4 753 909 bytes,
  sha256 `6df99eb856ebf1cd8b1daf6bd610a6f3ee4db804c41e465ca5be500ef35853fe` — identical to
  provenance.json and to the live `check:agent-docs-prose` output. One upstream state, not three.
- Link 3 commit `27a64ea4c`: `agent-docs.generated.ts` 6+/6− (`sourceCommit 504de3f67→0fed4d7ff`,
  timestamp, bytes 4753233→4753909, compressed 1363117→1363396, sha `a7c72177…→6df99eb8…`) — **confirms** the
  supervisor's figures. Link 4 commit `9a2c74c41`: `publish-assets.generated.ts` 1+/1− (`sourceCommit`
  only) — **confirms**.

## 3. Content fidelity — CONFIRMED

Authorized source edit (`git diff baf1cdf67..HEAD -- docs/site/web-layer/query-bridge.md`): adds the
sentence "The angle-bracket token `<resolved import.meta.url>` stands for …" and collapses the
diagnostic to one line `[NetScript SDK] Cache provider not initialized in module <resolved import.meta.url>. …`.

- `prose.json.gz` @ HEAD: `Cache provider not initialized in module <resolved import.meta.url>` × 2
  (page + `llms-full.txt`), token `resolved import.meta.url` × 4; @ base `baf1cdf67`: **0**.
- Decoded CLI barrel payload: same string × 2.
- `packages/mcp/src/publish-assets.generated.ts`: 0 occurrences — **expected**, `MCP_EMBEDDED_DOC_PATHS`
  (generator lines 15-28) does not include `web-layer/query-bridge`, which is exactly why link 4's diff
  is `sourceCommit`-only.

## 4. No fifth branch-caused mirror — CONFIRMED (none)

Every `gen:*`/`check:*` in root `deno.json`, run at **both** heads (`wt`=9a2c74c41, `base`=baf1cdf67):

| task | 9a2c74c41 | baf1cdf67 | decision |
| --- | --- | --- | --- |
| `check:agent-docs-prose` (`gen:agent-docs-prose`) | 0 | — | chain link 2 |
| `check:assets-barrel` (`gen:assets-barrel`) | 0 | — | chain link 3 |
| `check:publish-assets` (`gen:publish-assets`) | 0 | — | chain link 4 |
| `check:mcp-export-corpus` (`gen:mcp-export-corpus`) | **1** | **1** | pre-existing; regenerating at both heads yields the *same* 5+/5− diff to `export-surface-corpus.generated.ts` (diff-of-diffs = 0 lines) → not branch-caused; restored, not committed |
| `check:emitted-samples` | 0 (47 samples / 37 paths) | 0 | pass both |
| `check:streams-types` | 0 | 0 | pass both |
| `check:scaffold-versions` | 0 | 0 | pass both |
| `check:netscript-jsr-specifiers` | 0 (scanned 2361, failures 0) | 0 | pass both |
| `check:aspire-host-ports` | 0 | 0 | pass both |

No gate is red on the branch and green at base.

## 5. No hand-written source movement — CONFIRMED

`git diff --name-status baf1cdf67..HEAD` minus `.llm/runs/**`:

```text
M .llm/assets/agent-docs/prose.json.gz              (link 2)
M .llm/assets/agent-docs/provenance.json            (link 2)
M docs/site/web-layer/query-bridge.md               (link 1, granted)
M packages/cli/src/kernel/assets/agent-docs.generated.ts   (link 3)
M packages/mcp/src/publish-assets.generated.ts      (link 4)
M packages/sdk/README.md
M packages/sdk/src/cache/cache-provider.ts
M packages/sdk/src/cache/cache-provider_test.ts
M packages/sdk/src/cache/cache-query.ts
M packages/sdk/src/cache/cache-telemetry.ts
M packages/sdk/src/ports/cache-store.ts
A packages/sdk/tests/cache/cache-query-kv-limit_test.ts
M packages/sdk/tests/cache/cache-telemetry_test.ts
```

Exactly the eight authorized S1–S3 files + granted doc + four chain links. Nothing else.

## 6. Pre-existing reds untouched and still red — CONFIRMED

| red | evidence at 9a2c74c41 |
| --- | --- |
| `surface:diff` | EXIT 1, verdict `major`, 965 MAJOR/MINOR lines; base also EXIT 1 with 965 lines (stale `baselines/public-surfaces.json`, untouched by branch) |
| JSR `F-DOCT-5` | `audit-jsr-package.ts --root packages/sdk` → `WARN F-DOCT-5 cardinality: directory has 13 immediate children; doctrine cap is 12 (src)`; `packages/sdk/src` has 13 entries at both heads |
| `check:mcp-export-corpus` | EXIT 1 both heads (item 4) |
| six pinned `deno doc --lint` | all-entrypoints run: `QueryClientPort→QueryClient` (ports/query-client.ts:41), `createNetScriptQueryClient→QueryClient` (query-client-factory.ts:44), `DurableStreamProducerOptions["instrumentation"]→StreamsInstrumentation` (plugin-streams-core …:41); `./src/cache/mod.ts` alone: `KvCacheStore→CacheStore` (:48), `KvCacheStore.prototype.get→CacheKey` (:97), `→CacheStoreEntry` (:97). 6 total, EXIT 1 |

None was silently fixed; none is reported green.

## Supervisor claims — confirm / refute

| claim | result |
| --- | --- |
| three cascade gates EXIT 0, `fresh:true`, `stalePaths:[]`, porcelain empty after all three | **confirmed** |
| link 3 diff one file 6+/6−, `504de3f67→0fed4d7ff`, `a7c72177…→6df99eb8…`, 4753233→4753909 | **confirmed** |
| link 4 diff one line (`sourceCommit`) | **confirmed** |
| `packages/mcp` check 115 files, 0 occurrences | **confirmed** (`run-deno-check.ts --root packages/mcp`: filesSelected 115, totalOccurrences 0, EXIT 0) |
| #1652 precedent: `derivedAssetCascadePaths` = the same four paths | **confirmed** — `release-0.0.7--orchestration/milestone-cluster-state.json:512-517`, and `gh pr view 1652 --json files` contains exactly those four generated paths |
| `check:mcp-export-corpus` stale at base too | **confirmed** (identical regenerated diff at both heads) |
| `check:emitted-samples` passes | **confirmed** both heads |
| `run-deno-lint.ts --root packages/mcp` errors without a verdict | **confirmed** (`invalid type: string "packages/*", expected struct WorkspaceConfig`, EXIT 1); `deno lint packages/mcp/src/publish-assets.generated.ts` directly → Checked 1 file, EXIT 0 |
| `agent-docs.generated.ts` excluded from lint and fmt | **confirmed** — root `lint` task `--exclude "^(packages/(cli)|…"` and `fmt.exclude` lists `packages/cli/`; correctness rests on `check:assets-barrel` byte equality (which passed) |

## Advisories (non-blocking)

- A1. `check:mcp-export-corpus` is stale on `main` (5+/5− regeneration diff). Not this PR's; a separate
  chore should run `deno task gen:mcp-export-corpus` on its own branch.
- A2. `run-deno-lint.ts --root packages/mcp` cannot produce a per-package verdict (workspace-config parse
  error) — a tooling gap in `.llm/tools/run-deno-lint.ts`, not a PR defect.
- A3. Root suite not rerun here (out of remit; the flaky `typed-queue_test.ts` DLQ case was therefore not observed).

## Terminal verdict

**`PASS`** — the four-link chain is closed and convergent at `9a2c74c41`; no fifth mirror; no unauthorized
source movement; pre-existing reds untouched. Blocking items: none.
