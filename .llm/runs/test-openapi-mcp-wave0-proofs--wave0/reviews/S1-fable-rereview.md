APPROVED

# S1 opposite-family re-review — amended P1 proof

- Reviewer: Claude Fable 5, separate native session (advisory `review_codex` lane, not IMPL-EVAL)
- Scope: amended stable S1 artifacts only; no implementation, evidence, runtime, or GitHub action
  taken by this session.
- Inputs read: `plan.md` (D4–D6, D12), `plan-eval.md`, `reviews/S1-fable.md`,
  `proofs/P1-verdict.md`, `proofs/evidence/P1-runtime.json`, `proofs/evidence/P1-attempts.md`,
  `worklog.md`, `context-pack.md`, `drift.md`.

## Per-finding disposition

| Finding | Original issue | Disposition | Evidence in amended artifacts |
| ------- | -------------- | ----------- | ----------------------------- |
| M1 | HTTP 200 unattributed; `successfulLiveRequest: true` overstated inside `passBar` | **Resolved** | `P1-runtime.json` moves the fetch into a dedicated `ambiguousObservations.liveRequest` block with `attributedToOwnedService: false`, `listenerOwnershipEstablished: false`, `describeFetchOrderingPreciselyTimestamped: false`, all three candidate explanations, and an explicit not-pass-evidence note (`P1-runtime.json:57-73`). `passBar` now carries `attributedSuccessfulLiveRequest: false` and `allConditionsSatisfied: false` (`P1-runtime.json:74-84`). `P1-attempts.md` row 3 and `P1-verdict.md:21-26` state the listener owner/timing were not captured and name the candidate explanations. Timestamps were not retroactively invented — correctly, since they were not captured. |
| M2 | F1(b) record read as flat seam refutation; causal qualifier missing | **Resolved** | `P1-verdict.md:12-15`: the seam "produced correct allocated endpoint values"; F1(b) selected "because the locked D5 coherent-owned-run bar was not met due service health, not because the seam was shown impossible"; a later healthy owned run "may legitimately give the owner reason to revisit F1; both sources remain additive implementations of the same endpoint-source port." Matches the required causal-qualifier and revisitability language and is positioned to carry into the supervisor's RFC §9/epic update. |
| M3 | Rescope stop read as whole-run halt; independent work not distinguished | **Resolved** | `P1-verdict.md:42-45` splits blocked vs runnable: only DB-backed P2 is blocked pending the product permission fix; no-DB P2 and P3 "do not depend on `libsql` or `--allow-ffi`" and remain runnable after the normal review/sequence gate. Mirrored in `worklog.md` runtime-gate notes ("DB half product-blocked; no-DB half remains review/sequence-gated", "Independent of the permission defect"), handoff notes, and `context-pack.md` Next Steps/Open Questions. |
| m1 | `FAIL_RESCOPE` used as implementation-lane verdict vocabulary | **Resolved** | `P1-verdict.md:37-39`: "recommends `FAIL_RESCOPE` as the eventual IMPL-EVAL disposition … this is not a self-issued evaluator verdict." The append-only drift amendment (`drift.md:113-129`) explicitly supersedes the earlier unqualified `Action: FAIL_RESCOPE` wording and states only a separate evaluator may issue that verdict. Worklog and context-pack use "recommended/recommends" throughout. The original drift entry's `Action: FAIL_RESCOPE` remains in place, but drift is append-only by rule, and the superseding entry addresses it correctly. |
| m2 | S1 slice file list promised `rfc.md` §9, which S1 defers | **Resolved** | `worklog.md:55` S1 row now reads "seed `rfc.md` §9 is supervisor-applied after review", matching `P1-verdict.md:45-46` (RFC #1123 / epic #1126 updates remain for the supervisor after review and sign-off). |
| m3 | `literalLoopbackUrl: true` for a hostname URL | **Resolved** | `passBar` now distinguishes `allocatedHostUsesLoopbackName: true` from `literalNumericLoopbackUrl: false` and adds a `hostQualification` stating no numeric normalization or resolution proof was captured (`P1-runtime.json:77-79`). `P1-verdict.md:18-19` states "No literal numeric loopback address was observed." |

## Gate-integrity checks from the brief

- **D5/D6 not weakened.** The pass bar still requires manifest + same-owned-run Aspire description +
  attributed live request coherence; the amendment tightened it (attribution is now an explicit
  condition) rather than relaxing it. `allConditionsSatisfied: false` and the verdict remains an
  explicit `FAIL` mapping to F1(b) per D6 — no NOT_RUN-as-pass, no reinterpretation of the bar.
- **HTTP 200 not misrepresented.** It appears only as an ambiguous observation with attribution
  explicitly false and candidate explanations listed; nowhere is it used as satisfied pass-bar
  evidence. The in-file contradiction with the `Finished`/exit-1 description is preserved, not
  smoothed over.
- **F1(b) causally qualified and revisitable.** Confirmed as above (M2); the qualifier is present in
  the verdict, worklog progress log, drift amendment, and context-pack, so any future RFC §9/epic
  text drawn from these artifacts inherits it.
- **Only DB-backed P2 product-blocked.** Confirmed as above (M3); consistent across verdict,
  worklog gate tables, handoff notes, and context-pack.
- **Evaluator vocabulary scoped.** Confirmed as above (m1); the implementation lane recommends, the
  separate Qwen IMPL-EVAL decides.
- **Supervisor-owned RFC updates scoped.** Local seed `rfc.md` §9, RFC issue #1123, and epic #1126
  updates are consistently reserved for the supervisor after review/sign-off; the S1 slice table no
  longer promises them as slice files.

## New findings

No new blocking finding.

- **i1 (info, typo — non-blocking):** `P1-verdict.md:13` reads "not met due service health"
  (missing "to"). Cosmetic; the supervisor may fix it in the sign-off pass without re-review.

## Summary

All six original findings (M1, M2, M3, m1, m2, m3) are resolved faithfully: the amendments tighten
evidence attribution and decision-record precision without weakening the locked D5/D6 bar, without
laundering the unattributed HTTP 200 into pass evidence, and without expanding the implementation
lane's authority. P1 remains an explicit, evidence-backed `FAIL` selecting a causally qualified,
revisitable F1(b). The draft is fit for supervisor sign-off; this is advisory slice review, not
IMPL-EVAL.
