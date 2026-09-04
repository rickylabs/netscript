# Design steer #2 — pass 10: verified from the tree, not from the reports

**Branch:** `fix/steer2-consolidated` · **Worktree:** `/home/agent/projects/netscript/wave7-billing-steer2`
**Commit:** `dd49441`. Not pushed — no upstream; owner reviews and merges.
**Branch vs `master`:** 32 ahead, 2 behind (`1cd0f34`, `c5d57c6`, both webhooks). Not rebased.

## Why this pass exists

Nine passes have each closed this steer. Pass 9's lesson was that a closure
inherited from a prior report is not evidence. So this pass re-derived every
item against the critique's literal numbers and against the files, and built
nothing from the critique's build list — because the build list is complete.

The steer is **done**. This pass verifies that (§1), and then spends its effort
on the two things nine passes recorded as REMAINING without ever settling:
the lint gate (§2) and the dead money API (§3).

## DONE

### The five components — each checked against the critique's literal numbers

| Component | Spec | Verified |
| :-- | :-- | :-- |
| `DeltaChip` | pill `9999px`, padding `2px 8px`, `0.75rem`, weight `600`, `color-mix` 12%, optional glyph | `delta-chip.css`: `--ns-radius-full` (9999px), `--ns-space-0-5`/`--ns-space-2` = 0.125/0.5rem = 2px/8px, `--ns-text-xs` = 0.75rem, `font-weight: 600`, `color-mix(... 12%, transparent)` on all four directions |
| `SemicircularGauge` | `viewBox 0 0 200 110`, `r=80`, `stroke-width 18`, `stroke-linecap='butt'` | `semicircular-gauge.tsx:58-61` `VIEW_WIDTH=200`, `VIEW_HEIGHT=110`, `RADIUS=80`, `STROKE=18`; `linecap='butt'` on both track and segments |
| `SegmentedControl` | full-width capsule, filled active pill, hairline dividers | `segmented-control.css`: selected cell uses `background: var(--ns-card)`, not `border`; dividers drawn on the leading edge of every cell but the first |
| `ComparisonAreaChart` | hand-authored SVG, two layers, downward crosshair + dark tooltip | SVG geometry; CSS-only hover layer (crosshair, dot, tip); crosshair drops to the baseline, never upward |
| `FooterColumns` | N equal columns, 1px vertical hairlines | `footer-columns.css`: `grid-auto-columns: 1fr`, 1px rule on the leading edge of each column but the first |

All five are mounted on the billing surfaces the critique named and registered
in the gallery with variants, including the absence state:

- `DeltaChip` — `run-comparison`, `billed-summary`; gallery lines 267-276
- `SemicircularGauge` — `run-progress`, mounted on `routes/runs/[id].tsx:96`; gallery 382, 412
- `SegmentedControl` — `invoice-list`, `runs-table`; gallery 316-352, 459
- `ComparisonAreaChart` — `run-comparison`; gallery 283
- `FooterColumns` — `run-summary`, `run-progress`, `run-comparison`; gallery 394, 427, 434, 482

### The three named defects

- **Brutalist shadows:** grep for `3px 3px 0` across `assets/` and `components/`
  is clean. `.ns-btn--pill` exists (`button.css:97`), `radius-full` + hairline
  border + hover tint, no offset.
- **Money:** `money-text.tsx` calls `moneyParts()` and formats nothing itself;
  direction comes from `parts.direction`, not a re-derived `> 0`; currency is
  its own `<span>`, so `100.00USD` cannot render.
- **Dark-mode exception badge:** `exception-badge.css:14-16` uses
  `--ns-money-neg` / `--ns-destructive-subtle` / `--ns-destructive-border`,
  with the re-stepping reasoning in the comment. No `--ns-rust-6` remains.

### New this pass

| # | Item | Commit |
| :-- | :-- | :-- |
| 1 | Two pre-existing lint errors fixed (`triggers/daily-maintenance.ts`, `sagas/runtime.ts`) | `dd49441` |
| 2 | Pass 9's lint count corrected: it recorded 1 problem; the runner's scope has at least 3 | — |

## Correction to pass 9

Pass 9 recorded "`deno task lint` is red: **1 problem**, pre-existing." There
were more, and they were masked — the runner reports one failing batch at a
time, so each fix surfaced the next. Two are fixed here; a third
(`aspire/.helpers/register-apps.mts`, `buildViteEnvVarName` unused) is now
visible and still open.

Both fixed files were verified byte-identical to `master` before editing, so
neither is this branch's debt; that part of pass 9 was right.

