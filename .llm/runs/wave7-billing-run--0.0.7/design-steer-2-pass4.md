# Design steer #2 — pass 4: the five components land in the product tree

**Branch:** `fix/steer2-consolidated` · **Worktree:** `/home/agent/projects/netscript/wave7-billing-steer2`
**Commits:** `fcdebb3` → `ba37797` (10 commits). Not pushed — owner reviews and merges.

## Why this pass exists

Pass 3 left one item open and said why it was not half-wired:

> **The five components are still not in the product tree.** Porting them needs token-layer
> reconciliation — the design branch carries `--ns-radius-3xl`, `--ns-shadow-ambient`,
> `--ns-tip-bg/fg`, `--ns-series-1..6` that master does not.

That is this pass. The components themselves already existed and were tested on
`design/ledgerline-ui`; I verified that rather than trusting pass 3's claim, and did not rebuild
them.

## DONE

| # | Item | Commit |
| :-- | :-- | :-- |
| 1 | Reconcile the token layer — 13 missing `--ns-*` names | `fcdebb3` |
| 2 | `ledgerlineCatalog`: stop counting product components as upstream (R3) | `cc4c774` |
| 3 | `DeltaChip` | `31a4fed` |
| 4 | `WidgetCard` — the five-band card grammar | `bee83d5` |
| 5 | `SemicircularGauge` | `bd061f7` |
| 6 | `SegmentedControl` | `c81a7b5` |
| 7 | `ComparisonAreaChart` (+ gallery fixtures) | `5ceb1eb` |
| 8 | `FooterColumns` (+ `RangeControlDemo` island) | `fc20122` |
| 9 | Destructive button hover: ramp step → role (found by the test) | `460f040` |
| 10 | Scaffold fiction deleted from the gallery (R8) | `ba37797` |
| 11 | `tests/design_contract_test.ts` ported | `ba37797` |

### The token reconciliation

Thirteen names, all semantic rather than presentational: `--ns-series-1..6` (the fixed chart
cycle, H3), `--ns-chart-grid`, `--ns-chart-axis`, `--ns-absent` (the tone a movement takes when
it was never measured), `--ns-tip-bg/fg`, `--ns-radius-3xl` (24px, C7), `--ns-shadow-ambient`
(C8). Declared in both themes where theme-variant. Values taken from `design/ledgerline-ui`, not
invented, so the trees do not drift. Parity 188/188 at that commit, 189/189 after the
`--ns-destructive-hover` addition.

### Registration is now a test, not a claim

R3 was being violated: `registryMeta.total` read **72** while `@netscript/fresh-ui` publishes
**66** — the six product components had been folded into `registryCatalog`. Ledgerline's own
components now live in `ledgerlineCatalog` with their own `ledgerlineMeta` (12 entries), and the
upstream count is back to a fact about the upstream package.

Every catalogue entry has a `renderDemo` case, enforced by test.

### Two decisions that deviate from the critique, deliberately

**The hero's size lives on the band, not on the amount component.** `WidgetCard.Hero` styles any
`MoneyText` inside it to `--ns-text-4xl`. The design tree's `MoneyText` has a `size` prop; this
tree's does not, and extending it would have meant touching the component whose money contract
was fixed and verified one pass earlier. Putting the size on the band also means a caller cannot
forget it.

**The hero does not take the direction colour (M9).** `MoneyText` colours by sign, but a hero
states a balance, not a movement — in the reference cards the hero number is plain and only the
delta beside it is green. `widget-card.css` overrides it for the hero band only, and the
`DeltaChip` on the same baseline carries direction.

### What the ported test found unprompted

Three real defects, none of them in the critique:

1. **`button.css` hovered to `var(--ns-rust-6)`** — a ramp step, at 54.5% lightness. Imperceptible
   as a hover on paper, failing contrast on a dark card. Same family as the `exception-badge`
   defect the critic did find. Fixed with a `--ns-destructive-hover` role, stepped in the
   direction each ground needs (rust-7 light, rust-4 dark).
