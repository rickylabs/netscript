# IMPL-EVAL: #1751 / PR #1802 — agentic sender-lease recovery

| Field | Value |
| --- | --- |
| Run ID | `fix-agentic-sender-lease-recovery--1751` |
| Evaluated head | `5ac0275c79f62f0e0201b6fa159225bde8e693ec` (= PR #1802 head, verified via `gh pr view`) |
| PLAN-EVAL history | cycle 1 `FAIL_PLAN`, cycle 2 `PASS` (`plan-eval-cycle-2.md`) — implementation authorized |
| Generator | OpenAI GPT-5.6 Sol, high (per `supervisor.md`) |
| Evaluator (this session) | requested route: native Anthropic / Fable 5 / medium; **observed identity: `z-ai/glm-5.3-flash` (OpenRouter IMPL preset)** — opposite family to the generator, separate session. Per `evaluator/protocol.md` capability table this route has a verified reasoning trace and agentic turn, so gates were run for real. Route deviation recorded; no generator self-certification occurred. |
| Evaluator permissions | read-only over source; only this artifact written |
| Evidence standard | every exit below is a real captured `out=$(cmd 2>&1); rc=$?`; no pipeline was used for any verdict |

## Verdict summary

All six deciding questions were verified independently against head `5ac0275c7`. No blocking
finding. Non-blocking observations are listed with dispositions below.

## Q1 — Is the cleanup fix narrow, and do both invariants survive?

Verified by reading `stopAndReap` (`runtime/adapters/local-sender-lease-repair-adapter_test.ts:68-93`)
and by diffing the file against its frozen original blob `2e2817d0c27628e0f9e1ca922c47ec35738102ce`
(retrieved with `git cat-file -p`).

- Both kill guards match **only** `Deno.errors.NotFound` or `TypeError` with the exact message
  `'Child process has already terminated'` and rethrow everything else. This is not a blanket
  `catch (TypeError)`: a genuine programming `TypeError` carries a different message and propagates.
  The matched string is Deno's specific internal text for this exact condition, so the match is a
  legitimate narrow discrimination.
- `const status = child.status` is captured **before** the first kill (line 69 precedes line 71).
- `await status` (line 92) is unconditional — outside the `!terminated` branch — so status is
  awaited on **every** path, including the already-terminated one. The diff proves this is the
  hoist: the original had `await status` inside `if (!terminated)`.

The supervisor's disclosed claim was falsified-independently and confirmed, not inherited.

## Q2 — Is the flake actually gone? (re-derived, not inherited)

**N = 30** full-file repetitions of the focused adapter test through the structured wrapper
(`deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all
.llm/tools/agentic/runtime/adapters/local-sender-lease-repair-adapter_test.ts`), each iteration a
direct `out=$(cmd 2>&1); rc=$?` capture (scratch log `.llm/tmp/eval-1802-reps.log`, ignored):

- **Per-iteration exits: iterations 1–30 all `exit=0` (30/30 clean).** Each iteration ran the
  wrapper's real `deno test --reporter=tap --allow-all` subprocess (4 tests, including the
  live-writer fixture and the new already-terminated case); a spot-checked iteration reported
  `passed:4, failed:0, exitCode:0, durationMs≈334`.
- Wrapper validity controls: the wrapper executes the inner `deno test` and its exit code is the
  inner exit code (observed both directions). With the author's ~10% base rate, 30 clean runs leave
  a **4.2%** (`0.9^30`) lucky-sweep probability — above the requested evidential bar.
- **Second-fixture diagnosis re-derived from source, not inherited.** The pre-repair child blocked
  on `await new Promise(() => {})` (visible in the original blob): a top-level await with no pending
  runtime operation, so Deno exits the process and `pid.first` reads `dead` versus the expected
  `alive` — exactly the author's 46/50 diagnosis. The repair replaces it with
  `await Deno.stdin.read(new Uint8Array(1))` under parent-held `stdin: 'piped'`
  (`local-sender-lease-repair-adapter_test.ts:180-192`), a real pending I/O operation that keeps the
  child alive through every preservation assertion, with a 2 s readiness timeout that fails fast
  rather than hangs, and `stopAndReap` in `finally`.

**Stability is reproduced; the flake is gone.**

## Q3 — Do `blocked` and `repair-required` genuinely discriminate?

Yes — machine-readably at three layers, not merely in prose:

1. **Decision type** (`runtime/sender-ownership.ts:108-121`): finite unions `kind:
   'blocked' | 'repair-required'` × `reason` ∈ `{live_owner, ownership_conflict, provenance_unknown}`
   / `owner_inactive`, carried in typed `SenderOwnershipDiagnostic.ownershipKind/.ownershipReason`
   fields. `decideSenderOwnership` returns `blocked/provenance_unknown` for a record without
   `profileHome` (lines 206-213) and `repair-required/owner_inactive` only after that gate passes.
