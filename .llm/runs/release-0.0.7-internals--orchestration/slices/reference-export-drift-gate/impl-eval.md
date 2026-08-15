# IMPL-EVAL cycle 3 (fresh delta) — reference-export-drift-gate (PR #1666)

## Verdict

**PASS**

This is the fresh delta evaluation of the SA-3/SA-4 generated publication cascade that invalidated
the earlier PASS at `ee67d12b4` (preserved verbatim, append-only, as `impl-eval-cycle-2.md`; cycle 1
remains `impl-eval-cycle-1.md`). Every item in the brief was re-derived in this session, not re-read
from the author's or supervisor's evidence. No finding. The one item the supervisor declared as
carried rather than re-derived — generator idempotence — I ran end to end, including the full Lume
docs-site build, twice at the content head and once from the pre-content head, on scratch worktrees
outside `.llm/tmp/`.

## Binding

| Field                       | Value                                                                                                                                                                 |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Evaluator                   | Claude Fable 5, fresh separate session; opposite-family to Codex GPT-5.6 Sol author thread `01a005d2-7c9d-7dd1-b6fc-531b72dc14e4`                                     |
| Session                     | `claude.ai/code/session_01UDGunAVYYPRC6KBNxEwZWA` (bg job `f281b8cf`, Remote Control)                                                                                 |
| Immutable content head      | `46528ae4c71b3744f0af64bd749d01d831f70c89` — the code judged                                                                                                          |
| Recovery evidence head      | `b67414f4f26d53f00fc50adf3a5787d3bffae077` — `receipts/sa4/`, `audit/sa4/`, `sa4-evidence.md`, worklog                                                                |
| Base                        | `baf1cdf67a4e931af17b4772ddf6101f36152184`                                                                                                                            |
| Prior heads                 | `ee67d12b4` (cycle-2 PASS, untouched), `f98cfabac` (SA-3 plan), `440fa65ca` (cascade evidence)                                                                        |
| Local / remote / PR head    | `git rev-parse HEAD`, `git fetch` + `origin/fix/reference-export-drift-gate`, `gh pr view 1666 --json headRefOid` all `b67414f4f`; PR OPEN, draft, `status:impl`      |
| Receipt binding             | all 13 `receipts/sa4/*.json`: `gitHead == actualGitHead == 46528ae4c` — carried by the evidence commit, verified as the intended content-head binding, not a mismatch |
| Product content b674 = 4652 | `git diff --name-status 46528ae4c b67414f4f` lists only `.llm/runs/.../reference-export-drift-gate/*` (24 run-artifact paths); zero product paths                     |

Reproductions ran in `git worktree add --detach` copies under `$CLAUDE_JOB_DIR/tmp/` (`wt-content` @
`46528ae4c`, `wt-pre` @ `f98cfabac`, `wt-base` @ `baf1cdf67`), all removed at exit. No archive or
tarball was created under `.llm/tmp/`. No Aspire / Docker / browser / `e2e:cli` / scaffold smoke /
close-gate / publish ran. Nothing outside this file (plus the rename of the prior file) was written.

## Findings against the ten brief items

### 1. Four-output cascade — re-derived, exact

At `wt-pre` (`f98cfabac`: Fresh UI page changed, generated outputs not yet regenerated) I ran the
three canonical generators in order and read `git status` after each:

| Step                   | Raw exit | Tracked paths modified after step                                                |
| ---------------------- | -------: | -------------------------------------------------------------------------------- |
| `gen:agent-docs-prose` |        0 | `.llm/assets/agent-docs/prose.json.gz`, `.llm/assets/agent-docs/provenance.json` |
| `gen:publish-assets`   |        0 | + `packages/mcp/src/publish-assets.generated.ts`                                 |
| `gen:assets-barrel`    |        0 | + `packages/cli/src/kernel/assets/agent-docs.generated.ts`                       |

Nothing else moved (no untracked, no other tracked path; the `PUBLISH_ASSET_OUTPUTS` manifest's
other outputs, `packages/fresh-ui/registry.generated.ts`, `embedded.generated.ts`, etc., stayed
byte-identical). Compared to the committed content head: `prose.json.gz` **byte-identical**,
`publish-assets.generated.ts` **byte-identical** (`sourceCommit: 'f98cfabac'` reproduced because
that was HEAD there); `provenance.json` and `agent-docs.generated.ts` differ **only** in
`extractionTimestamp` (wall clock of my run) — expected and content-neutral. No fifth affected
output; no included-but-unaffected file. `gen:mcp-export-corpus` was not run and its output
`export-surface-corpus.generated.ts` did not move.

### 2. Idempotence — re-derived, holds (the declared gap is closed here)

At `wt-content` (`46528ae4c`, clean, `git status --short | wc -l` = 0):

- Run 1: `gen:agent-docs-prose` (full `deno task --cwd docs/site build` + bundle) → 0,
  `gen:publish-assets` → 0, `gen:assets-barrel` → 0; `git status --short` **empty**.
- Run 2: same three, all raw 0; `git status --short` **empty**.
- Then `check:agent-docs-prose` → 0, `check:assets-barrel` → 0, `check:publish-assets` → 0;
  `check:mcp-export-corpus` → **1**; status still empty.

