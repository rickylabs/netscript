# Adversarial triage — PR #471 (findings: `adversarial-findings.md`)

Reviewer verdict: no blockers, 6 major + 2 minor, mirror byte-identical. Supervisor disposition
per finding:

| # | Severity | Disposition | Fix |
| --- | --- | --- | --- |
| 1 | major | **ACCEPTED** — boundary as written was self-contradictory. | `seed-run.md`: boundary redefined as two surfaces — the run's own draft PR is always writable (it IS the commit trail); the **board** (issues/epics/milestones/repo labels) is untouchable before H. Run-layout bullet, Stage H, and Hard Invariants all updated to the same wording. |
| 2 | major | **ACCEPTED** — `plan/` was outside the canonical taxonomy. | `netscript-pr` SKILL: `plan/` registered as a seed-run-only branch type pointing at `seed-run.md`; `seed-run.md` names it "the seed-run branch type in the netscript-pr taxonomy". Reconciled in the canonical home, not by restating taxonomy in the harness doc. |
| 3 | major | **ACCEPTED** — Stage B omitted the Tier-C hard rule. | `seed-run.md` Stage B: workflows commit `workflow.js` to `<run-dir>/workflows/` before execution; corpus from an uncommitted workflow is not Stage-B proof. Checklist item extended. |
| 4 | major | **ACCEPTED** — "D, then A" was a restated lane routing. | Stage F lane cell now "distinct-model reviewer (see Stage F), then A"; new Stage F section fixes only the invariants (unoriented, separate session, model distinct from all authoring lanes, findings-only) and defers the tier choice to `supervisor.md` per lane-policy. |
| 5 | major | **ACCEPTED** — `phase-registry.md` wrongly mandatory. | Run-layout list now scopes it: "only when the run spans multiple phase groups — activation.md step 9". |
| 6 | major | **ACCEPTED-CLARIFIED** — the eval exception needed precise scoping. | Drift #3 appended: what is skipped for THIS docs-only codification run is the PLAN-EVAL pass (owner-directed); the separate-session OpenHands verdict (IMPL-EVAL analog, written to `evaluate.md`) and both hard invariants are retained. The exception is surfaced to the owner for ratification with the PR — it is not claimed to be doc-authorized. |
| 7 | minor | **ACCEPTED** — stale run state. | `worklog.md` (PR #471, S4/S5 log rows) and `context-pack.md` (Next) refreshed. |
| 8 | minor | **ACCEPTED** — `FILING-LOG` vs `FILING-LOG.md`. | Stage-H table cell now `FILING-LOG.md`. |

No finding rejected. All fixes land in slice S5.