2. **Scaffold fiction far beyond the three strings the critic named.** `api-gateway` services with
   `eu-west` regions and a `P95` latency column, `v2.4.1` release notes, "the eu-west region
   rotates certificates tonight", and an empty state instructing the reader to run
   `netscript service:add`. The denylist also misses what nobody thought to name — the
   pattern-based checks are what caught the CLI invocation.
3. **`NS One` identity** in five places: gallery badge, composition page, tokens page, sidebar
   environment label, theme-seed catalogue entry.

### Rendered proof, not transcripts

```
MoneyText '100'  -> <span class="ns-money-text__currency">$</span>100.00     (the critic's case)
MoneyText null   -> em dash
gauge            -> 2x stroke-linecap="butt", 0 round; dasharray 77.184 (318/412)
segmented        -> is-selected pill, role="tablist"
chart            -> max 250000, 4 gridlines, comparison + area layers, labelled empty frame
chart ticks      -> $250k | 188k | 125k | 63k | 0   (topmost carries currency, M7)
chart geometry   -> gridlines y=10/37.5/65/92.5, tick tops 8.33/31.25/54.17/77.08/100%
footer columns   -> 2 columns; null renders em dash
widget bands     -> header/range/hero/body/footer all present, in document order
island           -> 1M,3M,6M,1Y renders with a working period selector
```

## REMAINING

1. **Not merged to master; still 2 commits behind it** (`1cd0f34`, `c5d57c6`, webhooks). I did not
   rebase — rewriting history under an actively committing agent is how this run's earlier
   incident happened. Line 3 of pass 3's REMAINING, unchanged.
2. **Pre-existing lint debt, untouched.** 1 problem under the app
   (`routes/runs/(_islands)/saga-instances.tsx`, unused `VNode`), plus the 4 files pass 3 recorded
   outside it. Verified none of the five files I could have formatted are mine: `git log` over my
   commits shows zero touches to `routes/customers/*`, `routes/invoices/*`, `routes/runs/[id].tsx`
   — the 5 files `deno fmt --check` flags.
3. **`aspire/node_modules` still absent**, so the aspire group of `deno task check` fails on
   `Unable to load .../aspire/node_modules/typescript/bin/tsc`. Environmental, identical on
   master, needs `npm install` in `aspire/`.
4. **`Wave 7` design tree remains the source for `MoneyText`'s richer API** (`size`, `signed`,
   `tone`, `compact`). This tree's `MoneyText` is deliberately simpler and the hero size is
   handled by the band. If the two trees are ever converged, that is the seam to reconcile.
5. **The five components are registered but not yet mounted on product routes.** They exist in
   the gallery and the vocabulary is complete; wiring `SemicircularGauge` into `routes/runs/[id]`
   and `ComparisonAreaChart` into the overview is a product-surface change, not a design one.

## Verification

- `deno test --allow-all`: **55 passed**, 0 failed (was 42 after pass 3; +13 from the ported
  contract test).
- `deno check apps/ledgerline-web/main.ts`: clean.
- `deno lint apps/ledgerline-web/`: 1 problem, pre-existing and in a file I never touched.
- `deno fmt --check`: clean on every file this branch created or edited. 5 files remain
  unformatted; all predate the branch.
- Token parity: **189 declared in JSON, 189 in CSS, no divergence either way.**
- Rendered every new component through `preact-render-to-string` and inspected the output.
- Lock hygiene: `deno.lock` untouched. The render harness ran from a scratch directory with
  `--no-lock`.

## Corrections to earlier records

- **Pass 3's "the five components are still not in the product tree" is now closed**, and with it
  REMAINING #1.
- **The R3 violation was never recorded by any prior pass.** `registryMeta.total: 72` was quietly
  wrong from `7e7f9e1` onward; the gallery's headline number was a lie about what `ui:add` would
  install.

## Packaging note

`tests/design_contract_test.ts` landed inside `ba37797` ("Delete the scaffold fiction…") rather
than in its own commit — a `git add -A` caught the untracked file. The committed content is
current and correct (`git diff HEAD` is empty); only the commit message under-describes it. I
left history alone rather than rewriting a commit I had already made.
