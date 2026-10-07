# Interim evaluation checkpoint — F1–F5 repair review (NOT a verdict)

**This file is an interim checkpoint, not a verdict and not a merge signoff.** No `PASS`,
`FAIL_FIX`, `FAIL_RESCOPE` or `FAIL_DEBT` is emitted here. The round-1 terminal verdict
(`FAIL_FIX`) stands recorded in `evaluate-round-1.md` / `evaluate.md`; the round-2 terminal
verdict will be issued in this same evaluator session once the F6 off-worker
`scaffold.runtime` evidence returns.

| Field | Value |
| ----- | ----- |
| Run ID | `orch-divybot-636--bounded-stream-storage` |
| Phase | IMPL-EVAL round 1 → round 2 interim checkpoint |
| Evaluator | native Claude Opus 5 (`claude-opus-5`, xhigh), session `507f3317-ba68-4e62-b085-89eb707037de`, same session as round 1 |
| Reviewed head | `48aa35f` (`test(streams): bind cache and recovery invariants to regressions`) |
| Round-1 reviewed source | `6aa1676` |
| Scope of this checkpoint | F1–F5 repairs only; F6 remains open by design |

## Independence and scope integrity

| Check | Result | Evidence |
| ----- | ------ | -------- |
| Production source unchanged since the round-1 review | **confirmed** | `git diff 6aa1676..48aa35f -- bounded-file-store.ts bounded-segment-log.ts main.ts README.md tests/test_utils/` → 0 lines. sha256 of all four production artifacts byte-identical to the round-1 pins (`7b3c128c…`, `3e488a97…`, `eea48a42…`, `c1b63c90…`). The entire round-1 semantic review therefore carries over without re-derivation. |
| Diff is test + documentation only | **confirmed** | `48aa35f` touches `tests/bounded-segment-log_test.ts` (+39/−2), `tests/bounded-file-store_test.ts` (+41), `arch-debt.md` (+7/−3) and run artifacts. |
| No new public surface | **confirmed** | `deno publish --dry-run --allow-dirty` exit 0 at `48aa35f`; published list still contains only the two adapter modules from `services/`, and no `tests/` or `test_utils/` path. JSR `./services` surface remains 0 symbols. |
| Round-1 artifact preserved | **confirmed** | `evaluate-round-1.md` is a byte-identical 308-line copy. |
| Evaluator wrote only this file | **confirmed** | `git status` shows `repair-checkpoint.md` as the sole evaluator-created path; no lock churn from any evaluator command. |

## Independently re-run gates at `48aa35f`

| Gate | Command | Result |
| ---- | ------- | ------ |
| Scoped tests | `run-deno-test.ts -- --allow-all --frozen plugins/streams/services/src` | **18 passed / 0 failed / 0 ignored**, exit 0, 4.5 s — matches `review-tests.json`. 0 ignored confirms the new POSIX-permission test actually executed here (non-root uid). |
| Scoped typecheck | `run-deno-check.ts --root plugins/streams/services --ext ts --deno-arg --frozen` | 14 files, 0 occurrences, exit 0 |
| Scoped lint | `run-deno-lint.ts --root plugins/streams/services --ext ts` | 14/14, 0 occurrences, exit 0 |
| Scoped format | `run-deno-fmt.ts --root plugins/streams/services --ext ts` | 14/14, 0 findings, exit 0 |
| Doctrine / quality | `deno task quality:gate` | exit 0; `streams` section `FAIL=0 WARN=5 INFO=1`, every warning pre-existing (README fences, four stub `export default`). No new finding from the larger test files. |
| Publish dry-run | `cd plugins/streams && deno publish --dry-run --allow-dirty` | exit 0 |
| Dependency audit | `deno task audit:critical` (round 1) | 0 critical; same-head receipts `audit-critical-repair.json` (`6aa1676`) and `audit-critical-committed.json` (`c12a520`) both PASS exit 0 |
| ≥1 GiB RSS regression | re-measured in `rss-review-measurements.json`, reproduced in round 1 by the evaluator | native recovery 2,204,196,864 B (exit 1); native tail 2,205,429,760 B (exit 1); bounded recovery 59,441,152 B / after-tail 60,530,688 B (exit 0); identical recovered offset `0000000000000000_0000001073746944` against the 536,870,912 B ceiling |

## F1–F4: do the new tests actually bind the guarantees?

I did **not** reuse the generator's mutation harness. I built an independent copy in `$TMPDIR`
(production modules + both committed suites + a local import map pinning the real
`npm:@durable-streams/server@0.3.7`, `--no-check --cached-only`), confirmed a 10/10 baseline, then
applied my own faithful source removals one at a time. Where round 1 probed one mutant per guard, I
also split the invalidation predicate into its three individual branches — the stronger test is
whether each branch is separately pinned, not just whether deleting all of them is noticed.

