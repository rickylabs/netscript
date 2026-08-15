# IMPL-EVAL cycle 2 — reference-export-drift-gate (PR #1666)

## Verdict

**PASS**

Cycle 1 (`FAIL_FIX` at `4c09e9203`, preserved verbatim as `impl-eval-cycle-1.md`) raised one
finding, F1: three of the four committed refusal tests could not fail on the regression they name.
The repair at implementation head `423867017` is confined to
`.llm/tools/docs/check-exports-drift_test.ts`; the checker is byte-identical to the head cycle 1
judged. I re-derived F1 closure by mutation on my own `git archive` copy (table below): each of the
four named tests now fails, on the exit-code assertion, when its refusal branch is removed. No new
finding. Everything re-derived in cycle 1 was spot-checked or re-run and holds.

## Binding

| Field                         | Value                                                                                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Evaluator                     | Claude Fable 5, fresh separate session (opposite-family to Codex GPT-5.6 Sol author thread `01a005d2-7c9d-7dd1-b6fc-531b72dc14e4`)                     |
| Session                       | `claude.ai/code/session_01MDMbe68iYvjHBLuUGKZqBS` (bg job `7a3b4645`)                                                                                  |
| Immutable implementation head | `4238670173271bca4281eba7db6c2030d046bc73` — the code judged                                                                                           |
| Evidence head                 | `010da98a230503bb27b46eb0edc5e979929f7fb1` — `receipts/fix1/`, `audit/`, `fix1-evidence.md`, worklog                                                   |
| Base                          | `baf1cdf67a4e931af17b4772ddf6101f36152184` (= `merge-base HEAD origin/main`)                                                                           |
| Local / remote / PR head      | `git rev-parse HEAD`, `git ls-remote origin refs/heads/fix/reference-export-drift-gate`, `gh pr view 1666 --json headRefOid` all `010da98a2`; PR draft |
| Receipt `gitHead`             | all eight `fix1` receipts: `gitHead == actualGitHead == 423867017` — carried by the evidence commit, verified as intended binding, not a mismatch      |
| Prior cycle                   | `4c09e9203` FAIL_FIX (F1); supervisor checkpoint `0646f429f` noted                                                                                     |

Reproductions ran read-only in place or in `$CLAUDE_JOB_DIR/tmp/mut` (a `git archive 423867017`
extraction **outside** `.llm/tmp/`, removed afterwards). No `.llm/tmp/` tarball was created; the
`forbidden-commands_test.ts` scan passes in place. Tree clean at the end. No Aspire / Docker /
browser / `e2e:cli` / scaffold / runtime smokes; no lease.

## F1 closure — re-derived by mutation (my runs, not the author's table)

Archive copy of `423867017`; checker mutated, committed test file unchanged; one named test per run
via `--filter`, all reporting `1 failed | 5 filtered out`.

| Mutant on `check-exports-drift.ts`                                                                                                             | Named test                                               | Result                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------- |
| L421 OMITS branch → `if (false)`                                                                                                               | `refuses an omitted symbol through the injectable seam`  | **FAILED**, `assertSingleRefusal` actual 0 / expected 1 |
| L435 INVENTS branch → `if (false && …)`                                                                                                        | `refuses an invented symbol through the injectable seam` | **FAILED**, actual 0 / expected 1                       |
| L543 nonempty-reason error → `if (false)`; both `isNonemptyString(coverage.reason)` guards → `true`; `.trim()` → `String(...)` (full coercion) | `refuses an empty or malformed coverage reason`          | **FAILED**, actual 0 / expected 1                       |
| L566 `entrypoints-only` branch also accepts `mode === 'unknown'`                                                                               | `refuses an unknown coverage mode`                       | **FAILED**, actual 0 / expected 1                       |
| restored copy                                                                                                                                  | full file                                                | 6 passed / 0 failed                                     |

Why the tests now discriminate (read from the diff `47ca22abe..423867017`): all four use the real
on-disk `withSymbolFixture` package + doc, so a `NotFound` read can no longer stand in for a
refusal; `checkDriftCapturingErrors` captures `console.error`; `assertSingleRefusal` requires code
1, **exactly one** error, the branch-specific message, and asserts `Failed to read` is absent; the
invented case documents `['actualSymbol', 'inventedSymbol']` so OMITS cannot mask INVENTS. Cycle 1
required exactly this.

