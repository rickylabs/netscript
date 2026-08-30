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

---

# Part 2 — pushed exact head, final evidence, verdict confirmed

Author terminal: thread `01a05215` `idle`, launcher exited, per-slice PR comment posted
("## Slice 3 — publish and compat…"). Evidence head **`e19de923`**
(`test(harness): record #1466 slice 3 publish evidence`), local == `origin` == PR head, clean.
Content head remains **`9ab779ce`**.

## Receipts at the content head

All eight, `attempt 9`, `gitHead == actualGitHead == 9ab779ce96`, named explicitly:
`check` · `lint` · `fmt-check` · **`test`** · `quality-gate` · `arch-check` · `publish-dry-run` all
**PASS exit 0**; `public-doc-lint` **FAIL exit 1** (baseline-red, delta 0, set identity verified by me
at this head). `deno.lock` **byte-unchanged**. Sufficiency `INSUFFICIENT` for exactly one reason —
`public-doc-lint` — the terminal expected state for this leaf.

**Four archives, all 8 files, append-only:** `frozen-c9a391811`, `frozen-235482767`,
`frozen-42874803`, `frozen-2863d29e`.

## Slice-3 publish evidence — its own obligation, independently reviewed

- Workspace `publish:dry-run` PASS; per-member `@netscript/contracts` (4 entrypoints, 21 files) and
  `@netscript/sdk` (12 entrypoints, 60 files) both `Success Dry run complete`.
- `isolatedDeclarations: true` inherited from root with **no member override** — the executable
  publish bar, shown rather than asserted.
- SDK's only `@netscript/*` pin is exact: `jsr:@netscript/service@0.0.6`. Contracts has none.
- **The two SDK JSR WARNs were reported, not adjusted** — exactly as the brief required. I established
  attribution at the base independently (topic drift **D-36**): `packages/sdk/src` has **13 immediate
  children on `origin/main` and 13 at this head with an identical listing**, so `F-DOCT-5 cardinality`
  is pre-existing debt at delta 0; `F-JSR-7 slow-types` is WARN on SDK only because that member lacks
  the sanctioned annotation `@netscript/contracts` carries, and `slowTypes.ok` is `true` for both.
  Neither is introduced by #1466. Both are pre-existing architecture questions for the coordinator,
  correctly **not** fixed inside a slice whose plan says "no feature expansion".

## AF-1 evidence — matches my independent run

The author's `audit/af1-annotation-span-slice3.txt` records the decoy forgery going red
(`deno check` exit 0, `deno lint` exit 0, pin exit 1 / 4 passed 1 failed as the sole failure) and
restoration to 16/0 with the pattern unchanged. I ran the same attack myself at this head before
reading the file; the results agree.

## G-7 landed at this stop

`receipts/frozen-42874803/test-final.attempt5-skipped.json` restored from `dd201816`, SHA-256
`0d5d2c3d…` identical on source and restoration. The archive's deliberate mixed heads are now
documented in `worklog.md`: seven attempt-5 receipts at `42874803`, the attempt-7 `test` PASS at
`ff4e81cc` (attesting the head it ran at, product proven byte-identical), and the attempt-5 `SKIPPED`
record explaining why a `test` result was absent at that content head. Evidence head `e34505f1`.

## Verdict — confirmed

**`ACCEPTED`** at content head `9ab779ce`, evidence head `e34505f1`.

Nothing in Part 2 changes the Part 1 finding. **All three implementation slices are Tier-A accepted.**

## Dispatched immediately: final all-slices IMPL-EVAL

| Field | Value |
| --- | --- |
| Session | `8d9946e6`, `--remote-control ns1466-impleval-final` |
| Route | Claude · **Fable 5 · medium**, `formal_impl_evaluation` — native opposite-family for Codex work |
| Worktree | `ns1466-impleval-final`, **detached at `e34505f1`**, its own — never an author's (D-19) |
| Brief | `slices/impl-eval-1466-final.md` |
| Scope | **all three slices together** — S2 and S3 have never been formally evaluated; only S1 has a verdict |

The brief makes S2's metadata propagation the centre of gravity ("a type that no test can make fail
is not a contract"), requires the evaluator to attack the anchored pin and hunt a working forgery
against it, and routes four rulings: whether #1466 is complete across all three slices, whether the
leaf is close-gate ready, whether a **permanently baseline-red** `public-doc-lint` is an acceptable
standard to merge on, and whether S2/S3 regressed S1. It forbids restoring the closing keyword or
flipping ready **even on `PASS`** — that transition and the merge are human decisions.
