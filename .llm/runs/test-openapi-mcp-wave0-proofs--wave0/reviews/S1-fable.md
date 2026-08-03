CHANGES_REQUESTED

# S1 opposite-family review — P1 lifecycle verdict

- Reviewer: Claude Fable 5 / low, separate native session (advisory `review_codex` lane, not
  IMPL-EVAL)
- Reviewed: stable uncommitted diff of `.llm/runs/test-openapi-mcp-wave0-proofs--wave0/` only
- Inputs read: `plan.md` D4–D6/D12, `plan-eval.md`, `worklog.md`, `drift.md`, `proofs/P1-verdict.md`,
  `proofs/evidence/P1-attempts.md`, `proofs/evidence/P1-runtime.json`,
  `proofs/evidence/P1-resource-hygiene.json`, `proofs/experiments/p1-post-allocation-manifest.ts`,
  seed RFC `plan-openapi-mcp-plugin--seed/rfc.md` §4 (lines 256–266) and §9 (lines 367–391),
  issue #1127 body/acceptance.

## Verdict-level answers to the brief

1. **Is the FAIL correct?** Yes, under the locked plan. The callback + `getValueAsync()` +
   atomic identity-bound manifest is genuine post-allocation evidence (real allocated port 3001,
   complete identity binding, atomic `wx`+rename — `p1-post-allocation-manifest.ts:108-131`), but
   D5 (`plan.md:83`) requires the manifest, the same owned run's Aspire description, and a
   successful live request to agree with a healthy resource. The owned description recorded
   `users` as `Finished`/exit 1 with no URL (`P1-runtime.json:38-45`), so the D5 bar is not met,
   and D6 (`plan.md:84`) maps any FAIL — including incomplete execution — to F1(b). The explicit
   FAIL selecting F1(b) is the correct application of the PLAN-EVAL-passed rules. Note for the
   RFC record: the seam itself was *not* refuted; the failure cause is an orthogonal generated
   permission defect (missing `--allow-ffi`). F1(b) must be recorded as "selected because the P1
   bar was not met," not as "post-allocation seam demonstrated impossible" (see finding M2).
2. **Is the later HTTP 200 safe to use?** No, and the verdict is right not to use it — but the
   evidence currently under-explains it (finding M1). A process Aspire reports as exited with
   code 1 cannot itself have served the 200; the origin of the port-3001 listener at fetch time
   is unattributed on a shared host that carries 2 foreign AppHosts, 4 foreign containers, and 2
   unproven containers (`P1-resource-hygiene.json:13-15`). The 200 is ambiguous/potentially
   contaminated evidence and must not appear as a satisfied pass-bar condition.
3. **Truthfulness/sufficiency:** manifest identity, atomicity, race handling (write chain +
   completeness check), single-service completion, credential/path normalization, exact-target
   teardown, lock hygiene, scope containment (only run artifacts changed per `git status`), and
   the scoped static gates all check out against the evidence. Two evidence-quality gaps are
   listed below (M1, m3).
4. **Does `FAIL_RESCOPE` improperly block P2/P3?** Partially — see M3. The rescope is correctly
   scoped to the product fix, but the worklog framing ("stopped before S2", `worklog.md:91`)
   does not distinguish blocked work from merely sequence-gated work. P3 reruns an existing auth
   test with no scaffold and no AppHost; the no-DB half of P2 has no `libsql` dependency.
   Neither depends on `--allow-ffi`. Only the DB half of P2 is genuinely blocked by the defect
   (its live spec would come from the same crashing service, and the ambiguous 200 cannot be
   used). The supervisor should be able to authorize S2(no-DB)/S3 to proceed in parallel with
   the product-fix rescope; the current artifacts read as if the whole run is halted.

## Findings (severity-ranked)

### M1 (major, evidence integrity) — HTTP 200 origin unattributed; `successfulLiveRequest: true` overstates

- Evidence: `P1-runtime.json:57-63` (the fetch), `:70` (`"successfulLiveRequest": true` inside
  `passBar`), `:44` (`healthReport` says "endpoint not responding in the 200 range" — an
  in-file contradiction with the 200), `P1-resource-hygiene.json:13-15` (foreign/unproven
  survivors on the shared host).
- Problem: no PID/owner capture of the port-3001 listener at fetch time, and no timestamps
  ordering describe → fetch, so the 200 cannot be attributed to the owned `users` process (which
  Aspire says had exited). Possible origins include an Aspire restart, a stale description, or a
  foreign listener. Marking the pass-bar condition `true` from unattributed evidence is exactly
  the false-green shape the plan's hidden scope forbids.
- Required action (Codex lane, no re-run needed): in `P1-runtime.json`, either move
  `successfulLiveRequest` out of `passBar` into an `ambiguousObservations` block or set it with
  an explicit `"attributed": false` qualifier; add the describe/fetch ordering timestamps if
  captured; extend the `liveRequest.note` (and `P1-attempts.md` row 3, `P1-verdict.md:16-18`) to
  state the listener's owner was not established and name the candidate explanations. The FAIL
  verdict itself is unaffected — every candidate explanation still fails D5 coherence.

