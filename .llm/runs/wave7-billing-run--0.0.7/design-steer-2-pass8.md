# Design steer #2 — pass 8: verify, then repair what verification found

**Branch:** `fix/steer2-consolidated` · **Worktree:** `/home/agent/projects/netscript/wave7-billing-steer2`
**Commits:** `2550ac2` → `0d8fe41` (3 commits). Not pushed — no upstream; owner reviews and merges.

## Why this pass exists

The steer still asks for the five components, and passes 5–7 each closed them. So this
pass did not build anything. It started by asking *which tree* those closures live in,
because the answer turns out to be two trees at once, and then rendered what was already
there rather than inheriting the claims.

### First: there are two of everything

Steer #2 was worked in parallel in two worktrees of the same repo:

| Branch | Worktree | vs `master` |
| :-- | :-- | :-- |
| `design/ledgerline-ui` | `wave7-design` | 9 ahead, **41 behind** |
| `fix/steer2-consolidated` | `wave7-billing-steer2` | 25 ahead, **2 behind** |

`design/ledgerline-ui` branched at `a110230`, before 41 commits of backend work reached
master. Pass 7 ran there. This tree is 2 commits from master, so **this is the canonical
line** and pass 8 worked here. The choice is recorded in `RECORD.md` with the salvage
list, because "a pass closed it" is worth nothing until you know which tree it was in.

### Then: the inherited claims, checked

| Claim | Verdict |
| :-- | :-- |
| All five components built | **Holds** — `delta-chip`, `semicircular-gauge`, `segmented-control`, `comparison-area-chart`, `footer-columns` (+ `widget-card`) all present, all in `ledgerlineCatalog` with demos. |
| Brutalist `3px 3px 0` shadows gone | **Holds** — grep over source returns nothing; `.ns-btn--pill` is `border-radius: var(--ns-radius-full)`, hairline border, hover tint, no offset. |
| Money renders `$100.00`, currency spaced | **Holds** — rendered: `100`→`$100.00`, `100.5`→`$100.50`, `0`→`$0.00`, `4158250.5`→`$4,158,250.50`, `null`/`abc`→em dash + `sr-only`. Currency is its own `<span>`, so no `100.00USD`. |
| Dark-mode exception badge on a semantic token | **Holds** — `exception-badge.css` uses `--ns-money-neg` / `--ns-destructive-subtle` / `--ns-destructive-border`, and says why in a comment (rust-6 is ~3.4:1 on a dark card). |
| Gallery free of scaffold fiction | **Holds** — no `api-gateway`, `eu-west`, or `v2.4.1`. |
| Gauge matches the critique's numbers | **Holds** — `viewBox 0 0 200 110`, `r=80`, `stroke-width=18`, `stroke-linecap='butt'`. |
| `deno task lint` clean | **Was false at repo scope, and stays false** — 4 problems, all pre-existing, none in a file this branch touched. Verified on master's own copies of those 3 files: same 4 problems. |
| Pass 7's two fixes are in | **False here** — pass 7 ran in the *other* tree. Neither fix was present. |

## DONE

| # | Item | Commit |
| :-- | :-- | :-- |
| 1 | A `null` footer column renders in the absent tone | `fcc88e3` |
| 2 | The area chart's hover bands are clipped to the frame | `b0b8612` |
| 3 | `WidgetCard.Hero`'s dead `size` prop removed | `0d8fe41` |
| 4 | Canonical-tree decision + salvage list recorded in `RECORD.md` | `0d8fe41` |

### 1 — the null footer column

`FooterColumns` renders the em dash for a `null` value, but the tone rides on
`data-direction`, and `null` with no explicit direction emitted `inherit`, which no
rule matches — so the em dash painted in the full-contrast foreground and read as a
value. The gallery ships exactly that case: the `Wire` column.

Absence now wins over a caller-supplied direction, because once the value is null there
is no amount for a direction to qualify. Rendered both shapes: `{ value: null }` and
`{ value: null, direction: 'in' }` now both emit `data-direction="absent"`; a measured
value keeps its own.

### 2 — the hover bands

Each band was centred on its point with `translateX(-50%)` and given a full step of
width, so the first and last hung outside the frame by half a step. Worth stating
plainly: `.ns-areachart__frame` has **no `overflow: hidden`**, so nothing clipped the
overhang — on the gallery's four-point chart it reached ~14% of the frame's width past
each edge, into the y-axis gutter. Hovering a tick label popped the first point's
readout.

An end band cannot simply be clipped: the crosshair, dot and tooltip all sat at `50%`
of their band, so clipping would draw them off the point they name. The band now
reports the point's x back out as `--hit-x`, a percentage of *its own box* — 50% for
every interior band, off-centre only where an end band was clipped — and the
`translateX(-50%)` is gone, since inline `left`/`width` now name the band's real box.

Verified by rendering **every point count from 1 to 8**, not just the gallery's four:
bands tile with no seam, cover 0..100, stay inside the frame, and every marker lands on
its own x-tick. Four points give `0–17.92, 17.92–50, 50–82.08, 82.08–100` against
ticks `1.875, 33.958, 66.042, 98.125` — matching pass 7's independent numbers.

