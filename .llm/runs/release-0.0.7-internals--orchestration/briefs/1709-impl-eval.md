use harness

## SKILL

Load `netscript-harness`, `netscript-tools`, `netscript-deno-toolchain`, `netscript-doctrine`, and
`rtk`. Read `.llm/harness/gates/impl-eval.md` and `.llm/harness/workflow/lane-policy.md`.

# Brief — #1709 formal IMPL-EVAL (separate opposite-family session)

You are the **independent implementation evaluator** for issue #1709 / draft PR #1710. You did not
author this work, you did not plan it, and you must not fix it. Your only output is a verdict.

Formal IMPL-EVAL applies here **because this is a critical fail-closed tooling contract** — a
wrong verdict lets a wrapper report green while silently skipping files. It is not a mechanical
leaf.

## What you are evaluating

- **Exact head:** `5c4eaf0a38a505ac0d9cad2419230ba986c6bd2d` on `fix/lint-partial-exclusion-fail-closed`, worktree `/home/codex/repos/netscript-007-eval-1709-impl`.
- **Contract:** `.llm/runs/release-0.0.7-internals--orchestration/slices/lint-partial-exclusion-fail-closed/plan.md`
  — the plan is the specification. It passed owner-accepted F4 plus internals Tier-A. Do not
  re-litigate accepted decisions D1–D10, the six-path envelope, or the closed findings F1–F4 and
  A1–A3. Evaluate whether the **implementation matches the plan**, not whether you would have
  planned it differently.
- Preserved evaluator history you must not modify: `plan-eval.md`, `plan-eval-cycle-1.md`.

## Verify the head before anything else

Assert `git rev-parse HEAD` == the remote branch head == PR #1710 `headRefOid` == `5c4eaf0a38a505ac0d9cad2419230ba986c6bd2d`.
A verdict against a different head is void — a draft PR reports the base ref in some views, so
compare the actual OIDs. If they diverge, stop and report that, and nothing else.

## What to check — execute, do not read-and-believe

Run the gates yourself at this head. An author's transcript is a claim; your executed receipt is
evidence. In particular:

1. **Scope.** `git diff --name-only cf648f1ff...HEAD` contains **exactly** the six authorized
   product paths plus leaf harness evidence. A seventh product/generated/config/workflow path is
   an automatic `FAIL_IMPL`. No lock, cache, or workflow churn.
2. **The identity rule actually holds.** Complete coverage requires Deno's processed count to
   equal selected batch membership. Try to construct a selection where the wrapper reports green
   while a file was silently dropped. That adversarial attempt is the core of this evaluation.
3. **Precedence `coverage refusal ≥ crash ≥ ordinary finding`.** Exit 2 for any refusal; exit 1
   for crash-without-drop; exit 1 for ordinary finding. Confirm a **write-mode crash without a
   drop stays exit 1** — misclassifying it as a refusal was exactly F4.
4. **All three fmt completion forms**, with the third (`error: Failed to format M of N checked
   file(s)`, second integer) admitted **write-only**, singular/plural, ANSI and CRLF variants
   pinned. Confirm the adapter never infers processed count from `from <path>:` blocks or from the
   first integer of either error summary.
5. **Exact 1/2/200 controls** — crash-plus-drop (`3/2`, one dropped path, `partial-exclusion`,
   exit 2) and crash-only (`2/2`, empty refusals, exit 1) for lint, fmt check, and fmt write, with
   the diagnostic rendered exactly once and no crash text inside `coverage`.
6. **Batch invariance.** Identical selected sets must yield identical exit, cause, and
   dropped/processed identities at sizes 1, 2, and 200. A verdict that changes because a dropped
   path moved into its own child batch is a defect.
7. **Frozen gates at this head:** `check`, `test`, `quality:scan` (**`allowCount: 7`** — any new
   allowance or inline ignore is a failure), `arch:check`, `check:assets-barrel`, CLI
   `publish-dry-run`, per-member CLI JSR audit (the **19-WARN baseline must be disclosed**, not
   reported as clean).
8. **Generated asset integrity.** `agent-tools.generated.ts` changed only via
   `gen:assets-barrel`; running it again produces no diff; the delta is lint-driven only — fmt is
   not in `consumer-tools.json` and must carry no publish claim.
9. **Root behavior preserved.** Root lint retains `2041/36/0` exit 0 and `2041/2041/0` at
   `--batch-size 1`; root fmt `--batch-size 1` is `2041/2041/0`, findings 0, exit 0.
10. **Must-not-regress list** in the plan holds in full; no Deno rule, config allowance, inline
    ignore, or diagnostic parser was weakened to make a gate pass.

Report the **executed command and its actual exit/output** for every claim you make. Do not relay
the author's numbers. If a gate is genuinely N/A, say so and why.

## Out of scope — do not run or request

`scaffold.runtime`, `e2e:cli`, Aspire, Docker, browser/Playwright, MCP JSR audit, and docs-site
gates are **coordinator-waived N/A**. Keep Docker and Aspire empty. Do not take a runtime lease,
merge, flip labels, close the issue, or push to the author's branch.

## Output

Write `impl-eval.md` in the leaf slice run directory, commit it, and push. It must contain:

- The verdict on its own line: **`PASS_IMPL`** or **`FAIL_IMPL`**.
- The exact evaluated head SHA and your head-equality assertion.
- Numbered findings, each with severity, the exact evidence that establishes it, and the plan
  clause or invariant it violates. A finding without a reproduction is not a finding.
- Explicitly state which of the plan's stop conditions you checked and found intact.

Praise, adjectives, and quality impressions are not evaluation output — omit them entirely. Only
checkable findings and executed evidence count. If it passes, say so plainly and stop.

## Author's own claims — verify, do not inherit

The author reports the full 14-row matrix green, focused suites lint 14/14 and fmt 17/17, root
`check` 2,925 files / 0 failures, root `test` 4,233 passed / 19 ignored / 0 failed, `allowCount: 7`
retained, CLI JSR audit exit 0 with exactly 19 existing WARN findings, and the generator idempotent
across two passes. It also states the matrix first passed at S4 head `14c4d7349` and was rerun
after the final evidence head was pushed.

Those are claims. Re-execute them. Where your executed result differs from the author's stated
number, the discrepancy is itself a finding.
