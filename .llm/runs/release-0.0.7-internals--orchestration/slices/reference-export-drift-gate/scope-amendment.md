# Scope amendments SA-1 / SA-1a / SA-2 — `reference-export-drift-gate` (#1666 / closes #1296)

| Field          | Value                                                                          |
| -------------- | ------------------------------------------------------------------------------ |
| Amendment IDs  | `SA-1`, `SA-1a`, `SA-2`                                                        |
| Recorded (UTC) | SA-1 `2026-08-15T16:40:42Z`; SA-1a `2026-08-15T16:57Z`; SA-2 `2026-08-15`      |
| Authority      | coordinator `codex-root-0.0.7`, relayed through the owner                      |
| Recorded by    | `topic-internals-0.0.7`, Claude session `f7691917-0be2-4bcd-8839-43d3fc809c34` |
| Amends         | `plan.md`; SA-2 builds on evaluator `5d229e0f3` and SA-1a head `cb91b225d`     |
| Leaf / lane    | `reference-export-drift-gate`, wave 2 internals                                |
| Branch / base  | `fix/reference-export-drift-gate` / `baf1cdf67a4e931af17b4772ddf6101f36152184` |
| Status         | SA-2 in force; latest ruling governs wherever amendments or `plan.md` conflict |

This is a **control-plane** record. It changes authorized scope and gate classification. SA-1 left
D1-D11 intact; SA-2 narrows D8's JSDoc-only reconciliation to all four measured residual examples
and binds N1-N5. It does **not** grant merge, publish, ready-flip, relabel, issue-closure,
milestone, or release-writer authority.

## A1 — Tenth implementation path AUTHORIZED (test-only)

```
.llm/tools/docs/check-exports-drift_test.ts
```

The frozen contract in central `leaf-contracts.json` lists **nine** `fileSurfaces`. SA-1 authorized
this test path in addition to them. SA-2 later added three JSDoc-only paths, so the live total is
**thirteen** under these bounds:

- **Test assertions only.** No product, config, or generated file may be edited under this path. It
  is not a licence to reach any other unfrozen file.
- The **existing** negative export fixture (`drift checker negative fixture validation`) must keep
  passing; SA-1 adds cases, it does not license rewriting or weakening what is already there.
- A **fourteenth** implementation path is rescope: stop and request it.

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
application workflow changes. The `frontend` overlay is present because Fresh UI is the _documented
package_, not because browser behavior is modified.

**Obligations that survive the waiver:**

- `NOT_RUN` evidence is **preserved and reported as `NOT_RUN`**. A waiver is not a pass, and the
  gate must never be restated as green.
- **No runtime lease is acquired.** Aspire, Docker, browsers, `e2e:cli`, scaffold runtime, service
  runtime, publish, release cut, and resource cleanup remain prohibited in this lane.

## A3 — PLAN-EVAL cycle 1 GRANTED (one cycle, after fresh Tier-A)

| Field          | Value                                                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Cycles         | exactly **one** (cycle 1 of 2)                                                                                         |
| Precondition   | this amendment passes a **fresh Tier-A** supervisor review                                                             |
| Target         | the **amended immutable head** produced by the commit carrying SA-1                                                    |
| Session        | **fresh and separate** from the author session                                                                         |
| Route          | native **Fable 5**, effort **medium**, Remote Control attached                                                         |
| Output         | **artifact-only** — writes `plan-eval.md` in this slice directory and nothing else                                     |
| On `PASS`      | the **preserved original Codex author** resumes through the plan's serial slices, each followed by a fresh Tier-A gate |
| On `FAIL_PLAN` | reported as `FAIL_PLAN`; not worked around, not re-run without a grant                                                 |

The evaluator does not merge, relabel, flip the PR to ready, close issues, mutate central cluster
state, or edit any implementation path.

## A4 — Sequencing

`#1666` sequences **before** `#1533 jsdoc-example-compile-gate`. #1533 introduces an
example-compiler gate that would go red on all four affected files:

- `packages/contracts/src/application/paginated-query.ts`;
- `packages/contracts/src/application/transform-helpers.ts`;
- `packages/contracts/schemas/filters.ts`;
- `packages/contracts/schemas/pagination.ts`.

Landing #1666 first clears all four known example-compile failures; landing #1533 first would
knowingly ship a red gate against those already-identified defects.

## A5 — Central-state reconciliation is owed upstream

Central `leaf-contracts.json` is **coordinator-owned** and still freezes nine `fileSurfaces` for
this leaf. This lane does not edit it. SA-1 and SA-2 are the leaf-local record of the authorized
test path, three JSDoc-only paths, and gate classification, committed and pushed on the leaf branch
so they form part of the immutable head the evaluator reads. Reconciliation of central state against
the live **thirteen-path** leaf contract remains the coordinator's responsibility. Topic-side
record: `drift.md` in the topic orchestration run directory.

## What SA-1 does not change

