# Drift

- RTK unavailable; native commands used.
- Owner explicitly selects claude-opus-5-5 high read-only evaluation, overriding the feature matrix evaluator preference. No vendor/session independence waiver.
- Assignment generic completion footer conflicts with operator directive; operator directive wins: Refs #2516 only, draft until green required checks.

- CI skips draft PR jobs by design (.github/workflows/ci.yml). The operator requires an initial draft and reserves the READY report for green exact-head checks; transition out of draft after local tests/review is necessary to materialize CI. No READY claim is implied by that transition.
- Runtime suite raw exit 1 because Docker preflight/cleanup inventory cannot connect to the daemon. Per owner instruction this runtime gate is UNPROVEN; no infrastructure or unknown resources are changed.

- Current-head hosted quality failed at Aspire version parity because the tracked-file inventory gained the new init regression test. The initial local gate ran while that file was untracked and therefore invisible to git grep. Owner requested CI repair; regenerate the existing manifest rather than changing scan policy or pins.