- `triggers/daily-maintenance.ts:27` — the handler does synchronous work, but
  `TriggerHandler` is typed `(event, context) => Promise<...>`, so `async` is
  contractually required and `require-await` cannot see it. Removing `async`
  would break the type, so this is documented and suppressed — matching the
  sibling `incoming-file-watch.ts:17`, which carries the same suppression for
  the same reason. (First attempt used a two-line `deno-lint-ignore`, which
  silently did nothing: the directive binds to the next line only, and
  `ban-unused-ignore` caught it.)
- `sagas/runtime.ts` — line 8 statically imported `db`; line 21 then reached
  for it via `await import('@ledgerline/db')`. Same module, same instance,
  already loaded, so the static import was dead. Using the static binding is
  exactly equivalent and preserves the module's eager load; removing the import
  instead would have changed when the DB module initialises in concurrency
  glue, which is not a change to make without being able to run it.

## A finding: `ratio()` and `formatPercent()` are dead, and the surface they were written for has no data

`lib/money.ts` exports `ratio()` (line 305) and `formatPercent()` (line 315).
Both are tested (`tests/money_test.ts:88-99`) and have **zero production call
sites** anywhere in the tree. `ratio()`'s own doc names the surface it exists
for: *"Collection rate with no billed amount is undefined, not zero percent."*

There is no collection rate to render: `contracts/` contains no `billed` or
`collected` field, and the invoice ledger is a paginated table with no headline
percentage. So the critique's suggested DeltaChip surface ("Invoice Ledger:
real-time collection rate delta chip beside the headline percentage") cannot be
built from real data — building it would mean inventing a number the backend
does not provide, which is the same fiction this run spent a whole commit
removing (`57085f8`, R8).

Recommendation: **delete both, or park them behind the contract field.** Do not
build the surface. The repo already refused this class of thing once — pass 9
declined to port `signed`/`tone`/`compact` onto `MoneyText` on the grounds that
adding API nobody calls is what `WidgetCard.Hero`'s `size` prop was.

## REMAINING

1. **Not pushed; no upstream.** 32 ahead, 2 behind. Owner's call, unchanged
   since pass 4. Not rebased — rewriting history under an actively committing
   agent is how this run's earlier incident happened.
2. **The design tree is still a second copy.** `design/ledgerline-ui`
   (`/home/agent/projects/netscript/wave7-design`) is **41 behind / 9 ahead** of
   master. Pass 8 decided it is not the canonical line; its `home-view.tsx`
   still carries the "UI source / app-owned" narration removed here in `57085f8`.
   Salvage or delete — do not assume a component exists there because it exists
   here. (Spot check: the two trees' `comparison-area-chart.tsx` already differ
   in comment wording, so they are drifting, not merely duplicated.)
3. **`deno task lint` is still red.** Two fixed here; `aspire/.helpers/register-apps.mts`
   (`buildViteEnvVarName`) is next. Scope check of the whole repo: **325**
   problems, but ~233 are `no-slow-types` in `database/**/.generated/**`. On
   hand-written files the count is ~92, of which **78 are `no-slow-types` in
   `contracts/versions/v1/*.contract.ts`** (54 billing, 16 runs, 8 webhooks).
   That is a contracts/JSR-publish campaign, not a design-steer item.
4. **`ratio()` / `formatPercent()` dead API** — see above. Delete or park.
5. **A page-level hero still has no token.** Critique §5 wants one number that
   commands the page; `--ns-text-4xl` (2.25rem) is already the card hero's size,
   so there is no step to step to. Needs a display-size token in `tokens.json`.
6. **The build re-dirties five route files.** Cause is known precisely (one
   trailing comma — pass 9's correction). The fix belongs to the generator.
7. **The aspire batch of root `deno task check` exits 1** — `aspire/node_modules`
   absent, so `typescript/bin/tsc` cannot load. Environmental, identical on
   master. Every other batch exits 0.
8. **Not verified visually against the reference images.** Every pass including
   this one proves the code matches the critique's numbers and the repo's own
   rules, not that those numbers match the images. That needs an agent that can
   see.

## Verification

- App `deno task check` (`fmt --check . && deno lint . && deno check`): **exit 0**
  (185 + 120 files).
- `deno test --allow-all`: **55 passed**, 0 failed.
- `deno check sagas/runtime.ts triggers/daily-maintenance.ts`: **exit 0**.
- `deno fmt --check` on both edited files: **exit 0**.
- Tree clean at end: `git status --porcelain` empty. Lock hygiene: `deno.lock`
  untouched.
