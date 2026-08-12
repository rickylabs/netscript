# Drift Log — release-0.0.6-internals--orchestration

Append-only. Newest entries at the bottom.

## D-1 — PLAN-EVAL and IMPL-EVAL waived for PR-A (#1436/#1415)

- **Severity:** minor (process, owner-authorized)
- **Recorded:** 2026-08-12, stage A
- **Fact:** `netscript-harness` makes IMPL-EVAL mandatory "unless the owner explicitly waives it", and
  `lane-policy.md` (owner decision 2026-08-08) allows `PLAN-EVAL: N/A` for small/mechanical issues
  with complete contract/scope/acceptance/gates.
- **Drift:** PR-A runs neither pass.
- **Authorization:** owner brief `/tmp/ns006-internals-orchestrator.md` §3 — "#1436/#1415 are
  mechanical: no ceremonial PLAN-EVAL or IMPL-EVAL; record N/A/owner waiver and prove negative cases."
- **Substitute evidence required:** executed RED→GREEN negative cases per fix plus the orchestrator's
  own re-run of the probe against the patched parser. A waiver removes the ceremony, not the proof.

## D-2 — OpenHands not used as the formal evaluator

- **Severity:** minor
- **Recorded:** 2026-08-12, stage A
- **Fact:** the brief §5 prefers OpenHands for broad/complex IMPL-EVAL "after #1524 lands". `#1524`
  (`fix(agentic): fail closed on open evaluators`) is an **open draft PR with no milestone** at
  `01aa12b67`; `lane-policy.md` additionally records the automated cloud agent lane as
  "TEMPORARILY PAUSED by owner (2026-08-06)".
- **Drift:** none against policy — the native opposite-family route *is* the documented local default.
  Recorded so the choice is visible rather than inferred.
- **Effect:** formal PLAN-EVAL and IMPL-EVAL run in fresh native opposite-family sessions. Re-check
  #1524 before the last rail IMPL-EVAL; if it has landed, the cloud route becomes available and the
  switch is recorded here.

## D-3 — No canary declared by this lane

- **Severity:** minor
- **Recorded:** 2026-08-12, stage A
- **Fact:** `milestone-run.md` stage E declares canary points at wave boundaries.
- **Drift:** this topical lane declares none.
- **Authorization:** brief §7 — "Report merges immediately; root owns canary/stable." Stage E is
  owned by the root 0.0.6 orchestration, which computes payload from merge history
  (`canary-cadence.md`). This lane's obligation is a live `cut-trace.md` and an immediate merge report.

## D-4 — #1436's prescribed fix is a no-op; the issue's diagnosis is imprecise

- **Severity:** significant (a gate-integrity finding about a gate-integrity issue)
- **Recorded:** 2026-08-12, stage B, executed at `01aa12b67`
- **Fact:** #1436 states the parser "matches closing keywords **without a word boundary**" and
  prescribes `\b(clos(e|es|ed)|fix(es|ed)?|resolv(e|es|ed))\b\s+#\d+`. Executed against
  `.llm/tools/validation/acceptance-evidence.ts:43`, the word boundary is **already present** (landed
  by #1303) and the fence-stripping the issue does not mention is present too (`:47`).
- **Executed evidence** (`evidence/probe-1436-baseline.ts`):
  - `'Exact pre-fix #1431 head'` → `[1431]` — the reported defect, reproduced.
  - `'un-fixed #555'` → `[555]` — a second instance, **not** in the issue.
  - `'hotfix #999 landed'` → `[]`, `'prefixes #888 there'` → `[]`, `'This is a bugfix #777'` → `[]` —
    the three cases the issue predicts would break are already handled.
- **Why it matters:** `\b` is the cause, not the cure. `-` is a non-word character, so `\bfix\b`
  matches the `fix` inside `pre-fix`. Implementing the issue's literal prescription yields a patch
  that changes nothing while appearing to fix the bug — the exact class `milestone-run.md`
  § Gate integrity records ("two guards whose predicate could never be true … both did nothing and
  looked correct").
- **Action:** the correct predicate excludes a preceding hyphen as well as a preceding word character
  (`(?<![\w-])` shape). PR-A's brief carries `pre-fix`, `un-fixed`, `hotfix`, `prefixes`, `bugfix` as
  mandatory cases and the orchestrator re-runs the probe against the patched parser before merge.
  #1436's acceptance is unaffected (it has no checkboxes); the issue's *analysis* section is corrected
  by a comment on the issue, so the record is not silently better than the issue.
