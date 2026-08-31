# Merge packets — features lane, handed to the primary coordinator

**This lane does not merge.** These are exact coordinates and truthful gate state for the coordinator
to act on. Verified live against GitHub and git at the time of writing, not carried from memory.

---

## PR #1805 — `#1591` typed OpenAI Responses generation-options mapper — **EXACT-GREEN MERGE CANDIDATE**

| | |
| --- | --- |
| **Merge head (immutable)** | `e76e0227109e322d3e20202bd96592107a6eda2a` |
| Certified content head | `ff7d2de60ef470c312d633b851975d67a6774471` |
| Branch | `feat/ai-openai-responses-mapper` |
| Draft | **no** |
| Mergeable | **MERGEABLE / CLEAN** |
| Status label | exactly one — `status:ready-merge`; issue #1591 also `status:ready-merge` |
| Closing keyword | `Fixes #1591` — live `closingIssuesReferences` resolves to #1591 |
| Supervisor Tier-A | **ACCEPTED**, no findings |
| **IMPL-EVAL** | **`OPENHANDS_VERDICT: PASS`** at the exact head, GLM 5.3 Flash · effort `max`, independent read-only session — comment `5473484620` |
| CI at exact head | `close-gate` **pass** · `check-test` **pass** (8m30s) · `quality` **pass** · `code-quality` **pass** · `build` **pass** · `classify` **pass** |
| Review-thread gate | **PASS** — `threads=0 unanswered=0` |

### The `status:augment-review` question, answered with evidence

The label was applied at `2026-08-31T03:55:13Z`, 47 s after the IMPL-EVAL PASS comment, and it
parked an otherwise exact-green PR. **It did not correspond to any live review process:**

- `pulls/1805/reviews` → **0**; `pulls/1805/comments` → **0**.
- Check-runs on the exact head come from **`github-actions` only** — no `augmentcode[bot]` check-run,
  no third-party app at all.
- No `augment review` trigger comment exists on the PR (that comment is how the bot is invoked).
- **Control case #1747**, the only other PR carrying the label: its `augmentcode[bot]` review was
  submitted `2026-08-30T09:46:51Z` — **≈11 hours *before*** its `status:augment-review` label was
  applied at `20:32:50Z`. So the label is a **post-hoc marker of a completed advisory pass**, not an
  indicator of a pending one.

**Verdict: stale metadata, no live authorized process, therefore no run ID and no ETA.** Normalized
to `status:ready-merge` and the exact-head close-gate rerun without moving the head — it now passes.
The advisory pass remains available on demand (comment `augment review`); it is advisory, not a
required gate.

### IMPL-EVAL findings — all info-only, none blocking

1. `docs:exports-drift` red at this leaf's base `7908399af`. **Not this slice's** — the integration
   diff for `packages/ai` is empty, and the drift is in `docs/site/reference/telemetry/` on `main`.
   Independently confirmed fixed on current `main`: the same gate runs **PASS** in three separate
   leaves integrated at `584caa03f`. Merging #1805 does not carry the red forward.
2. `check:mcp-export-corpus` is environment-sensitive under `LD_LIBRARY_PATH`. CI unaffected.
3. Carried D-1: `run-gate.ts` should reject `(cached, inputs unchanged)` PASS receipts. Tooling lane.

---

## PR #1762 — `#1387` typed principal and procedure policy — **HELD BY COORDINATOR ORDER**

| | |
| --- | --- |
| Head (frozen) | `686eedb62db189907936dee8a0edc5acf295529a` |
| Draft | no · `status:ready-merge` · `Fixes #1387` live |
| Mergeable | MERGEABLE (BLOCKED only on `check-test`) |
| `close-gate` | **PASS** — see correction below |
| `check-test` | **red**, owned by P0 #1827, **not** by this leaf |
| IMPL-EVAL | **`OPENHANDS_VERDICT: PASS`** at `d7cf2419c` (GLM 5.3 Flash), 13/13 receipts verified |

**Correction to the rotation checkpoint:** `close-gate` was recorded as failing. It **passes**. The CI
red was a race — the acceptance mirror was mid-apply, so the gate read an issue snapshot from
`03:22:22Z` in which the boxes were not yet mirrored. Re-evaluated live at the exact head:
`close-gate PASS rickylabs/netscript#1762`. The CI job was rerun without moving the head and is now
green.

**Held per coordinator order:** no churn until P0 #1827 (`fix/cli-e2e-unstable-parity`) merges; then a
single integration of the complete `main`, carry the PASS across, and rerun the exact-head gates. The
verdict at `d7cf2419c` carries to `686eedb62` on the standing rule — the delta is `main`'s own docs
content plus regenerated carriers, with **no leaf product source change**.

---

## PRs #1810 / #1814 / #1820 — integrated, green, evaluation chain running

All three were `CONFLICTING/DIRTY` against `main` `584caa03f` at rotation. Each conflicted on exactly
one file — the generated MCP export corpus — resolved by taking `main`'s carrier and **regenerating
from tooling**, never hand-merging.

| PR | Issue | Integrated head | Evidence head | Closing keyword | Eval |
| --- | --- | --- | --- | --- | --- |
| #1810 | #1458 | `520573e1f` | `96f9cea99` | `Fixes #1458` | dispatched, running |
| #1814 | #1592 **partial** | `aeb616805` | `d2c290c0c` | **none, deliberate** | queued (serial) |
| #1820 | #1452 **partial** | `186cea472` | `3130fb52b` | **none, deliberate** | queued (serial) |

Merging #1814 must **not** close #1592; merging #1820 must **not** close #1452. Both have empty
`closingIssuesReferences`, verified live.

**A real blocker found and cleared:** while draft, CI's heavy lanes (`check-test`, `quality`,
`code-quality`, `close-gate`) were **all skipping** — `ci.yml` gates them on
`pull_request.draft == false`. All three would have reached the coordinator as "green" merge
candidates carrying **no real CI**. Each is now non-draft with `impl-eval:skip` applied, so CI runs in
parallel while the IMPL-EVAL chain stays serial and un-duplicated.

Gates re-cut at each integrated head, every receipt `gitHead == actualGitHead` with **non-empty
`stdout.bytes`** checked explicitly against the D-1 cache-replay trap. `deno.lock` byte-identical
(`edfa0c24…`) on all three. PR bodies rewritten to record the integration and the re-cut evidence.
