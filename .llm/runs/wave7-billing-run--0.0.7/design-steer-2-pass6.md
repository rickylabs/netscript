# Design steer #2 — pass 6: the last invisible selection, and a build that rewrites source

**Branch:** `fix/steer2-consolidated` · **Worktree:** `/home/agent/projects/netscript/wave7-billing-steer2`
**Commits:** `37d1c25` → `2550ac2` (3 commits). Not pushed — owner reviews and merges.

## Why this pass exists

Pass 5 closed the five components and their product mounts and left three actionable items
open: the branch is 2 commits behind master, the runs status filter's active state is still
invisible, and several files fail `deno fmt`. This pass is the second and third of those.
The first — merging master — is still the owner's call, for the reason pass 4 gave.

I verified pass 5's claims before inheriting them rather than after, because pass 5 had to
correct two of pass 4's.

| Pass 5 claim | Verdict |
| :-- | :-- |
| No `3px 3px 0` offset shadow in `assets/` or `components/` | **Holds** — grep returns nothing. |
| `money-text.tsx` resolves through `moneyParts` | **Holds** — one `moneyParts()` call, no `Number(`/`toFixed`/`Intl`. Rule M8 also enforces it as a test. |
| Dark-mode exception badge uses a semantic token | **Holds** — `exception-badge.css` uses `--ns-money-neg` / `--ns-destructive-subtle` / `--ns-destructive-border`, and says why in a comment (rust-6 is ~3.4:1 on a dark card). |
| All five catalogued and demoed | **Holds** — `ledgerlineCatalog` carries all five; the R3 test fails a catalogue entry with no `renderDemo` case. |
| `deno check` over the app clean | **Holds** — 200-file and 15-file batches exit 0. |
| 55 tests green | **Holds.** |
| `deno lint` clean | **Scoped claim, and it is wrong at repo scope** — see REMAINING 2. |
| 4 files fail `deno fmt` | **Understates it** — six fail, and none of them can stay fixed. See below. |

## DONE

| # | Item | Commit |
| :-- | :-- | :-- |
| 1 | `SegmentedControl` gains a wrap modifier; the runs status filter mounts it, so the selected status is drawn | `9037887` |
| 2 | The seven files `deno fmt` flags are formatted — `deno task fmt:check` is green repo-wide | `4d743c5` |
| 3 | The build-vs-`fmt` conflict is recorded in `RECORD.md` with a reproduction | `2550ac2` |

### The wrap modifier, and why it took nine cells to earn it

Pass 5 declined the runs filter on the grounds that "a control sized for `1D 1W 1M 3M 1Y`
stops describing a range once it is asked to hold ten". The count is the real objection and
it is a geometry problem, not a semantic one — the invoices filter already uses this control
for statuses, so statuses in a segmented control is settled in this codebase. Nine nowrap
cells in a stretched row overflow a narrow card rather than share it, so the control now
wraps.

Two consequences follow from wrapping, and both live in the component's stylesheet rather
than being left to the caller:

- **The container steps from a capsule to `--ns-radius-lg`.** A `9999px` radius on a
  two-line box reads as two unrelated pills with a seam, not as one group.
- **The inter-cell hairlines go away.** They are drawn on each cell's leading edge; with
  wrapping, the first cell of every row after the first would wear a divider hanging off
  its leading edge where the previous row used to be.

What deliberately did **not** change: the labels, the nine hrefs, and the page's
`?status=` contract. Grouping eight statuses into buckets would have been a product
decision about the URL; this is a decision about how the selected one is drawn. `size='sm'`
and `clientNav` carry over, so the filter keeps client-side navigation.

### Rendered proof

```
RunStatusFilter active=REVIEW -> 9 cells, /runs + 8 x /runs?status=<STATUS>
                                 REVIEW selected + aria-current, the other 8 neither
                                 container ns-segmented--wrap, not --block; 9 f-client-nav
RunStatusFilter no filter     -> 'all' selected + aria-current, 8 neither
default control (invoices)    -> wrap: false, block: true   (unchanged — no regression)
```

