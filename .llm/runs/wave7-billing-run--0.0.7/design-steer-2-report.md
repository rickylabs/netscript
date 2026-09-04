# Design steer #2 — response record

**Branch:** `design/ledgerline-ui` · **Worktree:** `/home/agent/projects/netscript/wave7-design`
**Commit:** `2da2189` (not pushed — owner reviews and merges)

## DONE against the six ranked items

| # | Steer | Done | Where |
| :-- | :-- | :-- | :-- |
| 1 | Kill brutalist button shadows, add pill variant | yes | `assets/ui/button.css`, `components/ui/button.tsx` (+ two more files, below) |
| 2 | Build `DeltaChip` | yes | `components/ui/delta-chip.tsx` + `assets/ui/delta-chip.css` |
| 3 | Establish the 5-band widget card | yes | `components/ui/widget-card.tsx` + `assets/blocks/widget-card.css` |
| 4 | Fix money rendering | yes **in this tree** — see the handoff below | `components/ui/money-text.tsx` |
| 5 | Real SVG charts: 180° gauge + two-layer area | yes | `semicircular-gauge.tsx`, `comparison-area-chart.tsx` |
| 6 | `SegmentedControl` + `FooterColumns` | yes | `segmented-control.tsx`, `footer-columns.tsx` |

Also flagged → done: gallery scaffold strings replaced with real Ledgerline values; the dark-mode
ramp-step leak fixed and made un-regressable (rule T2a + a test).

## Drift / divergence from the critique

1. **Three more files had the offset shadow.** The critic found it in `button.css`. It was also in
   `toast.css` (`4px 4px 0`, mixed from `--ns-border-strong`, which is near-white in dark) and
   `desktop-update-prompt.css`. Same defect family; all three now use `--ns-shadow-lg` /
   `--ns-shadow-drawer`. The new test is what found them — they did not show up in a line-oriented
   grep because they are multi-line declarations.

2. **Two more ramp-step leaks, both in scaffold files the critic did not open.** `sheet.css` and
   `switch.css` used `--ns-paper-12` directly. Since the paper ramp inverts, `paper-12` is
   near-black in light and near-white in dark. Fixed with two new semantic tokens:
   `--ns-control-thumb` (light `#ffffff`, dark `var(--ns-paper-12)`) and `--ns-shadow-drawer`.

3. **Radius is not uniform, deliberately.** The critique asks for large radii and pills everywhere.
   Taken literally that collides with the existing `DESIGN.md` refusal #4 ("rounded-everything and
   uniform elevation — refused: radius and elevation encode containment"). Resolved as a hierarchy,
   recorded as rule **C7**: the containing card is 24px (`--ns-radius-3xl`) with the diffuse ambient
   shadow, panels inside it step down to `--ns-radius-xl`, and every control, chip and segmented
   cell inside those is a full pill. Nothing shares a radius with the thing it sits inside.

4. **`MoneyText` is in the design tree, not the billing tree.** See the handoff.

5. **Chart ticks are derived, not authored.** My first gallery demo hardcoded `['$300k', '225k', …]`
   while the chart scaled to 250k — a tick disagreeing with its own gridline. The chart now exports
   `areaChartMax` and `AREA_CHART_TICK_RATIOS`, and callers build labels from the same number the
   gridlines sit on. This is rule H6.

## NOT DONE — cross-worktree handoff (I do not own `wave7-billing`)

`wave7-billing` is a separate checkout on `master` with live uncommitted work in it, so I read and
did not edit. Both defects the critic found there are confirmed real.

### `apps/ledgerline-web/components/product/money-text.tsx` (billing tree)

Confirmed at lines 23-29 and 47-48, exactly as reported:

- `Number(text)` with `minimumFractionDigits: Math.min(decimals, 6)` → `"100"` has 0 decimals, so it
  renders **$100** where the contract requires **$100.00**.
- `{currency && <span class='ns-money-text__currency'>{currency}</span>}` is appended straight after
  the amount, printing **100.00USD** with no separator.

The fix is to delete the private `formatMoney` and render through `lib/money.ts`, which already
exists in that tree and already guarantees two decimals:

```tsx
import { moneyParts } from '../../lib/money.ts';

const parts = moneyParts(value, { currency, locale: 'en-US' });

// …
<span class={cn('ns-money-text', className)} data-money-sign={parts.direction}>
  {parts.currency && <span class='ns-money-text__currency'>{parts.currency}</span>}
  <span>{parts.text}</span>
</span>
```

`parts.direction` is `'in' | 'out' | 'flat' | 'absent'`, so the sign branch on lines 47-48 goes too
(M5: no component re-derives "is this negative?"). The component I built in the design tree
(`components/ui/money-text.tsx`) is the finished version and can be dropped in as-is if the two
trees converge.

### `apps/ledgerline-web/assets/ui/exception-badge.css` (billing tree)

The rust-6 reference is in the **stylesheet**, not the `.tsx` the critique cited — lines 7-9:

```css
color: var(--ns-rust-6);
background: color-mix(in srgb, var(--ns-rust-6) 10%, transparent);
border: 1px solid color-mix(in srgb, var(--ns-rust-6) 24%, transparent);
```

`--ns-rust-6` is 45.5% lightness against a 21.5% dark card. Replace all three with the semantic
`--ns-money-neg` (which the token layer already re-steps to `--ns-rust-4` in dark) or
`--ns-destructive` / `--ns-destructive-subtle` / `--ns-destructive-border`.

### Also present in the billing tree, same two defect classes

`assets/ui/button.css:54,60,65,124,128,130,135`, `assets/ui/desktop-update-prompt.css:62`,
`assets/ui/sheet.css:14-15`, `assets/ui/switch.css:27,29`. All fixed on the design branch in
`2da2189`; the same edits apply to the billing tree unchanged.

## Verification

- `deno check apps/ledgerline-web` — clean.
- `deno lint` — clean.
- `deno fmt --check` on the app — clean. Two files were already unformatted before this work
  (`routes/index.tsx`, `tests/status_test.ts`); left alone to keep the diff to my own changes.
- `deno test tests/design_contract_test.ts tests/money_test.ts tests/status_test.ts` — 27 passed.
- `vite build` and `vite build --mode development` both succeed; the development build includes the
  design routes and emits `fresh-island__RangeControlDemo.mjs`, confirming the range-control island
  is discovered and hydrates.
- Rendered every new component through `preact-render-to-string` and checked the output: `100` →
  `$100.00`, currency as a separate prefix element, absence → em dash + `not recorded`, gauge arc
  `stroke-linecap="butt"` with dasharray 77.18 / 11.41 of a 100-unit path for 318 and 47 of 412
  items, y-tick tops at 8.33 / 31.25 / 54.17 / 77.08 / 100% matching the gridlines at y = 10 / 37.5
  / 65 / 92.5 / 120 exactly.

Lock hygiene: an ad-hoc verification script added `npm:preact-render-to-string@6` to `deno.lock`.
Reverted before committing; `deno.lock` is untouched in `2da2189`.
