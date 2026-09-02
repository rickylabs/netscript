# Merge packets — features lane, handed to the primary coordinator

**This lane does not merge.** These are exact coordinates and truthful gate state for the coordinator
to act on. Verified live against GitHub and git at the time of writing, not carried from memory.

---

## PR #1805 — `#1591` — **SHIPPED** as `main` `dea44991120a2c5da96a89df0f68d69c455c035e`

Landed after the current-main seam correction. `status:shipped`. The `status:augment-review` park that
held it was proven to be stale metadata (no reviews, no `augmentcode[bot]` check-run, no trigger
comment; on control PR #1747 the bot's review predated the label by ~11 h).

---

## PR #1810 — `#1458` — **SHIPPED** as `main` `eaea940bea4c19593b97b9895b09f512039f4e13**

_(packet retained below for the record)_

## PR #1810 — as surfaced

| | |
| --- | --- |
| **Head** | `3a1b2fa8df55c7958d678ac6fc3d7c012e249bf2` |
| Merge-ref first parent | **`dea44991`** = current `main` — its CI describes the *current* merge snapshot |
| Draft / labels | non-draft · exactly one `status:ready-merge` · issue #1458 also `status:ready-merge` |
| Closing keyword | `Fixes #1458`, live |
| IMPL-EVAL | **`OPENHANDS_VERDICT: PASS`** at `520573e1f` / evidence `96f9cea99` (comment `5473613425`) |
| Carry-forward | `0b60ee766` is a git **ancestor**; both product blobs identical (`06a7ea26…`, `ba2172c0…`); `evaluate.md` preserved byte-for-byte (`5b7d1181…`) |
| CI | **all green** — `close-gate` · `check-test` · `quality` · `code-quality` · `build` · `classify` |
| Review threads | **PASS** — 0 threads, 0 unanswered |

Do not churn the head. Obsolete run `33356348595` was cancelled by the coordinator; exact-head run
`33356709627` is the live one and is now fully green.

**Ready to merge.** Nothing outstanding on this lane's side.

---

## PR #1820 — `#1452` Slice 1, `createLazyKv` (**partial**) — green, but needs the seam behind #1810

| | |
| --- | --- |
| Head | `3130fb52bd76b52b38ce2c41072a1bbe6cb68ee6` |
| Mergeable | **MERGEABLE / CLEAN**, non-draft, one `status:ready-merge` |
| Closing keyword | **none, deliberate** — `Refs #1452`; `closingIssuesReferences` empty. Merging must **not** close #1452 |
| IMPL-EVAL | **`OPENHANDS_VERDICT: PASS`** at `3130fb52b`, base `0274c0a7` (comment `5473634548`) |
| CI | **all green** — `check-test`, `quality`, `code-quality`, `close-gate`, `build` |
| Review threads | **PASS** — 0 threads, 0 unanswered |
| Head (after harness-truth correction) | `7bd87da5cd533040c484feec3f00c003c5239562` |
| `scaffold.runtime` | **PASS** — run `33357314826` at head `7bd87da5c`: `scaffold-runtime (aspire + docker + postgres)` **success**, `scaffold-runtime-sqlite (aspire + sqlite + garnet)` **success**, `scaffold-static (deno-only)` **success**. Opted in via `e2e-cli-gate`; before that every scaffold lane reported `skipping`, so this is the first runtime evidence this leaf has ever carried. |
| Harness truth | corrected at the final head; product blobs proven byte-identical to the evaluated head (14/14), `git diff 3130fb52b..HEAD` is exactly the two harness files |

**Prepared, deliberately not executed:** converge onto the post-#1810 `main` in one pass, with the same
ancestry + byte proof used for #1805 and #1810, then fresh current-main CI. Held so the seam is taken
once, after #1810 lands, rather than twice.

Evaluator's deferred finding 2 (`SharedKvConfig` only implicitly exported; `createLazyKv` absent from
the kv reference page) is folded to Slice 2 / the docs sweep, as it recommends.

---

## PR #1814 — `#1592` Slice 1 (**partial**) — **NOT merge-ready; bounded repair in flight**

`quality` fails at `Publish dry-run` with **3x `TS2345`**. Proven slice-caused: `main`'s `ci.yml` is
green at `7908399af`, `584caa03f`, and `0274c0a70`, and that job runs `publish:dry-run` on every push.

**Root cause — not what the error text suggests.** `packages/plugin-workers-core` carries **four**
hand-maintained declarations of the execution-record shape. The slice updated two:

