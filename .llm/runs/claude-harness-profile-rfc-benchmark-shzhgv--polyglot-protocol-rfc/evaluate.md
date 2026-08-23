# IMPL-EVAL — claude-harness-profile-rfc-benchmark-shzhgv--polyglot-protocol-rfc

## Re-verification cycle 2 — PASS on the S11b head (2026-08-23) — CLOSING VERDICT

| Field | Value |
| --- | --- |
| Evaluator session | OpenHands cloud run 32625339098 (separate session; formal IMPL-EVAL via draft→ready automation) |
| Model / route | `openrouter/deepseek/deepseek-v4-flash-0731` |
| Evaluated head | 797a27d (S11b) |
| Verdict | `OPENHANDS_VERDICT: PASS` — finding 1 confirmed fixed; fmt-clean, zero TBD; seam cites + corpus verified; docs-only surface confirmed; plan gate + commit trail + false-done audit clean; no blocking findings |

This head-pinned PASS is the closing verification for the run. Full chain: PLAN-EVAL PASS →
IMPL-EVAL cycles 1–3 (PASS superseded; 2× FAIL_FIX doc fixes; two-failure limit → owner
escalation) → owner-commissioned adversarial pass (qwen3.8-max ×2, CONCERNS/FAIL_FIX, all
findings verified + consolidated) → owner approval ("approved proceed") → S11/S11b revision →
re-verification cycle 1 FAIL_FIX (one stale constant) → fix → **cycle 2 PASS**. DoD ticked and
`status:ready-merge` applied on this record.

## Re-verification cycle 1 on the S11 head — FAIL_FIX (2026-08-23)

| Field | Value |
| --- | --- |
| Evaluator session | OpenHands cloud run 32624659415 (separate session; formal IMPL-EVAL via draft→ready automation, post-owner-approval round) |
| Model / route | `openrouter/deepseek/deepseek-v4-flash-0731` |
| Evaluated head | 410f4f2 (S11) |
| Verdict | `OPENHANDS_VERDICT: FAIL_FIX` — one moderate finding; all other gates clean (fmt, zero TBD, spike evidence re-summed, seam cites verified, docs-only diff confirmed, no false-done entries) |

**Finding 1 (moderate)** — stale M2 occurrence: the "Duplicate `result` frames" edge-case row
still logged `Protocol.TerminalMissing` while the S11-updated Terminal-frame discipline,
first-terminal-wins rule, constant registry, and the sibling completion-API race row all use
`Protocol.TerminalDuplicate` for the same event — an internal contradiction at the head.
**Fixed** (S11b): the row now uses `Protocol.TerminalDuplicate`; `Protocol.TerminalMissing`
remains registry-valid for the absent-terminal `unknown-failure` case only. FMT re-checked
clean; re-dispatch on the amended head.

## Adversarial pass (owner-commissioned, R5-D-8) — CONCERNS / FAIL_FIX (2026-08-20)

| Field | Value |
| --- | --- |
| Evaluator session | OpenHands cloud run 32398533310 (separate session; presumed-stalled "attempt 1" that in fact completed after 4 h 21 m — one very long model call, see drift R5-D-8) |
| Model / route | `openrouter/qwen/qwen3.8-max` (owner fallback ruling after the Grok 4.6 allowlist rejection) |
| Review head | 4242a46 (RFC byte-identical to 02b1c6e; evaluator verified this itself) |
| Verdict | `ADVERSARIAL_VERDICT: CONCERNS` → `OPENHANDS_VERDICT: FAIL_FIX` |
| Of-record note | The attempt-2 trigger's "attempt 2 governs" clause is SUPERSEDED — its premise (attempt 1 dead) proved false; this completed attempt-1 review on the correct head is the verdict of record. Attempt 2 (run 32416122194) is a duplicate to be cancelled/ignored. |

