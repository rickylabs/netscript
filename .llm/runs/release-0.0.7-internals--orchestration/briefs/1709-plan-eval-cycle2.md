# Brief — #1709 PLAN-EVAL cycle 2 — **PREPARED, NOT LAUNCHED**

> **Not authorized yet.** The coordinator reconciles the new immutable repair head and grants cycle 2
> explicitly. Do not launch from this file without that grant.

## Route

`formal_plan_evaluation`, native opposite family for a Codex-authored plan: **Claude Fable 5 ·
medium · `--remote-control`**, `providerEnv {}`. Must be a **fresh** session, independent of the
Codex author `01a047f0-f17e-7692-b6f0-83a6d22888c9`, the topic supervisor
`f7691917-0be2-4bcd-8839-43d3fc809c34`, and **the cycle-1 evaluator
`1b7a1305-a353-4c1d-a415-34ee8869ff6b`**.

## Target

| Field                | Value                                                     |
| -------------------- | --------------------------------------------------------- |
| Evaluated head       | `3e934e2de1ed758f7182ad1eebf027750bcfb976` (repair head)  |
| Cycle-1 verdict head | `59b79ccd899ab02a2377e48bba2fdf9dbc866200`                |
| Base                 | `cf648f1ff973d74c213bb125a6f5f5b9328e693b` (live main)    |
| Worktree / branch    | `/home/codex/repos/netscript-007-lint-fail-closed`, `fix/lint-partial-exclusion-fail-closed` |
| Issue / PR           | #1709 / #1710 (draft)                                     |

**Preserve cycle 1 bit-identical**: copy the existing `plan-eval.md` to `plan-eval-cycle-1.md`
before writing the new canonical `plan-eval.md`. This is the pattern #1663 established.

## Scope — delta-focused

Cycle 1 already re-derived and confirmed the adapters, anti-inference rule, probes, both refusals,
`allowCount: 7`, lint-only publish surface, generator idempotence, `2037/35/0 → 2041/36/0`, the
unexposed malformed sibling, and that no seventh path is forced. **Do not redo that wholesale**;
spot-check what the repair could have disturbed and say explicitly what you carried forward.

Judge whether the repair actually closes its three findings:

- **F1** — does S3 introduce the injectable runner seam **inside `run-deno-fmt.ts`** with no new
  module, and are plan step 3 and the worklog "Ports / seams" text corrected?
- **F2** — is `refusal ≥ crash ≥ ordinary finding` genuinely locked, is crash-batch coverage defined,
  and do the S2/S3 crash controls name **exact expected exits and `coverage` JSON at 1/2/200**?
- **F3** — does validation row 8 read "exit 0 for both root tasks", and is per-file drop-free
  evidence present in S1 and S2/S3?
- **A1–A3** — folded, or explicitly and defensibly skipped?

Then run the **full plan gate** on the repaired plan and an evaluator-run open-decision sweep. A
newly introduced gap is as blocking as an unclosed one.

## Supervisor-verified facts you may spot-check rather than re-derive

At the repair head, measured by the topic supervisor: root lint as shipped **`2037/35/0`**; root lint
with the doctor term removed **`2041/36/0`**; root `fmt:check` **`2041/36/0`, findings 0** — fmt is
already at parity because #1663 corrected the fmt side, and S1 closes the remaining lint asymmetry.

## Bounds

Run artifacts only; no product/tooling/config/workflow mutation; reproductions on archive copies or
scratch projects; `git status --short` empty at exit. **No implementation grant exists** — do not
implement and do not recommend starting before separate coordinator authorization. No merge, ready
flip, relabel, checkbox, acceptance-evidence, or central-state edit. No lease, `scaffold.runtime`,
Aspire, Docker, browser, or `e2e:cli`.

## Output

`plan-eval.md` with one verdict line — `PASS` or `FAIL_PLAN` — and the cycle count stated as **2 of
the ordinary 2**. A second `FAIL_PLAN` exhausts the ordinary allowance and returns the leaf to the
owner; do not assume a third cycle.
