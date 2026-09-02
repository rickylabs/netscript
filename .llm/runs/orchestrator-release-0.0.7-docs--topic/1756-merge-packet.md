# MERGE PACKET (final) — #1756 · `test(docs): compile published JSDoc examples`

**Immutable pushed head: `216d9ced44425449e6e16b9002573c29c87ff923`** · base `main` `e938ecd31`
Closes #1533 · `status:ready-merge` · `orchestrator:docs`

## Changed since the previous packet

**`close-gate` now PASSES.** All seven #1533 acceptance boxes are mirrored:

```
acceptance-mirror APPLIED: #1533
close-gate PASS rickylabs/netscript#1756
provenance: head=216d9ced4 · snapshot #1533 bodySha256=7d2f3f47ffa072dd…
```

Three things got it there, two of them raised by the cycle-3 evaluator that another session
dispatched against `6a51cfe4c`:

1. **Duplicate evidence cleared.** A stale `acceptance-evidence` block in comment `5469523773`
   (2026-08-30, `box-index:` form, head `4cdee82f`) duplicated every shared box, because the mirror
   concatenates the body with every comment. Neutralised in place, history preserved. Verified zero
   remaining blocks across issue comments, review comments and reviews — cycle 3's R4 reported four
   in the PR thread, which its snapshot predated; there are now **one block, seven boxes, no
   duplicates**.
2. **The promised artifact now exists where a reviewer would look (cycle-3 R3).** It was correct that
   `find .llm/runs -name '*1756*'` found nothing and the tag was local-only: the patch lived on
   `orchestrator/release-0.0.7-docs`, not on this branch. It is now committed at
   **`.llm/runs/test-jsdoc-example-compile-gate--1533/workflow-step.patch`** (sha256
   `e303f45463cc32d6fafb200ac765fce1bc37c4372d1e6aae2574336be1d7bb54`), cut against this head so a
   plain `git am` applies it.
3. **Box 5 evidence added, once, and stated precisely.** Its entry records the wiring *and* that the
   step is carried as that patch rather than present on the head — so the mirrored tick on #1533
   carries its own caveat rather than asserting something the head does not do.

## Verdicts — every one against a named head

| Cycle | Head | Verdict |
| --- | --- | --- |
| IMPL-EVAL 1 (GLM, this lane) | `239f4b53d` | FAIL_FIX — F1 revert of #1740 in four stream factories, F2 shim laundering. Both fixed. |
| IMPL-EVAL 2 (GLM, this lane) | `889e676a5` | **PASS** — reproduced the laundering; audited the salvage's 47-file blast radius for a seventh revert (none). |
| Bounded delta (GLM, this lane) | `9372a27e1` | **PASS** — ceiling + `ci.yml`; proved the tightening bites and the failing receipt. |
| IMPL-EVAL 3 (OpenHands, other session) | `6a51cfe4c` | FAIL_FIX — R1/R2 the CI wiring (credential-blocked), **R3 and R4 both now resolved above**. |

## Gate state

| Check | Result |
| --- | --- |
| `close-gate` | **PASS** — 7/7 boxes mirrored |
| review threads | PASS, 0 threads |
| `deno task docs:jsdoc-examples` | 0 — `deferredCensus={"unboundName":116,"typeError":14}`, ceilings at exact census |
| `deno task test` | 4742 / 0 (synthetic tree on current `main`) |
| focused suite (candidate incl. `ci.yml`) | 18 / 0 |
| `check:aspire-version-parity` · `assets-barrel` · `publish-assets` | PASS · PASS · PASS |
| `quality:scan` over changed files | `findings: []` |
| `check-test` | **1 failure** — see below |

## The single remaining blocker

`check-test` fails only on `jsdoc-example-workflow_test.ts:26` — `assertEquals(gateOccurrences.length,
1)`, actual 0 — because the head carries **0** occurrences of `--gate jsdoc-example-compile` and the
merge candidate carries **1**. That is cycle 3's R1+R2, which it correctly called one slice.

The test was deliberately not weakened: it is the only proof the gate runs in CI, which is box 5
itself.

**This needs `workflow` token scope, which this session does not have.** Verified exhaustively at
this head, not assumed: the branch push, the tag push, and the contents API are each refused —

```
! [remote rejected] (refusing to allow a Personal Access Token to create or update workflow
   `.github/workflows/ci.yml` without `workflow` scope)
```

`gh auth status` → scopes `'repo'`; it is the only credential present. Authorization was never the
constraint.

## To finish — one command

```bash
git fetch origin test/jsdoc-example-compile-gate
git checkout 216d9ced44425449e6e16b9002573c29c87ff923
git am .llm/runs/test-jsdoc-example-compile-gate--1533/workflow-step.patch
git push origin HEAD:test/jsdoc-example-compile-gate
```

+8/−0 to `.github/workflows/ci.yml`; the delta evaluator independently confirmed `git apply --check`
is clean and the result byte-identical to the evaluated candidate. `check-test` goes green in the
same act, and nothing else changes — `close-gate` is already passing and does not depend on it.

## Follow-ups filed rather than scope-crept

- **#1892** — unattributed `deno check` diagnostics dropped whenever any example has a classified
  failure; plus value owners still binding via `declare global`.
- **#1893** — `check:aspire-host-ports` passes on runtime literal service URLs its own S5 test rejects.

This lane does not merge. Everything it can do is done at `216d9ced4`.
