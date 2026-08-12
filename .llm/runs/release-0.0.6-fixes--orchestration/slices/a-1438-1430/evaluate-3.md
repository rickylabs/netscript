use harness

# IMPL-EVAL cycle 3 — Slice A / PR #1539 / issues #1438 + #1430

You are a **fresh formal IMPL-EVAL evaluator**. Two prior cycles returned **FAIL**, each finding
the *same defect class* in a *different* file. You are neither prior evaluator. Re-derive; do not
inherit.

| Field | Value |
| --- | --- |
| Lane | `formal_impl_evaluation` — native opposite-family (Claude evaluating Codex work) |
| Your route | Claude · Fable 5 · medium |
| Evaluator worktree | `/home/codex/repos/ns006-f-a-impleval3` (detached at `2a4102600`) — **work here** |
| Generator worktree | `/home/codex/repos/ns006-f-a-release-tooling` — **never touch it** |
| PR | #1539, head `2a4102600` |
| Issues | #1438 (p1), #1430 (p2) |
| Prior verdicts | `verdict.md` (cycle 1), `verdict-2.md` (cycle 2) — read for context, verify don't adopt |
| Your output | `verdict-3.md` in this directory |

## SKILL

- `netscript-harness` · `netscript-release` (authority on release identity / canary-pair invariants)
- `netscript-deno-toolchain` · `netscript-tools` · `rtk`

## The history you are checking

The mechanism admits "inexact generated" paths for canary-pair inheritance when writers reproduce
them in `--check` mode. Both failures were the same shape:

- **Cycle 1** — `prose.json.gz`: its writer *version-rewrites the committed blob* rather than
  rebuilding it, so on a same-version tree `--check` compared the blob **to itself**. Injected
  non-version content reached the published barrel and was ADMITTED.
- **Cycle 2** — after a prose parent-anchor fixed that: `provenance.json` skipped the anchor
  entirely (it only guarded prose) and rode on `assertFresh`, which is tautological because the
  writer **spreads `...provenance`**, preserving arbitrary injected fields.

The generalisation the orchestrator gave slice A:

> **Any writer that PRESERVES content rather than RE-DERIVING it from validated source makes its
> HEAD-only `--check` a tautology.**

## What slice A now claims (commit `2a4102600`)

A **full audit of every writer-declared path** in `PREPARED_RELEASE_GENERATED_OUTPUTS`, each
categorised **Preserved** or **Re-derived** with a named source function, in `evidence.md`. Claimed
result: exactly **two** preserved paths — `prose.json.gz` (existing parent anchor, unchanged) and
`provenance.json`, now protected by **both** bounded options: a **closed eight-field writer schema**
plus **parent-derived equality** (integrity fields re-derived from parent/HEAD prose; stable
metadata must equal the canary parent). All other paths claimed **Re-derived** from tracked inputs
whose mutation is itself caught by the changed-path or exact-version rules.

## Your job

1. **Audit the audit.** The table is the substance of this fix. For each row, verify the category
   independently by reading the named writer function. **A single mis-categorised path is a
   blocking finding** — that is exactly how cycle 1 became cycle 2. Pay particular attention to
   rows claimed "Re-derived from validated inputs" (rows 4 and 10), which depend on *other* paths'
   guards holding, and to any writer that reads its own output.
2. **Attack provenance directly** — the cycle-2 vector. Inject a non-version field; try a field
   inside the closed schema carrying junk; try changing `sourceCommit` / `extractionTimestamp` /
   `files`; try a provenance-only change with prose untouched (the exact cycle-2 shape). Confirm
   each is rejected through the **real** inheritance path.
3. **Re-run cycle 1's prose attack** and confirm it still rejects — the new work must not have
   regressed the earlier anchor.
4. **Then look for a third instance of the class.** Two cycles found two. Assume a third. Probe any
   path where the writer's input is not strictly tracked-and-covered: absent files, empty payloads,
   a path present at HEAD but missing at parent, a path in the writer set that no writer actually
   emits, case/normalisation collisions, and the barrels' dependence on the anchored inputs.
5. **Confirm the legitimate path still inherits.** Drive the real measured v0.0.5 cut `6ec75573d`
   (0.0.4→0.0.5) end-to-end through the real `verifyGreenCanaryPair`. Cycle 2 got `ADMITTED`; if the
   closed schema or the new equality now *rejects* a genuine cut, **#1438 is inert** — fixed on
   paper, dead in practice — and that is a blocking finding, not a nicety.
6. **#1430** — judged correct and complete twice. Spot-check only; do not re-audit.
7. **Scope** — diff against the **merge-base**, not `origin/main`.

## Gates you must execute yourself

```
rtk proxy deno task check
rtk proxy deno task test
rtk proxy deno task lint
rtk proxy deno task fmt:check
deno test --allow-all .llm/tools/release/
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/release --ext ts
rtk git status --porcelain     # empty afterwards; deno.lock unmodified
```

Reproduce, do not relay. Quote real output.

## Hard constraints

- **No publication, ever.** No `deno publish`, no `release:publish`, no tag push, no canary.
- Do not commit, push, or merge. Do not touch the generator's worktree.
- Do not fix the code — describe defects precisely.
- Build scratch repos outside both worktrees; restore every tamper; leave your worktree clean and
  say so.
- If you stub anything to reach a code path, **say so explicitly** and prove the stubbed components
  separately against the real worktree — cycle 2 did this correctly and disclosed it.

## Verdict format

`verdict-3.md`:

- **VERDICT: PASS** / **PASS WITH FINDINGS** / **FAIL** — one line, first.
- **Headline answer, explicit:** can any non-version-bump content be admitted for canary-pair
  inheritance, through *any* writer-declared path? With the output that establishes it.
- **Your independent verdict on the audit table** — per row, agree or dispute the category.
- Whether the legitimate v0.0.5-shaped cut still inherits.
- Findings, blocking or non-blocking, each with a concrete failure scenario.
- What you executed, verbatim; what you could **not** verify; anything you stubbed.

Two cycles of green CI, 3189 passing tests and both runtime tiers missed both prior holes. Only a
briefed adversary found them. Assume there is a third and go looking; if there genuinely is not,
say so with the probes that establish it.
