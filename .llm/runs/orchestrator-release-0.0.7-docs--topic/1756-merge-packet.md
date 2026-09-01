# MERGE PACKET — #1756 · `test(docs): compile published JSDoc examples`

**Immutable pushed head: `6a51cfe4c481ef2325ee2b753621cc11d9a70e73`**
**Merge candidate (head + the unpushed `ci.yml` commit): `9372a27e1d5997465f9eb4e2b98b7c9ea90cfd8c`**
Base `main` at packet time: `e938ecd31`. Closes #1533. `status:ready-merge`, `orchestrator:docs`.

## Verdicts — all against exact, named heads

| Cycle | Head | Verdict |
| --- | --- | --- |
| IMPL-EVAL 1 | `239f4b53d` | **FAIL_FIX** — F1 silent revert of #1740 in four stream factories; F2 shim laundering constraint violations. Both fixed. |
| IMPL-EVAL 2 | `889e676a5` | **PASS** — reproduced the laundering itself; audited the salvage's full 47-file blast radius for a seventh semantic revert (none). One live finding (stale PR body) fixed. |
| Bounded delta | `9372a27e1` | **PASS** — scoped to the two files changed since cycle 2: the ceiling and `ci.yml`. |

Two earlier evaluators were terminated on stale heads **without verdicts** and are preserved as
transport evidence only, explicitly marked NO VERDICT.

## Gate state at the merge candidate

| Check | Result |
| --- | --- |
| `deno task docs:jsdoc-examples` | 0 — `PASS`, `members=35 files=2037 examples=358 candidates=357 checked=357 exempt=0 failures=0`, `deferredCensus={"unboundName":116,"typeError":14}` |
| focused suite | **18 passed / 0 failed** |
| `deno task test` | **4742 passed / 0 failed** (synthetic tree on current `main` `e938ecd31`) |
| `deno test .llm/tools/quality/` | 44 / 0 |
| `check:aspire-version-parity` | PASS (`ok: true`, 812 checked, 0 fail) |
| `check:assets-barrel` · `check:publish-assets` | PASS · PASS |
| `quality:scan` over changed files | `findings: []` |
| review threads | PASS, 0 threads |
| `ci.yml` | +8/−0, step-name set-difference empty (49 → 50) |
| tasks / gate ids vs base | zero lost; additions exactly the three intended; no duplicate keys |
| `git diff --check` · `deno.lock` | 0 · unchanged |

**Ceilings: `unboundName 116`, `typeError 14` — both at their exact census, zero slack.** Neither was
ever raised; all six crossings that arrived from other lanes were repaired at source.

## Proven by mutation, not by a green run

| Mutation | Result |
| --- | --- |
| revert a source repair | `ratchet failure: deferred unboundName 117 > 116`, exit 1 |
| `ServiceHandlerContext<number>` (violates `TCustom extends object`) | `ratchet failure: deferred typeError 15 > 14`, exit 1; receipt `outcome: FAIL`, `exitCode: 1` |
| `./api-clients.ts` in `create-service-query-utils.ts` | exit 1, `badSpecifier` naming file · symbol · example · fence |
| relative contract import in `packages/sdk/src/desktop/mod.ts` | exit 1, same form |
| delete the `jsdoc-example-compile` catalog line | `jsdoc-example-workflow_test.ts` fails — the task → gateArgv → ci.yml chain is test-enforced |

## Two blockers, both the same root cause

Everything below is caused by the single unpushed `ci.yml` commit, and both clear together.

**1. `check-test` — 4736 pass / 1 fail.** `jsdoc-example-workflow_test.ts:26`,
`assertEquals(gateOccurrences.length, 1)`, actual 0. The pushed head contains **0** occurrences of
`--gate jsdoc-example-compile`; the merge candidate contains **1** — exactly the cardinality asserted.
The test is correct and was deliberately not weakened: it is the only proof the gate runs in CI,
which is acceptance box 5 itself.

**2. `close-gate` — one box without evidence.** Now failing cleanly on exactly one thing:

```
error: Issue #1533: unchecked box "The gate runs in CI on `packages/**` and `plugins/**` changes."
       has no matching evidence entry
```

A stale `acceptance-evidence` block in comment `5469523773` (2026-08-30, `box-index:` form, head
`4cdee82f`) was duplicating all six shared boxes — the mirror concatenates the body with every
comment. Neutralised in place, history preserved as a quote; **exactly one parseable block now exists
across body and comments.** Box 5 remains deliberately unclaimed because it is false at a head
without the step, and the mirror is all-or-nothing, so nothing ticks until it is true.

## Completion — two steps, in this order

**Step 1 — apply the workflow commit** (needs `workflow` scope; this session's token has `repo` only,
and GitHub refuses both the push and the contents API):

```bash
git fetch origin test/jsdoc-example-compile-gate
git checkout 6a51cfe4c481ef2325ee2b753621cc11d9a70e73
git am .llm/runs/orchestrator-release-0.0.7-docs--topic/1756-workflow-step-on-eaae7a27b.patch
git push origin HEAD:test/jsdoc-example-compile-gate
```

Patch sha256 **`9ed954676206da1389254c4c4a746e6c69e1e2efe20788ddfa39adec73637ae0`** (verified); touches
only `.github/workflows/ci.yml`; **+8/−0**. The delta evaluator independently confirmed
`git apply --check` is clean at `6a51cfe4c` and the result byte-identical to the merge candidate, so
the patch being cut against `eaae7a27b` costs the applier nothing. Also held as tag
`salvage/1756-workflow-step`.

**Step 2 — add box 5's evidence**, which becomes true the moment step 1 lands. Append inside the
existing `acceptance-evidence` block in the PR body (do **not** add a second block):

```yaml
  - box: "The gate runs in CI on `packages/**` and `plugins/**` changes."
    evidence: "ci.yml quality job step 'JSDoc example import and fence integrity', guarded by env.RUN_DENO == 'true', invoking run-gate.ts --gate jsdoc-example-compile with a durable receipt at .llm/tmp/gate-receipts/quality/jsdoc-example-compile.json. RUN_DENO is set at ci.yml:292 from needs.classify.outputs.needs_deno, whose classifier maps packages/, plugins/ and apps/ to deno:true. Verified by the delta IMPL-EVAL at 9372a27e1."
```

Then rerun `close-gate` once; the mirror ticks all seven and the gate passes.

## Follow-ups filed rather than scope-crept

- **#1892** — unattributed `deno check` diagnostics are dropped whenever any example has a classified
  failure; plus value owners still binding via `declare global`.
- **#1893** — `check:aspire-host-ports` passes on runtime literal service URLs its own S5 test rejects.

## Not merged by me

This lane does not merge. Everything it can do is done at `6a51cfe4c`.