| # | Mutation applied to production source | Suite | Failing test |
| - | ------------------------------------ | ----- | ------------ |
| A | `recent()`: all invalidation removed (`!entry \|\| false`) | **exit 1** | `append, truncation and replacement invalidate stale boundaries` |
| B | `recent()`: **identity** branch only removed | **exit 1** | same |
| C | `recent()`: **shrink** (`file.size < entry.size`) branch only removed | **exit 1** | same |
| D | `recent()`: **equal-size/mtime** branch only removed | **exit 1** | same |
| E | `remember()`: `MAX_SEGMENT_CHECKPOINTS` `shift()` removed | **exit 1** | `tail seeks from recent boundaries and skips retained payloads` |
| F | `MAX_SEGMENT_CHECKPOINTS` tightened 128 → 64 | exit 0 (by design — see note) | — |
| G | `readExactly()`: short-read loop defeated (partial fill accepted) | **exit 1** | `complete frames, zero payload, split headers and short reads` **and** `read failure closes the descriptor…` |
| H | scan hook restored to the native swallow-and-return-zero behaviour | **exit 1** | `unreadable recovery preserves metadata instead of fabricating zero` |
| I | `scan()`: forced final boundary checkpoint removed | exit 0 | — (not a stated invariant; see residuals) |

Round 1's three green mutants (M3 stale checkpoints, M5 checkpoint cap, M4 partial read) are now all
red, and the previously untested "never fabricate resets" guarantee is red under H.

**F1 — SATISFIED, and more tightly than required.** The new block in test 5 reframes a two-frame
fixture into a single frame so the previously recorded mid-file boundary (65,541) lands *inside* a
payload and *below* the requested start (65,552), then exercises three distinct transitions —
same-size rewrite with a new mtime, replacement with a new identity (deliberately **without** an
mtime bump), and shrink. That design is why each predicate branch fails individually (mutants B, C,
D above): the replacement case is invisible to the mtime branch, the shrink case is invisible to the
equality branch, and the same-size case is invisible to the shrink branch. Asserting
`files.reads[0] === 0` also pins *how* it recovered (cold scan) rather than only the returned bytes.
Under a stale cache the seek reads payload bytes `0x62626262` as a frame length and returns nothing.

**F2 — SATISFIED.** `oldestRetained = count - MAX_SEGMENT_CHECKPOINTS + 1` is exactly the index of
the oldest boundary that a 128-entry FIFO can still hold for 144 equally spaced ≥64 KiB frames; the
test reads one capped frame at that boundary (`files.reads[0] === offset`, a direct seek) and one
frame below it (`files.reads[0] === 0`, a cold scan). Removing the bound makes the lower read seek
instead of rescan, so the assertion fails (mutant E). This observes the cache through its externally
visible seek behaviour instead of exporting internals — the right shape for this invariant.
*Note on mutant F:* both the expectation and the fixture size are derived from the imported
constant, so retuning the constant stays green. That is correct, not a gap: the test binds the
retention *mechanism* relative to the declared capacity, and the constant's value is a deliberate
configuration choice rather than a behaviour to freeze.

**F3 — SATISFIED.** Test 1 now reads back a `3 × SEGMENT_IO_BYTES + 19` payload with a
non-constant pattern (`(i*17+31) % 256`) while the fixture caps every positioned read at 37 bytes,
and the identity bump forces the read to be cold. Defeating the fill loop fails this test (mutant
G), and `maxRequest <= SEGMENT_IO_BYTES` still holds, so the fix cannot be "read it all at once".
The patterned payload (rather than a constant fill) is what makes a mis-positioned chunk detectable.

**F4 — SATISFIED, with a self-validating negative control.** The new store-level test uses a real
LMDB store and a real segment made unreadable with `chmod 000`, asserts the bounded store preserves
`currentOffset`, then asserts that the **unchanged** `FileBackedStreamStore` reconciles the same
metadata down to `frameOffset(0)`, then restores the mode and asserts recovery *and* payload
integrity. This reproduces exactly the divergence I had to prove with an ad-hoc probe in round 1,
and the embedded native control means the fixture cannot silently stop reaching the failure path.
Guards are correct: the test is skipped on Windows and when `Deno.uid() === 0` (mode bits do not
constrain root), and it re-chmods in `finally`; it ran here (0 ignored) and will run in CI's
`check-test` job, which is non-root.

**F5 — SATISFIED (documentation).** The debt entry's `Reason` now opens with
"`AP-4` cross-package implementation inheritance / `A11` dependency coupling", so a catalog-code
grep finds it; `Cost` now also requires re-running the native integration and ≥1 GiB RSS
negative-control suites on every dependency bump, which absorbs the substance of round-1 F7. Every
required registry field is still present. The section heading still reads "A11 upstream storage
extension seam" — cosmetic only, no action needed. The lock-slice disclosure in the PR body and
phase comment is generator-attested and **not independently verifiable from this session** (the
evaluator does not contact GitHub); the supervisor should confirm it at round 2.