| Declaration | Progress fields |
| --- | --- |
| `src/domain/job-definition.ts` (zod `ExecutionRecordSchema` + TS mirror) | updated |
| `src/state/execution-state.ts:35` | updated |
| `src/runtime/runtime-types.ts:129` | **stale — 0 occurrences** |
| `src/registry/registry-types.ts:119` | **stale — 0 occurrences** |

`ExecutionRecordSchema` feeds the **public v1 contract** via `workers.contract-definition.ts:197`, so
v1 output now requires the fields — but the workers routers import `ExecutionRecord` from
`@netscript/plugin-workers-core/runtime`, the *stale* copy, and spread it into the response.
`execution-state.ts:33-35` states the very invariant that broke: *"A fixed, fully-enumerated shape
keeps spreads precise so the connector handlers type-check against the contract."*

Repair dispatched (Codex `gpt-5.6-sol · high`, thread `01a0560f-2014-7d62-8007-37c5fb55ef5a`,
confirmed live): add the two nullable fields to the two stale declarations. Two files, no
`plugins/**` change, and the v1 contract shape is **not** weakened. Fresh gates + eval follow.

**Standing debt:** four duplicate hand-maintained declarations of one record shape is the defect
class; this repair restores consistency but does not remove the duplication.


---

## #1814 repair — cycle 1 stopped correctly at the ceiling; ceiling widened to 4 files

The implementer applied both declaration fixes and **refused to absorb the rescope**, exactly as the
brief required. Result: the original `runs.ts:20` and `tasks.ts:86` diagnostics are **gone**, and two
sites remain — proving the record shape is hand-maintained in **six** places, not four:

| Remaining | Diagnostic |
| --- | --- |
| `packages/plugin-workers-core/src/testing/job-fixtures.ts:97` | `TS2322` — fixture can yield `progressPercent` as `number \| null \| undefined`; the record requires `number \| null` |
| `plugins/workers/services/src/routers/runs.ts:79` | `TS2345` — `batchQueryExecutions` hand-enumerates its own local result type instead of spreading, so it still omits both fields |

**Rescope decision (mine, recorded rather than silently taken):** widen to four files and **keep the
fields required-nullable**. The alternative — making them `.optional()` on `ExecutionRecordSchema` —
is smaller but silently weakens a v1 contract shape that Tier-A and IMPL-EVAL already accepted, and
abandons the uniform "every execution reports progress, `null` when absent" guarantee. If the
coordinator prefers the smaller non-breaking option, say so and I will switch; it is a one-line change
in the opposite direction.

**Standing debt, unaddressed by this repair:** six hand-maintained declarations of one record shape.
The repair restores consistency; it does not remove the duplication, and the next field added to an
execution record will break the same way.


---

## #1820 — final seam taken; immutable head `b87fd92faf86bb2a616effc6c340568f7ddeaf96`

The evidence-only push made the branch `CONFLICTING/DIRTY` against the advanced `main` — and that is
also **why no CI ran on it**: GitHub could not compute a merge ref, so the `pull_request` workflow had
nothing to check out. Only the OpenHands push runner fired. Diagnosed and integrated in one pass.

| Proof | Result |
| --- | --- |
| Conflict set | exactly one file — `export-surface-corpus.generated.ts`, a generated carrier |
| Resolution | took `main`'s carrier, then **regenerated from tooling**; never hand-edited |
| Carrier currency | `check:mcp-export-corpus` exit 0 · `check:assets-barrel` exit 0 |
| Six hand-written product blobs | **byte-identical** to evaluated head `3130fb52b` (`cb729fa8…`, `b16f23f7…`, `755881c3…`, `592f9146…`, `e427a76c…`, `67df918b…`) |
| Seventh blob | the corpus, regenerated `1dd90409… → 6e84e995…`. It *was* the conflict and `main`'s inputs moved — identity cannot hold for a derivative, and asserting it would be false |
| Product diff vs current `main` | exactly the seven files |
| **Merge-ref first parent** | **`eaea940be` = current `main`** — the requirement that failed before is now met |
| Mergeable | **MERGEABLE** (BLOCKED only on running checks) |
| `deno.lock` | byte-identical `edfa0c24…` |

Gates re-cut at the seam `8ab11ddee`: scoped check 303-byte, lint 352-byte, fmt-check 301-byte, kv
tests 289-byte, `assets-barrel` exit 0, `docs:exports-drift` PASS. Fresh core CI **and** `e2e-cli`
(scaffold runtime) now running against the current-main snapshot; `build`, `close-gate`, and
`code-quality` already pass.

`Refs #1452` partial semantics preserved — `closingIssuesReferences` empty.

---

## Lane state after #1820 merged — 2026-08-31 ~05:15Z

