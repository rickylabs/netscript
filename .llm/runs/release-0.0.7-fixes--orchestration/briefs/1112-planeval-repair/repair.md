# PLAN-EVAL cycle 1 returned `FAIL_PLAN` — plan-artifact repair only

Verdict: **CHANGES_REQUESTED / `FAIL_PLAN`**, cycle 1 of 2, evaluated at your plan head
`069fd3e9175d28aaaf1b8c836e35d1f9bbbaa42a` by a fresh opposite-family evaluator (native Claude Fable 5,
medium). Public comment: `https://github.com/rickylabs/netscript/pull/1711#issuecomment-5452181794`.

**Plan-artifact repair only. No product implementation.** The seven-path product envelope is unchanged
and nothing in it may be edited this turn.

## F1 — BLOCKING. The example's `PrismaClient` import cannot type-check as planned

The evaluator proved this rather than asserting it:

- No generated client exists anywhere in the repo; committing one is your own Deferred item 3, an
  eighth path.
- `@prisma/client` **does not resolve** from the package. It appears in root `deno.json` only under
  `"catalog"` (`:235`), **not** under `"imports"`, and `packages/prisma-adapter-mysql/deno.json` has no
  `imports` at all. Its probe: `deno check` on a scratch file beside the example →
  `TS2307 Import "@prisma/client" not a dependency and not in import map`, exit 1. No workspace `.ts`
  imports `@prisma/client` today.
- Even if mapped, Prisma 7's `@prisma/client` entry re-exports generated output and its **ungenerated
  stub types `PrismaClient` as `any`** — so a passing `deno check` through that path would not be the
  semantic evidence gate 1 claims.

Your open-decision sweep lists "Actual example path — Resolved: owned". **It is not resolved.**

### What to do

**First, run the cheapest exact probes** needed to lock an honest import strategy. Prefer, in order:

1. A **real explicit generated-client path** — an exact relative specifier the example can carry.
2. A **scratch-only generation/check setup** that compile-checks the actual example file **without
   committing any generated output**.

**Forbidden, all three:** ambient `declare` blocks, `// @ts-ignore`, and leaning on the ungenerated
`@prisma/client` `any` stub. A green check bought with any of those is worse than an honest red.

Then state in the plan the **exact import specifier** `examples/basic-usage.ts` will carry, and show
with a probe that `run-deno-check.ts --file` on that actual file resolves it **inside the seven paths**.

**If the seven-path envelope cannot make the example executable honestly: STOP before rescope.** Report
the **minimum exact additional path** and the proof that it is required. Do **not** silently add an
eighth product path, and do not quietly downgrade the claim instead.

### Amend these together — one of them alone leaves the plan inconsistent

`D3`, gate 1 (`plan.md:160`), slice 2's proving gate, the risk-register row (`plan.md:184`), research
rows 41/44, and the open-decision sweep entry that currently reads "Resolved: owned". Whichever
strategy you land, all six must agree.

## F2 — ADVISORY. The "exactly eight" census count under-counts your own table

The evaluator's grep also returns `README.md:7` ("through Deno's native MySQL driver", your census row
15) and `docs/site/reference/prisma-adapter-mysql/index.md:100` and `:104` ("`deno_mysql` client", your
row 14). Every occurrence already has a disposition in the 49-row table, so this is not rework — but
**gate 13's expected result is a hard-coded "Eight … corrected"**, which an implementer can satisfy
while leaving `README.md:7` and the site driver table untouched.

Fix: restate gate 13's expected result as *"every Correct/Delete row in the census table is applied;
re-run the census grep; only `adapter.ts:30` remains"* and **drop the hard-coded count** wherever it
appears (`research.md:105-110`, `context-pack.md`, gate 13).

## F3 — ADVISORY. Missing PR phase-comment trail

`gh pr view 1711 --json comments` returns **0**. Post the phase comments you owe on **#1711**:
**research** and **plan** (including the cycle-1 `FAIL_PLAN` and this repair). **Do not** post the two
Tier-A comments — those are supervisor-owned and this topic will backfill them itself.

## F4 — ADVISORY. Gate 12 names the audit tool without its path

The script is `.llm/tools/fitness/audit-jsr-package.ts`. Add the full path so the implementer runs the
right tool.

## Owner policy amendment — record it in the plan

Formal PLAN-EVAL is now **selected only for genuinely critical, complex, or decision-heavy topics**.
Routine or mechanical leaves record **`PLAN-EVAL: N/A`** plus Tier-A instead.

**#1112 remains selected** for one final cycle, because it coordinates published integration docs, an
executable generated-client import, adapter lifecycle, public option truth, and TLS compatibility.
Record that rationale; do not present the selection as routine.

## Unchanged

Seven-path envelope; plan and research artifacts only; no product mutation; no runtime, Aspire, Docker,
browser, or `e2e:cli`; no lockfile; `#1664` and `#1293` untouched; no other lane. Keep PR **#1711**
draft and reference **#1112 without any closing keyword**.

Commit, push by explicit refspec, report your exact head sha and — if F1 forces it — the minimum
additional path with its proof. Then stop. Fresh Tier-A follows; **cycle 2 is not launched until the
coordinator grants it.**