**Checker unmoved:** `git diff 47ca22abe 423867017 -- .llm/tools/docs/check-exports-drift.ts` is
empty (0 lines); the repair commit's stat is the single test file. No checker behaviour changed to
make a test pass.

## Receipts and the preserved red

- `receipts/fix1/`: eight files. `arch-check`, `check`, `docs-accuracy`, `docs-source-format`,
  `publish-dry-run`, `quality-job` PASS/exit 0; `test.json` **FAIL/exit 1** preserved;
  `test-attempt2.json` PASS/exit 0 (4,203 / 0 / 19). All `gitHead == actualGitHead == 423867017`.
- `test.json` red is honestly explained: its stdout tail shows the single failure is
  `forbidden-commands_test.ts` finding `docker …`/`aspire stop --all` strings inside
  `.llm/tmp/refusal-mutants-full-423867017/source.tar` — the author's own mutation archive, not a
  product regression. `fix1-evidence.md`, `worklog.md`, and `evidence-set-fix1.json` (which lists
  `test-attempt2` as the `test` receipt) all state it as RED, not relabelled. `test-attempt2`
  legitimately supersedes it: same head, same argv, run after the scratch was removed. Retaining the
  red rather than deleting it is correct.
- Sufficiency for a test-only delta: `test` (full root discovery incl. the tool tests) and `check`
  are the gates the delta can affect; the other five are unchanged-surface re-cuts at the new head
  and cost nothing to include. Set judged **sufficient**. Also re-ran in place: focused test 6/0,
  `deno check --unstable-kv` on checker + test OK, `forbidden-commands_test.ts` OK.

## Re-derived / carried judgments