**Shipped from this lane this session:** #1805/#1591, #1810/#1458, #1820/#1452 (partial — **#1452
correctly stayed open**, `closingIssuesReferences` empty at merge).

### PR #1814 — `#1592` Slice 1 (**partial**) — evidence banked, holding for #1829

Held deliberately: rather than chase `main` (which moved four times during this leaf's recovery —
`0e93a6c` → `26e1b486` → `052f8659`), the evaluator and product evidence is **banked** at the current
head and one convergence will be taken onto the complete feature/fix base after #1829 merges.
Carriers only will be regenerated; no product history churn.

| | |
| --- | --- |
| Evidence head | `5a3f593e47f7e44602abae2d5816f71af32aa178` |
| Final seam so far | `693b62474` on `main` `26e1b486` |
| Mergeable | MERGEABLE |
| Closing keyword | **none** — `closingIssuesReferences` verified **empty** |
| 10 hand-written blobs | byte-identical to the FAIL_FIX-evaluated head `1baf61f0a3` |
| Gates at seam | check/lint/fmt/test/`quality:gate`/`publish-dry-run` all PASS, `gitHead == actualGitHead` |
| CI | `build`, `code-quality`, `quality` pass; `check-test` running; `close-gate` fails **correctly** while the IMPL-EVAL DoD box is honestly unticked |

### The IMPL-EVAL FAIL_FIX was this supervisor's defect, and it was correct

`1baf61f0a3` → `FAIL_FIX` on one finding: the PR body's own **negated** sentence placed a GitHub
closing keyword immediately before the issue number, registering a live closing reference. Merging
would have closed #1592 with its Slice 2 scope unimplemented — the precise outcome the sentence was
written to prevent — while the body simultaneously claimed the references were empty.

**The same defect existed in #1820, also written by this lane.** Both are fixed and verified empty via
the API. A first correction attempt on #1814 re-armed the matcher by quoting the offending phrase
verbatim; caught on a residual-token scan before it settled.

**Lesson:** never place `close`/`fixes`/`resolves` adjacent to an issue number in a partial PR — not
in a negation, not in a quotation, not in an explanation of this very bug. Phrase it as
"merging leaves #N open".

### A receipt trap that nearly cost a valid gate

The `publish-dry-run` receipt reads `stdout.bytes = 0` — identical to the D-1 cache-replay signature —
and was very nearly discarded as fake. It is genuine: **`publish:dry-run` writes to stderr**
(356,732 bytes, ending `Success Dry run complete`), and the known-good #1387 receipt has the same
zero-stdout shape. D-1's "always check `stdout.bytes`" is necessary but **not sufficient**: for this
gate the live channel is stderr.

---

# Two exact-green merge candidates — 2026-08-31 ~06:45Z

## PR #1814 — `#1592` Slice 1 (**partial**)

| | |
| --- | --- |
| **Merge head** | `0dc5ef539360fa4fdb695fa99351593af6e53041` |
| Mergeable | **MERGEABLE / CLEAN** |
| CI | `close-gate` · `check-test` · `quality` · `code-quality` · `build` — **all pass** |
| IMPL-EVAL | **`VERDICT: PASS`** (comment `5474439540`) — all four prior FAIL_FIX findings re-verified resolved, byte-identity re-derived by the evaluator rather than accepted |
| Status label | exactly one — `status:ready-merge` |
| Closing keyword | **none, deliberate** — `closes=[]`; merging leaves #1592 open |
| Review threads | 0 / 0 unanswered |

Carry proven file-by-file: 10/10 evaluator-judged blobs identical; every other product file in the
interval byte-identical to `main`'s own content; the two differing carriers shown to be `main`'s
version from the converged base and never leaf-authored (`merge-tree` clean).

## PR #1834 — `#1349` Slice 1 of 3 (**partial**, epic #1348)

| | |
| --- | --- |
| **Merge head** | `903cd520eda8fcd925c4b5cd8f56e4bb018feeea` |
| Mergeable | **MERGEABLE / CLEAN** |
| CI | `close-gate` · `check-test` · `quality` · `code-quality` · `build` — **all pass** |
| IMPL-EVAL | **`OPENHANDS_VERDICT: PASS`** (comment `5474713374`), no blocking findings |
| PLAN-EVAL | cycle 2 **PASS** after a cycle-1 `FAIL_PLAN` that caught the plan never opening RFC 0001 or its committed fixture |
| Status label | exactly one — `status:ready-merge` |
| Closing keyword | **none, deliberate** — `Refs #1349`, `closes=[]` |
| Review threads | 0 / 0 unanswered |

