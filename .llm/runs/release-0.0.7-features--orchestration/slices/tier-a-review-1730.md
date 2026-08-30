# Tier-A review — #1730 (provider-invisibility guard), content head `1baabbd6`

| Field | Value |
| --- | --- |
| Reviewer | features topic supervisor, native Claude Opus 5 · high |
| Author | Codex `gpt-5.6-sol` · high — S1 `01a052b7`, S2 `01a052e7`, S3/S4 successor thread |
| Head | `1baabbd678646eee2907c8c24fdee71df277a744`, local == `origin`, **clean** |
| Base | merge-base **`3e5cbabf`** = current `origin/main`; **0 behind** — converged at the plan's S4 convergence point |
| Review worktree | `ns1730-tiera`, detached — never the author's (D-19) |

## Scope — test-only, verified over the correct base

The leaf's delta over its **own base** touches **zero** product files outside `packages/ai/tests`:
`plan.md`, `research.md`, `supervisor.md`, `worklog.md`, `context-pack.md`, `drift.md` and
`packages/ai/tests/request_context_test.ts` (+80). `agent/loop.ts` and the bridge are untouched.
`deno.lock` **byte-unchanged**. No generated carrier moved (`git status` clean after every probe).

Measuring over the merge base rather than `origin/main..HEAD` matters: the naive diff showed 23 files,
all of which were **base motion** from `main` advancing, not leaf motion.

## The guard — broken twice by me, at both heads

I did not accept the author's demonstration. At the S2 head **and again at the final post-merge head**
I applied mutation B to `agent/loop.ts:159` (`system: \`${input.system ?? ''}${JSON.stringify(input.context ?? {})}\``):

| Probe | Result |
| --- | --- |
| Unmodified | **9 passed / 0 failed** |
| Mutation B | **RED — 8 passed / 1 failed**, the failing test being `agent loop: keeps context out of every provider-bound retry and continuation request` |
| After revert | **9 / 0**, `git status` clean |

**That is the defect #1730 exists to close.** Before this leaf, mutation B left 9/9 green — the loop
could serialize `RequestContext` into `system` and no test noticed. The guard asserts absence over a
`providerBoundPayload` of `messages`/`system`/`tools`/`options` minus `context`, across a provider
fixture that forces a **retry (429) → tool-call → continuation** sequence, so it covers the
continuation and retry turns the issue required rather than only the first.

## S3 — the overclaiming test, resolved by renaming

`never reaches the Anthropic provider wire request` could not detect mutation A, because the Anthropic
adapter drops unknown `modelOptions` keys itself — it passed whether or not the bridge leaked. It is
now `Anthropic adapter omits context from direct wire serialization`, with a comment stating the
boundary and naming the TanStack seam test that owns bridge/`modelOptions` leakage. That is the
brief's option (b), correctly executed: the name no longer promises coverage the test does not have.

## Receipts — and one defect I found and repaired

Seven receipts under **ignored** `.llm/tmp/gate-receipts/…`, deliberately: the plan lands the evidence
commit *first*, then cuts receipts at that immutable head, so no evidence commit can move the head out
from under them. That is a sounder design than the sibling leaf's, which had to stack evidence commits
and prove each one product-neutral.

All seven at `gitHead == actualGitHead == 1baabbd6`: `check` PASS · `lint` PASS · `fmt-check` PASS ·
`test` PASS · `quality-gate` PASS · `publish-dry-run` PASS · `doc-lint` **FAIL (base-red delta)**.

**AF-1 (found and repaired).** `publish-dry-run-final.json` recorded **`durationMs: 150`**. On the
sibling leaf the same task took ~28 s, so I timed it here: **40,318 ms**. A 150 ms receipt cannot be a
real workspace publish dry-run — its recorded output was a replay, not a fresh execution. This is the
same class as the defective receipt I shipped on #1731, caught this time by the rule that came out of
it: **verify `argv` and `durationMs`, never `exitCode` alone.** Re-cut at attempt 2 →
**30,719 ms**, exit 0, heads matching. The receipt path is gitignored, so the repair moved **no head**
and left the tree clean — verified before and after.

**`doc-lint` is a correctly contracted delta, not a pass.** Measured by me at both ends:
base `3e5cbabf` **total 20**, head `1baabbd6` **total 20** — **delta 0**. The plan contracted it as a
delta with the base number named, which is exactly the rule #1769 exists to generalise.

## Supplemental evidence added at the exact head

The plan's gate 7 (JSR audit, "no warning-count increase from 2") had no recorded exact-head artifact.
Run by me at `1baabbd6` and at base `3e5cbabf`:

- head: **2 findings** — `WARN F-DOCT-5 cardinality` (`src/ports` 13 > 12) and `WARN F-JSR-7 slow-types`
- base: **2 findings** — the same two, identical text

