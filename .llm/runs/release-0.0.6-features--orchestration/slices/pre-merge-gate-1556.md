# Pre-merge gate — PR #1556 (closes #1457)

Run per `.llm/harness/workflow/milestone-run.md`. Head `27a5bb50d`, 2026-08-12.

| # | Check | Result | Evidence |
| --- | --- | --- | --- |
| 1 | `close-gate` green | **PASS** | `close-gate` → `pass` after the body fix below. Its two earlier reds were **not** the gate rejecting the work — see "Two red herrings". |
| 2 | Zero unticked boxes on issues the PR closes | **PASS** | #1457 contains **no** acceptance checkboxes — it states expectations as prose. Grep for `- [ ]` → 0. Nothing for the mirror to tick. |
| 3 | No new `deno-lint-ignore` / `as unknown as` / `@ts-ignore`, excluding `.llm/runs/**` | **PASS** | Diff scanned → no matches. |
| 4 | Named expensive gates `SUCCESS` | **PASS** | `scaffold-runtime (aspire + docker + postgres)` · `scaffold-runtime-sqlite` · `scaffold-static` · `code-quality` · `quality` · `check-test` · `surface-diff` · `deps-report` · `close-gate` — all `pass`; 0 failing checks. |
| 5 | The single decisive claim, re-verified | **PASS** | Claim: *protocol query parameters now survive the proxy hop*. `deno task --cwd packages/fresh test` → **223 passed, 0 failed**; reverting the forwarding → **217 passed, 6 failed**, restored → 223/223 clean. |
| 6 | Changed-file audit | **N/A, audited** | Exactly two files, both `packages/fresh/src/runtime/ai/stream-proxy*`. No `application/defer/**` (#1459) and no `stream-url-resolver.ts` (#1548) — the sibling surfaces in this same reopen are untouched. |
| 7 | PR body checklist matches what shipped | **PASS** | All 5 DoD boxes ticked and true of the diff. |

`agentic:review-threads` → `PASS threads=0 unanswered=0`.

## IMPL-EVAL

`OPENHANDS_VERDICT: PASS` — automatic phase dispatcher, run `31590876488`. Triggered by the label
policy; **no manual dispatch, no local evaluator**.

## Two red herrings, both diagnosed rather than retried past

`close-gate` was red twice for reasons that had **nothing to do with the gate's verdict**:

1. **First run:** the log read `close-gate PASS`, and the job then died on a *later* step with
   `invalid peer certificate: Other(OtherError(UnsupportedCertVersion))` against
   `api.github.com/graphql` — an infrastructure/TLS failure. A red check summary here did **not** mean
   a failed gate. Merging on the summary alone would have been merging on a misread; re-running was
   what surfaced the real issue.
2. **Second run:** `Invalid acceptance-evidence YAML line: entries: []`. The slice emitted an
   `acceptance-evidence` block with an **empty entry list** because #1457 has no checkboxes. The
   mirror's parser rejects that line and fails the job outright — an empty block is *not* a
   harmless no-op. Fixed by removing the block and stating in the body why there is none.

Both are recorded because "close-gate is red" was, on this PR, twice not what it appeared to be.

## Verdict

**Cleared to merge.** Seven checks pass with named evidence; IMPL-EVAL PASS from the automatic
separate session; no unanswered review threads.
