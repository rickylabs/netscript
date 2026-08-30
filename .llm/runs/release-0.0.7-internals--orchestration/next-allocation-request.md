# Next internals allocation request — evidence, not preference

Requested of the coordinator. This lane does not self-assign: ownership is settled by
`milestone-cluster-state.json`, not by area labels, and all three candidates below are in
`committedIssues` with **no `leaves[]` entry**, so no lane owns them today.

## Why a request is needed at all

Internals has exactly one workable leaf right now. Every other filed internals leaf is unavailable:

| Filed internals leaf | State | Availability |
| --- | --- | --- |
| `aspire-reference-name-validation` (#1732, PR 1747) | implementing | **active — this lane** |
| `fresh-readonly-dehydrated-state` (#1734, PR 1736) | blocked | owner boundary after 2 terminal IMPL-EVAL failures |
| `aspire-13-5-s7-teardown-leak-check` (#1429/#1719, PR 1744) | blocked | behind an S3 merge |
| `aspire-13-5-s1/s2/s3` | implementing / ready | driven by the dedicated Aspire supervisor |

With `activeImplementationSlicesPerLane: 2`, internals has a free slot the moment #1732 reaches its
evaluator.

## Primary request — #1533, JSDoc `@example` compile gate

**Ask: assign #1533 to internals.**

*Fit.* This is a gate-coverage-honesty defect, which is the exact class internals has shipped four
times: #1542 (`quality-scan-root-coverage`), #1296 (`reference-export-drift-gate`), #1604/#1618/#1622
(`package-gate-honesty`), #1709 (`lint-partial-exclusion-fail-closed`). Every one is "a gate reports
green over files it never opened."

*The ownership objection, stated fairly.* #1533 carries `area:docs` alongside `area:tooling`, and a
docs topic orchestrator exists. The distinction that resolves it: the docs lane **authors content**;
this issue **builds a gate**. Its deliverable is a compiler over `@example` blocks, not documentation
prose. If the coordinator reads it the other way, the research below transfers intact.

*Evidence, re-derived by this lane rather than inherited.* This run's own `context-pack.md` records
#1533 as blocked because "PLAN-EVAL B1 found three more defective files, so #1533's gate would go red
on four." **That blocker is false**, and I verified why: the recorded measurement asked
`packages/contracts/mod.ts` for symbols the examples never claimed were on the root. The examples
import from `@netscript/contracts/query` and `/transform`, which are real published subpaths
(`deno.json` exports `.`, `./crud`, `./query`, `./transform`), and every symbol resolves from the
subpath its example actually names.

One genuine defect survives, and I confirmed it directly at `13878a80a`:
`packages/contracts/schemas/pagination.ts` imports only `PaginationInputSchema` and
`createPaginatedOutput`, then uses **`baseContract` and `UserSchema` with no import for either**. That
example cannot compile. It is a real instance of precisely the class #1533 describes — evidence the
gate is worth building, not a reason to defer it.

*So the framing changes.* Not "repair four broken import specifiers first" but "build the gate, then
find out how many examples actually fail" — a number nobody can state until the gate exists. The
first landing will need a fix-or-baseline position decided on real output; that is a plan-gate
decision, and it should be named in the dispatch rather than discovered mid-slice.

## Secondary request — #1616, dynamic-route scaffold gate coverage

**Ask: assign #1616 to internals, sequenced after #1732.**

Same class again: `scaffold.runtime` type-checks and runs a generated workspace containing **no
dynamic route at all**, so no gate anywhere exercises dynamic route binding end to end. The issue
carries its own reproduction — `grep -rnE "createRouteReference\('/[^']*\["` over `packages/cli/src`
returns nothing — and names the consumer defect that reached production through the hole (#1576: a
dynamic Form-C reference inferred params at compile time and resolved `ctx.path` to `{}`, returning
500, with every gate green throughout).

*Sequencing, and the reason it is not merely tidiness.* #1616 touches the same `scaffold.runtime`
fixture surface that #1732 slice 2 is editing right now
(`prepare-flow-b-fixture.ts`). Running both concurrently would put two leaves in one merge-readiness
fixture. Sequence it behind #1732's terminal handoff.

## Not requested, with reasons

- **#1557 / #1601** (`area:fresh`, `type:test`) — this run's context pack claims them as internals
  wave 4, but that same context pack was just proved wrong on the adjacent #1533 claim, and central
  state files neither. #1601 also involves a client-bundle test resolving `npm:vite` over the
  network, which may need a browser/runtime capability this lane holds no lease for. Worth filing;
  not worth this lane assuming.
- **#1429** — already `status:impl` under `aspire-13-5-s7-teardown-leak-check` / PR #1744. Not
  available.

## What this lane will not do

Open, relabel, milestone, or self-assign any of the above. The request is for an assignment
decision; the research is attached so whoever receives it starts unblocked.

---

## Freshness

Re-verified against central `milestone-cluster-state.json` at `updatedAt`
`2026-08-30T09:28:32.000Z`, `currentMainSha` `13878a80a50c55b9662099fed64555f2310ae4a3`:

- **#1533, #1616, #1557, #1601 all still have `leaves[] = NONE`.** They are committed issues that no
  lane owns.
- Internals' filed leaves are 8 `merged`, 4 `blocked` (#1734 owner boundary; aspire-13-5 s1/s3;
  s7 #1429/#1719), 1 `ready` (aspire-13-5-s2, driven by the Aspire supervisor), and 1
  `implementing` — `aspire-reference-name-validation` (#1732), this lane's, now with IMPL-EVAL
  running.
- So the free slot under `activeImplementationSlicesPerLane: 2` is real and immediate.