Mechanism confirmed in `.llm/tools/docs/build-agent-docs-bundle.ts` `writeCorpus`: when the
canonical uncompressed corpus equals the existing gzip's payload the existing compressed bytes and
the prior `sourceCommit`/`extractionTimestamp` are retained, so a rebuild at any later commit is a
no-op unless prose content changes. That is why `sourceCommit` stays `f98cfabac` at `46528ae4c` and
why the tree is stable. Cost was not prohibitive (~2–3 min per generator pass); it was run, not
inferred.

### 3. Both root-test receipts — verified

| Receipt                  | invocationId                         | gitHead     | exit | passed/failed/ignored | total | file SHA-256 (prefix) |
| ------------------------ | ------------------------------------ | ----------- | ---: | --------------------- | ----: | --------------------- |
| `receipts/sa4/test.json` | `reference-export-sa4-test`          | `46528ae4c` |    1 | 4202 / 1 / 19         |  4222 | `2715babef54414d6…`   |
| `test-attempt2.json`     | `reference-export-sa4-test-attempt2` | `46528ae4c` |    0 | 4203 / 0 / 19         |  4222 | `855a1509c099c9e4…`   |

Read from each receipt's `stdout.tail` summary block; distinct `invocationId`, `lifecycleId`,
`runnerIdentity`. The red is retained in the tree at `b67414f4f`, and its full SHA-256 matches the
value stated in `sa4-evidence.md`. The single failure in `test.json` is the sole test in
`.llm/tools/agentic/teardown/forbidden-commands_test.ts` (bulk-teardown scan), finding exactly one
path, `.llm/tmp/claude/hooks/unscoped/events.jsonl`. That is the only delta between the two runs
(4202+1 → 4203+0, ignored unchanged).

### 4. Quarantine attribution — honest; scanner unweakened; event unedited; recoverable

- **Scanner unweakened:** `git diff baf1cdf67 b67414f4f -- .llm/tools/agentic/teardown/` is empty;
  the test still walks the whole repo skipping only `.git`, `node_modules`, `_fresh`, `.netscript`,
  `runs` and `.llm/runs/`. `.llm/tmp/` is _inside_ its scan root and is `.gitignore`d (line 17),
  which is exactly how an untracked hook transcript can fail the suite.
- **Mechanism verified first-hand:** the repo's own `.claude/settings.json` PreToolUse/PostToolUse
  hooks run `.llm/tools/agentic/claude/claude-hook-log.ts`, which appends every tool input to
  `.llm/tmp/claude/hooks/<NETSCRIPT_RUN_ID | unscoped>/events.jsonl` (unchanged since `b13ca0fa9`,
  no diff base→head). During this evaluation the hook recreated that file for **my** session and
  captured my own probe commands, which quoted the token — I quarantined that file to
  `$CLAUDE_JOB_DIR/quarantine/` at exit for the same reason. The attribution is therefore not a
  story; it is the default behaviour of the checked-in hook and would recur for any Claude session
  in this checkout that mentions the token.
- **Event unedited / attribution correct:** destination
  `/home/codex/.claude/jobs/f7691917/quarantine/sa4-hooks-unscoped/events.jsonl` exists, 262,354
  bytes, 180 lines, mtime `2026-08-15 21:12:52 +0200`, SHA-256
  `d0251bc2f8c78814724cb2e6c2460102260a39aadb3a21551b81244efbaceab2` (matches the recorded pre-move
  value). Line 177 parses as `ts: 2026-08-15T19:11:51.339Z`, `sessionId: null`, `tool_name: Bash`;
  the token sits in `event.tool_input.command` inside supervisor prose describing the earlier
  `receipts/fix1/test.json` contamination (`.llm/tmp/refusal-mutant`). Exactly one line in the file
  contains the token. The source subtree was absent before my session recreated it.
- **Not laundering:** the forbidden-commands test passes in `wt-content` with the full docs `_site`
  build present (`ok | 1 passed`), and `test-attempt2` passed with the same product bytes, so no
  product path carried the token. The environmental fix removed a supervisor transcript, not a
  product failure.

### 5. Scope discipline — 14 of 17, no eighteenth, lock identical

`git diff --name-status baf1cdf67 46528ae4c` minus `.llm/runs/` = exactly 14 paths: `pages.yml`, the
four generated outputs, `check-accuracy-and-discoverability.ts`, `check-exports-drift.ts`,
`check-exports-drift_test.ts`, `deno.json`, `docs/site/reference/fresh-ui/index.md`,
`paginated-query.ts`, `transform-helpers.ts`, `schemas/filters.ts`, `schemas/pagination.ts`. All lie
inside the 17-path contract (9 frozen + SA-1 test + SA-2 ×3 + SA-3 ×4). The three do-not-touch
entries hold: `docs/exports` absent in tree and index; `contract-primitives.ts` and
`src/public/mod.ts` have empty diffs base→`b67414f4f`. `deno.lock` blob
`a1522e6ecc98dd4232312385b0cea4e52f5fa4b2` at base, content head and evidence head.
`46528ae4c..
b67414f4f` adds run artifacts only.