Architecture explicitly survived attack (tiers, two surfaces, sentinel framing, terminal
discipline, error model, doctrine-compliant package split — OBSERVATION-1/3). Findings are
spec-text repairs, all four MAJORs verified by the supervisor against RFC/spike sources
before disposition:

1. **MAJOR-1** — terminal `result` frames > FRAME_MAX_BYTES (4096) are unrepresentable: edge
   table demotes them to log ⇒ synthesized `unknown-failure` on a successful run; no size
   ladder for results (checkpoints have one); T0→T1 upgrade shrinks representable results.
   VERIFIED (RFC :343, :658, :311-315).
2. **MAJOR-2** — RETRY/attempt/checkpoint vocabulary has no executor in the five-wave plan;
   W2's D-5 retirement over-claims (increment-on-retry half retired by nothing). VERIFIED
   (wave table :670-676, :576).
3. **MAJOR-3** — normative progress throttle `min(0.8×timeout, 30 s)` (:454) contradicts the
   K6 replica that validates it (100 ms latest-wins flush, run-k6.ts:66-74); W4 bar unmeetable
   under the normative constant. VERIFIED (both sources re-read).
4. **MAJOR-4** — token `exp` fixed TTL (600/3600 s, :551) vs unbounded task timeout; no
   refresh verb; `GET /v1/credentials` (bootstrap-token-only, :513) not stated attempt-fenced
   ⇒ potential fence bypass. VERIFIED (grep: no refresh/renew verb exists).

MINOR-1 (K4 +0.41 ms headline is within recomputed 95% CI of zero; host-side 0.06–0.10 ms is
the robust number), MINOR-2 (edge-table "resolved" vs Unresolved-question contradiction on
redelivery fencing; tokens never fence engine-side writes), MINOR-3 (no crash-window /
at-least-once statement for terminal frames), MINOR-4 (four SDK-author ambiguities: deadline
vs buffered result ordering, T2 frame↔attempt correlation binding, "leases" undefined,
credentials-route consumer unidentified).