I first convinced myself two points would overlap the bands, arithmetic in hand.
Rendering counts 1–8 disproved it (for `count=2` the step is 96.25%, not 100%): the
clamped `centre ± step/2` is always the midpoint between adjacent points, so clamping
binds only at the two ends. The harness earned its keep by correcting me.

### 3 — `WidgetCard.Hero`'s `size` prop

Found while reconciling the two `MoneyText` shapes. `Hero` took `size?: 'md' | 'lg'`,
and the `--lg` rule set `--ns-text-4xl` — the same value the base
`.ns-widget__hero .ns-money-text` rule already sets. No call site ever passed it, and
`4xl` (2.25rem) is the largest type token in `tokens.css`, so there was no step for it
to step to; its only distinct effect was a `padding-block-start`.

Removed rather than left in place. A variant whose name promises a size and whose
stylesheet cannot deliver one is worse than no variant — the next caller reads the prop,
passes `'lg'`, and silently gets the default. A page-level hero is still wanted (the
critique §5 asks for one that commands the page); it needs a display-size token at the
token layer first, and `tokens.json` is the source for that, not this band.

## REMAINING

1. **Not pushed; no upstream configured.** Owner's call, unchanged since pass 4.
   25 commits ahead of master, **2 behind** (`1cd0f34`, `c5d57c6`, both webhooks).
   Not rebased — rewriting history under an actively committing agent is how this run's
   earlier incident happened.
2. **Two `MoneyText` shapes, still.** Here: `value`/`currency`/`class`, with hero
   typography owned by `.ns-widget__hero .ns-money-text`. Design tree: adds
   `size`/`signed`/`tone`/`compact`. Recorded in `RECORD.md` with a recommendation
   (keep card-owned typography; port `signed`/`tone`/`compact`). Not done here because
   it changes call sites in both trees and only matters when they converge.
3. **`deno task lint` is red at repo scope — 4 problems, none fixable in a design
   steer.** `sagas/runtime.ts:8` unused import; `triggers/daily-maintenance.ts:27`
   `async` with no `await`; and two unused imports in
   `aspire/.helpers/register-apps.mts`, a file whose first line reads *"GENERATED BY
   @netscript/cli. DO NOT EDIT."* — those two come back on the next
   `netscript generate`. Confirmed present on master's own copies of all three files,
   and confirmed untouched by this branch. Fixing the generator or excluding
   `aspire/.helpers/` is upstream work.
4. **The aspire batch of root `deno task check` exits 1** — `aspire/node_modules` is
   absent, so `typescript/bin/tsc` cannot load. Environmental, identical on master,
   needs `npm install` in `aspire/`. Every other batch exits 0.
5. **The build re-dirties five route files.** Reproduced a third time this pass:
   committed tree was clean, `vite build` succeeded, and the five `withRouteContract`
   files came back on one line. Diff is whitespace-only (no semantic change). Restored
   with `git checkout --`; the fix belongs to the generator. Full reproduction in
   `RECORD.md`.
6. **Not verified visually against the reference images.** I cannot see them. This pass
   proves the code matches the critique's *numbers*, not that the numbers match the
   images.

## Verification

- `deno task fmt:check` (root, 2 batches): **exit 0 / exit 0**.
- `deno test --allow-all`: **55 passed**, 0 failed.
- App `deno task check` (`fmt --check . && deno lint . && deno check`): **exit 0**.
- Root `deno task check`: batches **exit 0 / exit 0**, aspire batch **exit 1**
  (REMAINING 4).
- `deno task lint`: **4 problems**, all pre-existing, all in files this branch never
  touched, all reproduced on master (REMAINING 3).
- `vite build`: **exit 0**. `--hit-x: 50%` present in the emitted client CSS;
  `ns-delta-chip`, `ns-gauge`, `ns-areachart`, `ns-footer-cols`, `ns-segmented`,
  `ns-widget` all present; `hero--lg` count is **0** in both bundle outputs, so the
  removed variant left no trace.
- Rendered: footer columns (null, null-with-direction, measured), the chart at every
  point count 1–8, a composed `WidgetCard` hero, and `MoneyText` across
  `100 / 100.5 / -100 / 0 / 4158250.5 / null / abc` and with no currency.
- Tree clean at end: `git status --porcelain` empty. Lock hygiene: `deno.lock` and
  `apps/ledgerline-web/deno.lock` untouched; every scratch run used `--no-lock`.

Render harnesses are scratch and were removed from the app tree before the gates ran —
`apps/ledgerline-web/.llm/` is **not** gitignored (root `.gitignore`'s `.llm/tmp/` is
anchored), so leaving one there turns the app's own `check` gate red. Copies kept in
the ignored root `.llm/tmp/`; to re-run one, copy it into
`apps/ledgerline-web/.llm/tmp/`, run `deno run --allow-all --no-lock <file>`, then
delete the directory.
