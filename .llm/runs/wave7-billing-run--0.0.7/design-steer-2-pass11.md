# Design steer #2 — pass 11: verified from the tree, then two things ten passes did not do

**Branch:** `fix/steer2-consolidated` · **Worktree:** `/home/agent/projects/netscript/wave7-billing-steer2`
**Commits this pass:** `a48a861` (page hero) · `76988c4` (absent tone) · `e5698dc` (record)
**Branch vs `master`:** 35 ahead, 4 behind. Not rebased. Not pushed (see REMAINING 1).
**Tree clean at end.** `deno.lock` untouched.

## Why this pass exists

Ten passes have closed this steer, and pass 10 closed it by re-deriving every item from the files.
So this pass did the same — read every component and stylesheet again rather than inheriting
pass 10's table — and then spent its effort on the two items that were still open and that no prior
pass had touched: **critique §5 (hierarchy)**, which had no token to spend, and **critique §2.1
(contrast)**, which had been quoted but never measured.

It also produced the first runtime evidence any pass has for the design surface, and it withdraws
one of pass 10's findings.

## DONE

### The five components — re-read from the files, checked against the critique's literal numbers

| Component | Critique spec | Where it is, read this pass |
| :-- | :-- | :-- |
| `DeltaChip` | pill `9999px`, padding `2px 8px`, `0.75rem`, weight `600`, `color-mix` 12%, optional glyph | `delta-chip.css:16-59` — `--ns-radius-full`, `--ns-space-0-5`/`--ns-space-2`, `--ns-text-xs`, `font-weight: 600`, `color-mix(… 12%, transparent)` on all four directions. Tokens confirmed in `tokens.css`: `9999px`/`0.125rem`/`0.5rem`/`0.75rem` |
| `SemicircularGauge` | `viewBox 0 0 200 110`, `r=80`, `stroke-width 18`, `stroke-linecap='butt'` | `semicircular-gauge.tsx:58-63` `VIEW_WIDTH 200`, `VIEW_HEIGHT 110`, `RADIUS 80`, `STROKE 18`; `butt` on track and every segment (`:132,:143`) |
| `SegmentedControl` | full-width capsule, filled active pill, hairline dividers | `segmented-control.css:8-16,86-97` — capsule container, `grid-auto-columns: 1fr`, selected cell fills with `--ns-card` + `--ns-shadow-xs`, dividers on the leading edge of every cell but the first |
| `ComparisonAreaChart` | hand-authored SVG, two layers, downward crosshair + dark tooltip | `comparison-area-chart.tsx` — SVG path geometry, gradient fill, comparison layer at reduced opacity; CSS-only hover layer (crosshair, dot, tip); band clipped to the frame (`:129-136`) |
| `FooterColumns` | N equal columns, 1px vertical hairlines | `footer-columns.css:8-35` — `grid-auto-flow: column`, `grid-auto-columns: 1fr`, 1px rule on the leading edge of each column but the first |

All five are mounted on the billing surfaces the critique named (`run-comparison`, `billed-summary`,
`run-progress` on `/runs/[id]`, `invoice-list`, `runs-table`, `run-summary`) and catalogued with
`case` entries in `components-view.tsx`, which the R3 contract test enforces.

### The three named defects

- **Brutalist shadows:** `grep -rn "3px 3px 0" assets/ components/ routes/` is clean. `.ns-btn--pill`
  exists at `button.css:97` — `radius-full`, hairline border, hover tint, no offset.
- **Money:** `money-text.tsx:48` calls `moneyParts()` and formats nothing itself; direction comes
  from `parts.direction`; the currency is its own `<span>`, so `100.00USD` cannot render.
- **Dark-mode exception badge:** `exception-badge.css:13-17` uses `--ns-money-neg` /
  `--ns-destructive-subtle` / `--ns-destructive-border`. No `--ns-rust-6` remains.

### New this pass

| # | Item | Commit |
| :-- | :-- | :-- |
| 1 | `--ns-text-display` (3rem) + a page hero one step above the card hero — critique §5 | `a48a861` |
| 2 | The absent tone was invisible at 2.35:1; stepped to 4.03:1 light / 4.81:1 dark, with the measurement as a test | `76988c4` |

**1. A page hero (critique §5).** `--ns-text-4xl` was already the card hero, so a page that needed a
larger figure had nowhere to step — the console read as a grid of equal tiles. Added
`--ns-text-display` and a card modifier that spends it (`widget-card.css`), on the card rather than
on the Hero band, which is what `widget-card.tsx:82-86` said the fix would have to be. One card per
page takes it: `billed-summary` on `/runs`, `run-summary` on `/runs/[id]`.

**2. The contrast the critique misattributed.** §2.1 said `--ns-paper-6`/`--ns-paper-7` fail for
labels and axis ticks. Measured, they do not — that text is `--ns-muted-fg`, at **6.54:1** on
paper-1, **6.82:1** on a light card, **4.81:1** on a dark one. The token that fails is the one the
critique did not name: `--ns-absent`, the em dash, was **2.35:1** on a light card and **2.16:1** on a
dark one — under the 3:1 that even a large glyph needs. Every "not measured" in the product was
rendered in a tone that does not reach the reader.

Stepped to paper-6 in light (**4.03:1**) and paper-8 in dark (**4.81:1**, clears the small-text bar).
Light stops short of 4.5:1 and that is a ramp constraint, not a choice: `--ns-money-pos` is
**4.90:1** there, so anything dark enough for the small-text bar would out-shout the real amount the
dash replaces. Dark clears it because its money ramp steps to **7.00:1**.