2. **Emission** (`codex/launch-codex-slice.ts:398-416`): the blocked launch JSON carries
   `ownershipKind` + `ownershipReason`, so an external driver can branch machine-readably;
   `adapters/codex-adapter.ts:147` now pushes the diagnostic for **any** non-available decision.
   Tests assert these fields at the emission boundary (`launch-codex-slice_test.ts` new case asserts
   `repair-required/owner_inactive` vs `blocked/ownership_conflict`; `adapters_test.ts` new case
   asserts both records are preserved without a rival request).
3. **Behavior at the repair surface**: the two situations do **not** collapse. An inactive-but-
   provenance-bound record is repairable (`stale` authorization → eviction); a provenance-unknown
   record is refused end-to-end — the adapter never probes a default home, the classifier stays
   `indeterminate`, and `runSenderLeaseRepair` returns `blocked` with no receipt and no mutation
   (`sender-lease-repair.ts:139-147`). `live_owner` likewise cannot be repaired (alive PID →
   `preserve`).

Callers branching on exit code alone at launch see one code (4) for all blockers; the discrimination
lives in the structured fields — see observation O-2.

## Q4 — Is provenance genuinely fail-closed and backward-compatible?

- **No fallback**: production repair resolves the session root from `record.profileHome`
  (`local-sender-lease-repair-adapter.ts:148-152`; the CLI constructs the adapter **without** a
  session-root override, `agentic-runtime.ts` `senderLeaseDependencies`). A record without
  `profileHome` yields `unknown` rollout/thread evidence and **zero** default-home probes — the
  regression asserts `threadProbes === 0` and `rollout === {state:'unknown', provenance:'unknown'}`
  (`sender-profile-provenance_test.ts:87-116`).
- **Legacy records still load**: `parseSenderOwnershipRecord` accepts the optional `profileHome`
  (must start with `/`), keeps every legacy field legal, and still rejects unknown fields
  (`local-sender-ownership-adapter.ts` diff). The legacy-load regression parses and reads the record.
- **Apply-time provenance change aborts**: `unchangedLease` compares `profileHome`
  (`sender-lease-repair.ts:80-88`); the adapter throws `sender lease mismatch` on a changed
  `profileHome` before probing; regression at `sender-profile-provenance_test.ts:118-143`.
- **The isolated-profile regression actually fails without the fix** — demonstrated by mutation
  testing (read-only wrt the worktree; shadow copy under ignored `.llm/tmp/eval-1802-mut/` run with
  an exclude-free config copy and `HOME` bound to an empty temp dir so no real home is touched):
  - Shadow baseline (unmutated): 4/4 passed, exit 0.
  - Mutated shadow (the exact claimed pre-fix behavior: assume `$HOME/.codex` instead of resolving
    `record.profileHome`): **3 failed / 1 passed, exit 1** — `production profile provenance…` FAILED,
    `isolated profile provenance…` FAILED, `legacy records load but missing profile provenance…`
    FAILED; only the apply-time race case (home-resolution-independent) survived.
  - Conclusion: these are genuine discriminators, not production-only pass-throughs.

## Q5 — Protected ceilings

Current blobs vs the frozen baselines in `worklog.md`:

| File | Recorded baseline | Observed `git hash-object` | Status |
| --- | --- | --- | --- |
| `sender-lease-repair_test.ts` | `7be38302a…` | `7be38302ac6ed20f29571213d18172283e1aded5` | byte-identical ✓ |
| `codex-thread-read_test.ts` | `d3ca0b51f…` | `d3ca0b51fcb87aeee81e4202e5f527ed569fba12` | byte-identical ✓ |
| `agentic-runtime_test.ts` | `7113e271d…` | `7113e271dfa15e9f2dc53b6922c4d5055e086430` | byte-identical ✓ |
| `codex-resume_test.ts` | `546b5f018…` | `546b5f0185876fd51c9b5ee28b57a19fe37562b7` | byte-identical ✓ |
| `sender-ownership_test.ts` (authorized) | `978cd23d…` | `978cd23d073035e1d578193a299806a0fe9b77fb` | matches amended baseline ✓ |
| `local-sender-lease-repair-adapter_test.ts` (authorized) | `e12c023b…` | `e12c023b90b8debc66d2f6ad720f3a9b9cdd9f14` | matches amended baseline ✓ |

Diff additivity of the two authorized files (both originals retrieved from the object store and
diffed with `git diff --no-index`):

- `sender-ownership_test.ts`: 42 added / 3 removed lines. The only removed assertion is the
  old-vocabulary expectation `.kind === 'stale'`, replaced by `.kind === 'repair-required'` plus
  added `reason`/`ownershipKind`/`ownershipReason`/`operatorAction` assertions and a new legacy-
  provenance test. That removal **is** the authorized vocabulary change; nothing was weakened.
- `local-sender-lease-repair-adapter_test.ts`: two narrowed kill guards, `await status` hoisted to
  unconditional, one new already-terminated regression test, and the fixture swap
  (`await new Promise(() => {})` → parent-held stdin). Every original assertion remains.

## Q6 — Scope and boundaries

