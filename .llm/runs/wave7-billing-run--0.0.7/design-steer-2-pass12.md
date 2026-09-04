# Design steer #2 / #3 — pass 12: composed blocks land in the build lane

## The tree decision (drift, stated explicitly)

The turn launched me with `--cwd /home/agent/projects/netscript/wave7-design`. **I did not build
there.** `git merge-base --is-ancestor HEAD master` proves the design branch is a strict ancestor of
`master` — 0 commits ahead, 49 behind. Its work is already merged (turn-14 did the merge). It also has
no product: `routes/` there holds only `_app`, `_layout`, `index`, `health` and the design sub-app —
no `runs/`, `invoices/`, `customers/` or `webhooks/`.

Steer #3 asks for *run console, invoice detail, overview* as composed blocks. Those screens do not
exist in the design tree. So I worked in **`/home/agent/projects/netscript/wave7-billing` (`master`)**,
which is the tree the coordinator has been merging into and the only tree with the product. Every
change is a clean add or a one-line mount, so it merges forward without conflict.

## DONE

1. **`components/blocks/` created in the build lane** (it did not exist on `master`).
   - `run-console.tsx` — the run as a live object. Five-band `WidgetCard`: header (glyph · period ·
     status · provisional tag) → hero issued total with delta chip → gauge that fills against
     `expectedCount` beside the lifecycle stepper and a metric list → footer columns (Computed /
     Issued / Exceptions) with a full-width pill CTA when there are exceptions.
   - `invoice-detail.tsx` — derives the states an invoice enum cannot express (**part paid**,
     **retrying**, **partially refunded**, **past due**) from the payment rows, names each in a
     sentence, and shows those rows as evidence under the total. Footer carries the money triad.
2. **`lib/money.ts` grows `sumMoney` and `subtractMoney`** — outstandings and part-paid need
   arithmetic that did not exist. Both are digit-string arithmetic scaled to a common width, so no
   value meets a float. Five tests including `0.1 + 0.2 === '0.3'` and the cent case.
3. **Mounted on the real routes**: `/runs/[id]` summary layer and `/invoices/[id]` header layer, in
   place of the metadata-card + `StatsGrid` tiles the critique called disconnected.
4. **Gallery**: both catalogued as L4 blocks (`ledgerlineMeta.total` 7 → 9), with the run console in
   three states and the invoice in four.
5. **Fixed a merge leftover that had the app lint gate red**: the design-lane merge left two
   `case 'money-text':` clauses in `components-view.tsx` (`no-duplicate-case`). Resolved to the one
   richer ledgerline case, the way `b38d6db` handled the other union.
6. **Verified by rendering, not just type-checking.** A scratch SSR script (deleted, lock reverted)
   proved: gauge and delta chip render; footer reads `1,204,000.00 / 1,162,800.00 / 12 items`;
   part-paid and retrying chips render; a settled invoice shows `Settled in full.` with the invoiced
   amount as hero rather than `$0.00`.

   That last check caught two real defects I had shipped minutes earlier — the footer was receiving
   raw wire decimals (`4800.00` instead of `4,800.00`), and an invoice with no payments reported
   outstanding as *unmeasured* when "no payment recorded" is a measured zero. Both fixed in
   `bb21f66`. Type-checking found neither.

## REMAINING

1. **`components/blocks/mod.ts` will conflict with `fix/steer2-consolidated`.** That branch (39 ahead,
   20 behind `master`, in `wave7-billing-steer2`) already has `components/blocks/overview.tsx` and its
   own `mod.ts`. It is unmerged. Whoever merges second reconciles the barrel — the two files are
   additive, so the resolution is a union of exports, not a rewrite.
2. **`OverviewBlock` is still only on that branch.** `master` has no overview block. I did not
   duplicate it; landing it is the merge above.
3. **The gallery is a gallery.** Steer #3's point stands: these blocks are proved to render, not
   proved to look good. Nothing in this run has been seen by anything with vision — I have no image
   input, and the reference PNGs are still unreadable to me (pass 11 established this).
4. **Populated screens remain unproven.** `/runs` needs the Aspire stack up to show real data; the
   blocks are so far exercised on fixture data only.
5. **No render test for the blocks.** `preact-render-to-string` is already in `deno.lock` (transitively,
   via Fresh) but not in the app's import map. Adding that one import-map line would let the SSR proof
   above become a permanent test instead of a scratch script. I left the lock untouched.
6. **Generator churn, unchanged.** Eight route files are `deno fmt`-dirty because the Fresh generator
   emits `.withRouteContract` on one line at 105 chars over the 100-char limit. I kept my two touched
   route files generator-canonical rather than committing the reformat, matching pass 11's ruling.
   The app `deno task check` therefore still exits 1 on `fmt --check`; `deno lint`, `deno check` and
   all 63 tests are green.

## Verification

- `deno test --allow-all`: **63 passed, 0 failed** (was 60; +3 money tests).
- `deno check` (whole app): clean. `deno lint` (blocks, gallery, both routes): clean.
- `deno fmt --check` on every file I touched: clean.
- `deno.lock` reverted after the scratch script added a specifier; `git status` carries no lock churn.

Commits: `8e8dc09` · `ad8ecc2` · `bb21f66`, on `master` in `/home/agent/projects/netscript/wave7-billing`.
Not pushed — no tracking branch, owner's call since pass 4.