**Its close-gate needed a structural fix, not a tick.** The Definition of Done listed only
*future-slice* items ("Slices 2–3 land…", "Supervisor completes readiness…"), which a partial slice
can never satisfy — the gate was permanently unsatisfiable. Epic-level items moved to a **Deferred to
Slices 2–3** section and a real Slice-1 DoD written (LD-1…LD-7, `TError` slot, 16/17 arity law,
fixture migration, compatibility defaults, gate set). Nothing was ticked that was not true.

This lands the `#1348` epic's structural entry point, which #1352/#1353/#1467 were blocked behind.

---

## Still open, one external blocker each

| PR | Blocked on |
| --- | --- |
| **#1762** | **#1828** (`deno.unstable` lib parity) — `MERGEABLE/CLEAN` and close to landing. #1762 then needs only a `check-test` re-run plus its queued hosted `scaffold.runtime`; **no product change**. |
| **#1664** | `behavior.service-client-refetch`. Now **71/72** runtime gates green after the `--client` repair. The remaining failure is attempt 7's original red, reproduced on **current `main`** rather than the 53-commit-stale base — so D-22's "untestable" objection is retired and the defect is real. Needs a bounded investigation of the optimistic `onSettled`/rollback path: new product work, not integration repair. |

---

## Reconciliation against main `b66e52cbc` (#1860, Docs) — measured 2026-09-01

`#1860` = `docs(plugins): remove fabricated /scaffolding sub-path` — docs prose **plus four
generated carriers**. Overlap measured per leaf against its own merge-base, not assumed:

| Leaf | Files | Overlap with `#1860` |
| --- | --- | --- |
| **#1848** `e820f7b29` | 18 | `packages/cli/src/kernel/assets/agent-docs.generated.ts` — **carrier only** |
| **#1842** `e84f6fb41` | 14 | none |
| **#1864** `63e8ab4f5` | 26 | none |
| **#1861** `ebf8f9ad0` | 8 | none |

**No product overlap anywhere.** Per the coordinator's standing rule, no already-valid product work
is restarted.

### #1848 — rehearsed, not guessed

Synthetic `merge-tree` is clean (`abe0c347e`). Because a generated carrier that merges *textually*
is not thereby *canonical*, the merge was rehearsed in a throwaway worktree and the full cascade
(`gen:agent-docs-prose` → `assets-barrel` → `mcp-export-corpus` → `publish-assets`) run on the
result. The agent-docs carrier came back **byte-clean** — the textual merge already equals
regeneration, so #1848 needs no carrier repair for it. Both scratch worktrees were removed.

### Finding — #1848 publishes an export subpath that no gate polices

Regeneration on the merged tree leaves `export-surface-corpus.generated.ts` dirty. A/B against
**clean main** proves the split:

| | subpaths | symbols |
| --- | --- | --- |
| clean `b66e52cbc` regenerated | 271 | 7782 |
| #1848 merged, regenerated | **272** | **7789** |

