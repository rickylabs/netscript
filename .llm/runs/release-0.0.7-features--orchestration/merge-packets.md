# Merge packets — features lane, handed to the primary coordinator

**This lane does not merge.** These are exact coordinates and truthful gate state for the coordinator
to act on. Verified live against GitHub and git at the time of writing, not carried from memory.

## Honest status summary

**Three of four are CI-green and conflict-free but have one unmet gate; the fourth additionally
conflicts with `main`.** None is "exact-green ready-merge" by this run's own standard, because every
slice in this lane has required a separate opposite-family IMPL-EVAL before terminal acceptance, and
that gate is **parked pending #1792** by standing coordinator ruling. Stating that plainly rather
than handing over a green-looking packet with an unmet gate.

---

## PR #1805 — `#1591` typed OpenAI Responses generation-options mapper

| | |
| --- | --- |
| **Merge head** | `ff991165ffc0146718dd1e516e0bddf6dd72ac8f` |
| Certified content head | `ff7d2de60ef470c312d633b851975d67a6774471` (carrier product-neutral, re-verified) |
| Branch | `feat/ai-openai-responses-mapper` |
| Mergeable | **MERGEABLE / CLEAN** — zero file intersection with current `main` (`5197e70b7`) |
| CI | 2 SUCCESS, 19 SKIPPED, 0 failing |
| Closing keyword | `Fixes #1591` — live `closingIssuesReferences` correctly resolves to #1591 |
| Supervisor Tier-A | **ACCEPTED**, no findings |
| **Unmet gate** | separate opposite-family IMPL-EVAL — **parked pending #1792** |

## PR #1810 — `#1458` typed chat-response completion mode

| | |
| --- | --- |
| **Merge head** | `c438c82db9a730829d5a504efdfe79f2988e025c` |
| Certified content head | `acb096a94e8f2dc182ebc8c73be9ba421e2a6826` (carrier product-neutral, re-verified) |
| Branch | `feat/fresh-ai-chat-response-mode` |
| Mergeable | **MERGEABLE / CLEAN** — zero file intersection with current `main` |
| CI | 2 SUCCESS, 19 SKIPPED, 0 failing |
| Closing keyword | `Fixes #1458` — live `closingIssuesReferences` correctly resolves to #1458 |
| Supervisor Tier-A | **ACCEPTED**, no findings |
| **Unmet gate** | separate opposite-family IMPL-EVAL — **parked pending #1792** |

## PR #1814 — `#1592` Slice 1, worker execution progress (**partial**)

| | |
| --- | --- |
| **Merge head** | `af6f1691629c6b2e1cbf45f081f451fcb9005d35` |
| Certified content head | `7270cc7f7` (carrier product-neutral, re-verified) |
| Branch | `feat/workers-execution-progress` |
| Mergeable | **MERGEABLE / CLEAN** — zero file intersection with current `main` |
| CI | 2 SUCCESS, 19 SKIPPED, 0 failing |
| Closing keyword | **none, deliberately** — `Refs #1592`, live `closingIssuesReferences` correctly **empty**. Merging this does **not** and must not close #1592: the `ctx.reportProgress()` runtime wiring and the ordering/coalescing/replay documentation remain unimplemented. |
| Supervisor Tier-A | **ACCEPTED** as Slice 1, no findings |
| **Unmet gate** | separate opposite-family IMPL-EVAL — **parked pending #1792** |

---

## PR #1762 — `#1387` typed principal and procedure policy — **NOT MERGEABLE**

| | |
| --- | --- |
| Current head | `c4bd642324079f41eebb079fb862ebc5abbdd8ae` |
| Branch | `feat/service-principal-procedure-policy` |
| Mergeable | **CONFLICTING / DIRTY** against `main` `5197e70b7` |
| CI | only 2 checks, both SKIPPED — **no real CI has run on the current head** |
| Closing keyword | none — `Refs #1387` partial, `closingIssuesReferences` correctly empty |
| Slices 1–9 | all Tier-A ACCEPTED; Slices 1–8 additionally carry IMPL-EVAL verdicts (Slice 3 has two independent concurring ones) |
| **Unmet gates** | Slice 9 IMPL-EVAL (**parked pending #1792**) **and** integration with current `main` |

### The conflict is fully diagnosed and mechanical

Measured intersection between what `main` changed and what this leaf changed since the shared
merge-base `24f6642f0` — **exactly six files, five of them generated carriers**:

- `.llm/assets/agent-docs/prose.json.gz` — generated
- `.llm/assets/agent-docs/provenance.json` — generated
- `packages/cli/src/kernel/assets/agent-docs.generated.ts` — generated
- `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts` — generated
- `packages/mcp/src/publish-assets.generated.ts` — generated
- `.llm/tools/gates/catalog.ts` — **the only real source file**

**The one source conflict is textual, not semantic.** The two changes are additive and touch
different regions of the same object literal:

- `main` added `'aspire-version-parity': ['deno','task','check:aspire-version-parity']`
- this leaf added `'exports-drift'` and `'mcp-export-corpus'` (the D-5 fix)

The correct resolution is the **union of both** — all three entries should exist. Neither supersedes
the other.

### Recommended resolution order — integrate *before* evaluating, not after

Do **not** integrate and then evaluate separately. This run established (on PR #1731, twice) that
the correct sequence is: take current `main`, resolve carriers by **regenerating from tooling**
(never hand-merging generated output), union the `catalog.ts` entries, then run the evaluator against
the integrated head — so the verdict certifies the head that actually merges.

**I have deliberately not performed this integration yet.** Doing it now would move a head that the
parked Slice 9 IMPL-EVAL must certify, and `main` will advance again when #1792 lands — forcing a
second integration and a second evaluation. The efficient and correct order is: **#1792 lands →
integrate `main` once → dispatch the Slice 9 GLM IMPL-EVAL against the integrated head → hand a
genuinely exact-green packet.** Say the word if you want it integrated sooner regardless.

---

## What would make all four exact-green

One thing, shared: **#1792 landing**, which unblocks the GLM 5.3 Flash evaluator route for the four
parked evaluations. #1762 additionally needs the one-pass `main` integration described above.
