# IMPL-EVAL cycle 4 (post-integration delta) — reference-export-drift-gate (PR #1666)

## Verdict

**PASS**

This is the post-integration delta evaluation of the union merge `8c03d8629` that resolved the
`CONFLICTING` state created when #1665 advanced the same generator cascade on main. The prior
canonical verdict (cycle 3, PASS at content head `46528ae4c`, evidence head `b67414f4f`, committed
at `0d4c82d6e`) is preserved verbatim as `impl-eval-cycle-3.md`; cycles 1 and 2 are untouched. Every
item below was re-derived in this session on scratch worktrees under `$CLAUDE_JOB_DIR/tmp/`, not
re-read from `base-refresh-evidence.md`. No blocking finding; one non-blocking observation (§6).

## Binding

| Field                    | Value                                                                                                                                                                                                    |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Evaluator                | Claude Fable 5, fresh separate session; opposite-family to Codex GPT-5.6 Sol author thread `01a005d2-7c9d-7dd1-b6fc-531b72dc14e4`                                                                        |
| Session                  | `claude.ai/code/session_01RQ7Eb4N4NaQEuAA6zPtpxV` (bg job `be3774eb`, Remote Control)                                                                                                                    |
| Immutable content head   | `8c03d862931b64573df9a4bac76ebf266e0ec175` — true merge commit, `^1 = 0d4c82d6e`, `^2 = 0ef48c2ec` (main)                                                                                                |
| Recovery evidence head   | `021c7ffc62cea5b0f6728ddb8ee377393a647f44` — `receipts/base-refresh/`, `audit/base-refresh/`, `base-refresh-evidence.md`, worklog                                                                        |
| Original base / new base | `baf1cdf67` (= `git merge-base 0d4c82d6e 0ef48c2ec`) / `0ef48c2ec` (PR `baseRefOid`)                                                                                                                     |
| Prior heads              | `ee67d12b4`, `f98cfabac`, `440fa65ca`, `46528ae4c`, `b67414f4f`, `0d4c82d6e` — all `git merge-base --is-ancestor` of `021c7ffc6`; no rebase/squash                                                       |
| Local / remote / PR head | `git rev-parse HEAD`, `git fetch` + `origin/fix/reference-export-drift-gate`, `gh pr view 1666 --json headRefOid` all `021c7ffc6`; PR OPEN, draft, `status:impl`, `mergeStateStatus CLEAN`               |
| Receipt binding          | all 12 `receipts/base-refresh/*.json`: `gitHead == actualGitHead == 8c03d8629`, ids `reference-export-base-refresh-*` — the intended content-head binding carried by the evidence commit, not a mismatch |
| Product content E = C    | `git diff --name-only 8c03d8629 021c7ffc6` = 16 paths, all under `.llm/runs/.../reference-export-drift-gate/`; zero product paths                                                                        |

Scratch worktrees: `wt-content` @ `8c03d8629`, `wt-main` @ `0ef48c2ec`, `wt-eval` @ `021c7ffc6`
(this commit), all `git worktree add --detach` under `$CLAUDE_JOB_DIR/tmp/`, removed at exit. Corpus
decompressions went to `$CLAUDE_JOB_DIR/tmp/corpus/`. Nothing was created under `.llm/tmp/` except
the checked-in Claude hook's own `.llm/tmp/claude/hooks/unscoped/events.jsonl` for this session,
quarantined at exit (see hygiene). No Aspire / Docker / browser / `e2e:cli` / scaffold smoke /
close-gate / publish / label / issue / draft-state action.

## Integration-specific findings

### Union, not side-selection — re-derived, exact

`git merge-tree --write-tree --name-only 0d4c82d6e 0ef48c2ec` → exit 1, exactly four conflict paths:
`.llm/assets/agent-docs/prose.json.gz`, `.llm/assets/agent-docs/provenance.json`,
`packages/cli/src/kernel/assets/agent-docs.generated.ts`,
`packages/mcp/src/publish-assets.generated.ts`. Zero source conflicts (`docs/site` diverged on
disjoint pages: main touched `services-sdk/sdk.md`, `tutorials/live-dashboard/03-…`,
`web-layer/query-bridge.md`; the leaf touched `reference/fresh-ui/index.md`).

I decompressed the four corpus versions (base `baf1cdf67`, main `0ef48c2ec`, leaf `0d4c82d6e`,
merged `8c03d8629`; 181 members each) and computed the ideal three-way union member-by-member:

- Members changed by main only vs base: `pages/services-sdk/sdk/index.md`,
  `pages/tutorials/live-dashboard/03-sdk-cache-first-query/index.md`,
  `pages/web-layer/query-bridge/index.md` — merged corpus carries **main's** bytes for all three.
- Member changed by leaf only: `pages/reference/fresh-ui/index.md` — merged carries the **leaf's**
  bytes.
- Member changed by both: `llms-full.txt` only. `git merge-file -p leaf base main` on the three
  line-split versions exits 0 (no conflict) and its output is **line-identical** to the merged
  member (40,616 lines; main +23/−16, leaf +87/−28 vs base; every added line of both sides present;
  zero lines in the merged member that are in neither side; no main-removed line survives).