- Locked decisions D1-D7 and D9-D11 in `plan.md`, including D5 ("exclusions must never compensate
  for parser defects") and D11 ("do not tune the checker to baseline green — a real red is reported
  red"). D8 is superseded only to include the three coordinator-granted JSDoc lines.
- The nine frozen paths and their per-path actions, plus the SA-1 test path and SA-2's three
  JSDoc-only paths. `docs/exports` remains **do not create**; `contract-primitives.ts` and
  `src/public/mod.ts` remain **do not edit**.
- The remaining proving gates: `check`, `test`, `publish-dry-run`, `quality-job`, `arch-check`,
  `docs-source-format`, `docs-accuracy`, and the JSR audit obligations.
- Evidence discipline: raw exit codes read unpiped, an empty selection is a refusal rather than a
  pass, a command that did not fire is `NOT FIRED`, and scratch stays out of measured roots.
- The prohibition on merge, publish, ready flip, relabel beyond the leaf's own `status:`, issue
  closure, milestone change, central-state mutation, and touching another lane's worktree.

## SA-1a — historical correction to SA-1 (2026-08-15T16:57Z; count superseded by SA-2)

SA-1 authorized the tenth path but left four path-count statements in `plan.md` reading "nine". One
of them was load-bearing: validation row 11 and the S3 evidence line historically bound the audit to
the frozen count, so the audit gate as written would have refused the very path SA-1 authorized — or
pushed the author to drop the test file to make the gate quiet. That is the same
coverage-versus-compliance failure this leaf exists to remove, introduced by the amendment meant to
prevent it.

At the SA-1a head, the correction bound the audit to the then-current ten paths. SA-2 supersedes
that count everywhere operational: S3, validation row 11, and the risk guard are now bound to
**thirteen**, and a fourteenth implementation path is rescope. The unrelated Contracts `doc:lint`
baseline remains nine private-type-ref diagnostics and is deliberately unchanged.

Found by an independent Tier-A pass, not by the Tier-A that admitted SA-1 — that pass grepped for
the authorized filename and never grepped for the count. Recorded in the topic drift log.

## SA-2 — PLAN-EVAL cycle-1 remediation (2026-08-15)

PLAN-EVAL cycle 1 returned `FAIL_PLAN` at evaluator commit `5d229e0f3`. The coordinator ruled every
open point; this section records those rulings and does not delegate them to implementation
judgement.

### B1 — three JSDoc-only paths GRANTED

Exactly these paths are added, and only the `@example` import subpath may change:

| Path                                                      | Symbols                                          | Ruled entrypoint                 |
| --------------------------------------------------------- | ------------------------------------------------ | -------------------------------- |
| `packages/contracts/src/application/transform-helpers.ts` | `createTransformer`                              | `@netscript/contracts/transform` |
| `packages/contracts/schemas/filters.ts`                   | `FilterConditionSchema`, `buildPrismaWhere`      | `@netscript/contracts/query`     |
| `packages/contracts/schemas/pagination.ts`                | `PaginationInputSchema`, `createPaginatedOutput` | `@netscript/contracts/query`     |

No runtime, type, export, or schema change is authorized. Together with the frozen nine and SA-1's
test path, the surface is **thirteen**. `Closes #1296` remains honest because the plan now repairs
all four measured residual examples; without this rescope it would not be honest.

### Corrected enforcement premise

The coordinator's original dispatch premise was wrong, and the research inherited that error. The
checker is already enforced fail-closed in qualifying non-draft CI:

```text
ci.yml:366  run-gate.ts --gate docs-accuracy --id quality-docs-accuracy
  (quality job at :282; non-draft guard at :287)
  -> catalog.ts:59  docs-accuracy -> deno task docs:accuracy
  -> deno.json:85  docs:accuracy -> check-accuracy-and-discoverability.ts
  -> :291-301  spawn check-exports-drift.ts; print child output and throw on nonzero
```

The remaining acceptance gap is discoverability and maintainer procedure: no named
`docs:exports-drift` task, no explicit Pages step bearing that name, and no runbook. S2 preserves
existing enforcement and makes it visible; it does not claim to create enforcement.

### N1-N5 — binding implementation details

- **N1:** S1 commits an honest residual red with its raw exit and findings; green is not its commit
  condition and D11 forbids tuning the checker quiet.
- **N2:** every checker run prints each package's coverage mode, reason, and omission-group counts
  before its terminal verdict.
- **N3:** export injectable `checkDrift(mapping)` returning a process code; the
  `if (import.meta.main)` guard calls `Deno.exit(await checkDrift(AUTHORITATIVE_MAPPING))`. Tests
  pass malformed mappings directly without triggering `main` and assert nonzero without trying to
  mutate the hardcoded constant in a subprocess.
- **N4:** the Pages step runs `deno task docs:exports-drift` from repository root, has no
  `working-directory`, and uses `if: env.RUN == 'true'`.
- **N5:** `docs:accuracy` invokes the named task under its existing `--allow-run=deno` permission
  and preserves the current child stdout/stderr surfacing before throwing on nonzero.

### PLAN-EVAL cycle 2

A fresh PLAN-EVAL is **required** because SA-2 materially changes closure scope, the test seam,
coverage reporting, and the CI premise. It is not author-granted. After this run-artifact-only head
is pushed, the coordinator must run fresh Tier-A and then grant/dispatch the final separate-session
cycle. No JSDoc or product edit may begin without both Tier-A PASS and PLAN-EVAL cycle-2 PASS.
