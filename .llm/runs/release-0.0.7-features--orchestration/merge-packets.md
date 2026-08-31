# Merge packets — features lane, handed to the primary coordinator

**This lane does not merge.** These are exact coordinates and truthful gate state for the coordinator
to act on. Verified live against GitHub and git at the time of writing, not carried from memory.

---

## PR #1805 — `#1591` — **SHIPPED** as `main` `dea44991120a2c5da96a89df0f68d69c455c035e`

Landed after the current-main seam correction. `status:shipped`. The `status:augment-review` park that
held it was proven to be stale metadata (no reviews, no `augmentcode[bot]` check-run, no trigger
comment; on control PR #1747 the bot's review predated the label by ~11 h).

---

## PR #1810 — `#1458` typed chat-response completion mode — **EXACT-GREEN MERGE CANDIDATE**

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
| `scaffold.runtime` | **required and now running** — opted in via the `e2e-cli-gate` label; `scaffold-static` already **pass**. Previously every scaffold lane reported `skipping`. |
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