### 6. Receipt coherence and sufficiency — sufficient for this delta

Thirteen receipts, all `gitHead == actualGitHead == 46528ae4c`, ids `reference-export-sa4-*`, exit 0
except the preserved `test.json`. `audit/sa4/evidence-set.json` names twelve gate ids and selects
`test-attempt2` for `test`; recomputed by hand: every expected gate id has a bound receipt. For this
delta the load-bearing gates are the three freshness checks (`agent-docs-prose`, `assets-barrel`,
`publish-assets`), root `check`/`test`, `quality-job` (composite incl. lint / fmt / deps),
`docs-accuracy` (which spawns the export-drift checker), `publish-dry-run`, and the four JSR audits
in `audit/sa4/`. All present, all bound. I independently re-ran the three freshness checks,
`docs:exports-drift` (raw 0, eight package coverage lines, terminal PASS), the checker test (6/0),
and the forbidden-commands test (1/0) at the content head. Sufficient.

### 7. CLI/MCP publication selection — verified, JSR table honest

`packages/mcp/src/publish-assets.generated.ts` `MCP_EMBEDDED_DOCS_PROVENANCE.paths` is the bounded
12-document list (`llms.txt` + 11 pages); `pages/reference/fresh-ui/index.md` is **not** in it. The
content-head diff for that file is a single line (`sourceCommit` `504de3f67` → `f98cfabac`);
`sha256`/`sourceBytes`/`documentCount` unchanged. `agent-docs.generated.ts` changes the base64
payload line and the six provenance fields (`sourceCommit`, `extractionTimestamp`,
`uncompressedBytes` 4,753,233→4,768,211, `compressedBytes` 1,363,117→1,367,454, `sha256`
`a7c72177…`→`78d5fed4…`). The `sa4-evidence.md` member table states both deltas as they are.

### 8. Known reds stay red — confirmed pre-existing

- `check:mcp-export-corpus`: raw **1** at `wt-base` (`baf1cdf67`) and raw **1** at `wt-content`;
  "MCP export-surface corpus is stale". Not regenerated, not waived;
  `export-surface-corpus.
  generated.ts` unchanged base→head.
- `run-deno-doc-lint.ts --root packages/contracts`: exit 1, `{errors 9, privateTypeRef 9}` at base
  **and** content head. `packages/fresh-ui`: exit 1,
  `{errors 123, privateTypeRef 96,
  missingJSDoc 27}` at base **and** content head. Baseline,
  unchanged.

### 9. Issue #1296 acceptance — `Closes #1296` is earned; boxes left unchecked

- Box 1 (JSDoc imports compile): the four `@example` lines now import from `/query` and
  `/transform`; a scratch probe importing all six symbols from those subpaths type-checked and ran
  (`deno run`), printing the expected types. `contract-primitives.ts` was already correct at base.
- Box 2 (inventory advertises no non-exports): `docs:exports-drift` reports `contracts` in
  `mode=complete`, 0 omitted / 0 documented-non-export groups, PASS.
- Box 3 (Fresh UI matches published exports): `fresh-ui` in `mode=complete` over six entrypoints, 0
  omitted-symbol groups, 1 explicitly labelled documented-non-export group (Dropzone copy-source),
  PASS.
- Box 4 (machine-readable omissions): reason-bearing coverage discriminant with fail-closed refusal
  tests (cycle-1/2 mutation evidence stands; test file unchanged since `423867017`).
- Box 5 (runbook + wired verification): named `docs:exports-drift` task, Pages step, runbook on the
  Fresh UI page, and `docs:accuracy` still spawns the checker fail-closed.

Boxes remain unchecked and coordinator-owned; I did not touch them. PR body carries `Closes #1296`
as its own line.

### 10. `NOT_RUN` boundaries — reported as such

`fresh-browser` N/A/waived, `NOT_RUN`, no runtime lease; close-gate `NOT_RUN`, deliberately not
rerun by me. Neither is restated as a pass anywhere in `sa4-evidence.md`, the PR comments, or here.
Note for the coordinator: GitHub CI is `skipped` at `46528ae4c`/`440fa65ca`/`b67414f4f` because the
PR is draft; the freshness gates CI failed at `ee67d12b4` were satisfied here by local receipts plus
my independent reruns, and CI will re-exercise them on the ready flip.

## Evaluator commit and exit hygiene

- Only `impl-eval.md` written; prior canonical file renamed to `impl-eval-cycle-2.md` (content
  byte-identical, `git mv`). Committed on a detached evaluator worktree at `b67414f4f` and pushed by
  explicit refspec `HEAD:refs/heads/fix/reference-export-drift-gate`.
- Scratch worktrees `wt-content`, `wt-pre`, `wt-base` and probe files removed; my session's
  `.llm/tmp/claude/hooks/unscoped/events.jsonl` moved to
  `/home/codex/.claude/jobs/f281b8cf/quarantine/hooks-unscoped/` so the forbidden-commands scan
  stays green for the next runner; `git status --short` empty in the shared checkout at exit.
