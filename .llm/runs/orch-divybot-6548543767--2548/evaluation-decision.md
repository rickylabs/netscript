# Evaluation stop decision

Two independent read-only source-review rounds used the same Claude Opus 5.5 high evaluator. Both returned FAIL_FIX; preserve the exact verdicts in slice-review.md and slice-review-repair.md.

The assignment's supplied leaf profile says: **Two consecutive terminal failures on one leaf ends the loop.** It also says **Do not try a third time.** No third evaluator round is launched, and no implementation PASS or READY is claimed. No evaluator resource lease was acquired; the print-mode process exited. Private resume identity is retained outside the public run, and is not committed.

F1: fixed — canonical registry is bumped and its compressed carrier is included in stable/canary staging; regression executes/decodes the production encoder.
F2: accepted tooling limitation — catalog meta.version follows generic version-field ownership at a future bump FROM 0.1.0; documented in drift.md.
F3: fixed after the second review — stable generated-output proof now checks registry:embed:check before consuming the carrier in downstream barrels. Regression fails before the change and passes after.

Remaining decision for Cockpit/owner: review the final F3 correction and supply an independent passing implementation verdict before READY/merge. This draft PR is the concrete reviewable delivery; local checks and dry-run proof are recorded without self-certification. Required non-draft CI remains a handoff gate; all-skipped draft runs are not a success claim.
