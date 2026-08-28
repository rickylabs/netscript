use harness

## SKILL

Continue under the skills already loaded for this leaf (`netscript-harness`, `netscript-pr`,
`netscript-tools`, `netscript-deno-toolchain`, `rtk`) plus `.llm/harness/gates/plan-gate.md`.

# Brief — #1709 F4 amendment (owner-accepted, plan-only, bounded)

## Status

PLAN-EVAL cycle 2 returned **`FAIL_PLAN`** at `f2b3fc8b3` on a **single narrow finding**. The
ordinary two-cycle allowance is exhausted and **there is no third PLAN-EVAL**. The owner has
**accepted the recommended fix**, so this is a bounded amendment, not a re-plan.

Cycle 2 explicitly closed **F1, F3 and A1–A3**, and closed **F2 apart from this one extension**.
Everything else in your plan stands. Do not reopen or restructure it.

## The finding — F4, verified

Your fmt adapter admits two completion forms: `Checked N file(s)`, and check-mode
`error: Found M not formatted file(s) in N file(s)`. **Write mode with a crashing file emits a third
form you never measured.** Confirmed on Deno 2.9.5:

| Invocation                        | Output                                        | Exit |
| --------------------------------- | ----------------------------------------------- | ---- |
| `deno fmt good.ts bad.ts` (write) | **`error: Failed to format 1 of 2 checked files`** | 1  |
| `deno fmt good.ts` (write, clean) | `Checked 1 file`                                | 0    |
| `deno fmt --check good.ts bad.ts` | `Found 1 not formatted file in 2 files`         | 1    |

`1 of 2 checked files` — the **second** integer is the processed count.

Why it blocks: your must-not-regress row asserts write mode "retains a verified original `Checked N`
count". That is false on a crashing write batch. The adapter would find no admissible summary and,
by your own fail-closed rules, raise a **coverage refusal at exit 2** for what your locked precedence
says is an ordinary **crash at exit 1** — misclassifying, and violating
`refusal ≥ crash ≥ ordinary finding` in the very mode D8 extended coverage into.

## Required amendment — exactly this, nothing more

1. **Admit the third write-mode form.** Add `^error: Failed to format (\d+) of (\d+) checked files?$`
   as the third admissible fmt completion form, **scoped to write mode**, with the **second** integer
   as the processed count. Pin singular/plural and ANSI variants like the existing forms.
2. **Propagate the correction** to every place that states the old two-form assumption: **D8**, the
   *Completion adapters* list, the **must-not-regress** row (`Checked N` **or**
   `Failed to format M of N checked`), the **S3 slice row**, the **risk-register write row**, and
   **research finding 10**.
3. **Add controls** — write-mode **crash-only** and **crash-and-drop** at batch sizes **1, 2 and
   200**, with the **same expected exit and `coverage` JSON shape** as the existing check-mode
   controls.
4. **Preserve `refusal ≥ crash ≥ ordinary finding`** exactly as locked, and preserve every previously
   accepted F1–F3 / A1–A3 boundary. A write-mode crash without a drop must exit **1**, not 2.

## Bounds

- **Plan artifacts only.** No product, tooling, config, or workflow mutation; no prototyping in the
  checkout. The leaf must stay plan-only, as it is now.
- **Six-path ceiling unchanged**; a seventh is an immediate rescope stop.
- Do not touch `plan-eval.md` or `plan-eval-cycle-1.md` — both evaluator artifacts are preserved
  history.
- No merge, ready flip, relabel, issue-checkbox, acceptance-evidence, or central-state edit. No
  evaluator or runtime lease. `scaffold.runtime`, Aspire, Docker, browser and `e2e:cli` remain N/A.
- Record the amendment in `drift.md`, noting the owner acceptance and that no third PLAN-EVAL exists.
  Keep `worklog.md` and `context-pack.md` current.

## Output and stop condition

Commit, push with `git push origin HEAD:refs/heads/fix/lint-partial-exclusion-fail-closed`, update
the draft PR #1710 record and post the phase comment, then **stop**.

**There is no third PLAN-EVAL.** The supervisor runs a fresh Tier-A on your exact pushed head; on
PASS the leaf stops for the coordinator's implementation grant. Report your thread id, commit SHA,
amended head, and confirm you measured the write-mode form yourself rather than taking it from this
brief.
