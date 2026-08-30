# Tier-A review — #1466 slice 2 (SDK declaration propagation + G-1), PR #1731

| Field | Value |
| --- | --- |
| Reviewer | features topic supervisor, native Claude Opus 5 · high (PID `5495`) |
| Author | Codex `gpt-5.6-sol` · **high** (`complex_implementation`), thread `01a051f8-ab0a-7443-921f-17e48be6bc35` |
| Content head | `2863d29e` — `feat(sdk): preserve procedure metadata through declarations` |
| Review worktree | `/home/agent/projects/netscript/worktrees/ns1466-tiera-c4`, detached — **never** the author's (D-19) |
| Status | **PART 1 — substance.** The author's turn was still open when this was written: 4 of 8 receipts cut, nothing pushed. Receipt-set verification is Part 2 and gates the verdict. |

Every number below was re-measured in my own worktree at `2863d29e`.

## G-1 — closed, and I broke it myself rather than trusting the audit file

The pin moved from a file-wide count to a declaration-anchored pattern:

```
/export\s+const\s+baseContract\s*:[^=;]+?=\s*oc\.\$meta<NetScriptProcedureMeta>\(\{\}\)\.errors\(commonErrorMap\);/g
```

I reproduced the evaluator's exact forgery — perturbation B2 (`NetScriptProcedureMeta &
{ readonly extra?: string }` on the real initializer) **plus** the dead decoy
`const _legacyBase = oc.$meta<NetScriptProcedureMeta>({}).errors(commonErrorMap); void _legacyBase;`:

| Probe | Old pin (slice 1) | New pin (slice 2) |
| --- | --- | --- |
| `deno check --unstable-kv` on the forged file | exit 0 | **exit 0** — still passes, which is the point |
| The pin test | **GREEN** (forgery succeeded) | **RED** — `4 passed / 1 failed` |
| Unmodified head | 5/5 | **5/5** |

`check` passing on the forged file is what makes this finding real: type-checking alone cannot see the
substitution, so the pin is the only guard, and it now holds. Worktree reverted clean
(`git status --porcelain` → 0) after the perturbation.

The author's own `audit/g1-declaration-pin-slice2.txt` records the same two probes plus a
no-decoy B2 case and a restoration proof. My run agrees with it; I ran it because agreement between
an author's audit and a reviewer's measurement is worth something only when the reviewer measured.

**One residual worth stating (AF-1, low, not blocking).** The anchor uses `[^=;]+?` to span
`baseContract`'s type annotation. That works today, but it fails **on correct code** the moment the
annotation contains a `=` or `;` — a default type parameter (`<T = X>`) in the `ContractBuilder`
generics would do it. The failure mode is a false positive on a legitimate refactor, and the tempting
"fix" is to loosen the regex back toward the file-wide form G-1 just removed. Worth a comment in the
test naming that trap. Slice 3 can carry it; it does not warrant its own cycle.

## R-1's binding constraint — holds exactly at the new content head

Receipt argv, 16 entrypoints, run at `2863d29e` and at `origin/main` `13878a80a`:

- `main`: exit 1, **12** findings. Slice-2 head: exit 1, **12** findings.
- vs `main`: nine identical; `main`-only `{BaseContractRoute→BaseContractErrors,
  BaseContractOutputRoute→BaseContractErrors, baseContract→oc}`; head-only
  `{BaseContractErrors→MergedErrorMap, baseContract→ContractBuilder, baseContract→Schema}`.
- vs the **slice-1 head set**: `diff` reports **IDENTICAL**.

That is the strong result. Slice 2 adds public SDK surface (`ProcedureMeta`,
`ProcedureMetaFromNode`) and adds **zero** doc-lint findings — the count did not move and neither did
the set, so R-1's set-identity condition is satisfied by measurement rather than by a matching count.

## Substance

- **Suites**: `deno test --allow-all packages/sdk packages/contracts` → **94 passed / 0 failed**.
- **`docs:exports-drift`**: **PASS, exit 0** (R-3's named supplemental evidence).
- **No metadata-boundary casts or `any` introduced.** Grepping `+` lines of the SDK diff for
  `any` / `as unknown as` / `deno-lint-ignore` / `@ts-ignore` / ` as <Type>` returns only three hits,
  and all three are **inside the new scanner test's own fixture strings** — the assertion-budget
  scanner testing that it counts `const value = source as Target;` as 1 and a commented/quoted
  occurrence as 0. That is the scanner proving itself, not a boundary cast.
- **`ActionMethod`** is present and wired: declared `query-factory.ts:51`, applied at `:126`
  (`[K in ContractProcedureNames<TContract>]: ActionMethod<TContract, K>`), exported at
  `ports/mod.ts:32` — the plan's slice-2 marker obligation.
- **Public surface delta** is exactly two NetScript-owned type exports, `ProcedureMeta` and
  `ProcedureMetaFromNode`, added to `ports/mod.ts` and `query/mod.ts`. **No upstream oRPC type is
  re-exported** — AP-14 clear, consistent with the unchanged doc-lint set.
- **`procedure-meta-independence_test.ts`** covers the new symbols by name alongside the slice-1
  three, so the doc-JSON independence obligation extends to the SDK surface rather than stopping at
  contracts.
- **`commonErrorMap` stays private** — the slice-2 diff does not touch `public/mod.ts`.

## Part 2 — outstanding before a verdict

1. All eight receipts at content head `2863d29e` with `gitHead == actualGitHead`; four exist
   (`check`, `lint`, `fmt-check`, `test`), four pending (`public-doc-lint`, `quality-gate`,
   `arch-check`, `publish-dry-run`).
2. The slice-1 set archived to `receipts/frozen-42874803/` — **already verified**, 8 files, alongside
   `frozen-235482767/` and `frozen-c9a391811/`, all append-only.
3. Sufficiency recomputed over the eight named files.
4. `deno.lock` byte-unchanged.
5. The per-slice PR comment (the G-2 obligation this brief made explicit).
6. `context-pack.md` refreshed — and it must **not** carry forward the stale "inotify is 128 /
   watch-run dies" paragraph; that correction is queued for delivery and is now wrong on the facts
   (inotify is 1024, `watch-run` reaches its heartbeat exit 2).

**No verdict yet.** Substance is strong and nothing found so far blocks; the verdict waits on the
receipt set rather than being issued against a half-cut one.

---

# Part 2 — receipts, process, and verdict

Author turn closed. Evidence head **`dce16175`** (`test(harness): record #1466 slice 2 evidence`),
local == `origin` == PR head, clean. Content head remains **`2863d29e`** —
`git diff --stat 2863d29e..dce16175 -- packages plugins docs templates` is **empty**, so the evidence
commit moved no product.

