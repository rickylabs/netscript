# Design steer #2 — pass 5: the five components reach the product routes

**Branch:** `fix/steer2-consolidated` · **Worktree:** `/home/agent/projects/netscript/wave7-billing-steer2`
**Commits:** `f904592` → `37d1c25` (5 commits). Not pushed — owner reviews and merges.

## Why this pass exists

Pass 4 closed everything the steer asked for and left one item open:

> **The five components are registered but not yet mounted on product routes.**
> They exist in the gallery and the vocabulary is complete; wiring
> `SemicircularGauge` into `routes/runs/[id]` and `ComparisonAreaChart` into the
> overview is a product-surface change, not a design one.

That is this pass. I first verified pass 4's claims rather than inheriting them: 55 tests
green, no `3px 3px 0` offset shadow anywhere in `assets/` or `components/`, `money-text.tsx`
resolving through `moneyParts`, token parity intact.

## DONE

| # | Item | Commit |
| :-- | :-- | :-- |
| 1 | `SemicircularGauge` + `FooterColumns` → the run console hero | `f904592` |
| 2 | `ComparisonAreaChart` → computed vs prior, beside it | `f6e1f72` |
| 3 | `DeltaChip` → the runs index headline | `908d513` |
| 4 | `SegmentedControl` → the invoice status filter | `50b1f55` |
| 5 | The gallery type-checks and the app lints clean | `37d1c25` |

### Mounting decisions, and what forced them

**The gauge is item counts, not money.** A run's only honest denominator is the item:
settled, excepted, or open. Money is what the reader is then told about that shape —
the centre carries the issued figure, the footer carries what each outcome is worth.

**`sumMoney` joins `lib/money`.** The footer's per-outcome amounts needed adding, and
M8 keeps that arithmetic out of components. It sums scaled `BigInt` digit strings and
skips unmeasured values, so a sum over nothing measured is absent rather than `0.00`.

**An empty group is a real zero; an unmeasured one is the em dash.** No item failed
means "`$0.00` was excepted". Items whose amount was never computed means the em dash.
Getting this backwards is the M1 failure in its least visible form, and it is exactly
what the footer invites.

**The comparison chart plots `computedTotal` against `priorTotal`.** Not a benchmark and
not a projection: `AMOUNT_DELTA` exceptions are decided from precisely these two numbers,
so the comparison layer is the other half of a decision the console already asks for.
Both period totals are summed over the same population — the compared items only —
because comparing "everything this run" against "everything last period" reports a
change in item count as a change in price.

**`movement()` joins `lib/money`, shared by both call sites.** It is the partner to
`ratio`, and they part company on the case that matters: `ratio` answers "what
fraction", a movement answers "which way and by how much", and with no prior amount
there is no movement at all rather than a movement of zero.

### Two things found by rendering, not by reading

**`formatMoney` deliberately omits the currency symbol** so `MoneyText` can render it as
a spaced prefix element. A gauge centre, a footer column and a chart tick take a string,
so they now use `formatMoneyWithCurrency` — gluing `$` on by hand at a call site is how
`100.00USD` happens, which is the defect this whole steer started from.

**The invoice status filter's active state was never shown.** It carried `aria-current`
and nothing else, so the selected status was announced to assistive tech and invisible
to everyone else. The segmented control fills the selected cell.

### Deviations from the critique, deliberately

- **The chart is not on the overview.** No route in this tree exposes a collected
  amount per period, so "billed vs collected" on `/` would have been invented. It sits
  where both halves of the pair actually exist.
- **The runs filter keeps its plain link row.** Ten cells against the invoices
  filter's six, and a control sized for `1D 1W 1M 3M 1Y` stops describing a range once
  it is asked to hold ten. Its active state is invisible for the same reason the
  invoices filter's was — recorded below rather than fixed here.

### Rendered proof

