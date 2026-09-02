# MERGE PACKET — #1756 · immutable head `b607bfe260138df616f748973a8f213f5e3f4b7d`

Integrated onto `main` `0622dc432`; still **MERGEABLE / CLEAN** against current `main` `1201d6216`.
Closes #1533 · milestone 0.0.7 · `status:ready-merge` · `orchestrator:docs`.

**The `ci.yml` gate step is now committed source on this branch, not a carried patch.** That was the
last substantive blocker for this run.

## All CI green at this head

| Check | Result |
| --- | --- |
| **check-test** | **pass** (11m4s) — the plumbing assertion that was red for this entire run |
| **close-gate** | **pass** — 7/7 #1533 boxes mirrored |
| quality · code-quality · build | pass · pass · pass |
| classify changes · docs-site · Fresh UI · fresh-ui-quality | pass |
| core CI lane visibility | pass |
| review threads | PASS, 0 threads |
| `mergeable` | **MERGEABLE / CLEAN** |

Local at the same head: repo suite **4855 passed / 0 failed**; scanner suite **45 / 0**;
`docs:jsdoc-examples` exit 0 with `deferredCensus={"unboundName":116,"typeError":14}` against
ceilings `116`/`14` — both at exact census, zero slack, never raised.

## The credential note, because the instruction's form was not sufficient

`env -u GH_TOKEN -u GITHUB_TOKEN` alone still failed. `~/.gitconfig` configures a credential helper
that reads **`$HOME/.gh_token`**, a file holding the repo-only token — unsetting environment
variables does not touch it. Confirmed by scope, without printing either token:

```
~/.gh_token           -> x-oauth-scopes: repo
stored gh credential  -> x-oauth-scopes: gist, read:org, repo, workflow
```

Adding the gh helper was also not enough, because git tries helpers in order and the global one won.
The working form clears the list first, per-invocation, mutating no file:

```bash
env -u GH_TOKEN -u GITHUB_TOKEN git \
  -c credential.helper= \
  -c credential.helper='!gh auth git-credential' \
  push …
```

Worth recording for the next lane that hits this.

## Integration — one conflict, and a check that it did not eat the branch's work

Twelve commits replayed onto `0622dc432`. One conflict: `agent-tools.generated.ts`, resolved to
main's copy and then **regenerated** rather than hand-merged, since `check:assets-barrel` is a
regenerate-then-assert-empty-diff gate.

Rather than assume the rebase was faithful, I compared the branch's own edit **per file** across both
bases. Identical everywhere except:

- the two new artifacts (`impl-eval-cycle-3.md`, `workflow-step.patch`);
- the regenerated barrel;
- `scan-code-quality.ts` / `_test.ts` — where **main itself added 124 lines**. My
  `templateInteriorLines` fix survived intact, and the scanner suite went 44 → **45/0** because main
  added a test.

Union assertions vs the new base: zero tasks lost, zero gate ids lost, zero `ci.yml` steps lost,
`ci.yml` delta exactly **+8/−0**.

## Cycle-3 (OpenHands) FAIL_FIX — all four repairs discharged

| | Repair | Status |
| --- | --- | --- |
| R1 | land the `--gate jsdoc-example-compile` step in the `quality` job | **done** — committed source, +8/−0, correct placement and `RUN_DENO` guard |
| R2 | flip the plumbing test green | **done** — `docs:jsdoc-examples:test` 1/1; `check-test` green |
| R3 | deliver or drop the promised patch artifact | **done** — carried at `.llm/runs/test-jsdoc-example-compile-gate--1533/workflow-step.patch` |
| R4 | fix close-gate bookkeeping | **done** — stale duplicate block neutralised; one block, seven boxes, zero duplicates |

## Verdict history — every one against a named head

| Cycle | Head | Verdict |
| --- | --- | --- |
| IMPL-EVAL 1 | `239f4b53d` | FAIL_FIX — F1 revert of #1740 in four stream factories; F2 shim laundering. Both fixed. |
| IMPL-EVAL 2 | `889e676a5` | **PASS** — reproduced the laundering; audited the 47-file blast radius for a seventh revert (none). |
| Bounded delta | `9372a27e1` | **PASS** — ceiling + `ci.yml`; proved the tightening bites and the failing receipt. |
| IMPL-EVAL 3 (OpenHands) | `6a51cfe4c` | FAIL_FIX — four repairs, all discharged above. |
| Bounded delta (final) | `b607bfe26` | **in flight** — scoped to the wiring, the rebase's fidelity, barrel honesty, census, and whether box 5 is now true. Verdict appended when it returns. |

## One staleness I introduced and removed

Box 5's evidence carried a "CARRIED, NOT YET ON THE HEAD" caveat, true when written and false once
the patch landed. Refreshed to describe the committed step. A caveat that outlives its condition is
just a wrong claim.

## Follow-ups filed rather than scope-crept

- **#1892** — unattributed `deno check` diagnostics dropped whenever any example has a classified
  failure; plus value owners still binding via `declare global`.
- **#1893** — `check:aspire-host-ports` passes on runtime literal service URLs its own S5 test rejects.

This lane does not merge.