The numbers are now test `M1` in `design_contract_test.ts` — OKLCH→sRGB→WCAG luminance for both
themes, asserting the floor **and** the ceiling. It was verified non-vacuous: at the old value it
fails with `--ns-absent is 2.35:1 against the card in light — the em dash is unreadable`.

### Runtime evidence (first in this run for the design surface)

`deno task dev`, then:

| Request | Result | What it proves |
| :-- | :-- | :-- |
| `GET /design/components` | **200**, 282 KB | the gallery renders |
| class counts in that HTML | `ns-delta-chip` 55 · `ns-gauge` 56 · `ns-segmented` 62 · `ns-areachart` 179 · `ns-footer-cols` 68 · `ns-widget--display` 2 | all five render server-side, not just in JSX |
| `GET /runs` | **200**, 159 KB | the runs console route renders |

`/runs` renders its skeleton because no Aspire stack is up, so `BilledSummary` has no runs to
summarise — the page proves the route and the shipped CSS, not the populated card. The dev server
was killed afterwards; no processes left running.

## Corrections to earlier passes

1. **Pass 10's "dead money API" finding is wrong, and acting on it would have broken a shipped
   component.** Pass 10 recorded that `ratio()` and `formatPercent()` have "zero production call
   sites" and recommended deleting both. They have one: `movement()` at `lib/money.ts:345` calls
   both, and `movement()` backs the `DeltaChip` in `billed-summary.tsx:41` and
   `run-comparison.tsx:142` — including the page hero this pass just shipped. The earlier sweep
   excluded `lib/money.ts` from its own grep, which hid the only call site there is. **Nothing was
   deleted**; I started the deletion, hit a type error on `movement()`, and reverted. Finding
   withdrawn.
2. **Pass 10's lint count.** It recorded "325 problems" from an unscoped `deno lint .`. The repo's
   own gate (`.netscript/quality-runner.ts lint`, 227 files) is red on **exactly 2 problems, both in
   one generated file**: `aspire/.helpers/register-apps.mts:10` (`buildViteEnvVarName`) and `:19`
   (`getResourceEndpoint`).
3. **Pass 10's "not pushed — no upstream".** `origin` exists (`https://github.com/rickylabs/ledgerline.git`);
   the branch simply has no tracking branch configured. Pushing is still the owner's call.
4. **Pass 9's cause for the re-dirtied route files.** It is not a trailing comma. The Fresh generator
   emits `.withRouteContract({ … })` on one line at **105 characters**, over the `lineWidth: 100` in
   `deno.json`, and `deno fmt` splits it back into four. Five route files differ that way after any
   build; reverted, not committed.

## REMAINING

1. **Not pushed.** 35 ahead, 4 behind, no tracking branch. Owner's call since pass 4.
2. **`deno task lint` is red — 2 problems in 1 generated file, and the fix is not in this repo.**
   `aspire/.helpers/register-apps.mts` says `GENERATED BY @netscript/cli. DO NOT EDIT`, and the
   scaffold's own runner (`quality-runner.ts:10`) deliberately lints `aspire/.helpers`, so excluding
   it locally would make the gate green for the wrong reason. Root cause, located exactly:
   `packages/cli/src/kernel/assets/generated/aspire/helpers/generate-register-apps-1.ts.template`
   emits the `buildViteEnvVarName` import and the `getResourceEndpoint` helper **unconditionally**,
   while `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-apps.ts`
   emits their **call** sites only when an app has service/plugin references (`:180,194,222`). The
   generator already knows the convention — it aliases its other unused import
   (`withCacheReference as _withCacheReference`) — so the two conditionally-used symbols are the gap.
   Fixing it upstream does not turn this tree green until the CLI is republished and the helper
   regenerated, which is why this pass did not start it: it is a cross-repo change and the netscript
   worktree is a live `aspire-13.5` branch with its own PR process.
3. **The design tree is still a second copy** (`/home/agent/projects/netscript/wave7-design`,
   41 behind / 9 ahead). Pass 8 ruled it not canonical; it is drifting, not merely duplicated.
4. **A 4.5:1 absent tone in light is blocked on the money ramp, not the paper one.** Closing it means
   darkening `--ns-money-pos` (currently 4.90:1) first. Theme decision for the owner.
5. **Populated screens are unproven.** `/runs` renders its skeleton with no stack up; a populated
   console with real runs, and the gallery's dark theme, need the Aspire stack (steer #10's remit).
6. **Not verified visually against the reference images — and this pass proved why it cannot be from
   here.** Every pass assumed some future agent with vision would do it. I do not have image input:
   reading `design-references/finance-3.png` returns "this model does not support image input". The
   code matches the critique's numbers, and this pass caught one place the critique's numbers were
   wrong, but nothing in this run has been compared to the images by anything that can see them.
7. **The aspire batch of root `deno task check` exits 1** — `aspire/node_modules` absent, so
   `typescript/bin/tsc` cannot load. Environmental, identical on `master`.

## Verification

- App `deno task check` (`fmt --check . && deno lint . && deno check`): **exit 0** (185 + 120 files),
  run before the first commit and again after the second.
- `deno test --allow-all`: **56 passed**, 0 failed (was 55; +1 is the contrast test).
- `deno test --allow-all tests/design_contract_test.ts`: **14 passed** (was 13).
- The new test verified against the pre-fix token: **FAILED** at 2.35:1, then restored and passing.
- `git status --porcelain` empty at end (the five build-dirtied route files were reverted, not
  committed). `deno.lock` untouched.