```
run progress  -> arcs 2x stroke-linecap="butt"; dasharray 40/60 then 20/80 of 5 items
                centre $1,250.50, caption "2 of 5 items"
                footer: Issued $1,250.50 in | Excepted $99.99 out | Open $500.00 flat
empty run     -> "Nothing to measure yet"; all columns $0.00 flat
unmeasured    -> the open column em dash + sr-only "not recorded", data-direction=absent
comparison    -> hero $5,250.50, chip +64.1% up, ticks $4.0k|3.0k|2.0k|1.0k|0
                tooltips Acme Corp $1,000.00 / Bluth Co $250.50 / Carrie Ltd $4,000.00
                footer: Prior period $3,200.00 | 3 items | 1 item
dense (12)    -> x-axis labels reduce to the two ends; every point keeps its tooltip
no prior      -> chip em dash, data-direction=absent, note "no prior run"
runs index    -> widget card, hero $114,000.00, chip +14.0% up, "vs the 2026-06-01 run"
                one run only -> chip absent; zero runs -> renders nothing
invoice filter-> 6 link cells, f-client-nav on each, is-selected on the active one
```

## REMAINING

1. **Not merged to master; still 2 commits behind it** (`1cd0f34`, `c5d57c6`, webhooks).
   I did not rebase — rewriting history under an actively committing agent is how this
   run's earlier incident happened. Line 1 of pass 4's REMAINING, unchanged.
2. **The runs status filter's active state is still invisible.** `RunStatusFilter` in
   `routes/runs/(_components)/runs-table.tsx` carries `aria-current` with no visual
   effect, exactly as the invoices filter did. Fixing it means grouping nine statuses
   into a set a segmented control can hold, which changes the page's URL contract —
   a product decision, not a styling one.
3. **4 files remain unformatted** (`routes/customers/index.tsx`, `customers/[id].tsx`,
   `routes/invoices/index.tsx`, `invoices/[id].tsx`). All last touched by `521d4b5`,
   which predates this branch; all four want the same `withRouteContract` object
   expanded onto multiple lines. `routes/runs/[id].tsx` had the same defect and is now
   clean as a side effect of being edited — the other four want the same treatment.
4. **`aspire/node_modules` still absent**, so the aspire group of the root
   `deno task check` cannot load `typescript/bin/tsc`. Environmental, identical on
   master, needs `npm install` in `aspire/`.
5. **The `Wave 7` design tree remains the source for `MoneyText`'s richer API**
   (`size`, `signed`, `tone`, `compact`). Unchanged from pass 4: this tree's hero size
   lives on `WidgetCard.Hero`, and that is the seam to reconcile if the trees converge.

## Verification

- `deno check` over the whole app: **clean**. Was **7 errors** at `ba37797` — see below.
- `deno lint` over the whole app: **clean**. Was 1 problem.
- `deno test --allow-all`: **55 passed**, 0 failed.
- `deno fmt --check`: clean on every file this branch created or edited; 4 files remain
  and all predate it (item 3 above).
- `vite build` succeeds; all five components' class names are present in the emitted
  server chunks (`ns-gauge` in the `/runs/[id]` chunk, the rest in `server-entry.mjs`),
  which is what proves they are reachable from a route rather than tree-shaken out.
- Rendered every mount through `preact-render-to-string`, including the empty,
  single-item and all-unmeasured cases.
- Lock hygiene: `deno.lock` untouched. The render harness ran from scratch with
  `--no-lock`.

## Corrections to earlier records

- **Pass 4's "`deno check apps/ledgerline-web/main.ts`: clean" was scoped to `main.ts`,
  which does not reach the design routes.** Checking the whole app found 7 errors, all
  in `components-view.tsx` and all present at `ba37797`: `SECTIONS` declares `scope` on
  five of six entries, so TypeScript inferred the element type from the first entry and
  every later entry failed excess-property checking; and `TransitionFeed` was rendered
  but never imported. Both fixed in `37d1c25`. A verification command that only covers
  the paths that pass is not a gate.
- **Pass 4 recorded 5 unformatted files including `routes/runs/[id].tsx`;** that one is
  now clean, so the count is 4.
