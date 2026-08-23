# Tier-A review — F8 bounded CDP waits (PR #1664, plan disposition)

- Reviewer: features topic supervisor (Tier-A), restored session, native Claude Opus 5
- Reviewed head: `20337441788b4e2341b0474d6297bec1ddd33b80`
- Baseline: `2385cdb72602c149c29cc637870ddca3db09e0cd`
- Worktree: `/home/codex/repos/netscript-007-features-1355`
- Role: reviewer/orchestrator. Not the author, not the formal evaluator. Nothing below is self-certified.

## Identity — verified, not accepted

| Check | Result |
| --- | --- |
| local `HEAD` | `20337441788b4e2341b0474d6297bec1ddd33b80` |
| `git ls-remote origin refs/heads/feat/app-service-client-wiring` | `20337441788b4e2341b0474d6297bec1ddd33b80` |
| PR #1664 `headRefOid` | `20337441788b4e2341b0474d6297bec1ddd33b80` |
| `git status --porcelain` | empty |
| PR state | OPEN, **draft**, `status:impl` |

Three-way identity holds. I re-derived each value rather than reading it from a prior artifact.

## Changeset — run-artifact-only, confirmed by measurement

`git diff --numstat 2385cdb72..20337441788` touches six paths, all under
`.llm/runs/feat-app-service-client-wiring--1355/`. A filter for `^(packages|plugins|docs)/` and
`deno.lock` returns **nothing**. No product, test, fixture, template, or lockfile byte has moved
since the baseline.

`leak-report.md` **does not appear in the numstat at all**. That is the strongest available proof
that the provenance correction in `4255a57b9` restored the author blob byte-identically: its net
diff against the baseline is not merely small, it is absent. The contamination I caused is closed
on the evidence, not on assertion.

## Reconciling the PLAN-EVAL `PASS` with attempt-6's 69/1/0

These two facts look opposed and are not. The reconciliation is the whole point of this review.

**The 69/1/0 is real.** I tallied `gate-end` records directly from the NDJSON:

- 69 total gates, **68 `passed`, 1 `failed`, 0 `skipped`**.
- The single red is `behavior.service-client-refetch`: `code 143` (128 + SIGTERM), `durationMs
  900030`, `timedOut: false`, `stdoutTail: ""`, `stderrTail: ""`.

`timedOut: false` alongside a 900,030 ms SIGTERM confirms the amendment's framing precisely — the
kill arrived at the **suite's outer command boundary**, not from the gate's own timeout. The gate
never got to decide it had failed.

**The ledger genuinely cannot attribute it.** I grepped the entire NDJSON for `cdp`, `websocket`,
`Page.enable`, `Network.enable`, `Fetch.enable`, `Runtime.evaluate`, `Page.navigate`, and
`continueResponse`. **Zero matches anywhere in the file.** There is no stage marker between the
child command start and the outer kill. The evidence cannot distinguish a socket that never opened
from a command whose response never returned.

**So the `PASS` does not rest on the runtime evidence, and does not pretend to.** The amendment
declines to classify the live refetch behavior as pass or fail, and bounds both primitives on
**code measurement** instead. That is the correct evidentiary posture: 68 green gates do not make
the 69th diagnosable, and the amendment does not borrow their credibility. The one red stays red
and stays unattributed.

## The two unbounded primitives — verified from source, not from the verdict

`packages/cli/e2e/src/application/gates/scaffold/service-client-browser-probe.ts` (605 lines). I
enumerated every async wait primitive rather than spot-checking the ones already named.

Only **three** `new Promise` sites exist in the file:

| Site | Bounded? | Basis |
| --- | --- | --- |
| `:79` `CdpClient.connect` | **NO** | Settled only by `socket.onopen` → resolve / `socket.onerror` → reject. A socket emitting neither is pending forever. **Real defect.** |
| `:93` `CdpClient.send` | **NO** | Returns a promise whose settlement lives only in `#pending`; only `#receive` resolves it, and only on a matching id. No timer exists. **Real defect.** |
| `:604` `delay` | YES | `setTimeout`. |

