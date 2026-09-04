# Design steer #2 — pass 7: verify, don't inherit the claim

**Branch:** `design/ledgerline-ui` · **Worktree:** `/home/agent/projects/netscript/wave7-design`
**Commits:** `809b130` → `f82a8f4` (4 commits). No upstream configured; owner reviews and merges.

## Why this pass exists

The steer message is unchanged and still asks for the five components. Three prior passes in this
tree claimed them closed. So this pass did not start building — it started by *rendering* what was
already there, on the principle this run has had to learn twice: a claim is not evidence.

| Inherited claim | Verdict |
| :-- | :-- |
| All five components built to the critique's literal spec | **Holds.** Rendered each one and read the markup against the spec's numbers. |
| Brutalist button shadows gone | **Holds** — C8 test, plus `grep` finds no `Npx Npx 0` shadow in `assets/`. |
| Money resolved through `moneyParts` | **Holds** — M8 test; `100` renders `$100.00`, currency is a spaced element. |
| Dark-mode exception badge on a semantic token | **N/A here, holds in the billing tree** — `ExceptionBadge` is product code and does not exist in this tree. |
| All five catalogued and demoed | **Holds** — `ledgerlineCatalog` carries 7 entries; R3 fails a catalogue entry with no demo case. |
| `deno lint` clean | **Holds at repo scope** — 197 files, exit 0. |
| `deno check` clean | **Holds for every batch except aspire**, which cannot load `typescript/bin/tsc`. |
| `deno fmt` clean | **Was false** — 4 files red in the app, 2 more at repo scope. Fixed (below). |
| `deno task check` green | **Was false** — the app task is `fmt --check && lint && check`, so the fmt failure made the whole gate red. |

## DONE

| # | Item | Commit |
| :-- | :-- | :-- |
| 1 | Four files formatted — the app's `deno task check` gate is green for the first time | `809b130` |
| 2 | Area chart hover bands clipped to the frame, marker kept on the point | `433caf9` |
| 3 | A `null` footer column renders in the absent tone | `91dc1b2` |
| 4 | The two non-app files formatted — root `fmt:check` green | `f82a8f4` |

### The two defects rendering found that reading did not

**The hover bands.** `ComparisonAreaChart` gave each hit band a full step of width and centred it
with `translateX(-50%)`. That is geometrically right in the middle, and wrong at the ends: the
first and last bands hang outside the frame by half a step. On the gallery's four-point chart that
is ~14% of the frame's width — enough that hovering the **y-axis gutter** pops the first readout.

The obvious fix is to clip the end bands, and the obvious fix is wrong: the crosshair, the dot and
the tooltip all sit at `50%` of their band, so a clipped band would draw them off the point they
name. The band now reports the point's x back out as `--hit-x`, a percentage of *its own box* —
50% for every interior band, off-centre only where an end band was clipped. Tiling is unaffected,
because adjacent bands still meet exactly at the midpoint between their points.

Verified by rendering four points:

```
bands   0–17.92  17.92–50  50–82.08  82.08–100      (was -14.17–33.96 … 66.04–114.17)
marker  1.875    33.958    66.042    98.125         (x-ticks: 1.875 33.958 66.042 98.125)
```

Every marker lands on its own x-tick, and no band leaves the frame.

I got this wrong once first — I read the band as starting at its point, missed the
`translateX(-50%)`, and "fixed" a bug that was not there. Reverted before committing.

**The null footer column.** `FooterColumns` renders the em dash for a `null` value, but the tone
rides on `data-direction`, and `null` with no explicit direction emitted `inherit`, which no rule
matches — so the em dash painted in the full-contrast foreground and read as a value. The gallery
ships exactly that case (`Wire`). Absence now wins over a caller-supplied direction.

### Spec conformance, read off the rendered markup

- `DeltaChip` — pill, `data-direction`, signed value, em dash for `absent`. Padding resolves to
  2px/8px, 0.75rem/600, `color-mix(… 12%)` over the money token.
- `SemicircularGauge` — `viewBox 0 0 200 110`, `r=80`, `stroke-width=18`, `stroke-linecap="butt"`
  on track and every segment, dash pairs summing to 100, centre label over the figure, baseline rule.
- `SegmentedControl` — `role=tablist`, `aria-selected` on every cell, `is-selected` fills.
- `ComparisonAreaChart` — SVG geometry, hairline rounded frame, dashed gridlines, comparison layer
  at 18% with no stroke, 2px current line, CSS-only crosshair/dot/tooltip.
- `FooterColumns` — equal columns, hairline dividers on leading edges, uppercase label, tabular amount.
- `WidgetCard` — five bands emit in order; `--ns-radius-3xl` surface, header restored to a row.

## REMAINING

1. **No upstream; not pushed.** The branch has never been pushed (`fatal: no upstream configured`),
   so nothing here is visible on a remote. Owner's call, same as the sibling tree.
2. **The two trees have diverged on the same component.** `SegmentedControl` exists in both this
   tree and `wave7-billing-steer2` (`fix/steer2-consolidated`). Pass 6 added a `--wrap` modifier
   there for a nine-cell runs filter; this copy has only `--sm` and `--block`. These are two copies
   of one component drifting apart — the same failure mode passes 5 and 6 each had to repair.
   Nothing merges them until someone decides which copy is canonical.
3. **`MoneyText`'s API is still two APIs.** This tree's carries `size`/`signed`/`tone`/`compact`;
   the billing tree's hero size lives on `WidgetCard.Hero`. Reconcile on convergence.
4. **Root `deno task check`: the aspire batch exits 1** — `aspire/node_modules` is absent, so
   `typescript/bin/tsc` cannot load. Environmental, pre-existing, identical on master, and needs
   `npm install` in `aspire/`. Every other batch exits 0.
5. **Not re-verified visually against the reference images.** I cannot see them. The critique was
   written by an agent that could; this pass proves the code matches the critique's *numbers*, not
   that the numbers match the images.

## Verification

- `deno task fmt:check` (root, 2 batches): **exit 0 / exit 0**. Was 6 files red.
- `deno task lint` (root): **exit 0**, 197 files.
- `deno task check` (root): every batch **exit 0** except the aspire batch (REMAINING 4).
- `deno test --allow-all tests/design_contract_test.ts tests/money_test.ts tests/status_test.ts`:
  **30 passed**, 0 failed.
- App `deno task check` (`fmt --check . && deno lint . && deno check`): **green** — it was red at
  the start of this pass.
- `deno task build`: **exit 0**; `ns-gauge`, `ns-areachart`, `ns-footer-cols`, `ns-delta-chip`,
  `ns-segmented` and `ns-widget` all present in the emitted client CSS, and `--hit-x` in it too.
  The build did **not** dirty any tracked source in this tree (unlike the billing tree, where
  `vite build` rewrites the `withRouteContract` routes).
- Rendered all five components plus the composed `WidgetCard` through
  `preact-render-to-string` (scratch harness, `.llm/tmp/render-proof.tsx`, run `--no-lock`).
- Tree clean: `git status --porcelain` shows only untracked run inputs. Lock hygiene: `deno.lock`
  untouched; the render harness ran `--no-lock`.
