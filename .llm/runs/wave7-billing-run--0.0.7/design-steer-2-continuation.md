# Design steer #2 — continuation: the product-tree half

**Branch:** `fix/steer2-product-defects` (off `master`) · **Worktree:** `/home/agent/projects/netscript/wave7-billing`
**Commits:** `dc54d95` → `40f91d6` → `8dcedce` → `975c85e`. Not pushed — owner reviews and merges.

## Why this pass exists

The previous pass (`2da2189`, `b8ae695` on `design/ledgerline-ui`) reported the five components and the
gallery work as done, and handed two defects off to the billing tree. I re-read both trees before
building anything, because that branch's own history contains an overclaim (`b8ae695` exists to correct
a false "every scaffold string is gone" in `2da2189`).

The design half holds up. All seven items (`DeltaChip`, `SemicircularGauge`, `SegmentedControl`,
`ComparisonAreaChart`, `FooterColumns`, `WidgetCard`, `MoneyText`) exist, each has a registry entry
*and* a render case in `components-view.tsx`, and the suite is green: `deno check` clean, 30 tests pass.
I did not rebuild them.

The handoff did not hold up, and that is what this pass is.

## The handoff record was wrong in a way that mattered

`design-steer-2-report.md` says of the billing tree: *"import `moneyParts` from `lib/money.ts`, which
already exists in that tree."*

It does not exist there. `apps/ledgerline-web/lib/money.ts` is present only on `design/ledgerline-ui`
(added in `24cccd5`), which branched from `master` at `a110230` and has never been pushed. Master has
no `components/ui/money-text.tsx` either. So the fix as written could not be applied, and every amount
in the shipping product was still rendered by the float formatter.

Worse: master's `components/ui/mod.ts` re-exports `MoneyText` from `../product/mod.ts`, so *every*
money figure in the product — invoices, customer ledger, run items — went through the defective
component. It was not a corner of the app.

## DONE

| # | Item | Commit | Where |
| :-- | :-- | :-- | :-- |
| 1 | Port the money contract layer master never had | `dc54d95` | `lib/money.ts`, `tests/money_test.ts` |
| 2 | Money renderer: `$100.00`, currency separated | `40f91d6` | `product/money-text.tsx`, `assets/ui/money-text.css` |
| 3 | Exception chip readable in dark | `8dcedce` | `assets/ui/exception-badge.css` |
| 4 | Brutalist offset shadows removed, `pill` added | `975c85e` | `button.css`, `toast.css`, `desktop-update-prompt.css`, `sheet.css`, `button.tsx` |

**Money.** `MoneyText` now formats nothing. One `moneyParts()` call supplies digits and direction.
Rendered proof:

```
'100' + USD  ->  <span class="ns-money-text__currency">$</span>100.00     (was $100)
'-1204.5'    ->  $-1,204.50        data-money-sign="neg"
'0.005'      ->  $0.005            metered precision survives
null         ->  —                 plus sr-only "not measured"
```

The currency is a prefix element spaced by layout, never concatenated as `100.00USD`. The
`data-money-sign` / `data-money='absent'` contract is preserved — routes and the stylesheet select on
it. The private `Number(text)` round-trip and the `amount > 0` sign re-derivation are both gone.

**Exception chip.** Was `color/background/border` mixed from `--ns-rust-6`, a ramp step. The paper ramp
inverts, so a component must not name a step: on a dark card rust-6 lands near 3.4:1. Now
`--ns-money-neg` (rust-6 → rust-4 in dark, ~5.7:1) with the `--ns-destructive-subtle` /
`--ns-destructive-border` pair, which the theme already steps 10/20% → 12/24%. One rule, both themes.

**Shadows.** Every `Npx Npx 0` offset and its `translate(1px,1px)` press nudge is gone from
`button.css`, `toast.css` and `desktop-update-prompt.css`. They were mixed from `--ns-paper-12`, which
is 13.5% lightness in light and near-white in dark — the offsets were a stark pale slab on a dark
surface. Press is now `filter: brightness(0.96)`. `pill` is a real variant (`ns-btn--pill`), not a
hand-rolled capsule at each call site.

## REMAINING

1. **`switch.css:27,29` — thumb is `--ns-paper-12`.** Same class of defect, but a thumb that stays
   light in both themes cannot be expressed by a ramp step, and the token that names it
   (`--ns-control-thumb`) exists only on the design branch. Needs a token-layer decision, not a
   substitution. I did not invent the token here.
2. **`provisional-tag.css:6-8` — chip is `--ns-amber-6`.** A finding, not a fix. The amber ramp stops at
   amber-6 (65.5% L), which is ~2.4:1 on paper in *light* mode; stepping to the semantic `--ns-warning`
   (amber-5) makes light worse, not better. The ramp needs a darker step or a dedicated text token.
3. **`sheet.css` uses `--ns-shadow-xl`,** not a directional drawer shadow. The paper-12 leak is gone,
   but the design branch has a proper `--ns-shadow-drawer` (-8px 0 30px) that this tree should adopt.
   Noted in the CSS at the call site.
4. **The five components are not in the product tree.** They are complete and tested on
   `design/ledgerline-ui`. I did not port them: that branch carries token additions
   (`--ns-radius-3xl`, `--ns-shadow-ambient`, `--ns-tip-bg/fg`, `--ns-series-1..6`) that master does
   not, and master's `tokens.css`/`tokens.json` have diverged from it (`7e7f9e1`). Porting the
   components without reconciling the token layer would ship them half-wired. That reconciliation is a
   merge decision.

## Two corrections to the critique and the prior report

- **rust-6 is 54.5% lightness, not 45.5%.** 45.5% is `--ns-rust-7`. The finding stands — 54.5% on a
  21.5% dark card is still ~3.4:1 and fails — but the number in `design-critique-1.md` is one step off.
- **The critique cites `exception-badge.tsx:40-42`.** The rust reference is in
  `assets/ui/exception-badge.css:7-9`; the `.tsx` holds no colour. Same defect, wrong file, worth
  knowing before someone edits the component to fix a stylesheet.

## Verification

- `deno check` (app): clean.
- `deno test`: 12 money tests pass (ported with the module); 30 pre-existing tests
  (`sagas`, `refund-flow`, `negative-auth`) still pass — no regressions.
- `deno lint`: clean on every file touched.
- `deno fmt --check`: clean on all 10 of my files. Five route files
  (`routes/customers/*`, `routes/invoices/*`, `routes/runs/[id].tsx`) are unformatted; they are
  untouched by this branch and were already drifting — left alone to keep the diff to my own changes.
- Rendered every changed component through `preact-render-to-string` and inspected the output.
- Lock hygiene: `deno.lock` is untouched. The render check ran from a scratch directory with
  `--no-lock`, so no npm spec was added to the workspace.

## Incident: a concurrent commit landed on this branch

At 13:08:59, while this branch was checked out, another agent's commit
`38f4aee "Backend D: terminal compensation proved — instances API + refund + run rows"` was committed
onto it (reflog). It was on no other ref.

I preserved it as `backend/d-compensation-proof` and rebased my four commits onto `master` so this
branch carries only the steer work. **Nothing was lost, but the backend commit is now only on that
branch and on no trunk — whoever owns it should decide where it lands.** The receipt file
`.netscript/agent/opencode-receipt.jsonl` was stashed and restored by the rebase; verified at 1644
lines, unchanged.

Two agents committing into one worktree will keep doing this. It needs either separate worktrees or a
commit gate.
