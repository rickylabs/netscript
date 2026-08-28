use harness

## SKILL

Continue under the skills already loaded for this leaf (`netscript-harness`, `netscript-pr`,
`netscript-tools`, `netscript-deno-toolchain`, `rtk`) plus `.llm/harness/gates/plan-gate.md`.

# Brief — #1709 plan-artifact repair after PLAN-EVAL cycle-1 `FAIL_PLAN`

## Status

Formal PLAN-EVAL cycle 1 returned **`FAIL_PLAN`** at verdict commit `59b79ccd8` against your plan
head `d437db44d`. It is a **specification-gap** verdict, not a design rejection. The evaluator
independently re-derived and **confirmed** your adapter shapes (singular/plural/ANSI), the
anti-inference rule, probe forms, both refusals in both wrappers, `allowCount: 7`, the lint-only
publish surface, generator idempotence, `2037/35/0 → 2041/36/0` with the malformed sibling
unexposed, and that **no seventh path is forced**. It found your root-task correction *stronger*
than you claimed. The architecture and envelope stand.

**Authorized: plan-artifact repair only. No implementation.** Cycle 2 exists but is **not yet
granted** — do not assume or request it.

## Hard ceiling, unchanged

The **six** product/config/generated paths remain the ceiling:
`.llm/tools/run-deno-lint.ts`, `.llm/tools/run-deno-lint_test.ts`, `.llm/tools/run-deno-fmt.ts`,
`.llm/tools/run-deno-fmt_test.ts`, `deno.json`,
`packages/cli/src/kernel/assets/agent-tools.generated.ts` (canonical regeneration only). **A seventh
path is not granted.** Preserve all history — `plan-eval.md` is the evaluator's and is not yours to
edit.

## Required fixes

**F1 — correct a false statement about existing code (decisions-locked box).**
Your plan assumes an injectable runner seam in both wrappers. That is true only of lint. Verified at
the evaluated head: `run-deno-lint.ts` has `export type BatchRunner` at `:430`, `denoLintRunner` at
`:436`, and an injectable `runner: BatchRunner = denoLintRunner` at `:472`; **`run-deno-fmt.ts` has
none**. Repair the plan so **S3 introduces an equivalent injectable runner seam inside
`run-deno-fmt.ts`** — same file, no new module, therefore no seventh path. Correct plan step 3 and
the worklog "Ports / seams" text, and update the S3 slice row so the fmt malformed-summary and
inconsistent-probe controls are unit fixtures through that new seam.

**F2 — lock crash/coverage precedence and pin the controls (open-decision sweep box).**
Add a crash row to the failure-precedence table and **lock `refusal ≥ crash ≥ ordinary finding`**.
Define crash-batch coverage semantics explicitly. The supporting fact is verified: **Deno still emits
a completion summary on a parse-error batch** — a broken file beside a good one gives
`Checked 2 files` from lint and `Found 1 not formatted file in 2 files` from fmt, both exit 1 — so
coverage *can* be evaluated on crash batches. Whichever rule you lock, it must be explicit, and the
S2/S3 crash controls must name the **exact expected exit and `coverage` JSON shape at batch sizes
1, 2 and 200**. A run containing any coverage refusal exits 2 regardless of crash batches; crash
diagnostics still render once through the existing failure paths; `coverage` never copies crash text.

**F3 — tighten the root-task validation.**
Change validation row 8 to **"exit 0 for both root tasks"**, and add **per-file drop-free evidence**
to the S1 and S2/S3 proving gates — batch-size-1 root lint/fmt, or summed per-batch
`Checked N == filesSelected`. Cite the evaluator's §7 numbers as the pre-implementation baseline.

**A1–A3 — fold in where cheap.** State that `coverage` is omitted in lint `--input` mode; consider
`--check` probes in write mode; pin a CRLF summary fixture. These are non-blocking; include them if
they cost little and say so if you deliberately skip one.

## Bounds

- Harness artifacts only. **No product, tooling, config, or workflow mutation**, and no prototyping
  in the checkout — the leaf must stay plan-only, exactly as it is now.
- Do not touch `plan-eval.md`. Preserve all prior artifacts and history.
- No merge, ready flip, relabel, issue-checkbox, acceptance-evidence, or central-state edit. No
  evaluator or runtime lease. `scaffold.runtime`, Aspire, Docker, browser and `e2e:cli` remain N/A.
- Record the repair in `drift.md` and keep `worklog.md`/`context-pack.md` current.

## Output

Commit the repaired plan artifacts, push with
`git push origin HEAD:refs/heads/fix/lint-partial-exclusion-fail-closed`, update the draft PR #1710
record and post the phase comment, then **stop**. The supervisor performs a fresh Tier-A on your
exact repaired head. **Cycle-2 PLAN-EVAL is prepared but not launched** — the coordinator grants it
after reconciling the new immutable head. Report your thread id, commit SHA, repaired head, and
whether you folded or skipped each of A1–A3.
