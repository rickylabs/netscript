# Plan — epic #1169: guarantee a one-pass publish

Archetype: tooling/CI surface (no `packages/` framework code except `packages/cli/e2e`, which is a
workspace-internal, publish-excluded test harness). Scope overlays: none (service/infra tooling).
Doctrine verdict: unaffected — no public package surface changes.

## Root-cause groupings (the seven failures collapse to four causes + one closed)

- **RC-A · Verdict provenance** — a check cannot state what it ran against. Covers F2
  (superseded runs read as current), F3 (close-gate stale verdict), F6+#1142 (post-merge re-runs
  against deleted refs failing red forever). Three symptoms, one rule: *a verdict must identify the
  state it evaluated, and a superseded/cancelled run must be classifiable as such mechanically.*
- **RC-B · Retry semantics** — F1. Timeout/cancellation-class failures retry once, visibly;
  assertion failures never retry. Instrument before choosing retry vs ceiling.
- **RC-C · Contention** — F4. Expensive suites either serialize or fail with a verdict that names
  contention.
- **RC-D · Tooling honesty** — F5. No refusal exits 0; probes verified against reality.
  `duplicate_sender_risk` appears already fixed (exits 4, tested) — verify, audit for siblings,
  close on evidence.
- **F7** — already fixed (#1165/#1167); close on evidence at the next cut.

## Locked decisions

1. **S1 lands first** (RC-B, #1168): it is the only defect that actually blocked the release PR,
   and it introduces the *attempt-visible gate verdict* (`attempts`, per-attempt duration + failure
   class in `GateResult` and the report JSON) that is the epic's unifying primitive. Retry
   classification: retry only `timedOut` and exit-6/"task was canceled"; never a nonzero-exit
   assertion failure. One retry, both attempts always in log + report artifact.
2. **Verdict provenance is implemented locally per verdict producer**, not as a shared library:
   e2e `GateResult` gains attempt/provenance fields (S1); close-gate `Report` gains
   `{headSha, evaluatedAt, issueBodyHash/updated_at per issue}` (S3). A shared package would couple
   `.llm/tools` to `packages/cli/e2e` for a record shape — not worth it.
3. **Latest-run-per-name is a read-side tool** (`agentic:pr-checks`, S2), not a CI change: GitHub
   will keep exposing superseded runs; the honest view must be computed. Non-zero exit only for
   *current* failures; cancelled/superseded/stale-post-merge classified and labeled.
4. **F4 contention fix stays off `e2e-cli-prod*.yml`** (release-tooling-adjacent test reads it):
   cross-ref `concurrency` group for the expensive `scaffold.runtime` job in `e2e-cli.yml` with
   queueing (`cancel-in-progress: false` at job level), plus a local suite lease (reusing the
   sender-ownership lease pattern) whose refusal names contention and the holder.
5. **Every new predicate demonstrates its negative case** — each slice's gate includes a test or a
   real run where the guard fires. No slice merges on "would fire" argument.
6. Codex Sol·low implements mechanical slices S4/S6 app-server-attached; supervisor reviews per A1.

## Commit slices (one PR per slice; sub-issue per slice)

| Slice | Closes | Content | Lane |
| --- | --- | --- | --- |
| S1 retry+attempt-visible verdicts | #1168 | Command-gate retry helper (timeout/cancel class only), `GateResult.attempts[]`, report + log surfacing, negative test (assertion failure not retried), aspire-restore instrumentation evidence | Claude design + Codex tests |
| S2 `agentic:pr-checks` honest rollup | new | Latest-run-per-name check reporter; classifies CANCELLED/superseded/post-merge-stale; exit non-zero only on current failures; negative fixtures | Codex Sol·low |
| S3 close-gate provenance | new | `Report` carries headSha/evaluatedAt/per-issue body hash + `updated_at`; staleness detectable; negative test (stale snapshot flagged) | Codex Sol·low |
| S4 post-merge/deleted-ref CI hardening | #1142 + new (F6) | Fix classify-changes heredoc-under-`bash -e`; skip or green post-merge re-runs; guard `agent` job against deleted refs | Codex Sol·low |
| S5 expensive-suite mutual exclusion | new | Cross-ref concurrency group for scaffold.runtime job in `e2e-cli.yml` (queue, not cancel) + local lease with contention-naming refusal; negative case: forced collision names itself | Claude + Codex |
| S6 tooling-honesty audit | new | Verify `duplicate_sender_risk` exit path against observed transcript; sweep `.llm/tools/agentic/` for exit-0 refusals; add missing negative tests; close F5 on evidence | Codex Sol·low |
| S7 evidence closure | F7 boxes | Verify #1165/#1167 at next cut; tick epic DoD | supervisor |

Order: S1 → (S2, S4 parallel-able) → S3 → S5 → S6 → S7. Deferred: any change to
`e2e-cli-prod*.yml` or `.llm/tools/release/` (propose-and-wait per brief).

## Risk register

| Risk | Mitigation |
| --- | --- |
| Retry masks a real regression | class-gated retry (timeout/cancel only) + negative test + attempts always visible |
| Ceiling is the real F1 cause | instrumentation lands with S1; decision recorded before retry is relied on |
| S5 queueing slows PR CI | queue only the expensive job, not the workflow; measure before widening |
| S2 misclassifies a genuinely red run as superseded | classification requires a *newer completed* run of the same check name on the same PR head or later |
| Touching prod E2E workflows | out of scope; guarded by decision 4 |

## Debt implications

None new; F5 partially closes existing debt (probe honesty class from #1074).