- **`deno.lock` byte-unchanged**: `git rev-parse 969e7dfe:deno.lock` = `HEAD:deno.lock` =
  `a1522e6ecc98dd4232312385b0cea4e52f5fa4b2` (also the worklog's recorded blob). `deno.json`
  likewise untouched.
- **Sibling #1750** (Claude hybrid-launcher task-separator parser fix, CLOSED): no `claude/**` or
  hybrid-launcher file appears in the leaf diff (`git diff --stat 969e7dfe..HEAD` — 33 files, all
  under `.llm/tools/agentic/**` + run artifacts). The `launch-codex-slice.ts` changes are sender-
  record persistence and preserve-only launch logic, not argument parsing; the `codex-resume.ts`
  change is one exit-mapping line (#1751's own D8 contract). The README diff adds the new repair
  command and the D8 exit contract and does **not** touch the #1750 separator example.
- **Run artifacts preserved**: all 9 run-dir files tracked and unmodified; working tree clean except
  this artifact. `.llm/tmp` scratch (repetition log, shadow-mutation tree, negative-control) is
  ignored and intentionally uncommitted.

## Independent gate re-runs (this session, real captured exits)

| Gate | Exit | Result |
| --- | ---: | --- |
| Full `.llm/tools/agentic` suite (structured wrapper) | 0 | **537 passed / 0 failed / 0 ignored** — independently reproduces the worklog's final-head claim |
| Focused adapter test × 30 repetitions | 0 ×30 | 30/30 clean, 4 tests per iteration (Q2) |
| Provenance regression, shadow baseline | 0 | 4/4 passed |
| Provenance regression, mutated pre-fix shadow | 1 | 3 failed / 1 passed (Q4) |
| Wrapper negative control | 1 | inner non-zero exit propagates to the wrapper exit (validates the 30× exit-0 verdicts) |

Not re-run here (already evidenced at the same head in `worklog.md`, and outside this leaf's
surface): root suite 4,661/0/19, scoped check/lint/fmt over `.llm/tools/agentic` (175 files),
`arch:check`, `deno task e2e:cli`.

## Findings by severity (all non-blocking)

- **O-1 (minor, code observation)** `SenderLeaseCliDependencies.sessionRoot`
  (`runtime/cli/agentic-runtime.ts`) is declared but unused by the production
  `runSenderLeaseRepair`, which resolves the session root from `record.profileHome` — the fail-closed
  property actually depends on that override **not** being set. **Disposition:** accepted as-is;
  cosmetic dead surface, and its inertness is what keeps production fail-closed. A future cleanup
  may drop the field; not merge-blocking.
- **O-2 (minor, design observation)** At launch, every non-available decision shares exit code 4;
  the live-owner / provenance-unknown / conflict / repair-required discrimination is carried in the
  structured `ownershipKind`/`ownershipReason` JSON fields, not in distinct exit codes. A consumer
  branching on exit code alone cannot distinguish the cases. **Disposition:** accepted — the finite
  reason union is the machine-readable contract, and the plan's finite-exit-code constraint argues
  against proliferating exit codes; the repair surface discriminates behaviorally (Q3 §3).
- **O-3 (minor, test-shape observation)** The new already-terminated regression proves `stopAndReap`
  tolerates a terminated child, but cannot itself prove `await status` on every path (status is
  already resolved when the test calls the helper). **Disposition:** accepted — the every-path-await
  invariant is established by code shape (unconditional `await status`), verified in Q1.
- **O-4 (minor, process observation)** The evaluator identity observed this session is the OpenRouter
  GLM 5.3 Flash IMPL preset, not the `supervisor.md`-planned native Fable 5 medium route.
  **Disposition:** recorded per protocol (requested vs observed identity); the route is a sanctioned
  opposite-family evaluator preset with a verified agentic turn, the session is separate from the
  generator, and no gate was skipped. Supervisor should note the lane deviation in its close-out.
- **O-5 (inherited, out of scope)** `deno task check:mcp-export-corpus` remains red at the
  integrated head; the generated file is byte-identical to `origin/main` and this leaf touches no
  package export surface. **Disposition:** correctly preserved as upstream drift for supervisor
  disposition, exactly as recorded in `drift.md`; not a #1751 failure.
- **O-6 (inherited, deliberate)** `launch-codex-slice.ts` now always passes `sessionActive: false`
  with the rationale comment "A recorded id is identity, not proof of a live writer," moving
  dead-owner-with-session records from `blocked` to `repair-required` routing. **Disposition:**
  accepted — this is the vocabulary amendment's intended semantic, is asserted by the updated tests,
  and live ownership is still caught by the real `ownerProcessAlive` probe.

## Close-out notes (no action taken by this session)

- PR #1802 remains OPEN/draft at `5ac0275c7`; issue #1751 remains OPEN on `status:impl`. Labels,
  milestones, readiness transitions, the close-gate (`Closes #N` acceptance), and any merge decision
  belong to the supervisor, per this evaluation's mandate.
- Process obligations verified present: PLAN-EVAL cycle 2 `PASS` before implementation; Design
  checkpoint and per-slice RED/GREEN evidence in `worklog.md`; drift log current, including both
  authorized protected-ceiling exceptions and the two failed-then-repaired stress-gate cycles
  (46/50 → fixture diagnosis → 50/50), which this evaluation re-derived rather than inherited.

VERDICT: PASS
