# IMPL-EVAL (final) — PR #1416 / issue #1102 completion (S4A / S4B / S5)

**Role:** independent evaluator, read-only. You did not write this and must not defend it.
**Route:** Claude · Anthropic · Fable 5 · medium (native opposite-family; Codex-authored).
**Protocol:** `.llm/harness/evaluator/protocol.md` + `verdict-definitions.md`.
**Subject head (immutable):** `2058626ca2a98a9b35322677a478ca2424630497` — verified identical local and remote.
**Worktree:** `/home/codex/repos/ns005-impleval-1416` (already at that head; confirm with `git rev-parse HEAD`).

## Boundaries

- Read-only. No edits, commits, pushes, git write commands.
- **Never enter** `/home/codex/repos/ns005-w3b1` or any other lane worktree.
- **Do not run Aspire, containers, or `e2e:cli`.** The serialized runtime proof is already done under
  a committed ledger grant; re-running it is neither authorized nor needed.
- Deliver the verdict in your final message. Do not end by saying you will wait for anything.

## Context

S1–S3 merged as #1404 with `Refs #1102`, because two acceptance rows were unsatisfied. This PR
completes them. A PLAN-EVAL passed at `71c0a29c2` and left three carried attention points, which are
now your job to check. The lane has **not** self-certified: the PR still says `Refs #1102`, DoD rows
are unchecked, and it explicitly deferred the closure decision to this evaluation.

## Claims to falsify (execute; do not infer)

1. **Row 3 is repaired as a class, not a memorized sentence.** This is the highest-value check.
   PLAN-EVAL warned that every planned gate would still pass if the writer added only the quoted
   5-gram `hitting my service every render`. Read the `cache-freshness` alias diff. Then **query the
   built corpus yourself** with at least one paraphrase that appears **nowhere** in the aliases or
   tests — e.g. `stop refetching data on each re-render` or `my component calls the API on every
   paint` — and report where it ranks. If only alias-shaped phrasings route correctly, row 3 is not
   honestly satisfiable and `Closes #1102` must not be used.
2. **The score-only control actually constrains scoring.** Reproduce the mutation yourself in a
   scratch copy outside the repo: invert only `right.score - left.score` and confirm the suite exits
   non-zero **naming the zero-concept score-only row specifically** — not merely "a test failed".
   Then confirm the clean checkout passes. This is the only thing closing the exact-score-tie escape.
3. **The locked five rows and 15 citations are byte-for-byte unchanged**, and no ranking constant was
   retuned. Diff `guidance-evaluation.json` and the ranking policy against `origin/main`.
4. **Row 6 activation is the real path.** Verify `find_guidance` now appears in
   `MCP_AGENT_INSTRUCTIONS`, generated `AGENTS.md`, and skills assets, and that the CLI pair proves
   `agent init --with-docs` → `agent mcp` → rank-1 `llms#task-router`. A tool merely being listed is
   not activation — that was the pre-fix state.
5. **The runtime proof is admissible and honest.** Ledger grant row 66 (`12357e33a`) precedes the
   run; release row 67. Reported: `RAW_EXIT_CODE=0`, `passed=79 failed=0 skipped=2`, 81 total steps,
   both skips named as `DEFERRED #1398`. Check the arithmetic and that no non-#1398 skip is hiding.
   **Do not re-run it.**
6. **Nothing out-of-scope landed.** `git diff origin/main...HEAD --name-only`: no lockfile, and
   **no `deno.json` changes at all** — a prior turn had 19 manifests dirtied by the root
   `publish:dry-run` (filed as #1417) and restored. Confirm `packages/service/deno.json` still reads
   `"zod": "catalog:"` at this head.
7. **Byte budget.** Report embedded total bytes and document count against the 262,144 cap. If the
   document count is below 12, find which document left and whether `drift.md` records it. A silent
   drop is blocking regardless of whether the budget fits.
8. **All seven acceptance rows.** Read #1102 and rule row by row with evidence you executed. Then
   state plainly: **is `Closes #1102` justified at this head?** If any row falls short, the PR must
   keep `Refs` and say what remains — the shape #1404 used.

## Timebox

Rule as soon as claims 1, 2, 4 and 8 are answered. Do not exhaustively audit the rest. Anything you
did not examine must be stated as "not examined" with a one-line reason — an honest gap is expected;
an unstated one is not, and a judgement you did not actually check is worse than admitting you ran
out of time.

Report per claim: claim → command → observed output → verdict. Then the overall verdict, exactly
`PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT`, plus the minimal repair if not PASS. Report only
concrete blockers; put non-blocking observations in a separate labelled list beneath the verdict.
