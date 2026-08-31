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
