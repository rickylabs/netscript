# PRIORITY 1 — merge the design lane. Nothing else until this lands.

**The design work has never reached your tree.** Zero design commits are on your branch. All of it —
**46 components against your 39**, and every one of the five widgets built from the owner's reference
sheets — lives only on branch `design/ledgerline-ui`:

`delta-chip` · `semicircular-gauge` · `segmented-control` · `comparison-area-chart` · `footer-columns`

The owner has just seen screenshots of your tree and called the design *"absolutely hideous"* and
*"multiple leagues behind"*. He is right, and it is because he was looking at the product **with none
of the design work in it**. That is a coordination failure, not a design failure.

## Do this now

```bash
git merge design/ledgerline-ui
```

I previewed it: **7 files conflict, 12 hunks total**, and everything else auto-merges cleanly
(7 new components come in as clean adds).

| File | Hunks | Resolution guidance |
| --- | --- | --- |
| `components/ui/mod.ts` | 1 | **Union.** Keep every export from both sides — a component missing from the barrel is invisible to the gallery. |
| `assets/styles.css` | 1 | **Union**, preserving import order: component CSS before per-surface block files. |
| `assets/ui/money-text.css` | 2 | Prefer the design lane — it fixed the tabular-numeral and currency-spacing rules. |
| `assets/ui/switch.css` | 1 | Prefer the design lane (it removed the last raw hex). |
| `routes/(design)/design/(_components)/components-view.tsx` | 3 | Prefer the design lane, then re-add anything of yours it dropped. This is the gallery — it must render the new widgets. |
| `routes/(_components)/home-view.tsx` | 3 | Yours is newer on content; take the design lane's styling and keep your real data. |
| `routes/_app.tsx` | 1 | Careful — keep the pre-paint theme script and the correct `<title>`/meta. |

Then: `deno check`, `deno task test`, and confirm the `/design` gallery renders all five new widgets.

## Then use them — this is the part that matters

Merging the components is not the goal. **Putting them on screen is.** The owner's reference sheets
are widget cards with a specific anatomy, and your screens currently have none of it:

- **`SemicircularGauge`** as the hero of the run console — issued vs exceptions vs remaining, amount
  in the centre.
- **`FooterColumns`** directly under it — approved / excepted / excluded, equal columns, hairline
  dividers.
- **`DeltaChip`** beside every hero metric, never in a header, never a rectangular badge.
- **`ComparisonAreaChart`** for billed vs collected on the overview.
- **`SegmentedControl`** as the period selector.

Every card follows one anatomy: header glyph + title, action affordance top-right, hero metric ~3×
the label with a delta chip beside it, body visualisation, then footer columns or a full-width CTA.

Commit the merge on its own, then the screen work. Report when the gallery renders all five.
