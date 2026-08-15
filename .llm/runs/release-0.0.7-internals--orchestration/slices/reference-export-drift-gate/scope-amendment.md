# Scope amendment SA-1 — `reference-export-drift-gate` (#1666 / closes #1296)

| Field                | Value                                                                                |
| -------------------- | ------------------------------------------------------------------------------------ |
| Amendment ID         | `SA-1`                                                                               |
| Recorded (UTC)       | `2026-08-15T16:40:42Z`                                                               |
| Authority            | coordinator `codex-root-0.0.7`, relayed through the owner                            |
| Recorded by          | `topic-internals-0.0.7`, Claude session `f7691917-0be2-4bcd-8839-43d3fc809c34`       |
| Amends               | `plan.md` (inline `AMENDED (SA-1)` annotations) at planning head `9d0b4bf12`         |
| Leaf / lane          | `reference-export-drift-gate`, wave 2 internals                                      |
| Branch / base        | `fix/reference-export-drift-gate` / `baf1cdf67a4e931af17b4772ddf6101f36152184`        |
| Status               | in force; governs wherever it conflicts with `plan.md`                               |

This is a **control-plane** record. It changes authorized scope and gate classification. It changes
no implementation decision in `plan.md` (D1-D11 stand unmodified), and it does **not** grant merge,
publish, ready-flip, relabel, issue-closure, milestone, or release-writer authority.

## A1 — Tenth implementation path AUTHORIZED (test-only)

```
.llm/tools/docs/check-exports-drift_test.ts
```

The frozen contract in central `leaf-contracts.json` lists **nine** `fileSurfaces`. This tenth path
is authorized in addition to them, under these bounds:

- **Test assertions only.** No product, config, or generated file may be edited under this path. It
  is not a licence to reach any other unfrozen file.
- The **existing** negative export fixture (`drift checker negative fixture validation`) must keep
  passing; SA-1 adds cases, it does not license rewriting or weakening what is already there.
- An **eleventh** path remains rescope: stop and request it.

**Why.** S1 lands fail-closed coverage-policy semantics (D2-D5) whose refusal paths are the
load-bearing part of the change — empty or malformed reasons, unknown coverage modes, invented
symbols, and omitted symbols must each exit nonzero. `plan.md` originally routed those to one-off
negative probes recorded as diagnostic evidence, explicitly "because the frozen surface forbids
editing the test file." A probe run once in an author's terminal leaves no artifact that can fail a
future CI run. This leaf exists to remove exactly that defect — a gate reporting green over code it
never examined — so proving its own refusal paths with non-persistent evidence would reproduce the
defect inside the fix. Persistent test cases are the only durable proof.

**Minimum coverage this path must carry:** empty/malformed reason, unknown coverage mode, invented
symbol, omitted symbol — each asserted nonzero by the committed test.

## A2 — `fresh-browser` classified N/A / WAIVED

The frozen contract lists `fresh-browser` among `provingGates`. It is now classified **N/A /
waived** for this leaf.

**Why.** The verified plan changes checker logic, documentation prose, shipped JSDoc, task wiring,
and workflow wiring only. No route, component, island, CSS, interaction, loading/error state, or
application workflow changes. The `frontend` overlay is present because Fresh UI is the *documented
package*, not because browser behavior is modified.

**Obligations that survive the waiver:**

- `NOT_RUN` evidence is **preserved and reported as `NOT_RUN`**. A waiver is not a pass, and the
  gate must never be restated as green.
- **No runtime lease is acquired.** Aspire, Docker, browsers, `e2e:cli`, scaffold runtime, service
  runtime, publish, release cut, and resource cleanup remain prohibited in this lane.

## A3 — PLAN-EVAL cycle 1 GRANTED (one cycle, after fresh Tier-A)

| Field         | Value                                                                        |
| ------------- | ---------------------------------------------------------------------------- |
| Cycles        | exactly **one** (cycle 1 of 2)                                               |
| Precondition  | this amendment passes a **fresh Tier-A** supervisor review                   |
| Target        | the **amended immutable head** produced by the commit carrying SA-1          |
| Session       | **fresh and separate** from the author session                               |
| Route         | native **Fable 5**, effort **medium**, Remote Control attached               |
| Output        | **artifact-only** — writes `plan-eval.md` in this slice directory and nothing else |
| On `PASS`     | the **preserved original Codex author** resumes through the plan's serial slices, each followed by a fresh Tier-A gate |
| On `FAIL_PLAN`| reported as `FAIL_PLAN`; not worked around, not re-run without a grant       |

The evaluator does not merge, relabel, flip the PR to ready, close issues, mutate central cluster
state, or edit any implementation path.

## A4 — Sequencing

`#1666` sequences **before** `#1533 jsdoc-example-compile-gate`. #1533 introduces an example-compiler
gate that would go red on `packages/contracts/src/application/paginated-query.ts:6` — the very JSDoc
import this leaf corrects. Landing #1533 first would knowingly ship a red gate against an
already-identified defect.

## A5 — Central-state reconciliation is owed upstream

Central `leaf-contracts.json` is **coordinator-owned** and still freezes nine `fileSurfaces` for this
leaf. This lane does not edit it. SA-1 is the leaf-local record of the authorized tenth path and the
gate classification, committed and pushed on the leaf branch so it forms part of the immutable head
the evaluator reads. The reconciliation of central state against SA-1 is reported upstream and
remains the coordinator's to perform. Topic-side record: `drift.md` in the topic orchestration run
directory.

## What SA-1 does not change

- Every locked decision D1-D11 in `plan.md`, including D5 ("exclusions must never compensate for
  parser defects") and D11 ("do not tune the checker to baseline green — a real red after wiring is
  reported red").
- The nine frozen paths and their per-path actions, including `docs/exports` (**do not create**),
  `contract-primitives.ts` (**do not edit**), and `src/public/mod.ts` (**do not edit**).
- The remaining proving gates: `check`, `test`, `publish-dry-run`, `quality-job`, `arch-check`,
  `docs-source-format`, `docs-accuracy`, and the JSR audit obligations.
- Evidence discipline: raw exit codes read unpiped, an empty selection is a refusal rather than a
  pass, a command that did not fire is `NOT FIRED`, and scratch stays out of measured roots.
- The prohibition on merge, publish, ready flip, relabel beyond the leaf's own `status:`, issue
  closure, milestone change, central-state mutation, and touching another lane's worktree.
