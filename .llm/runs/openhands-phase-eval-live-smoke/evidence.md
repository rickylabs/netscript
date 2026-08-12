# OpenHands phase-evaluation live smoke

This deliberately minimal pull request validates the post-merge IMPL-EVAL lifecycle.

Acceptance contract:

- moving this pull request from draft to ready for review dispatches exactly one evaluator;
- the default implementation evaluator is DeepSeek V4 Flash 0731;
- the evaluator reads this immutable head and does not commit to it;
- a passing verdict moves the pull request to `status:augment-review`;
- the evaluated head SHA remains unchanged throughout the evaluator run.

This file is test evidence only and must not be merged into `main`.