## Receipt set — all eight at the content head

| Receipt | exit | outcome | attempt | gitHead == actualGitHead |
| --- | --- | --- | --- | --- |
| `check` | 0 | PASS | 8 | ✓ `2863d29e34` |
| `lint` | 0 | PASS | 8 | ✓ |
| `fmt-check` | 0 | PASS | 8 | ✓ |
| **`test`** | **0** | **PASS** | 8 | ✓ |
| `public-doc-lint` | 1 | FAIL | 8 | ✓ |
| `quality-gate` | 0 | PASS | 8 | ✓ |
| `arch-check` | 0 | PASS | 8 | ✓ |
| `publish-dry-run` | 0 | PASS | 8 | ✓ |

Named explicitly, never a glob; every head matches. `deno.lock` **byte-unchanged**
(`git diff --exit-code -- deno.lock`). Sufficiency `INSUFFICIENT` with exactly one reason —
`public-doc-lint` — which is R-1's baseline-red / delta-0 finding and external to this leaf.

**The `test` receipt matters more than its row suggests.** It is a real `PASS` at exit 0, cut after
the host repair, i.e. under `tini` **and** `fs.inotify.max_user_instances` = 1024. The live set for
slice 2 therefore carries **no infrastructure waiver at all** — no `SKIPPED`, no ruling cited to
avoid a gate. That is the state D-33 said the final evaluator should require, reached one slice
earlier than expected.

## Process obligations — met

- **G-2 discharged by the author**, not by me: a per-slice PR comment is posted on #1731 ("Slice 2 of
  3 is implemented…"). The brief made it a closing obligation instead of "commit, push, stop", and
  that fixed the defect cycle 2 raised.
- **`context-pack.md` refreshed and accurate.** It names the slice-2 content head, marks S3 and the
  final IMPL-EVAL as outstanding, states `Refs #1466 — partial` with no closing keyword, and tells a
  resumer not to touch the G-4 docs items before slice 3. A resumer reading it alone is not misled —
  which is the G-3 standard.
- Supplemental evidence recorded under `audit/`: `docs-exports-drift-slice2.txt`,
  `public-doc-lint-slice2.txt`, `sdk-focused-slice2.txt`, `evidence-sufficiency-slice2.json`.

## Carried to slice 3 — not blocking

- **AF-1** (this review, Part 1): the G-1 anchor's `[^=;]+?` annotation span goes red on *correct*
  code if that annotation ever gains a `=` (a default type parameter). The hazard is the repair
  someone would reach for — loosening back toward the file-wide form G-1 removed. Slice 3 adds a
  comment naming the trap; **the pattern itself is not to be changed.**
- **Host-state gap in `context-pack.md`.** Slice 2 correctly removed the stale "inotify is 128 /
  watch-run dies" paragraph but put nothing in its place, so a resumer cannot tell the host was ever
  repaired, that R-1's root-`test` condition is void, or that the frozen archives predate the fix.
  Slice 3's brief requires a short host-state section. Left to that author rather than patched by me,
  so one owner writes the file.
- **G-4** (IMPL-EVAL cycle 2): the `CommonErrorMap` docs row and a `{@link commonErrorMap}` public
  JSDoc still point at a symbol that is no longer public. Slice 3's, by the evaluator's assignment.

## Verdict

**`ACCEPTED`** at content head `2863d29e`, evidence head `dce16175`.

Slice 2 does what plan slice 2 contracts and nothing else. The two claims worth attacking both held
under my own measurement: the anchored G-1 pin goes **red** against the evaluator's exact decoy
forgery while `deno check` still passes on the forged file — so the guard is the only thing standing
between that substitution and a green build, and it now stands — and `public-doc-lint` is **12 with a
set identical to slice 1's**, meaning two new public SDK type exports added zero findings. Suites
94/0, `docs:exports-drift` exit 0, `ActionMethod` wired and exported, `commonErrorMap` untouched and
still private, no upstream re-export (AP-14 clear), no metadata-boundary cast or `any` — the only
`as` tokens in the diff are inside the new scanner's own fixture strings, the scanner proving itself.

No finding blocks. AF-1 and the context-pack host-state gap are carried to slice 3 with G-4.

Withheld from this lane and unchanged: merge, ready-flip, relabel, milestone change, issue close,
acceptance-box ticking, restoring a closing keyword, and any runtime lease. PR #1731 stays **draft**
at `Refs #1466 — partial`; slice 3, the final all-slices separate-session IMPL-EVAL, and the
close-gate all remain outstanding.