### M2 (major, decision-record wording) — F1(b) record must carry the causal qualifier

- Evidence: `P1-verdict.md:7-18`; RFC §9 (`rfc.md:379`) frames F1(b) activation on P1's verdict;
  #1127 states "A FAIL verdict is a legitimate result, not a blocker."
- Problem: the verdict text does say the callback evidence was "necessary but not sufficient,"
  but the "Arbitrated F1 outcome" heading reads as a flat seam refutation. When the supervisor
  updates RFC §9 and epic #1126, an unqualified "F1(b)" entry would misrecord *why* — the seam
  produced correct allocated values; the bar failed on service health caused by a generated
  permission defect outside this run's scope.
- Required action: add one sentence to `P1-verdict.md` §"Arbitrated F1 outcome" (and carry it
  into the eventual RFC §9/epic update): the post-allocation seam itself yielded correct
  allocated endpoint values; F1(b) is selected because the locked D5 coherence bar was not met
  in an owned run, and a future healthy re-run is a legitimate basis for the owner to revisit
  F1 — the RFC keeps (a) and (b) in the same port contract, so this is additive, not wasted.

### M3 (medium, disposition) — rescope stop over-blocks independent proof work

- Evidence: `P1-verdict.md:29-34`, `worklog.md:91`, `worklog.md:138-139` (P2/P3 NOT_RUN "hard-
  gated"), plan D12 (`plan.md:90`).
- Problem: `FAIL_RESCOPE` correctly routes the `--allow-ffi` product fix out of this PR, but
  nothing in the artifacts records that P3 and the no-DB half of P2 are independent of the
  defect and remain runnable under the existing plan. As written, the rescope reads as a
  whole-run halt, which the brief's question 4 correctly challenges.
- Required action: add a "Blocked vs runnable" note to `P1-verdict.md` (or worklog handoff):
  DB-scaffold P2 evidence is blocked pending the product fix; no-DB P2 and P3 are only
  review/sequence-gated and may be authorized by the supervisor without waiting for the rescope.

### m1 (minor, vocabulary) — `FAIL_RESCOPE` is evaluator-verdict vocabulary

- Evidence: `P1-verdict.md:27-29`; harness verdict definitions reserve
  `PASS/FAIL_FIX/FAIL_RESCOPE/FAIL_DEBT` for IMPL-EVAL.
- Problem: the implementation lane emitting an evaluator token as a "Rescope disposition" risks
  being read as a self-issued eval verdict — the lane must not self-certify or pre-empt the
  separate Qwen IMPL-EVAL.
- Required action: reword to "Rescope required (per D12); recommended IMPL-EVAL disposition:
  FAIL_RESCOPE" or similar, making clear the token is a recommendation to the evaluator.

### m2 (minor, consistency) — S1 slice file list names `rfc.md §9`, which S1 deliberately did not touch

- Evidence: `worklog.md:55` (S1 files include "seed `rfc.md` §9") vs `P1-verdict.md:31-34` and
  `worklog.md:151-152` (RFC/epic updates withheld for supervisor).
- Problem: the slice table promises a file the slice intentionally defers; an evaluator diffing
  slice-files vs actual changes will flag it.
- Required action: annotate the S1 row (e.g. "seed `rfc.md` §9 — supervisor-applied after
  review") or move it to the supervisor sign-off step.

### m3 (minor, evidence precision) — `literalLoopbackUrl: true` for a hostname URL

- Evidence: `P1-runtime.json:29,67`; #1127 requires "literal-loopback URLs"; plan risk register
  (`plan.md:113`) requires normalized-host comparison with raw URLs preserved.
- Problem: `http://localhost:3001` is a loopback *name*, not a literal loopback address
  (`127.0.0.1`/`[::1]`); `localhost` can resolve to either family. The evidence records no
  normalization or resolution check backing the `true`.
- Required action: rename the field (e.g. `loopbackUrl`) or add a note that the allocated host
  was the `localhost` name and no literal-address normalization was performed. Cosmetic for a
  FAIL verdict, but the field name would be load-bearing on a future PASS re-run.

### i1 (info) — acceptance boxes and PR hygiene

- #1127's second acceptance box ("epic + RFC §9 updated") is correctly still open; the PR must
  not carry `Closes #1127` until the supervisor lands those updates. First box is satisfiable by
  committing this evidence set (explicit FAIL + measured evidence) once M1/M2 amendments land.
- Static gates, lock hash stability (`264f029e…` before/after), exact-target teardown with zero
  owned survivors, and untouched foreign resources are all consistent across
  `P1-attempts.md`, `P1-runtime.json`, and `P1-resource-hygiene.json` — no discrepancy found.

## Summary

The P1 `FAIL` → F1(b) arbitration is the correct application of locked D5/D6 and is supported by
the evidence; no finding overturns it. Sign-off should wait for the M1 evidence-attribution
amendment, the M2 causal qualifier on the F1(b) record, and the M3 blocked-vs-runnable
clarification; the minors are wording/consistency fixes the Codex lane can apply in the same
amendment pass without re-running any AppHost.
