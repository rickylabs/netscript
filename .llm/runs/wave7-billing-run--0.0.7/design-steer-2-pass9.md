# Design steer #2 — pass 9: the steer was reported done; it was not

**Branch:** `fix/steer2-consolidated` · **Worktree:** `/home/agent/projects/netscript/wave7-billing-steer2`
**Commits:** `e868cc2` → `7e1687c` (4 commits). Not pushed — no upstream; owner reviews and merges.
**Branch vs `master`:** 31 ahead, 2 behind (`1cd0f34`, `c5d57c6`, both webhooks). Not rebased.

## Why this pass exists

Passes 5–8 each closed the steer. So this pass built nothing from the critique's
build list. It started by checking the closures against the two files the critique
named, and against the repo's own `DESIGN.md` rules, instead of inheriting the
claims. Three real defects were still open, and one recorded fact was wrong.

The pattern across all three is the same: **a rule was checked where the new work
was, not where the old work still was.** The widget card took C7; the base card
did not. The gallery's three named strings were deleted; the scaffold's
vocabulary was not. The run summary was named in the critique as the defect; the
three new widgets were built beside it and it was never touched.

## DONE

| # | Item | Commit |
| :-- | :-- | :-- |
| 1 | The base `.ns-card` takes C7: 24px + ambient shadow, panel steps down, title steps up | `25a9a12` |
| 2 | `run-summary.tsx` rendered in the widget grammar — the screen the critique named | `00bf74f` |
| 3 | The scaffold sweep renamed the fiction instead of removing it — finished, and R8 hardened | `57085f8` |
| 4 | Corrections and three findings recorded in `RECORD.md` | `7e1687c` |

### 1 — two card radii on one page

`DESIGN.md` C7: the containing card is `--ns-radius-3xl` (24px) with the ambient
shadow, a panel inside steps down to `--ns-radius-xl`, nothing shares a radius
with the thing it sits inside.

`surface-styles.css` gave `.ns-card` **and** `.ns-panel` one shared rule at 12px
with no shadow. `WidgetCard` set 24px + ambient on top. On `/runs/[id]` the
consequence was literal: a bare `Card` summary at 12px with no elevation sat
directly above a `WidgetCard` gauge and a `WidgetCard` chart, both at 24px.

Split the rule. Card: 24px + `--ns-shadow-ambient`. Panel: 12px, no shadow, so it
cannot read as a second card competing with its host. Title: `--ns-text-sm` →
`--ns-text-base`, because it was 14px — the exact size of the description under
it — which is the critique's "the titles have no presence" (§5).

Checked before raising the radius: no card nests inside a card in this tree, so
nothing can collide. `stats-grid` and `data-table` are `Card`s and now match the
widgets they sit beside.

### 2 — the run summary

The critique §2 and §5 named `run-summary.tsx` as the page where the five-band
grammar did not exist: "a generic metadata card and a separate 4-box `StatsGrid`
… disconnected rectangular tiles", four stats of identical weight, "no large hero
number that commands the page". It still read exactly that way.

It is now one widget: period as the heading, computed total as the hero, three
counts as hairline footer columns.

- Absence carries through — an unanswered console leaves every column `null`, so
  the hero and all three columns show the em dash, not `$0.00` (M1).
- The two warnings are now conditional on the fact they describe: exceptions only
  when something failed, console-unavailable only when the projection missed.
- The heading is an `h1`, not `WidgetCard.Title` — it is the route's only
  top-level heading and the title component renders a `p`. It carries the band's
  own title class. Dropping it would have left the route with no `h1`.
- The `not-found` / `denied` / `unavailable` states stay bare `Card`s: a card with
  no single answer has no hero band (C2).

Rendered in every state: four bands present, `h1` preserved, `$1,240,500.00` as
the hero, three columns, em dashes throughout when the console is absent, the
failed notice absent when nothing failed.

### 3 — the scaffold was renamed, not removed

Rule 8 was closed when `api-gateway`, `eu-west` and `v2.4.1` were deleted. Those
were the words someone had already thought to name. Still shipping, in the
billing product's own gallery:

- a **"Build pipeline"** card — "Twelve checks across lint, types, and tests. The
  slowest stage is the integration suite at 96 seconds"
- a **"Deployment region"** select whose options were billing periods
- **"P95 latency / 184ms / All regions"** as the `StatsGrid` demo
- `Enable build cache` · `Auto-promote previews` · `Maintenance mode` ·
  `Locked by org policy` · `Service name` · `API key` · `Upload` · `Migration` ·
  `Deployment inspector` · `Region capacity` · `Loading deployments`
- three design-gallery page titles branded **"NetScript design system"**, one
  describing **"the scaffolded @netscript/fresh-ui theme"**
- the landing page's stat row measuring the app: **"UI source: app-owned"**,
  **"Theme: paper & ink"**, **"see RECORD.md"**

All replaced with Ledgerline vocabulary. The landing page's stat row is deleted
rather than rewritten: that layer receives no billing data, so the cards could
only describe their own build, and a card that counts the app is a card the
customer cannot read. `appName` went with it.

The R8 denylist is *why* this survived three passes under a green test, so the
test now carries the terms plus two patterns for the **shape** of the fiction:
naming the UI registry a component was copied from, and prose that points at the
repository record instead of the domain. The registry pattern caught a fourth
site the hand-sweep missed — the design gallery's own page descriptions.