All three `while` loops (`:102` `waitFor`, `:467` `waitForCompletedStableBaseline`, `:551`
`waitUntil`) carry explicit elapsed-time bounds against `TIMEOUT_MS = 20_000`. Both `Promise.race`
sites (`:338` version probe, `:410` startup) race against a timer or `child.status`.

The amendment's identification is therefore **exactly right and exactly complete** for the
`new Promise` class. It is scope-disciplined, not plausibility-driven: two defects, both
independently reproducible without a browser.

I also confirmed the late-response safety property the contract depends on. `#receive` at `:124`
does `if (!pending) return;` before touching state — so once a timed-out send removes its id, a
late matching response is inert. The contract's requirement that a send timeout delete its id
*before* rejecting is achievable against the existing receive path.

## Path ceiling — sufficiency proven, not asserted

The plan permits exactly two paths. The live risk is that injecting a socket seam forces a third
(an export/barrel/`deno.json` edit). I checked, because `CdpClient` is **not exported** today —
`:62` is a bare `class CdpClient {`.

- `packages/cli/deno.json` `publish.exclude` contains **`e2e/`**, and `publish.include` does not
  reach it.
- `packages/cli/e2e/deno.json` is `@netscript/cli-e2e` with **`"publish": false`**.
- `packages/cli/e2e/mod.ts` (51 lines) does **not** re-export the probe module.

So a same-module export added for the test seam touches no publish surface, no package barrel, and
no JSR-visible API. The existing test file already imports seven internal seams from this exact
module by path. **The two-path ceiling is genuinely sufficient.** No third path is forced.

## Findings

**No blocking findings.** The amendment survives independent verification on every load-bearing
claim: the hashes match, the diff is clean, the tally is real, the unattributability is honest, the
two defects are the only unbounded promises, and the path ceiling holds.

**R1 — carried observation, not a blocker.** The PLAN-EVAL's wait matrix marks
`terminateBrowserProcess` (`:437-451`) as bounded. That is generous: `await child.status` (`:448`)
and `await drain` (`:449`) have no timer, so a browser that ignores SIGTERM would hang there. This
is **correctly out of F8's scope** — it is F6-owned contract code with passing tests, and it is
unreachable while `connect`/`send` hang first, since cleanup never runs. Bounding the CDP
primitives is the prerequisite that makes this path reachable at all. Widening F8 to cover it now
would be exactly the plausibility-driven scope creep this amendment earned its `PASS` by refusing.
Recorded so a later leaf can pick it up deliberately.

**R2 — honest limitation on provenance.** The verdict commit `20337441788` is one file, 174
insertions, subject naming the evaluator. But git `author` and `committer` are `Rickylabs
<eric.chautems@gmail.com>` for **every** agent in this repository. Git metadata therefore cannot
distinguish which agent signed it; provenance rests on the session records in `worklog.md`
(evaluator session `aed7b4ad-54d3-4cfb-b496-43c717a9b39d`). This does not weaken the verdict — the
one-file scope is consistent with the claim — but the record should not overstate what git proves.

**Scope of the `PASS` vs the reviewed head.** The evaluator judged `4255a57b9`; the current head is
`20337441788`. The only delta is the verdict file itself. The `PASS` therefore covers the current
plan content exactly, with no unreviewed drift.

## Disposition

**ACCEPT.** F8's plan is terminal and released for implementation, bounded to the two declared paths
and the deterministic 20-second connect/send contract.

This review authorizes **implementation only**. It does not grant runtime attempt 7, a lease,
readiness, merge, publish, relabelling, or any expensive gate. `scaffold.runtime` remains
prohibited for this leaf. All four quarantines, the six attempt histories, `f6-test.json`, and
`f7-test.json` remain append-only and untouched.