- No member added or removed relative to base ∪ main ∪ leaf; the two non-`pages/` preserved members
  (`context/01-…mdx`, `context/02-…mdx`) are byte-identical across all four versions, so the
  `buildAgentDocsProseFromSite` carry-forward of the binary-conflict "ours" gzip lost nothing.

The union corpus therefore contains both #1665's query-bridge guidance
(`module instances are
loaded`) and this leaf's Fresh UI rule (`reason-bearing omission group`), and
nothing else. Canonical decompressed SHA-256 `c1d095a62e…74b3` equals `provenance.json` `sha256`;
checked-in gzip SHA-256 `46703a024d…c52f7c`.

### History preservation — verified

`46528ae4c`, `b67414f4f`, `0d4c82d6e`, `ee67d12b4`, `f98cfabac`, `440fa65ca`, `0ef48c2ec` are all
ancestors of `021c7ffc6`; `8c03d8629` has both parents.
`git diff --stat 0d4c82d6e 021c7ffc6 --
receipts/sa4 receipts/s3 receipts/fix1 audit/sa4 impl-eval*.md plan-eval*.md`
is empty: prior receipts (including the preserved red `sa4/test.json`, SHA-256 `2715babef5…62f7`,
exit 1, 4202/1/19 = 4222), audits and verdicts are unamended. `0d4c82d6e..021c7ffc6` in the run dir
adds only `receipts/base-refresh/*` (12), `audit/base-refresh/*` (2), `base-refresh-evidence.md`,
and a worklog append.

### Provenance stamp subtlety — benign, and re-derived rather than assumed

`provenance.json` at `8c03d8629` carries `sourceCommit 0d4c82d6e`,
`extractionTimestamp
2026-08-15T20:40:35.830Z` (fresh, i.e. **not** retained from the leaf's
`19:47:49` stamp — the corpus genuinely changed during resolution, so retention did not fire then).
Retention can only hide staleness if `existingEquivalentTransport`
(`build-agent-docs-bundle.ts:134`) is weaker than content equality; it is not — it gunzips the
existing file and requires `bytesEqual(payload, encoded)`. My own regeneration at `8c03d8629`
(below) reproduced the identical gzip and left `provenance.json` unchanged, which under that
predicate proves the committed corpus **is** the canonical corpus of the merged site. No stale
corpus is hiding behind the stamp.

## Findings against the ten brief items

### 1. Four-output cascade — exact

`comm -23 <(diff-paths 0d4c82d6e..8c03d8629) <(diff-paths baf1cdf67..0ef48c2ec)` is empty: the merge
introduced no path outside main's own change set; the only paths that are neither pure main-side
content nor pure leaf content are the four generated outputs above. Leaf source paths are
byte-identical between `0d4c82d6e` and `8c03d8629` (empty `--stat` over the ten non-generated leaf
paths). `packages/mcp/src/export-surface-corpus.generated.ts` unchanged base→main→head. No fifth
output; no included-but-unaffected file.

### 2. Idempotence — re-derived at the content head, holds

At `wt-content` (`8c03d8629`, clean): run 1 `gen:agent-docs-prose` (full Lume build) → 0,
`gen:publish-assets` → 0, `gen:assets-barrel` → 0, `git status --short` empty after **each** step;
run 2 identical, empty after each step. Then `check:agent-docs-prose` 0, `check:assets-barrel` 0,
`check:publish-assets` 0, `check:mcp-export-corpus` **1**; tree still clean; gzip SHA-256 still
`46703a024d…c52f7c`; `provenance.json` unchanged. Cost was ~2–3 min per cascade pass; it was run,
not carried.

### 3. Both root-test receipts — verified

`receipts/sa4/test.json`: `reference-export-sa4-test`, `gitHead 46528ae4c`, exit 1, summary
`4202/1/19`, total 4222, single failure `forbidden-commands_test.ts` on
`.llm/tmp/claude/hooks/unscoped/events.jsonl`. `test-attempt2.json`:
`reference-export-sa4-test-attempt2`, same head, exit 0, `4203/0/19`, total 4222. Both retained
byte-unchanged since `0d4c82d6e`. New `receipts/base-refresh/test.json` at `8c03d8629`: exit 0,
`4211/0/19`, total 4230 (main added tests) — the head-bound authority for this delta.

### 4. Quarantine attribution — honest; scanner unweakened; event unedited; recoverable

`/home/codex/.claude/jobs/f7691917/quarantine/sa4-hooks-unscoped/events.jsonl`: 262,354 bytes, 180
lines, mtime `Aug 15 21:12`, SHA-256 `d0251bc2f8…eab2` (matches recorded pre-move value). Line 177:
`ts 2026-08-15T19:11:51.339Z`, `sessionId null`, `tool_name Bash`; the token appears once in the
whole file, inside supervisor prose that itself describes the earlier `receipts/fix1/test.json`
contamination. `.llm/tools/agentic/teardown/`, `.claude/settings.json` and `claude-hook-log.ts` have
empty diffs base→`8c03d8629`; the forbidden-commands test passes at the head worktree (`1 passed`).
The same hook recreated `.llm/tmp/claude/hooks/unscoped/events.jsonl` for **this** session at 22:31
— the mechanism is the checked-in default, not a story. Not laundering.

