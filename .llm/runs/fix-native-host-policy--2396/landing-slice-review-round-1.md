# Independent landing slice review round1 — records correction

Requested/observed claude-opus-5-5, requested effort high. Same separate read-only evaluator; closed stdin. No source blocker. Receipt indexing omission was already corrected while review was in flight; authoritative follow-up must reread current record.

The source side is clean: all 22 hashes match, every input predates the 11:04:28 run start, and the native files are unchanged. The ignored count 25 = 19 + 6 (main's 4 incoming regression files, previously 36/0/6). One problem is in the committed records rather than the source.

**CHECKPOINT: CHANGES.** The merge source is faithful and the fresh full run is real. However, `landing-gates.json` misrecords which roots that run covered. Fix the record before committing, because a later fix would move the head.

**Blocker (records only, one-line fix):**
- `.llm/runs/fix-native-host-policy--2396/landing-gates.json` `completeTests.roots` (lines 182-201) lists 18 roots and leaves out `packages/service`.
- The external `complete-tests.receipt.json` argv shows `packages/service` actually ran first, so 19 roots were tested.
- As committed, the durable record says the package holding the native repair wasn't part of the fresh suite. It also contradicts `landing-acceptance-evidence.md:6,27`, which says "complete19-scope" and "all original14 roots".
- Fix: add `"packages/service"` to `completeTests.roots` so it matches the receipt argv, then commit.

**Fix in the same edit (wording in `landing-acceptance-evidence.md`, not a separate blocker):**
- Lines 20-23 carry text copied from the native phase: "scoped4-file check/lint/fmt zero" and "Preserve the first full-suite failure, focused retry". This landing's gates include neither. The scoped result is still valid because those four files are unchanged, but the text should say it is reused from the native repair or historical. As written, it reads as a fresh landing run.

**Verified, no source blocker:**
- **Merge state:** HEAD is c1f9c1090 with parents 32264fc11 and abe9d3e43. MERGE_HEAD is aec75e4d9 (#2511), with merge base abe9d3e43. There are no unmerged paths.
- **Main's paths:** the staged changes cover exactly main's 23 paths. Edits not yet staged are limited to run records: 2 modified and 3 untracked files.
- **Faithful to main:**
  - All four main-owned locks (`deno.lock`, `packages/fresh-ui/deno.lock`, `packages/cli/e2e/fixtures/desktop-native/deno.lock`, `resources/examples/expo-streams/deno.lock`) are byte-identical to aec75e4d. Branch-side lock changes are zero.
  - All the worker logging files (`job-dispatcher.ts` and its test, `job-execution.ts`, the new `job-logger.ts`, `worker-idempotency-events.ts`) and `docs/site/background-processing/workers.md` are identical to main.
  - `plugins/workers/deno.json` is main's version plus only the branch's existing `./service` export and `check`-task entries.
  - `agent-docs-prose.generated.ts` is a canonical union, and its freshness gate passes.
- **Native scope:** the native source, the test, both facades, the service reference and README, and `arch-debt.md` show zero staged difference from HEAD and keep their reviewed hashes. The 23/22 inventory and the 2026-11-10 target are unchanged.
- **Hashes:** I recomputed all 22, and each matches `landing-gates.json`. Every recorded input was last modified at or before 10:58:24 UTC, before the run started at 11:04:28.
- **Fresh suite** (`complete-tests.receipt.json`):
  - It ran from parent HEAD c1f9c109 with `--allow-all --unstable-kv`, covering the 19 roots, and exited 0 at 1937/0/25.
  - The 25 ignored are the 19 from before plus the 6 from main's four incoming regression files.
  - The four extra passes fit main's `job-dispatcher_test.ts` additions.
  - The task-local executable `TMPDIR` fix is the same one reviewed at the previous refresh. No assertion, deadline, permission or ignore changed.
- **Other gates:** root check 4051/34/0 and the other gates all PASS.
- **Scope of this approval:** only the snapshot, once the record is fixed. Main has since moved to 851d1ce9, so READY and final acceptance against current main need a later audit and integration, followed by a new exact-head review.

CHECKPOINT: CHANGES
