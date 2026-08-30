# Tier-A review — #1466 slice 3 (publish & compatibility evidence, G-4, AF-1), PR #1731

| Field | Value |
| --- | --- |
| Reviewer | features topic supervisor, native Claude Opus 5 · high (PID `5495`) |
| Author | Codex `gpt-5.6-sol` · high, thread `01a05215-7eb1-7c53-af0c-1cc2b7aa4efd` |
| Content head | `9ab779ce` — `docs(contracts): close procedure metadata compatibility findings` |
| Review worktree | `/home/agent/projects/netscript/worktrees/ns1466-tiera-c4`, detached — never the author's (D-19) |

All numbers re-measured in my own worktree at `9ab779ce`.

## Scope discipline — the constraint that mattered

Plan slice 3 says *"evidence/run artifacts and acceptance docs only; **no feature expansion**."* The
product diff is **three files, +7/-3**: a docs row, a JSDoc paragraph, and two comment lines in a
test. **No type, export, or behaviour was added.** For a slice whose brief warns that the tempting
failure is to "improve" something on the way past, that is the result you want.

Slice-2's receipt set was archived to `receipts/frozen-2863d29e/` before recutting — append-only
honoured, now four archives (`c9a391811`, `235482767`, `42874803`, `2863d29e`).

## G-4 — closed, verified by absence not by diff

The evaluator's finding was that two places described things by reference to a symbol withdrawn from
the public surface in slice 1. I checked the property rather than reading the patch:

- `grep -rn '{@link commonErrorMap}' packages/` → **NONE**
- `grep -rn 'shape of .commonErrorMap' docs/ packages/` → **NONE**
- `grep -n commonErrorMap packages/contracts/src/public/mod.ts` → **not exported** — the value is
  still private, so the fix was not achieved by re-exporting it. That was the one wrong way to close
  G-4 and it was not taken.

The `CommonErrorMap` row now reads "The standard NetScript error map carried by every base route…",
describing the type on its own terms, and the `baseContract` JSDoc says "wired to NetScript's standard
error map" with the compatibility sentence inline. A reader of the public reference is no longer sent
to a symbol they cannot reach.

## AF-1 — comment only, and the pin still bites

My slice-2 finding was that the anchor's `[^=;]+?` annotation span goes red on *correct* code if that
annotation ever gains a `=`, and that the tempting repair would be loosening back toward the file-wide
form G-1 removed. The author added exactly two comment lines naming the trap and the correct response
("Widen that span when needed; never drop the `export const baseContract` declaration anchor") and
**did not touch the pattern** — which is what the brief required.

Because a comment edit sits in the same file as the guard, I re-ran the attack rather than assuming it
was inert: perturbation B2 plus the evaluator's dead decoy at this head → **RED**, `4 passed / 1
failed`. The comment did not weaken the pin.

## R-1 — holds, third head running

`deno doc --lint`, receipt argv, 16 entrypoints, at `9ab779ce`: **12** findings, and `diff` against
the R-1 set recorded in `evaluate.md` reports **IDENTICAL**. Three consecutive content heads
(`42874803`, `2863d29e`, `9ab779ce`) now hold count *and* set. Delta 0 against a baseline-red gate is
the bar; green was never achievable and was never the goal.

## Receipts and gates at the content head

| Receipt | exit | outcome | attempt | heads |
| --- | --- | --- | --- | --- |
| `check` / `lint` / `fmt-check` / `quality-gate` / `arch-check` / `publish-dry-run` | 0 | PASS | 9 | ✓ `9ab779ce96` |
| **`test`** | **0** | **PASS** | 9 | ✓ |
| `public-doc-lint` | 1 | FAIL (baseline-red, delta 0) | 9 | ✓ |

Every `gitHead == actualGitHead` at the **content** head, named explicitly, never a glob.
`deno.lock` **byte-unchanged**. Independently re-run by me: `deno test --allow-all packages/sdk
packages/contracts` → **94 passed / 0 failed**; `deno task docs:exports-drift` → **PASS, exit 0**.

**No infrastructure waiver anywhere in this set** — a real `test` PASS cut under `tini` and inotify
1024, no `SKIPPED`, no ruling cited to avoid a gate. That is the state the cycle-2 addendum required
of slices 2 and 3, met by both.

## Supervisor item landed alongside — G-7

G-7 is **my** defect, not the author's: re-cutting `test-final.json` at `1f0cdef2` overwrote the
attempt-5 `SKIPPED` receipt in place instead of archiving it, breaking the append-only rule this lane
enforces on every author. Restored byte-for-byte from `dd201816` as
`receipts/frozen-42874803/test-final.attempt5-skipped.json`, with the archive's mixed heads noted.
Landed at this stop rather than while an author was live in the worktree, because concurrent writes
into `receipts/` are the exact damage class G-7 describes.

## Verdict

**`ACCEPTED`** at content head `9ab779ce`.

Slice 3 does what plan slice 3 contracts and nothing more — the strongest evidence being how little
product it touched. G-4 is closed by the route that keeps `commonErrorMap` private rather than the
one that would have reopened F-1. AF-1 is a comment, the pattern is untouched, and the pin still goes
red against the forgery. R-1's set identity holds at a third consecutive head, and the receipt set
carries no waiver.

**All three implementation slices are now complete with Tier-A acceptance.** What remains before
#1466 can close: the **final all-slices separate-session IMPL-EVAL** (slice 2 has never been formally
evaluated; slice 3 has not either) and the close-gate. Merge, ready-flip, relabel to
`status:ready-merge`, issue close, acceptance-box ticking and restoring a closing keyword all remain
outside this lane and outside this verdict.