## Correction to pass 8

Pass 8 recorded the build's re-dirtied `withRouteContract` diff as
"whitespace-only". It is not. Stripping every whitespace character from both
forms leaves a **one-character** difference in all five files, always the same
character: `deno fmt` breaks the too-wide call across lines and a broken object
literal gains a trailing comma; the generator emits one line with none. No
behavioural difference, but the next session sent after a line-width knob would
find nothing — the fix is a trailing comma.

## The six ranked items, verified in this tree

Not inherited from a prior report — each checked here:

| Item | Verdict |
| :-- | :-- |
| 1. Brutalist `3px 3px 0` shadows gone, pill action added | **Holds** — grep clean; `.ns-btn--pill` is `radius-full`, hairline border, hover tint, no offset. |
| 2. `DeltaChip` beside the hero | **Holds** — `WidgetCard.Hero` holds `MoneyText` + `DeltaChip` on one baseline in `run-comparison` and `billed-summary`. |
| 3. Five-band `WidgetCard` | **Holds now** — was widget-only; the base card took the radius and title this pass. |
| 4. Money: `$100.00`, currency spaced | **Holds** — `money_test.ts` green; `moneyParts` owns every digit; currency is its own `<span>`. |
| 5. SVG gauge + area chart | **Holds** — `viewBox 0 0 200 110`, `r=80`, `stroke=18`, `stroke-linecap='butt'`; the chart is hand-authored SVG. |
| 6. `SegmentedControl` + `FooterColumns` | **Holds** — selected cell fills (`background`, not `border`); footer columns divide by 1px rules. |
| Dark-mode exception badge | **Holds** — `--ns-money-neg` / `--ns-destructive-subtle` / `--ns-destructive-border`, with the reasoning in a comment. |

## REMAINING

1. **Not pushed; no upstream configured.** 31 ahead, 2 behind master. Owner's
   call, unchanged since pass 4. Not rebased — rewriting history under an
   actively committing agent is how this run's earlier incident happened.
2. **The design tree is still a second copy.** `design/ledgerline-ui`
   (`/home/agent/projects/netscript/wave7-design`) is 9 ahead and 41 behind
   master and none of this pass's four fixes are in it. It is not the canonical
   line (pass 8's decision, `RECORD.md`), and its `home-view.tsx` still carries
   the "UI source / app-owned" narration this pass removed here. Salvage or
   delete — do not assume a component exists there because it exists here.
3. **`deno task lint` is red: 1 problem, pre-existing.** `triggers/daily-maintenance.ts:27`
   `require-await`. Untouched by this branch (checked against `master...HEAD`).
   Pass 8 saw 4 problems here; the other three are gone, so someone fixed them.
4. **The aspire batch of root `deno task check` exits 1** — `aspire/node_modules`
   is absent, so `typescript/bin/tsc` cannot load. Environmental, identical on
   master. Every other batch exits 0.
5. **The build re-dirties five route files.** Reproduced a fourth time, and the
   cause is now known precisely (one trailing comma — see correction). Restored
   with `git checkout --`; the fix belongs to the generator.
6. **Two `MoneyText` shapes.** Unchanged from pass 8. Porting `signed`/`tone`/
   `compact` from the design tree was **considered and rejected**: no call site in
   this tree needs them — deltas come from `movement()`, chart ticks from
   `formatMoneyCompact()` — so porting would add props nobody calls, which is the
   same dead-API mistake `WidgetCard.Hero`'s `size` prop was (`0d8fe41`).
7. **A page-level hero is still wanted and still has no token.** Critique §5 asks
   for one number that commands the page. `--ns-text-4xl` (2.25rem) is the
   largest type token, and that is already the card hero's size, so there is no
   step to step to. Needs a display-size token in `tokens.json` first.
8. **Not verified visually against the reference images.** I cannot see them.
   This pass proves the code matches the critique's numbers and the repo's own
   rules, not that those numbers match the images.

## Verification

- `deno task fmt:check` (root, 2 batches): **exit 0 / exit 0**.
- `deno test --allow-all`: **55 passed**, 0 failed. `design_contract_test.ts`
  alone: **13 passed**.
- App `deno task check` (`fmt --check . && deno lint . && deno check`): **exit 0**
  — verified after each commit.
- Root `deno task check`: batches **exit 0 / exit 0**, aspire batch **exit 1**
  (REMAINING 4).
- `vite build`: **exit 0**. The five re-dirtied route files were restored after a
  whitespace-and-trailing-comma-only diff was proven (no behavioural change).
- Rendered `RunSummary` in five states (clean totals, failed items, absent
  totals, and each terminal state) before committing it.
- `RECORD.md` additions are `deno fmt`-clean and add 67 lines with **zero**
  modifications to existing lines — the file is not fmt-managed at 100 columns
  (273 pre-existing deviations) and the gate does not cover it, so running
  `deno fmt` on it would have reflowed the whole file.
- Tree clean at end: `git status --porcelain` empty. Lock hygiene: `deno.lock`
  and `apps/ledgerline-web/deno.lock` untouched; every scratch run used
  `--no-lock`.