Main is stale on its own (that is #1859/#1862's fix, not chargeable here) **and** #1848 adds
**+1 subpath / +7 symbols** of its own via `./navigation`. #1848 never regenerated the corpus, and
`check:mcp-export-corpus` is **absent from its CI job list** (trap 6 — it is not in the shared
catalog). So merging #1848 as-is silently re-creates the staleness class that #1857 exists to close.
#1848 must carry its own corpus regeneration at the final seam.

### Ordering consequence for the coordinator

`#1862` (corpus fix) must land first; then **#1842 and #1848 each regenerate the corpus**, so they
collide with each other and cannot be reconciled in parallel. Sequence: `#1862` → one of
{`#1842`, `#1848`} → the other regenerates on top. Merge order is the coordinator's call.

---

## Evaluator-evidence audit — all five active leaves, 2026-09-01

Per the coordinator's control-plane warning, `status:impl-eval` was treated as **claim, not
evidence**. Each leaf was checked for a real runner session **and** a genuine verdict artifact.

### How to tell a genuine verdict from a prompt (this filter has misled twice)

Verdict comments and dispatch prompts share the **same author** (`rickylabs` — the runner posts under
the repo-owner token), and prompts quote `OPENHANDS_VERDICT` verbatim. Author filtering does not
work. Discriminate by **body shape**:

| Shape | Meaning |
| --- | --- |
| opens `@openhands-agent model=…` | dispatch **prompt**, not a verdict |
| contains `<!-- openhands-agent-summary -->` + `openhands-run: {"run_id":…}` | genuine agent summary |
| opens `OPENHANDS_VERDICT: <V>` with base/head attestation | genuine **verdict** |

### Findings

| Leaf | Label claimed | Reality found | Action |
| --- | --- | --- | --- |
| **#1848** | `status:impl` | real eval live (`33477762017`, `issue_comment`) | none |
| **#1842** | `status:impl` | none, correctly — held for #1862 | none |
| **#1864** | `status:impl-eval` | real eval live, **plus a duplicate** | deduped |
| **#1861** | `status:impl-eval` | real eval live, **plus a duplicate** | deduped |
| **#1664** | `status:impl-eval` | **phantom** — newest genuine verdict is `FAIL_FIX` at **`3e7a0e2e5`**, three repair slices stale; current head `377811da8` never evaluated | fresh eval dispatched |

### The automation gap, stated precisely

`ready_for_review` fires the runner with `authorize: skipped` / `agent: skipped` — a **2-second
no-op** (`33478760878`, `33478763335`) — while the label still advances to `status:impl-eval`. A
separate automation comment *does* spawn a real `issue_comment` run, so evaluation is not always
absent; what is unreliable is the **coupling**. The label can lead, lag, or outlive the evidence, as
#1664 shows: it kept `status:impl-eval` across three repair slices with no evaluator at the new head.

**Rule adopted:** never infer evaluation from the label. Require a live runner session **or** a
shape-verified verdict comment **pinned to the current head**. Before manually dispatching, list
existing runner runs for the PR — my #1864/#1861 dispatches raced automation comments already in
flight and created duplicates (`33478766019`, `33478767799`, cancelled; head-pinned briefs kept).

**Second duplication mechanism, measured separately:** a *single* dispatch comment can spawn **two**
runner runs ~20 s apart (#1664 comment `06:50:03` → `33479325247` at `06:50:06` **and**
`33479351700` at `06:50:26`). So duplicates arise both from racing automation *and* from one comment
alone. **Always re-list runner runs ~60 s after dispatching and cancel all but one.**

---

## Ownership-label reconciliation, 2026-09-01

All open PRs enumerated and keyed by `orchestrator:*`. **All five Features leaves already carry
`orchestrator:features`** and are complete on every taxonomy axis (`type:`/`area:`/`priority:`/
`wave:` + milestone `0.0.7`): #1664, #1842, #1861, #1864, #1848. No lifecycle status was touched.

One accuracy repair: **#1848 gained `area:cli`** — it changes hand-written
`packages/cli/.../netscript-web-runtime-closure.ts`, not just `packages/fresh`, so an `area:cli`-keyed
audit would have missed it.

**Outside this lane — flagged, not claimed:** PR **#1856** (`fix/fresh-form-navigation-drop`,
`Closes #1609`) is the **only** open PR in the repository with **no `orchestrator:` label at all**. It
is **not** Features': #1609 is labelled `orchestrator:fixes`. It also carries **no milestone and no
labels whatsoever**, so it is invisible to every keyed audit including its own lane's. Reported to the
coordinator rather than labelled here — mislabelling it into Features would corrupt the ownership
signal the audit depends on.

---

## Evaluator verdicts landed, 2026-09-01

| Leaf | Head | Verdict | Note |
| --- | --- | --- | --- |
| **#1848** | `e820f7b29` | **PASS** | fresh verdict; both prior `FAIL_FIX` HIGHs verified closed |
| **#1664** | `377811da8` | **PASS** | supersedes `FAIL_FIX` at `3e7a0e2e5`; `--client` repair confirmed *by design*, gate diff is exactly `+ '--client', 'users'` — **no gate reordering** |
| #1861 | `ebf8f9ad0` | running | exact CI green |
| #1864 | `1b5ef859e` | running | product findings survive convergence (byte-identical) |

### Audit mechanic — the summary comment is created at dispatch and updated in place

`created_at` on an `<!-- openhands-agent-summary -->` comment is **dispatch time, not verdict time**;
the body is rewritten when the run completes. #1848's summary reads `created_at 06:29:05` while its
substantive verdict comment is `06:56:13`. Judging elapsed evaluation time from the summary's
`created_at` makes a 27-minute evaluation look like a 24-second one — i.e. like a rubber stamp. Read
the linked verdict comment, or the run's own completion time.

### #1864 convergence onto `8e01a347a`

Three-carrier conflict (`prose.json.gz`, `provenance.json`, `agent-docs.generated.ts`) — `prose.json.gz`
is **binary and cannot be hand-merged at all**. Resolved by taking main's version and regenerating;
gates green before commit. All **7** Slice P product files verified byte-identical to `1b5ef859e`
through the merge, so no completed evaluation is restarted. Head `ee841c158`.

### #1864 — the carrier cascade takes two rounds, and CI only shows one at a time

The `quality` job runs carrier gates **sequentially and fails fast**, so each round exposes exactly
one stale carrier. Two rounds were needed:

