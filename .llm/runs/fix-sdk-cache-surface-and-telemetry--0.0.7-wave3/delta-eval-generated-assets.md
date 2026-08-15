# Delta IMPL-EVAL — generated-asset repair `7549d9fc0` (PR #1665)

Scope: source-to-generated fidelity of `.llm/assets/agent-docs/` and confinement of the repair
delta `0fed4d7ff..7549d9fc0`. The product IMPL-EVAL PASS issued at `9a26c107a` is out of remit and
is preserved (see item 4).

## Identity

| Field | Value |
| --- | --- |
| Evaluator | fresh native Claude session, separate from Codex author `01a00516-2033-7ed3-936a-a616cee47447` and from the Tier-A orchestrator |
| OS PID | 128297 (`~/.claude/sessions/128297.json`, sessionId `08eb7184-7a14-4976-8421-1e4d5b13163a`, name `NetScript 0.0.7 #1665 DELTA-EVAL`) |
| bridgeSessionId | `session_01Jc8aRcLQFVyVWKogq6SaFC` (state.json: `cse_01Jc8aRcLQFVyVWKogq6SaFC`); Remote Control URL `https://claude.ai/code/session_01Jc8aRcLQFVyVWKogq6SaFC` |
| Job | `08eb7184`; `respawnFlags`: `--permission-mode bypassPermissions --remote-control --name "NetScript 0.0.7 #1665 DELTA-EVAL" --effort medium --model claude-fable-5` |
| Requested route | native Claude `claude-fable-5` · effort `medium` · Remote Control on |
| Observed route | `claude-fable-5` · `medium` · `--remote-control` present → **matched** |
| cwd | `/home/codex/repos/netscript-007-leaf-sdk-cache` |
| `git rev-parse HEAD` | `7549d9fc052e604212f12e617b05085a061f9e0b` (= immutable head; = `origin/fix/sdk-cache-surface-and-telemetry`; = PR #1665 `headRefOid`) |
| Tree at start | clean |

## 1. Confinement — CONFIRMED

```
$ git diff --stat 0fed4d7ff..7549d9fc0
 .llm/assets/agent-docs/prose.json.gz               | Bin 1363117 -> 1363396 bytes
 .llm/assets/agent-docs/provenance.json             |  10 +-
 .../context-pack.md                                |  30 +++---
 .../generated-assets-repair-report.md              | 117 +++++++++++++++++++++
 .../worklog.md                                     |   8 ++
 5 files changed
```

Only the two generated assets plus run artifacts under
`.llm/runs/fix-sdk-cache-surface-and-telemetry--0.0.7-wave3/`. No product, docs-source, test,
lockfile, or baseline change.

## 2. Fidelity — CONFIRMED (regenerated independently)

Provenance delta (`git diff 0fed4d7ff..7549d9fc0 -- provenance.json`): `sourceCommit`
`504de3f67`→`0fed4d7ff`, `extractionTimestamp` →`2026-08-15T15:32:16.221Z`, `uncompressedBytes`
4753233→4753909, `compressedBytes` 1363117→1363396, `sha256` `a7c72177…`→`6df99eb8…`. `files`
manifest: `diff` of the two `.files` arrays is empty (181 entries, none added/removed).

Committed asset measured directly: gz size 1363396; `gunzip | wc -c` = 4753909;
`gunzip | sha256sum` = `6df99eb856ebf1cd8b1daf6bd610a6f3ee4db804c41e465ca5be500ef35853fe`
(matches the orchestrator's pre-repair reproduction values).

Regeneration:

```
$ deno task check:agent-docs-prose        # Lume build (638 files, 13.55s) + --check
EXIT=0
{"fresh":true,"stalePaths":[],"provenance":{... "sourceCommit":"0fed4d7ff", "uncompressedBytes":4753909,
 "compressedBytes":1363396, "sha256":"6df99eb8…853fe"}}
```

I read `.llm/tools/docs/build-agent-docs-bundle.ts` `checkCorpus()`: `--check` gunzips the committed
asset and `bytesEqual`s it against the freshly-built canonical corpus — a full byte comparison, not a
hash-only shortcut. I then also ran the mutating generator
(`build-agent-docs-bundle.ts --site-dir docs/site/_site`, exit 0): the tree remained clean
(`git status --short` empty) and the payload sha stayed `6df99eb8…`; i.e. regeneration at HEAD is
byte-identical. Tree restored/clean; nothing regenerated was committed.

Per-entry drift check: comparing the old vs new decoded corpora entry-by-entry, exactly two keys
differ — `pages/web-layer/query-bridge/index.md` (the authorized source edit) and `llms-full.txt`
(the aggregate that embeds it). No unrelated drift.

## 3. Corpus reflects the new diagnostic text — CONFIRMED

`grep -c 'resolved import.meta.url'`: old corpus 0, new corpus 4 (2 in the `query-bridge/index.md`
entry, 2 in `llms-full.txt`). The entry contains the single-line template
`Cache provider not initialized in module <resolved import.meta.url>. Add ` … matching
`docs/site/web-layer/query-bridge.md:97-100`.

## 4. Product preservation — CONFIRMED

`git diff 9a26c107a..7549d9fc0 -- packages/ plugins/ docs/ tools/ deno.json deno.lock` → empty
(0 lines). `git diff --name-only 9a26c107a..7549d9fc0` lists only the two assets and four run
artifacts (`context-pack.md`, `generated-assets-repair-report.md`, `impl-eval.md`, `worklog.md`).
The prior IMPL-EVAL PASS is not invalidated by this delta.

## 5. Pre-existing reds unchanged and still red — CONFIRMED

- `ls -1 packages/sdk/src | wc -l` → 13 (F-DOCT-5 cap 12; pre-existing, still red).
- `deno task surface:diff` → EXIT=1, `surface:diff failed: 517 undeclared major change(s)`
  (stale baseline; pre-existing, still red).
- Plan step 9a, from `packages/sdk`, `deno doc --lint` over all 12 entrypoints → EXIT=1, exactly 3:
  `QueryClientPort`→`QueryClient` (`src/ports/query-client.ts:41:1`),
  `createNetScriptQueryClient`→`QueryClient` (`src/query-client/query-client-factory.ts:44:1`),
  `DurableStreamProducerOptions["instrumentation"]`→`StreamsInstrumentation`
  (`packages/plugin-streams-core/src/application/create-durable-stream.ts:41:3`).
- Plan step 9b, `deno doc --lint ./src/cache/mod.ts` → EXIT=1, exactly 3:
  `KvCacheStore`→`CacheStore` (`kv-cache-store.ts:48:1`), `KvCacheStore.prototype.get`→`CacheKey`
  and →`CacheStoreEntry` (both `kv-cache-store.ts:97:3`).

None reported green; none silently fixed.

## Supplementary

- `run-deno-lint.ts --root packages/sdk --ext ts,tsx` → 84 files, 0 findings;
  `run-deno-fmt.ts` same scope → 84 files, 0 findings (confirms supervisor "lint 0 / fmt 0 over 84").
- Root test suite not run (delta touches no code; known `packages/queue` DLQ flake noted in brief,
  not exercised here).

## Supervisor claims — verdict table

| Claim | Verdict |
| --- | --- |
| `check:agent-docs-prose` exit 0, `fresh:true`, `stalePaths:[]`, `sourceCommit 0fed4d7ff` | CONFIRMED |
| lint 0 / fmt 0 over 84 files | CONFIRMED |
| doc-lint 3 + 3 unchanged, still exit 1 | CONFIRMED |
| delta confined to two assets + run artifacts | CONFIRMED |
| product tree identical to `9a26c107a` | CONFIRMED |
| expected fresh values 4753909 / `6df99eb8…` equal committed | CONFIRMED |
| provenance byte/sha/commit moves, `files` unchanged | CONFIRMED |

## Verdict

**PASS**

Blocking items: none.

Advisories (non-blocking):
- `provenance.json.sourceCommit` records `0fed4d7ff` (the commit whose tree was rendered), not the
  repair commit itself; this is how the generator works (`--check` preserves the previous
  `sourceCommit`) and is consistent, but readers should not expect it to equal the asset commit.
- The `.llm/runs/.../impl-eval.md` file appears in `9a26c107a..HEAD` because it was added at
  `0fed4d7ff` (the prior eval record), not by the repair; noted only for completeness.