### 5. Scope discipline — 14 of 17, no eighteenth, lock identical

`git diff --name-only 0ef48c2ec 8c03d8629` minus `.llm/runs/` = exactly 14 paths (`pages.yml`, four
generated outputs, `check-accuracy-and-discoverability.ts`, `check-exports-drift.ts`,
`check-exports-drift_test.ts`, `deno.json`, `docs/site/reference/fresh-ui/index.md`, four
`packages/contracts` files) — all inside the seventeen-path contract. `docs/exports` absent from the
`8c03d8629` tree; `contract-primitives.ts` and `src/public/mod.ts` empty diffs main→head.
`deno.lock` blob `a1522e6ecc98dd4232312385b0cea4e52f5fa4b2` at `baf1cdf67`, `0ef48c2ec`,
`0d4c82d6e`, `8c03d8629`, `021c7ffc6`.

### 6. Receipt coherence and sufficiency — sufficient; one observation

Twelve receipts, all bound, all exit 0/PASS, `audit/base-refresh/evidence-set.json` expects exactly
those twelve gate ids and recomputes `SUFFICIENT` (`reasons: []`). For an integration delta the
load-bearing set is the three freshness checks, root `check`/`test`, `quality-job`, `arch-check`,
`docs-accuracy` (spawns the drift checker fail-closed), `publish-dry-run` — all present at the exact
head; I re-ran the three freshness checks, `docs:exports-drift` (raw 0, 8 coverage lines, terminal
PASS), the checker test (6/0) and the forbidden-commands test (1/0) at `8c03d8629`. **Observation
(non-blocking):** the four JSR audits in `audit/sa4/` were not recut at `8c03d8629`; that is
acceptable because no package `deno.json`/export map changed `0d4c82d6e→8c03d8629`, only the two
regenerated embedded assets moved, and `publish-dry-run` PASS is head-bound.

### 7. CLI/MCP publication selection — verified, JSR table honest

`MCP_EMBEDDED_DOCS_PROVENANCE.paths` at head is `llms.txt` + 11 pages; `pages/reference/fresh-ui/`
is not among them (`03-sdk-cache-first-query` **is**, but main already carried its new bytes). The
main→head diff of `publish-assets.generated.ts` is the single line
`sourceCommit ef3e43f06 →
0d4c82d6e`. `agent-docs.generated.ts` changes the base64 payload plus
`sourceCommit`, `extractionTimestamp`, `uncompressedBytes 4,755,371→4,770,349`,
`compressedBytes
1,364,040→1,368,351`, `sha256 c8491e53…→c1d095a6…`. `base-refresh-evidence.md`
states both as they are.

### 8. Known reds stay red — pre-existing at the new base

`check:mcp-export-corpus`: raw 1 at `wt-main` (`0ef48c2ec`) and raw 1 at `wt-content`; not
regenerated, not waived. Doc-lint `packages/contracts` `{errors 9, privateTypeRef 9}` and
`packages/fresh-ui` `{errors 123, privateTypeRef 96, missingJSDoc 27}` — identical at main and head.

### 9. Issue #1296 — `Closes #1296` earned; boxes left unchecked

Leaf source is byte-identical to the cycle-3-judged content (item 1), so the cycle-3 box-by-box
derivation stands unchanged; the head-side re-runs of `docs:exports-drift` (contracts and fresh-ui
`mode=complete`, PASS) and the checker test confirm boxes 2–5 at the integrated head. Issue open,
five boxes unchecked, coordinator-owned, untouched. PR body carries `Closes #1296` on its own line.

### 10. `NOT_RUN` boundaries — reported as such

`fresh-browser` N/A/waived and close-gate `NOT_RUN` in `base-refresh-evidence.md`, the worklog and
the last IMPL comment; neither restated as a pass. CI at `021c7ffc6`: draft, so `close-gate`,
`quality`, `check-test` are `skipped`; only `build` and `classify docs-site changes` ran (success).
Not rerun by me.

## Evaluator commit and exit hygiene

- Only this file written; prior canonical file preserved as `impl-eval-cycle-3.md` via `git mv`
  (byte-identical). Committed on detached `wt-eval` at `021c7ffc6`, pushed by explicit refspec
  `HEAD:refs/heads/fix/reference-export-drift-gate`; shared checkout fast-forwarded (`--ff-only`) to
  the pushed head.
- `wt-content`, `wt-main`, `wt-eval` and `$CLAUDE_JOB_DIR/tmp/corpus` removed; this session's
  `.llm/tmp/claude/hooks/unscoped/events.jsonl` moved to
  `/home/codex/.claude/jobs/be3774eb/quarantine/hooks-unscoped/`; `git status --short` empty in the
  shared checkout at exit.
