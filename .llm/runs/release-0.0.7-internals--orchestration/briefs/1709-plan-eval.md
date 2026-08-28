# Brief — #1709 / PR #1710 formal PLAN-EVAL (cycle 1)

You are a **fresh, separate-session formal plan evaluator**. Read this completely before acting.

## Route and family

`formal_plan_evaluation` per `.llm/harness/workflow/lane-policy.md:45`: the plan is **Codex
GPT-5.6 Sol-authored**, so the evaluator binding is the **native opposite family** — Anthropic
**Claude Fable 5, effort medium**, `--remote-control`. Record session id, non-empty
`bridgeSessionId`, job `state.json` backend and `respawnFlags`, `providerEnv` (must be `{}` —
native, not a gateway), cwd, and CLI version, and state explicitly whether requested route equals
observed route **and** that the family is opposite to the author's.

**Independence:** you must not be, and must share no state with, the Codex author thread
`01a047f0-f17e-7692-b6f0-83a6d22888c9` (idle/parked) or the topic supervisor
`f7691917-0be2-4bcd-8839-43d3fc809c34`.

## Target — immutable

| Field              | Value                                                        |
| ------------------ | ------------------------------------------------------------ |
| Issue / PR         | #1709 / **PR #1710** (draft)                                 |
| Worktree           | `/home/codex/repos/netscript-007-lint-fail-closed`           |
| Branch             | `fix/lint-partial-exclusion-fail-closed`, **no upstream by design** |
| **Evaluated head** | **`d437db44d40d4dd3e7149ebf98187f3d3fcbb53c`**               |
| Base               | `cf648f1ff973d74c213bb125a6f5f5b9328e693b` (live main)       |
| Run dir            | `.llm/runs/release-0.0.7-internals--orchestration/slices/lint-partial-exclusion-fail-closed/` |

Verify local `HEAD`, `git ls-remote`, and PR `headRefOid` all equal `d437db44d` before evaluating.
Stop and report if any differs. The leaf is **plan-only**: the diff from base excluding `.llm/runs/`
is empty, and it must still be empty when you finish.

## What is being evaluated

A **research + plan** stage only. Judge `plan.md` (with `research.md`) against every box of
`.llm/harness/gates/plan-gate.md`. There is no implementation to review and none is authorized.

### The accepted architecture is settled — judge the plan of it, not the choice

The coordinator decided: **fail closed** whenever Deno silently drops any selected file; a
report-only green is explicitly rejected; the root `lint` task's obsolete doctor-family exclusion is
corrected **first**. Do not re-open that decision. Judge whether the plan implements it soundly.

### The six-path envelope is granted

`.llm/tools/run-deno-lint.ts`, `.llm/tools/run-deno-lint_test.ts`, `.llm/tools/run-deno-fmt.ts`,
`.llm/tools/run-deno-fmt_test.ts`, `deno.json`, and
`packages/cli/src/kernel/assets/agent-tools.generated.ts` (canonical regeneration only).

The fmt pair was added by **coordinator rescope** after the author's mandatory audit reproduced the
symmetric defect — that is authorized history, not scope creep. **A seventh path is not granted**;
judge whether the plan forces one, including any shared helper/module the plan might need.

## What to verify — re-derive, do not accept on trust

1. **The completion-adapter claim, which is the crux.** The plan asserts lint terminates with
   `Checked N file(s)` on both clean and finding runs, while fmt uses `Checked N file(s)` when clean
   or writing and `error: Found N not formatted file(s) in M file(s)` on check findings — **taking
   the second integer**. Re-derive both shapes yourself on Deno 2.9.5, including singular/plural and
   ANSI forms. If they are wrong, the S2/S3 split and the whole identity proof collapse.
2. **The anti-inference rule.** The plan forbids deriving fmt's processed count from the number of
   `from <path>:` findings. Confirm why (a clean peer in the same batch produces no finding), and
   judge whether the plan's parser can actually honour it.
3. **Batch-size invariance.** The plan claims cause and verdict cannot change because a dropped path
   moved into its own child batch. Judge whether the design delivers that, and whether mixed RED at
   sizes 1/2/200 is sufficient coverage.
4. **Probe soundness.** Probes are classification-only and must never enter occurrence/finding
   parsers, crash structures, JSON diagnostics, or stderr. Judge the reconciliation rule
   ("classifications must reconcile exactly to the original processed count", `unverifiedFiles`
   otherwise) and every declared fail-closed failure mode — missing, duplicate, malformed, negative,
   overlarge counts.
5. **Must-not-regress.** All-excluded and empty-selection refusals stay fail-closed in **both**
   wrappers; no Deno rule weakened; no new allowance (`quality:scan` `allowCount` must stay **7**).
6. **Publish claim.** The plan ties barrel/hash/dry-run/JSR to the **lint** change only and states
   fmt creates no publish delta. Verify `consumer-tools.json` and the generated barrel yourself.
7. **The root-task correction.** `2037/35/0 → 2041/36/0`, still green, four healthy doctor files
   gained, malformed sibling still not exposed.
8. **Open-decision sweep** — any decision that would force rework if deferred is an automatic
   unchecked box.

## Hard bounds

- **Edit run artifacts only**, inside the slice run dir; your commit's diff versus `d437db44d` must
  contain nothing else. **Mutate no product, tooling, config, or workflow path** — the plan's
  prescribed changes are not yours to make or prototype in the checkout.
- Run reproductions on `git archive` copies or scratch projects under `$CLAUDE_JOB_DIR/tmp`, never in
  the checkout. Verify `git status --short` is empty at exit.
- **No implementation grant exists.** Do not implement, and do not recommend starting before a
  separate coordinator authorization.
- No merge, ready flip, relabel, issue-checkbox mutation, acceptance-evidence block, or central-state
  edit. No runtime lease, `scaffold.runtime`, Aspire, Docker, browser, or `e2e:cli` — all N/A.

You **may** commit your verdict, push by explicit refspec, and post truthful PR evidence on #1710.

## Output

Write `plan-eval.md` in the slice run dir: identity/route/family/independence, target verification,
per-checklist results with executed evidence, findings with `file:line` and reproduction, an
evaluator-run open-decision sweep, and **one verdict line** — `PASS` or `FAIL_PLAN`. On `FAIL_PLAN`,
list the specific required fixes. State the cycle count (this is cycle 1 of the ordinary two).

Commit as `docs(harness): PLAN-EVAL <verdict> for lint-partial-exclusion-fail-closed`, push, post the
phase comment, and report your session id, verdict, and commit SHA to the internals topic supervisor.

An honest `FAIL_PLAN` is a correct outcome. Do not soften a verdict because a supervisor Tier-A
already passed — Tier-A is a different, lighter gate and is not a substitute for yours.
