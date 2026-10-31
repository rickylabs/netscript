# Resume — round5 W1 fixed, fresh independent cycle required

PR #2483 remains ready and rebased onto main 4aa734e. All four Augment findings have fixes
and replies, and native review-thread gate passes. Round5 independently reviewed exact head
1edb71eeeb72ddd4d84327bc9bd97f79ce5c31b3 and returned CHANGES for one W1 blocker: throwing
expected requeue outcomes exhausts the Redis listener supervisor's lifetime restart budget.

The follow-up code explicitly nacks and returns for queue requeue outcomes, preserves disabled/
missing task ACK behavior and direct non-queue replay rejection, and leaves supervisor/listen
concurrency unchanged. Real Redis/Garnet regressions exercise six disabled tasks, six active
caller-key duplicates and six lost-lease jobs, then prove later valid work executes with zero
supervisor restarts. Four task-survival tests fail on round5 source and all six new cases pass
on the correction. Existing shutdown/DLQ tests assert explicit settlement rather than rejection.

Final combined follow-up suite and exact-head gate results are recorded in listener-validation.json
and the PR update. Corrected-head independent approval is UNPROVEN. The supplied feature cycle
caps implementation evaluations at five; all are used. Coordinator must authorize a fresh cycle
before re-steering the same independent evaluator. Do not silently launch round6 or self-certify.

Required full scaffold-runtime CI remains unproven until coordinator #2474 arms e2e-cli-gate.
Keep both corrected-head review and runtime acceptance unchecked. No local scaffold.runtime,
label/milestone changes, merge/tag/release. Canonical BLOCKED report uses excluded atomic handoff.