## Substantive findings from this checkpoint

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| low | **R2-1 — two of the four repairs fail with an assertion-library crash instead of a readable diff.** When the large-payload comparisons fail, `@std/assert` tries to build a diff over ~196 KB / ~131 KB byte arrays: the short-read mutant dies with `RangeError: Array buffer allocation failed` (the diff allocates `(M*N+…)*2` `Uint32Array` elements — 7.7e10 requested vs a ~4.3e9 typed-array maximum, so it is a deterministic throw, not an OOM hazard) and the stale-checkpoint mutant dies with `Maximum call stack size exceeded` in `buildMessage`. The gate is correctly red either way and the binding is unaffected, but a future engineer who breaks these guards gets an allocator error rather than "payload mismatch". My round-1 wording ("`assertEquals` the whole byte array") invited this; the right form is a cheap structural comparison. | evaluator mutants G and A; `mutation-partial-read.log`, `mutation-stale-checkpoints.log`; `deno eval` of the diff allocation | optional, cheap — compare `length` plus a digest (or a few sampled indices) for payloads above a few KiB instead of raw `assertEquals` on the arrays, keeping the same semantics with a diagnosable failure. Not a blocker; do not weaken what is asserted. |
| info | **R2-2 — off-worker run re-dispatched at the current head: resolved during this checkpoint.** I first observed the `e2e-cli-gate` run only at `c12a520`; `off-worker-e2e.md` now records run `37681694541` at `48aa35f` superseding it, with `scaffold-static` passed and the SQLite and canonical Postgres runtime jobs `IN_PROGRESS` and **no exit code yet** — correctly not presented as a passing receipt. GitHub state is generator-attested; this session does not contact GitHub. | `off-worker-e2e.md`; `worklog.md` round-2 entry | round-2 precondition only — return the raw exit code for `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` at the final head. |
| — | **R2-3 — durable `quality:gate` receipt at the current head: resolved during this checkpoint.** When I began, the newest `run-gate.ts` receipt was `quality-gate-committed.json` at `6aa1676`. `review-quality-committed.json` now carries `gitHead == actualGitHead == 48aa35f`, `outcome PASS`, exit 0, which matches my own independent `deno task quality:gate` run at that head. No action. | `review-quality-committed.json`; evaluator run | none |
| info | **R2-4 — residual unbound optimization (unchanged from round 1).** Removing the forced final boundary checkpoint in `scan()` still leaves the suite green (mutant I). This is a tail-seek *performance* characteristic, not a correctness or memory invariant, and it is not claimed anywhere as one — recorded so it is not mistaken for an unexamined gap later. | evaluator mutant I | none |
| — | **Checked and dismissed:** `deno fmt --check` reports the debt entry as unformatted, but Markdown and `.llm/**` are outside this repo's formatting scope (`fmt.include` is `packages/**` + `plugins/**` `*.ts(x)`; `fmt:check` runs `--root packages --root plugins --ext ts,tsx`), and `arch-debt.md` is equally "unformatted" on `main` at `6f6cbdf`. Not a gate violation and not a finding — logged so a later pass does not re-raise it. | `deno.json` `fmt`/`tasks.fmt:check`; `deno fmt --check` on `6f6cbdf`, `6aa1676` and HEAD all exit 1 | none |

Round-1 F7 is absorbed into the debt `Cost` line. Round-1 F8 (CI cost / OOM-sensitivity of the
negative controls) and F9 (`main.ts` wiring untested, stray `proxy-addr-provenance.json`) were
explicitly declined as optional in the worklog; both were marked low/informational and that is a
reasoned decline I do not press. F8's stated rationale — do not weaken a negative control for a
hypothetical runner — is sound; the ~1.1 GiB temp-space and ~3.3 GB peak-RSS requirement of the
repo-wide `check-test` job remains a known operational characteristic rather than a defect.

## Status of the round-1 findings

| Finding | Status at `48aa35f` |
| ------- | ------------------- |
| F1 checkpoint-staleness guard unbound | **satisfied** — bound at branch granularity (mutants A–D) |
| F2 per-segment checkpoint cap unbound | **satisfied** — bound via observed seek (mutant E) |
| F3 multi-chunk short-read integrity unbound | **satisfied** — bound by patterned 3-window payload under 37-byte reads (mutant G) |
| F4 "never fabricate resets" untested | **satisfied** — real denied-segment recovery with an unchanged-native reset control (mutant H) |
| F5 AP-4 code + lock-slice disclosure | **satisfied** for the debt code; PR-body disclosure generator-attested, supervisor to confirm |
| F6 `scaffold.runtime` unproven | **open by design** — opted into the off-worker `e2e-cli-gate`; not substituted by local tests, no PASS claimed |
| F7 hook-shape guard | absorbed into the debt `Cost` requirement |
| F8 / F9 | reasoned decline / informational |

No new substantive implementation defect was found in this checkpoint, and nothing in the repairs
weakened an existing assertion or negative control. The sole outstanding blocker for a round-2
verdict is F6's off-worker `scaffold.runtime` exit code at the final head (R2-2); R2-3 resolved while
this checkpoint was being written, and R2-1 is an optional diagnostic improvement.