| Round | Head | Failing gate | Cause |
| --- | --- | --- | --- |
| 1 | `63e8ab4f5` | `check:agent-docs-prose` | Slice P source feeds the prose corpus; never regenerated |
| 2 | `ee841c158` | `check:publish-assets` | `publish-assets.generated.ts` **embeds** the corpus, so regenerating prose staled it downstream |

Green at **`b1422d6b0`**: `check:agent-docs-prose` 0, `check:assets-barrel` 0, `check:publish-assets` 0.
**Lesson: after regenerating prose, run the whole downstream cascade locally rather than the one gate
CI happens to be showing** — `prose → assets-barrel → publish-assets`. `mcp-export-corpus` is
deliberately excluded: its staleness is main-side and belongs to #1862.

**Product attribution at the converged head.** Seven non-generated product files differ from the
evaluated `1b5ef859e`, and **all seven are main's own** (each has a non-empty diff in
`78be0e032..8e01a347a`): `packages/ai/*` ×3, `packages/cli/.../import-resolver*` ×2,
`packages/fresh-ui/deno.lock`, `packages/fresh/deno.json`. Slice P's own **7 files are byte-identical**
to the evaluated head, so the running evaluation is not restarted.

---

## MERGE PACKETS — #1861 and #1864, verified 2026-09-01

Both are **`status:ready-merge`**, independently evaluated PASS, and **file-disjoint from each other
and from the #1862→#1848→#1842 chain**. Neither needs #1862.

| | **#1861** | **#1864** |
| --- | --- | --- |
| Issue | #1451 Slice C (JobConfig schema) | #1592 Slice P (progress transport) |
| Exact head | `ebf8f9ad0` | `b1422d6b0` |
| IMPL-EVAL | **PASS** (`5490251080`, 07:09:53) | **PASS** (07:12:57) |
| Failing checks | **0** | **0** |
| Mergeable | `MERGEABLE/CLEAN` | `MERGEABLE/CLEAN` |
| Synthetic merge vs `d2b33a09b` | **CLEAN** | **CLEAN** |
| `closingIssuesReferences` | **0** — merging leaves #1451 open | **0** — merging leaves #1592 open |
| Milestone | 0.0.7 | 0.0.7 |

#1864 carries a two-round carrier repair on top of the evaluated `63e8ab4f5`; its **7 product files
are byte-identical** to the evaluated head, so the PASS stands at `b1422d6b0`.

## Evaluator time-bound: #1861's run delivered, so no second evaluator was launched

The coordinator's 15-minute bound was real — run `33478869259` ran **06:43:51 → 07:12:14 (~28 min)**.
But it **completed `success` with a genuine verdict**: comment `5490251080` at 07:09:53, 4,614 chars,
`[PHASE: IMPL-EVAL] [VERDICT: PASS]` pinned to head `ebf8f9ad0`, verifying `int().nonnegative()` with
`maxConcurrency: 0` pinned by test and defaults byte-equal to the pre-existing runtime fallbacks.

Launching the direct OpenRouter evaluator would have **re-evaluated an already-evaluated leaf**, so it
was not launched. This is a completed evaluation, not a stalled one. A second opinion remains
available on request — that is a different purpose from recovering a missing verdict.