**No increase; both base-inherited.** They are the same class as #1768 (which records the equivalent
pair for `packages/sdk/src`), for `packages/ai/src/ports` instead. Not this leaf's, and not a blocker.

`packages/ai` suite: **147 passed / 0 failed**.

## Verdict

**`ACCEPTED`** at content head `1baabbd6`, with AF-1 repaired in place and no head movement.

The leaf does what #1730 contracts and nothing else: it converts a negative promise into an executable
guard, proves it by mutation at two heads, removes a test name that overclaimed, and adds no product
behaviour. Its receipt design is better than the sibling leaf's, and the one defective receipt was
caught by a rule this lane paid for on that sibling.

## Merge-bar work still outstanding — not Tier-A's to close

PR body is still partial (S3/S4 and 6 DoD unchecked, no acceptance map, no S4 phase comment); issue
#1730's five boxes are unchecked; **no separate-session IMPL-EVAL has run**; and draft CI reports
every matrix job **skipped**, which is **not** a pass. Those are the next steps, in that order.

---

# Tier-A cycle 2 — IMPL-EVAL `FAIL_FIX` repair at `1c836918`

Repair head **`1c836918`**, local == `origin`, clean. Evaluator verdict `6977debd` (evidence-only).

## F-1 closed — and I broke it myself, both ways

The fix captures `stream()`'s second argument (`async *stream(request, options)`), destructures out
`signal`, folds the remaining `ChatClientCallOptions` into the per-request projection, and pairs
request↔options by index. 498 LOC, under the F-10 ceiling of 500.

| Probe (mine, at `1c836918`) | Result |
| --- | --- |
| Unmodified | **9 / 0** |
| **Mutation B2** — `{ signal, modelOptions: { ctx: JSON.stringify(input.context) } }` at `loop.ts:165` | **RED, 8 / 1** |
| **Mutation B** — context appended to `system` | **RED, 8 / 1** (still fires) |
| After each revert | **9 / 0**, tree clean |

B2 left **all 147 tests green** before this repair. That is the finding closed, and it is the one my
own Tier-A missed after breaking the guard twice — the separate evaluator earned its place.

F-2 handled by comment, naming the incidental owner of the `modelId` path rather than silently
leaving it unguarded.

## F-3 / F-4 / F-6 — the receipt trail is now accurate

`worklog.md` now records that the `publish-dry-run` argv is the **workspace** `deno task
publish:dry-run`, not the planned package-cwd `deno publish --dry-run --allow-dirty`, and that
**attempt 2 at 30,719 ms** superseded a 150 ms value that "was a replay and is not" valid evidence.
The receipt audit table is in the worklog, so it no longer lives only in a partly stale PR comment.

Seven receipts re-cut at `1c836918`, all `gitHead == actualGitHead`: `check`, `lint`, `fmt-check`,
`test`, `quality-gate`, `publish-dry-run` **PASS**; `doc-lint` the contracted base-red delta.
`packages/ai` **147 / 147**; `deno.lock` unchanged; **zero** product outside `packages/ai/tests` over
the merge base.

## A correction to my own AF-1 rule — I nearly raised a false positive

`check-final.json` recorded **8,090 ms** where the prior head's receipt said 119,238 ms, and by the
rule I wrote after the 150 ms defect I flagged it. Measured before asserting:

| Where | Duration |
| --- | --- |
| author's worktree, fully warm | **89 ms** |
| the receipt's own run | 8,090 ms |
| my run, cold, in a fresh worktree | **117,649 ms** |

`deno task check` caches aggressively; `publish:dry-run` does not — which is exactly why re-running
*that* one still took ~30 s and proved 150 ms impossible. The receipt's own stdout shows the complete
work (`filesSelected: 2937, batches: 25, failedBatches: 0`).

**So the rule needs sharpening: a short duration is not itself evidence of a replay.** The test is
whether the gate *can* cache, and whether the receipt's own output shows the full work it claims. Left
as "check `argv` and `durationMs`", the rule generates false positives on cached gates — which would
train people to ignore it, the opposite of what it is for.

## Verdict — cycle 2

**`ACCEPTED`** at `1c836918`. All six actionable IMPL-EVAL findings are closed: F-1 and F-2 in the
test, F-3/F-4/F-6 in the durable trail, F-5 by the supervisor's Tier-A comment on PR #1763. F-7 is
informational.

Outstanding and not Tier-A's to close: a second separate-session IMPL-EVAL at this head (failure count
stands at **1 of 2**), then body/acceptance/ready/mirror and **real `SUCCESS` CI** — the draft matrix
currently reports every job `skipped`, which is not a pass.
