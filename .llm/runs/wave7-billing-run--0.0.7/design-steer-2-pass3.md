# Design steer #2 — pass 3: verification, consolidation, and the last two token names

**Why this pass exists.** Two prior passes reported steer #2 as done. That branch's own
history contains an overclaim (`b8ae695` exists to correct a false "every scaffold string is
gone" in `2da2189`), so this pass re-verified every claim before building anything, and then
did only what was genuinely left.

## State before this pass (verified, not taken on trust)

| Tree | Branch | Head | |
| :-- | :-- | :-- | :-- |
| `wave7-design` | `design/ledgerline-ui` | `4261c92` | 7 components, gallery, tests |
| `wave7-billing` | `master` | `38f4aee` | money layer + renderer landed |
| `wave7-billing` | `fix/steer2-product-defects` | `58a79aa` | exception chip + shadows |
| `wave7-billing` | `fix/steer2-provisional-tag-contrast` | `27b8950` | provisional chip (parallel) |

The steer's work was spread across three heads and none of it was pushed.

## DONE

### Verified, not rebuilt (`design/ledgerline-ui`, 7 components)

All five the steer named, plus `WidgetCard` and `MoneyText`, exist as real modules, each with a
registry entry **and** a render case in `components-view.tsx`. Gallery registration is not
manual — `R3 — every Ledgerline catalogue entry has a gallery demo` fails if a catalogue entry
lacks a demo, so it cannot silently rot.

The critique's items are regression-guarded by `tests/design_contract_test.ts`, which is what
makes "done" durable rather than a claim:

- `T2a — no component reaches for a ramp step` — the `paper-12` / `rust-6` defect family
- `C8 — no hard offset shadow survives` — the brutalist `3px 3px 0`
- `M8 — only lib/money turns a decimal into text`
- `H8 — gauge arcs terminate with a flat cut` — `stroke-linecap="butt"`
- `R8 — no scaffold fiction ships` — the `api-gateway` / `eu-west` / `v2.4.1` strings
- `T1` — tokens.json ↔ tokens.css parity, and every token a component uses is declared

Verification: `deno task check` clean on the app; **62 tests pass**; `deno lint` clean
(197 files); `deno fmt --check` clean apart from four files that predate the branch.

### Fixed: a fmt defect this branch introduced (`wave7-design`, `310a123`)

`design-steer-2-report.md` recorded `tests/status_test.ts` as pre-existing fmt drift. It is
not — the branch created it in `24cccd5`, so the debt was ours. Formatted (import ordering and
one `for-of` wrap, no behaviour change). The four genuinely pre-existing files
(`routes/index.tsx`, `router.ts`, `services/runs/src/lib/stream.ts`,
`streams/run-console-schema.ts`) were left alone.

### Verified: the money contract is fixed in the product tree

Rendered the real component rather than trusting the prior report's transcript:

```
"100"      -> <span class="ns-money-text" data-money-sign="pos">…<span class="ns-money-text__currency">$</span>100.00</span>
"-1204.5"  -> …>-1,204.50           data-money-sign="neg"
"0.005"    -> …>0.005               metered precision survives
"1240500"  -> …>1,240,500.00
null       -> —  +  sr-only "not measured"
```

The critique's exact case is fixed: `"100"` now prints `$100.00`, not `$100`. Currency is a
separate prefix element spaced by `inline-flex` + `gap`, never concatenated as `100.00USD`.
`font-variant-numeric` comes from the class, not an inline style. `lib/money.ts` is the only
thing that turns a decimal into text (rule M8), and the component no longer re-derives sign.

### Fixed: the last two ramp-step/shadow leaks (`fix/steer2-consolidated`, `7f044c1`)

Both were deliberately deferred by the previous pass as needing a token-layer decision. The
design tree had already made that decision, so porting it is not inventing a token.

- **`switch.css`** — the thumb used `--ns-paper-12`. The paper ramp inverts, so a thumb that
  must stay light in both themes cannot be a ramp step: in dark, paper-12 is near-white and
  the thumb's own 1px ring (paper-12 at 10%) vanished into it. The comment already claimed
  "deliberately not a ramp step" while the declarations used one — intent recorded, never
  applied. Now `--ns-control-thumb` (`#ffffff` light, `var(--ns-paper-12)` dark); the ring
  mixes `--ns-fg`.
- **`sheet.css`** — used `--ns-shadow-xl`, which is omnidirectional. A drawer is docked to an
  edge and casts away from it. Now `--ns-shadow-drawer`.

Both added to `tokens.json` **and** the generated `tokens.css` in light and dark, with values
matching `design/ledgerline-ui` so the trees do not drift. Parity checked programmatically:
**175 declared in JSON, 175 defined in CSS, no divergence either way.** Verified no
`--ns-paper-12` reference survives outside the token file and its comments, and no
`Npx Npx 0` offset shadow survives anywhere.

### Consolidated: three unpushed heads into one

`fix/steer2-product-defects` and `fix/steer2-provisional-tag-contrast` both branched from
`38f4aee` without seeing each other, so the steer's billing work lived on two branches.
Merged into **`fix/steer2-consolidated`** (`7d299b2`) — no file overlap, so it is a clean
merge and the provisional commit is preserved unchanged. The owner now has one branch to
review instead of two.

## REMAINING

1. **The five components are still not in the product tree.** They exist and are tested on
   `design/ledgerline-ui`. Porting them needs token-layer reconciliation — the design branch
   carries `--ns-radius-3xl`, `--ns-shadow-ambient`, `--ns-tip-bg/fg`, `--ns-series-1..6` that
   master does not, and master's `tokens.css`/`tokens.json` have diverged (`7e7f9e1`). This
   stays a merge decision; I did not half-wire them.
2. **`fix/steer2-consolidated` is 2 commits behind master.** The live agent landed `1cd0f34`
   and `c5d57c6` (webhooks). I checked for collision: **zero file overlap**, so the merge is
   clean. I did not rebase, because rewriting history under an actively committing agent is
   how the earlier incident happened.
3. **Pre-existing lint debt, untouched.** 5 problems in `aspire/.helpers/register-apps.mts`,
   `sagas/runtime.ts`, `routes/runs/(_islands)/saga-instances.tsx`,
   `triggers/daily-maintenance.ts`. All four files predate the branch.
4. **`aspire/node_modules` is absent in both checkouts**, so the aspire group of
   `deno task check` fails on `Unable to load .../aspire/node_modules/typescript/bin/tsc`.
   Environmental, identical in both trees, present on master — needs `npm install` in
   `aspire/`, not a code fix.

## Incident: concurrency, again

`wave7-billing` has an actively committing agent (master moved `38f4aee` → `c5d57c6` while I
worked, with uncommitted `services/webhooks/*` changes in the tree). I did **not** commit or
check out in that worktree. All billing work was done in a new linked worktree
`wave7-billing-steer2`, which is the mitigation the previous pass asked for. This is the third
recorded collision in this run; it needs separate worktrees or a commit gate, not care.

## Verification

- `deno test --allow-all` on `fix/steer2-consolidated`: **42 passed**, 0 failed (run after the
  token commit).
- `deno task check`: app group clean.
- `deno fmt --check`: clean on all 4 files touched.
- Token parity: 175/175 JSON ↔ CSS.
- `deno.lock` untouched in both trees (the render check ran from a scratch directory with
  `--no-lock`, deleted afterwards).

## Corrections to earlier records

- **`tests/status_test.ts` is not pre-existing drift** — this branch created it.
- **rust-6 is 54.5% lightness, not 45.5%** (45.5% is rust-7). The finding stands.
- **The rust reference is in `assets/ui/exception-badge.css`, not `exception-badge.tsx`.**