Reachability, not just type-checking: `vite build` emits `ns-segmented--wrap` into the
client CSS bundle (`_fresh/client/assets/client-entry-*.css`) and into
`_fresh/server/server-entry.mjs`.

### What the formatter found that reading had not

Six files failed `deno fmt`, not four. Beyond the four `withRouteContract` routes pass 5
named: `services/runs/src/lib/stream.ts` (an import block `deno fmt` reorders) and
`streams/run-console-schema.ts` (no newline at end of file). All six predate this branch.

Then the decisive accident: after formatting and committing, the tree went dirty again
while I ran the app's own build. `routes/runs/[id].tsx` — which I had never touched and
which was clean at `4d743c5` — came back with a one-line `withRouteContract`. Nobody
edited it; the build's codegen rewrote it. Reproduced twice:

```
deno fmt <files>  ->  fmt:check green (227 files, both batches exit 0)
vite build        ->  all five route files back on one line, git status dirty
```

So pass 5's REMAINING item 3 was not a queue of files to format; it was a generator that
emits unformatted output. The formatted form is what stays committed (it is what the
repo's gate wants), `git checkout --` the five after any build, and the fix lives upstream
in the generator. Written into `RECORD.md` so the next session does not rediscover it as a
mystery dirty tree or, worse, commit the generator's version.

## REMAINING

1. **Not merged to master; now 23 commits ahead, still 2 behind** (`1cd0f34`, `c5d57c6`,
   both webhooks). I did not rebase — rewriting history under an actively committing agent
   is how this run's earlier incident happened. Unchanged from pass 4, and it is the
   owner's call.
2. **`deno task lint` is red, and half of it is unfixable here.** Four problems, none in
   `apps/ledgerline-web` and none in a file this branch touched:
   - `sagas/runtime.ts:8` — unused `db` import.
   - `triggers/daily-maintenance.ts:27` — `async` handler with no `await`.
   - `aspire/.helpers/register-apps.mts:10,19` — two unused imports, in a file whose first
     line reads **"GENERATED BY @netscript/cli. DO NOT EDIT."**

   The first two are backend runtime code outside a design steer, and removing an `async`
   is not the zero-risk change a formatter is. The last two cannot be fixed at all — they
   come back on the next `netscript generate`. So `deno task lint` is not a gate this repo
   can pass until either the generator stops emitting unused imports or `aspire/.helpers/`
   is excluded from lint. Pass 5's "lint clean" was true of the app and is not true of the
   repo; recorded here rather than left as an inherited claim.
3. **The five route files re-dirty on every `vite build`** (above). Committed formatted;
   `git checkout --` after building; fix belongs to the generator.
4. **`aspire/node_modules` still absent**, so the aspire group of the root `deno task check`
   cannot load `typescript/bin/tsc`. Environmental, identical on master, needs `npm install`
   in `aspire/`.
5. **The `Wave 7` design tree remains the source for `MoneyText`'s richer API** (`size`,
   `signed`, `tone`, `compact`). Unchanged since pass 4: this tree's hero size lives on
   `WidgetCard.Hero`, and that is the seam to reconcile if the trees converge.

## Verification

- `deno task check`: the app's 200-file and 15-file batches exit **0**. The 12-file aspire
  batch still exits 1 on missing `node_modules` (REMAINING 4).
- `deno task fmt:check`: **green**, both batches, 227 files. Was 6 files red.
- `deno task test --allow-all`: **55 passed**, 0 failed.
- `deno task lint`: **4 problems**, all outside the app, all pre-existing — none in a file
  this branch touched (REMAINING 2).
- `vite build` succeeds; `ns-segmented--wrap` is present in the emitted client CSS and the
  server chunk.
- Rendered the filter through `preact-render-to-string` in both states, plus a default
  block control to prove the invoices filter did not regress.
- Tree clean: `git status --porcelain` empty. Lock hygiene: `deno.lock` untouched, and the
  render harness ran with `--no-lock` from scratch.
