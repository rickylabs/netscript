# Pre-merge gate — PR #1528 (closes #1405)

Run per `.llm/harness/workflow/milestone-run.md` § The pre-merge gate, by the orchestrator holding
merge authority. Evaluated at head `c491c6989`, 2026-08-12.

| # | Check | Result | Evidence |
| --- | --- | --- | --- |
| 1 | `close-gate` result is green | **PASS** | `close-gate` → `SUCCESS`. A result exists — not absent, not skipped. |
| 2 | Zero unticked `- [ ]` on every issue the PR closes | **PASS** | #1405 body fetched live: all **5** acceptance boxes `- [x]`, ticked by the evidence mirror on `status:ready-merge` from the PR's fenced `acceptance-evidence` block, not by hand. |
| 3 | No new `deno-lint-ignore` / `as unknown as` / `@ts-ignore` in the diff, excluding `.llm/runs/**` | **PASS** | `git diff origin/main...FETCH_HEAD -- . ':(exclude).llm/runs/**'` grepped for all four patterns on added lines → no matches. The diff **was** scanned; this is a verdict, not an absence. |
| 4 | Named expensive gates report `SUCCESS`, not `SKIPPED`/`CANCELLED` | **PASS** | Named individually rather than counted: `scaffold-runtime (aspire + docker + postgres)` SUCCESS · `scaffold-runtime-sqlite (aspire + sqlite + garnet)` SUCCESS · `scaffold-static (deno-only)` SUCCESS · `code-quality` SUCCESS · `quality` SUCCESS · `check-test` SUCCESS · `surface-diff` SUCCESS · `deps-report` SUCCESS · `close-gate` SUCCESS. |
| 5 | The single decisive claim per issue, re-verified independently | **PASS** | Claim: *the reasons are now accurate and each is independently pinned*. Verified twice from different directions — orchestrator reverted **both** fixes → 5 failures; IMPL-EVAL reverted **each** fix alone → close-drain test fails only under fix-A revert, refusal tests only under fix-B revert. Aggregate redness would not have proven this. |
| 6 | Changed-file audit for `packages/**`/`plugins/**` on docs-lane PRs | **N/A, and audited anyway** | Not a docs-lane PR. Files: 4 × `packages/plugin-streams-core/**` + 4 × this run's own `slices/1405/**` artifacts. No unrelated package or plugin touched; no #1398 surface. |
| 7 | The PR body's own checklist matches what shipped | **PASS** | All 5 DoD boxes ticked and each is true of the diff: reasons-and-observability only; four negative tests present; evidence recorded including the red the brief's own bad command produced. |

**Additional gate run (repo requirement, not in the seven):** `agentic:review-threads` →
`PASS threads=0 unanswered=0`, exit 0. No silent review finding is being merged past.

## Did-not-run discipline

Every row above states a positive result from a named source. The checks that legitimately did not
run are recorded rather than ignored: `agent` (×2), `code-quality-repo`, and `Minimax M3 docs
accuracy` reported `SKIPPED`. None is in the named-gate set for a `packages/**` code change —
`code-quality-repo` is the repo-wide audit and the Minimax job is the docs-accuracy lane — and
`code-quality` itself ran and passed.

**Recorded caveat carried from IMPL-EVAL:** `deno task quality:gate`'s configured roots omit
`packages/plugin-streams-core`, so the package-quality verdict rests on the **explicit target scan**
(`findings=[]`, `allowCount=0`) rather than on the repo gate. The CI `code-quality` job passing is
therefore not by itself proof of this package's quality; the target scan is. This is a repo
gate-coverage gap, not a defect in this change, and it is stated here so the merge record is not
read as more than it is.

## Verdict

**Cleared to merge.** All seven checks pass with evidence; IMPL-EVAL PASS from a separate session;
no unanswered review threads.
