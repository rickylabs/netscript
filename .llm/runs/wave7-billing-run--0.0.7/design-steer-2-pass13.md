# Design steer #2 — pass 13: audit the build against the spec, don't rebuild it

## The tree decision

`/home/agent/projects/netscript/wave7-billing` (`master`). Same reasoning as pass 12: it is the
only tree with the product, and it is the tree the coordinator merges into.

## The finding that shaped this pass

The steer asked me to build five components. **All five already exist**, along with `WidgetCard`
and three composed blocks, from passes 3–12. Building them again would have been duplicated work
with a merge conflict attached. So instead of building, I **audited each component against the
literal numbers in `design-critique-1.md` §4** and fixed what had drifted.

That audit found eight real defects, none of which type-checking or the 13 design-contract tests
could see. Four were on the spec's own literal numbers.

## DONE

**Commit `0a587f1` — the literal numbers in the critique's spec.**
- `FooterColumns` label was 10px (`--ns-text-3xs`); the spec says 11px. Now `--ns-text-2xs`.
- `SegmentedControl` ground was `--ns-muted` (paper-3/paper-4), one step darker than the spec's
  paper-2. Resolved to `--ns-surface`, which is paper-2 in **both** themes — the well the active
  pill lifts out of. A bare `--ns-paper-2` would have inverted on one theme, which is exactly what
  T2a forbids, and the gate caught it within seconds of my trying.
- `ComparisonAreaChart`: the plot bleeds to the viewBox floor, so the 18% comparison fill painted
  square across the frame's 12px radius. Clipped the `<svg>`, **not the frame** — the hover readout
  is absolutely positioned above the node and clipping the frame would cut the tooltip off on a
  peak. The baseline rule was stroked centred on y=120, the exact viewBox edge, losing half its
  stroke; now drawn at 119.5.
- `SemicircularGauge` spoke a **raw number** in its `aria-label` and hardcoded the domain noun
  "run items" inside a generic `ui/` component. Added `totalDisplay` (a preformatted string, H2)
  and wired all three call sites. A fractional total would have printed `342.6666666666667`.

**Commit `3feaa2b` — the dark-mode bug was still there, one component over.**
`provisional-tag.css` reached for primitive `--ns-amber-6` — the identical failure the critique
flagged on `exception-badge`, which had been fixed. It shipped because the fallback hid it:
`var(--ns-amber-6, var(--ns-status-refunded))` never falls back, the primitive always being
defined in `:root`. It also slipped the T2a gate because the pattern was anchored on `\)` and a
ramp step carrying a fallback ends in a comma. Tightened to `\s*[,)]` — catches both shapes, still
passes semantic roles and semantic fallbacks. Now `--ns-status-progress`, which is the role a
provisional figure actually is.

**Commit `f319577` — three gallery demos that lie about the product.**
- The Collection-rate hero routed a **percentage through `MoneyText`** and rendered `$92.40`. The
  hero band does not size its children, so there was no way to borrow the scale without borrowing
  the currency; added `.ns-widget__hero-value` — same 4xl/600/tabular scale, no money attached.
- Separator demo read `logs / metrics / traces` (scaffold vocabulary). Now Invoiced / Collected /
  Outstanding. A Spinner read `Loading deployments`; now `Loading invoices`.
- `money-text` is catalogued twice (registry.ts:474 upstream, :678 ledgerline), so the gallery
  emitted two `<article id="item-money-text">` and the rail anchor hit whichever came first.
  Upstream entries whose name Ledgerline owns are now filtered out.

**Commit `6d6333a` — a compact amount was the one figure whose currency went unstyled.**
Every amount renders its symbol in `.ns-money__currency` (0.75em, muted) except compact ones —
that branch skipped `moneyParts` and printed `formatMoneyCompact`'s single concatenated string, so
`$1.2M` had its symbol at full hero size. `formatMoneyCompact` could not just change (chart ticks
want the symbol inline), so I added `compactMoneyParts` and built `formatMoneyCompact` on top of
it; the component's two branches collapsed into one. Sign stays in the text so `-$12k` keeps it
inside the direction-coloured element. New test for the split.

## Verified by rendering, not just type-checking

SSR proof of every widget (scratch file deleted, `deno.lock` byte-identical afterwards). It
confirmed what type-checking could not:

- `MoneyText value='100'` → `<span class="ns-money__currency">$</span><span …>100.00</span>`
  (the critique's `$100` defect is gone, and the currency has its own element)
- compact → `$` + `1.2M`; negative → `-12k` with `data-direction="out"`
- absent → em dash + `sr-only`
- gauge → `viewBox="0 0 200 110"`, `A 80 80`, `stroke-width="18"`, `stroke-linecap="butt"`, and
  `aria-label="ISSUED $1,240,500.00 — of 412 run items — Issued $1,240,500.00, In review
  $183,400.00"` — no raw number anywhere
- rate hero → `92.4%`, not `$92.40`
- area chart → both paths with real geometry, both closing at y=120, baseline at y=119.5

One scare that was **my** bug, not the component's: I first passed `comparison={[10, 14, 12]}`
where the prop takes `AreaChartPoint[]`, so `Math.max` over `undefined` poisoned `max` and the
comparison path rendered `NaN`. Corrected the scratch and the geometry came out clean.

## REMAINING

1. **Nothing in this run has been seen by anything with vision.** I have no image input and the
   reference PNGs remain unreadable to me — unchanged from pass 11. Every fix above is reasoned
   from the critic's written spec, not observed against the images.
2. **`WidgetCard.FooterColumns` does not exist.** The spec (line 192) names it; the compound
   exposes `WidgetCard.Footer`, and callers nest the standalone `FooterColumns` inside it. API gap.
3. **`.ns-card` is still 12px** (`surface-styles.css:3`); only the new `.ns-widget` seam carries
   24px. `.ns-card__header` is still hardcoded `flex-direction: column`, overridden to row only
   under `.ns-widget__header`. Both are **documented** radius/cascade decisions by the previous
   author, and bare `Card` tiles are deliberately unaffected — I left them alone rather than
   half-apply ranked item 3.
4. **`--ns-destructive-fg: #ffffff` is never remapped** and sits at **3.79:1 on its own button in
   both themes** — the one hard WCAG AA failure I found. `--ns-warning` is 2.38:1 on white in
   light. Both are token-layer work outside the five components; I did not touch them because a
   contrast change ripples through every destructive surface and deserves its own pass.
5. **`components/product/money-text.tsx` is an orphan** — exported, imported by nobody, and its
   class `ns-money-text` has no stylesheet at all, so its `data-money-sign` attributes are dead.
   Deleting it is the right call but it is a barrel/export change.
6. **No permanent render test.** The SSR proof above is still a scratch script; pass 12's item 5
   stands. `preact-render-to-string@6.7.0` is already in `deno.lock` — one import-map line would
   make it a test. I left the lock byte-identical because another writer is active in this tree.
7. **Populated screens still unproven.** The Aspire stack is running, but these blocks have only
   been exercised on fixture data.

## Verification

- `deno test --allow-all`: **104 passed, 0 failed** (was 103; +1 money test).
- App `deno fmt --check .` **195 files, exit 0** — pass 12's generator-churn red is gone as of
  `4aa1747 fmt`.
- App `deno lint .` 127 files clean. `deno check .` zero errors.
- `deno.lock` byte-identical before and after; `git status` carries no lock churn.

Commits: `0a587f1` · `3feaa2b` · `f319577` · `6d6333a`, on `master` in
`/home/agent/projects/netscript/wave7-billing`. Not pushed — no tracking branch, owner's call
since pass 4.