**Corollary:** a long OpenHands run is not evidence of a stall. Genuine IMPL-EVALs in this lane have
run 26–28 minutes (#1848: 27 min; #1861: 28 min). Judge liveness by **run status**, never by elapsed
time or by the summary comment's `created_at` (which is dispatch time).

## Main `d2b33a09b` (#1640, RFC 0006 accepted; Prisma deferred)

**0 carriers, 0 product files** across 44 changed paths — docs/RFC only. Overlap with every active
leaf: **none**. No leaf is re-converged for it; re-running CI would prove nothing. Recorded as the
convergence target for the next real seam.

---

## Correction — the corpus ordering claim was wrong (2026-09-01)

I wrote, in `d5e2a68c5` and in reports, that #1848's `+1 subpath / +7 symbols` was "recorded for the
corpus refresh to pick up" by #1862. **That is not possible.** #1862's head `5917c2b36` does not
contain the `@netscript/fresh/navigation` surface, so it cannot generate a corpus entry for an
entrypoint that is not yet on its base. A PR cannot pick up an unmerged surface.

Measured at `d38158176`: committed corpus `271 / 7782` (pre-navigation), `check:mcp-export-corpus`
**exit 1**, attributable to this PR.

**Correct order, now enforced by `/home/agent/observability/seam-1848.sh`, which aborts if #1862 is
not an ancestor of main:**

1. #1862 merges (Internals).
2. #1848 rebases onto that merge.
3. The **combined** corpus + carriers regenerate in #1848 — one regeneration containing both #1862's
   main-side refresh and this leaf's navigation entrypoint.
4. Focused delta eval + current CI.
5. Packet.

**Consequence for #1842:** it is stacked on #1848 and already regenerated a corpus to `272 / 7790`.
That regeneration is likewise ahead of #1862 and must be redone after #1848's post-#1862 rebase. Its
CI *does* gate `check:mcp-export-corpus` (#1848's does not), which is why it regenerated at all — but
the ordering is the same, so it re-stacks on the corrected #1848 head rather than merging first.

**Generalisation worth keeping:** "a later carrier PR will absorb my delta" is only true when that PR's
base already contains the surface producing the delta. Check ancestry before making that claim; the
convenient assumption is the one that fails silently at merge.

---

## MERGE PACKET — #1848 (#1590 Slice 1), head `53398a818`

| Field | Value |
| --- | --- |
| Exact head | **`53398a818`** |
| CI | **5/5 SUCCESS** — check-test, quality, close-gate, build, code-quality |
| Mergeable | `MERGEABLE/CLEAN`, non-draft |
| Review threads | **0 threads, 0 unanswered** (`review-threads PASS`) |
| Milestone | 0.0.7 |
| `closingIssuesReferences` | **0** — merging leaves #1590 open; Slice 2 owns the hosted A→B→A browser proof |
| Labels | `orchestrator:features`, `type:fix`, `area:cli`, `area:fresh`, `priority:p1`, `wave:v1` |

**IMPL-EVAL: PASS at `e820f7b29`, carried by byte-identity.** Every source file this leaf authored is
byte-identical between the evaluated head and `53398a818` — the six navigation modules, the type
fixture, and `netscript-web-runtime-closure.ts`. **Zero source code changed since the verdict.** Only
`README.md` (audit-mandated paragraph move) and `deno.json` (main's `@tanstack/ai` bumps arriving
through the merge, `./navigation` intact) differ.

**Corpus, in the corrected order.** #1862 merged first (`82a2527e2`), then this leaf regenerated:
`271/7782 -> 272/7789`. The `+1 subpath / +7 symbols` is `./navigation`'s public surface exactly —
2 values, 5 types — matching the reference page. `check:mcp-export-corpus` **0**, previously red.

**One open item, stated rather than glossed:** the bounded delta evaluation (run `33534554636`) is
in flight. It verifies the byte-identity carry claim first and judges only the four deltas (corpus,
reference page, README move, drift-checker count). The packet is complete on every other axis; the
label flips to `status:ready-merge` on its PASS.

---

## MERGE PACKET — #1842 (#1452 Slice 2), head `826ad4946`

| Field | Value |
| --- | --- |
| Exact head | **`826ad4946`** |
| CI | **5/5 SUCCESS** — check-test, quality, close-gate, build, code-quality |
| Mergeable | `MERGEABLE/CLEAN`, non-draft |
| Review threads | **0 / 0 unanswered** |
| Milestone | 0.0.7 |
| `closingIssuesReferences` | **0** — merging leaves #1452 open |
| Labels | `orchestrator:features`, `type:feat`, `area:cli`, `area:plugins`, `priority:p2`, `wave:v1`, `status:ready-merge` |

**IMPL-EVAL PASS at `a203a52f3`**, carried by byte identity: all **5** product files in that head's
touch set are byte-identical at `826ad4946`. Note the evaluated head is `a203a52f3`, **not** `e84f6fb41`
— an earlier packet draft compared against the wrong baseline; the carry proof above uses the head the
verdict actually cites.

**Corpus, in the corrected order.** Re-stacked onto merged main `102ef8a10` after #1848 shipped. Six
carrier conflicts resolved by taking main's and regenerating. Corpus `272/7789 -> 272/7790`: the `+1`
is this leaf's own structural service-context surface, while `./navigation`'s `+1/+7` now arrives from
main via #1848 rather than being carried here.

Design constraint held: **no concrete `@netscript/plugin` -> `@netscript/kv` dependency**. The factory
stays structural/injected over caller-supplied async resolvers, per the owner ruling.

---

## MERGE PACKET — #1842 (#1452 Slice 2), head `d1697421c` — 2026-09-02

| Field | Value |
| --- | --- |
| Exact head | **`d1697421c`** |
| Base integrated | `main` **`77ad823dc`** (#1910, #1911, #1889, #1756) |
| Mergeable | `MERGEABLE`, non-draft |
| Milestone | 0.0.7 |
| `closingIssuesReferences` | **0** — merging leaves #1452 open |
| Labels | `orchestrator:features`, `type:feat`, `area:cli`, `area:plugins`, `priority:p2`, `wave:v1`, `e2e-cli-gate`, `status:impl` |

### Gates at the exact head

| Gate | Result |
| --- | --- |
| `check-test` | **SUCCESS** |
| `quality` | **SUCCESS** |
| `code-quality` | **SUCCESS** |
| `close-gate` | **SUCCESS** |
| `build` | **SUCCESS** |
| `scaffold-static (deno-only)` | **SUCCESS** |
| `desktop-native-linux` | **SUCCESS** |
| `scaffold-runtime (aspire + docker + postgres)` | **FAILURE** — attributed to #1844, see below |
| `scaffold-runtime-sqlite (aspire + sqlite + garnet)` | queued behind the shared e2e-cli runner at packet time |

### The one red is #1844's, proven rather than asserted

The uploaded E2E report (run `33617486148`, job `100206685348`,
`e2e-report-scaffold-runtime.json`) reports **`passed=46 failed=1`**. The single failure is the
**last** gate in the suite:

```
runtime.wait.postgres   ->     512 ms   PASS
runtime.wait.garnet     -> 300338 ms   FAIL (300 s timeout)
```

Everything before it passed, including `database.init` (22837 ms),
`database.migration-artifacts` (27760 ms), `database.generate`, `database.seed`, both
`capture-db-allocation` gates and `runtime.aspire-restart-after-db`.

That is exactly **#1844** (`orchestrator:fixes`, `status:impl`, PR **#1858** open —
"make Garnet readiness deterministic and align Garnet version pins"). #1844's own body records it as
"a single observation, not a confirmed shared defect"; this run is a **second independent
reproduction** at a different head with the identical `passed=46 failed=1` shape and a sharper
postgres/garnet asymmetry (512 ms vs 300 s, same wait mechanism, same run). Posted to #1844 as
evidence — comment `5508166737`.

**Why it is not #1842's.** The slice touches `packages/plugin/src/sdk/`, one CLI asset template, its
own tests, and the generated export corpus. It adds **no Aspire resource, no health probe, and no
container**. It cannot affect garnet readiness. This red is therefore *not* a reason to hold the
PR — but it is also **not something this lane can clear**, and the coordinator should decide whether
to merge over a known #1844 reproduction or wait for #1858.

### Integration work carried in this head

Merged `main` `77ad823dc` with **zero conflicts**, then repaired a defect the merge could not fix
and refreshed the carriers:

1. **`packages/fresh/README.md` carried a duplicated "Ordered partial navigation" section** — two
   `###` headings (158, 198) against main's single one at 162. The earlier re-stack onto #1848 had
   resolved that file by keeping "our" side, but this branch owns nothing in it: "ours" was a stale
   snapshot of a section #1848 **moved** before merging, so main's moved copy arrived through the
   merge alongside the leaf's stale one. Main's version is now taken verbatim; the file is
   byte-identical to `origin/main`.
2. Carriers regenerated: `assets-barrel` and `publish-assets` already current;
   `mcp-export-corpus` → sha256 `4d383b1e…`, 272 subpaths / **7804** symbols, `check` exit **0**.
3. `deno.lock` byte-identical to `origin/main`. Scoped `packages/plugin` check: 155 files,
   **0 diagnostics**.

### Note for the coordinator — this head also refreshes a corpus that is stale on `main`

Measured on a clean detached worktree at `origin/main` `77ad823dc`: `check:mcp-export-corpus`
**exits 1**, and regeneration there produces `eb026322…` / 272 subpaths / **7803** symbols against a
different committed blob. So **main's committed corpus is itself stale** — the #1862 class has
recurred, and it drifts silently because `mcp-export-corpus` lives in
`.llm/tools/gates/catalog.ts` but is not wired into any GitHub workflow.

Consequence for this packet: #1842's corpus (`7804`) is main's fresh corpus (`7803`) **plus exactly
this slice's own `packages/plugin/src/sdk/mod.ts` export**. The delta is therefore *not* purely
#1842's, and merging it incidentally also refreshes main. Stated here so the number is not read as
a larger public-surface change than it is.

### IMPL-EVAL

`PASS` at `a203a52f3` (prior packet). Product files were byte-identical at `826ad4946`; this head
adds only the `main` integration, the README repair (now byte-identical to main) and the regenerated
corpus. **No product source authored by this branch has changed since the verdict.**

### Known concurrent edit

#1915 (`feat/sdk-credential-contribution`) also adds one line to `packages/plugin/src/sdk/mod.ts`.
Both are single-line export additions; whichever merges second takes a one-line textual conflict.