Disposition: returned to owner with a proposed S11 revision slice (all findings are text-level
per the evaluator's own assessment). This pass closes the IMPL-EVAL two-failure escalation's
verification question: the eval-loop mechanics were sound, and the independent pass surfaced
findings the formal cycles did not.

### Supplementary review — attempt 2 (run 32416122194, completed 02:10Z, ~5h21m)

The duplicate dispatch was not cancelled and completed with its own full review (same model,
same head 4242a46): `ADVERSARIAL_VERDICT: CONCERNS` / `OPENHANDS_VERDICT: FAIL_FIX`, 0 BLOCKER /
6 MAJOR / 7 MINOR / 6 OBSERVATION. Status: SUPPLEMENTARY — the of-record verdict remains
attempt 1's (recorded above); per the supervisor contract only findings absent from the
of-record review are folded into the S11 scope. Convergence signal: both independent passes
found the same retry-engine hole (A1 = MAJOR-2) and the same throttle contradiction
(A6 = MAJOR-3), and both judged the architecture sound.

Novel findings folded into S11 scope (attempt-2 ids):

- **A2** — redelivery identity unspecified: today each delivery creates a NEW execution record
  (job-dispatcher.ts:192-245), so attempt-token fencing (step 3) verifies BOTH the live and the
  redelivered attempt (each "current" in its own record) — the fenced race the edge table
  promises is not fenced; plus no ordering rule between the two terminal channels (result frame
  vs `POST /v1/executions/:id/complete`) over an unguarded read-modify-write `#transition`.
- **A3** — bootstrap-token scope contradiction (":457 per-boot" vs ":535 per-task env") and the
  credentials exchange not bound to the presenting execution ⇒ cross-task confused-deputy that
  voids capability scoping. (Sharpens of-record MAJOR-4B into a concrete break.)
- **A4** — frame/envelope size limits are transport-dependent but legislated universally:
  T2 checkpoint "8–256 KB via inbound frame" contradicts the 4096-byte frame MUST; envelope
  payload has NO size bound while env delivery hits MAX_ARG_STRLEN (128 KiB Linux) and the
  32,767-char Windows env block. (Complements of-record MAJOR-1, which covered result frames.)
- **A5** — `resultSchema` validation failure has no semantics (payload analogue is specified at
  :662; the result mirror is silent) — four RFC-conformant divergent behaviors demonstrated.
- **M1** — cancellation ladder gaps: no `graceMs` default, no SIGTERM→SIGKILL interval, no
  drain-to-EOF-before-finalize rule (a buffered terminal frame can be discarded on kill).
- **M2** — duplicate-terminal logs `Protocol.TerminalMissing` (wrong constant; no duplicate
  member in the vocabulary).
- **M3** — T2 init silence: demotion vs zombie-kill unresolved; no detection timeout.
- **M4** — conformance exclusion authority undefined (self-exclusion ⇒ tier inflation).
- **M5** — token-invalidation trigger list incomplete (lease requeue is not `behavior:RETRY`;
  GC-paused worker's token stays valid while its replacement runs).
- **M6** — attempt arithmetic undefined (0- vs 1-based; bump on redelivery?; `retry.remaining`
  semantics).
- **M7** — Summary "closed envelope" vs normative `.loose()` open-world MUST — say
  "closed-vocabulary envelope".
- **O1/O3/O4 notes** — scope the K4 bar as a c=1 statement and stop citing the c16 delta as an
  improvement; add the envPassthrough footnote to Goal 2; W1 watch-item: confirm arch:check
  tolerates `testing/` in a published package.

Attempt-2 items NOT novel (already of-record): A1 (=MAJOR-2), A6 (=MAJOR-3), its O1 (=MINOR-1),
credentials-consumer ambiguity (=MINOR-4.4), engine-write fencing overlap (=MINOR-2/3).

Consolidated S11 scope: of-record MAJOR-1..4 + MINOR-1..4 PLUS the novel items above.
All remain RFC-text edits per both evaluators; no spike re-runs required.

## Cycle 3 — FAIL_FIX on the fixed head (2026-08-20)

| Field | Value |
| --- | --- |
| Evaluator session | OpenHands cloud run 32359981617 (separate session) |
| Evaluated head | c45d6c1 |
| Verdict | `OPENHANDS_VERDICT: FAIL_FIX` — all four cycle-2 fixes confirmed applied; every seam cite + spike figure re-verified; ONE moderate finding |

### Finding → disposition

**F-1 (moderate)**: Summary line 32 claimed the wave plan retires "D-1..D-10/D-12/D-13", but the
wave/seam tables retire exactly D-1..D-9, D-12, D-13, D-14 (D-10 not wave-retired; D-14 is) —
**fixed**: Summary corrected, and an explicit "deliberately outside the five-wave retirement"
note for D-10/D-11 added under the wave table.

### Eval-loop accounting

Second FAIL_FIX of the IMPL-EVAL loop → the two-failure limit is reached. Per
`evaluator/plan-protocol.md`, escalated to the owner with the fix applied rather than
self-dispatching a fourth cycle: owner decides between a final re-dispatch or folding
verification into the planned Codex Sol Max adversarial pass.


## Cycle 2 — FAIL_FIX on the S10 revision head (2026-08-20)

| Field | Value |
| --- | --- |
| Evaluator session | OpenHands cloud run 32358375889 (separate session) |
| Model / route | `openrouter/deepseek/deepseek-v4-flash-0731` (draft→ready re-dispatch, R5-D-7 mandate) |
| Evaluated head | 45b134a (S10 revision, 319→803 lines) |
| Verdict | `OPENHANDS_VERDICT: FAIL_FIX` — design judged "substantively sound and reference-complete" (Zod 4.4.3 snippets hand-tested; seam file:line cites verified; K1–K6 figures re-checked; L1–L8 intact; fmt-clean, zero TBD); four doc/bookkeeping fixes owed |

### Findings → disposition (cycle-2 fix commit)

1. **F1 (medium)** corpus count "34-file" wrong (32 per `research-sources/`) — **fixed** in RFC
   Summary + Prior art; PR body aligned in the same pass.
2. **F2 (medium)** stale context-pack resume point (still "S9 complete") — **fixed**: resume
   point now records S10, the eval-cycle history, and the pending cycle-3 re-dispatch.
3. **F3 (low)** stale PR body (no S10 slice; presented the superseded 70d101a PASS as final)
   — **fixed**: body rewritten for the S10 head; DoD verdict box re-opened pending cycle 3.
4. **F4 (low)** bare-basename seam cite — **fixed**: full path
   `packages/plugin-workers-core/src/executor/multi-runtime-task-executor.ts:195-205`.

Eval-loop accounting: first FAIL_FIX of the IMPL-EVAL loop (limit two before escalation).

## Cycle 1 — PASS on the pre-revision head (superseded by R5-D-7, kept as record)

**Verdict: PASS** (`OPENHANDS_VERDICT: PASS`)

| Field | Value |
| --- | --- |
| Evaluator session | OpenHands cloud run 32346098261 (separate session) |
| Model / route | `openrouter/deepseek/deepseek-v4-flash-0731` (draft→ready automation dispatch) |
| Trusted base | 9634735 (main after #1686) |
| Evaluated head | 70d101a (RFC at b76013f; 70d101a adds only a context-pack fix) |
| Verdict provenance | PR #1687 comment (2026-08-20T08:02Z, summary-file source) + owner correction comment |

## Independently verified by the evaluator

- PLAN-EVAL chain confirmed on record (cycle-1 FAIL_PLAN → f4ae089 fixes → cycle-2 PASS run
  32343592955) — the required hard stop was resolved, not silently N/A'd.
- Every quantitative RFC claim spot-checked against raw JSONL: K4 +0.41 ms (7.59→8.00) and
  1920/1920; K5 3.5/5.8 + 30.2/43.1 with 60/60 cancels; K6 92.0/93.9 p95 + 9.52× coalesce;
  K1 10/10×200/200 + 2504 lookalikes + fd-3 infeasibility; K2 0400 environ + leak-free
  allowlist; K3 0.49/0.67 p50 + NotCapable denial + UDS constraints — all match.
- False-done audit clean: replica marking (R5-D-3), fd-3/UDS/environment limitations, and the
  UNVERIFIED register all surfaced where a reader needs them.
- All five plan-L9 verdict criteria honored; G4 docs-lane re-confirmed by independent diff.

## Findings → disposition (post-verdict, artifact-only commits)

1. **[minor] Loopback figure precision** (RFC "0.42–0.70 ms" vs raw 0.49/0.67) — **fixed**:
   RFC now cites the exact per-client p50s.
2. **[minor] Worklog S5 drift** (27.1 vs raw 27.5 ms) — **fixed** in worklog.md (the raw was
   re-generated after the constructed-env assertion improvement; the note now matches the
   final raw).
3. **[cosmetic] "cautionary tale" spelling** — **no change needed**: the RFC text already
   reads "cautionary tale", identical to the evaluator's suggested spelling (line cited
   verified).
4. **[info] Tracking issue + D-register filing** — acknowledged as next-phase owner actions
   (RFC Discussion-stage pattern of #1680; defect issues follow per supervisor charter).

Owner correction on the verdict comment (K6 record bound is 82–84 B, not "86–84 B") noted;
the RFC's own text ("bounded 84 B record") is consistent with the raw.

## Post-verdict head note

Commits after 70d101a are run-artifact/bookkeeping only (lock-hygiene drift note 1469808,
this mirror + the two finding fixes); the RFC content change is limited to the finding-1
precision edit. Deliverables otherwise unchanged since the evaluated head.