| #  | Item                         | This cycle                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| -- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | #1296 acceptance / `Closes`  | **Re-run.** Enumerated all nine shipped Contracts example imports (`grep` over `packages/contracts/**/*.ts`, non-test): root ×3, `/query` ×3 files, `/crud` ×2, `/transform` ×1. `deno doc --no-lock --filter` against the export-map entrypoints (`mod.ts`/`query.ts`/`transform.ts`/`crud.ts`): all 11 symbols OK at their claimed entrypoint; the six repaired symbols MISS on root. **No fifth wrong-root example survives.** `Closes #1296` earned; close-gate mapping (five boxes) remains coordinator-owned and is correctly documented as such in `fix1-evidence.md`. Cycle-1 advisory on `pagination.ts` free identifiers (#1533) unchanged. |
| 2  | Fail-closed refusal coverage | **Re-run** (this cycle's core). Four refusal cases committed as discriminating tests — see mutation table.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 3  | Per-package accounting       | **Re-run.** `deno task docs:exports-drift` → eight `Coverage [...]` lines (fresh-ui/config/contracts/telemetry `complete`; plugin/queue/sdk/service `entrypoints-only` with reason; telemetry `omitted-symbol-groups=1`), `PASS`, exit 0. Enforcement path unchanged since cycle 1 (checker unmoved) — truth of `complete` carried from cycle 1's verification.                                                                                                                                                                                                                                                                                       |
| 4  | Fresh UI / Contracts truth   | **Re-run.** `deno doc --json` union over the six export-map entries = 28/11/35/82/16/7 → 168 unique symbols; every `Symbol`-table cell on the page split on `/`, generics stripped → 168 exports all present; the only 7 on-page non-exports are `DROPZONE_INGEST_SOURCES`, `DROPZONE_REJECTED_REASONS`, `DropzoneIngestDetails`, `DropzoneIngestSource`, `DropzoneProps`, `DropzoneRejectedFile`, `DropzoneRejectedReason` — under `## Dropzone (registry component)`, labelled "a copy-source registry component, not a package export", and the mapping's `documentedNonExports` group. Not passed off as exports.                                 |
| 5  | S2 discoverability           | **Re-run.** `deno.json:85` `docs:exports-drift` (`--no-lock --allow-read --allow-run=deno`, narrower than base's `--allow-all` child argv); `check-accuracy-and-discoverability.ts:292-300` spawns the named task once, fail-closed; `pages.yml:143-145` one root step (Pages does not run `docs:accuracy`, so no double execution); `ci.yml:366` reaches it only via `docs-accuracy` gate. PR body §"enforcement" says plainly the enforcement chain pre-existed and the leaf adds discoverability. `docs:accuracy` PASS exit 0 in place.                                                                                                            |
| 6  | JSR / pins / publish delta   | **Carried** from cycle 1 (Contracts/Fresh UI package files unchanged since; `git diff --quiet` on both `deno.json` clean). `publish-dry-run` re-cut PASS at `423867017`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 7  | Baseline reds                | **Spot-checked.** `audit/doc-lint-contracts.json` totalErrors 9 (all private-type-ref); `audit/doc-lint-fresh-ui.json` 123 (96+27); `s3-evidence.md:47` carries both as **RED, raw exit 1**; oRPC INFO / `F-DOCT-4` WARN retained (`:46`, `:22`). Not in any PASS receipt, attributed to baseline; the delta since cycle 1 touches none of those files.                                                                                                                                                                                                                                                                                               |
| 8  | Scope and lock               | **Re-run.** `git diff --name-only baf1cdf67 010da98a2` minus `.llm/runs` = **10** paths (same ten as cycle 1); `docs/exports` absent; `deno.lock`, `contract-primitives.ts`, `src/public/mod.ts`, both package `deno.json` byte-identical to base (`git diff --quiet` exit 0).                                                                                                                                                                                                                                                                                                                                                                        |
| 9  | Receipt sufficiency          | **Re-run.** See "Receipts and the preserved red" above; seven gate ids present, `test` satisfied by `test-attempt2`, all bound to `423867017`, `evidence-set-fix1.json` SUFFICIENT with named receipt ids.                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 10 | `fresh-browser` NOT_RUN      | **Re-run.** `grep` across slice artifacts and PR body: only `NOT_RUN` / N/A / waived (SA-1); never restated as pass; no lease.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

## Process notes (non-blocking, unchanged from cycle 1)

- Design checkpoint is carried by the locked D1–D11 table in `plan.md` + PLAN-EVAL cycle-2 PASS
  `45c249b9c`; the worklog now names that pointer explicitly.
- Close-gate before `ready-merge` is coordinator-owned: five #1296 boxes, `acceptance-evidence`
  block, PR DoD last box.

## Executed command log (abridged)

- binding: `git rev-parse HEAD`; `git ls-remote origin refs/heads/fix/reference-export-drift-gate`;
  `gh pr view 1666 --json headRefOid,baseRefOid,isDraft,state`; `git merge-base HEAD origin/main`
- `git diff 47ca22abe 423867017 -- .llm/tools/docs/check-exports-drift.ts | wc -l` → 0
- `git archive 423867017 | tar -x -C $CLAUDE_JOB_DIR/tmp/mut`; four `sed` mutants +
  `deno test
  --no-lock --allow-all --filter <name>` each →
  `FAILED | 0 passed | 1 failed | 5 filtered out`; restored → 6 passed; `rm -rf` mutant dir
- in place: `deno test --allow-all .llm/tools/docs/check-exports-drift_test.ts` → 6/0;
  `deno test --allow-all .llm/tools/agentic/teardown/forbidden-commands_test.ts` → 1/0;
  `deno check --unstable-kv` checker+test → OK
- `deno task docs:exports-drift` → 8 coverage lines, PASS, exit 0; `deno task docs:accuracy` → PASS,
  exit 0
- `packages/contracts`: `deno doc --no-lock --filter <sym> <entry>` ×11 OK at claimed entry, ×6 MISS
  on root
- `packages/fresh-ui`: `deno doc --no-lock --json <entry>` ×6 → 168 unique; page-cell diff → 7
  Dropzone-only
- receipts: `jq` over `receipts/fix1/*.json` (ids, outcome, exit, gitHead/actualGitHead)
- forbidden-surface `git diff --quiet` → clean; `docs/exports` absent; 10 product paths
