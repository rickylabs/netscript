# Resume — rebased worker recovery follow-up

PR #2483 remains ready. Latest main 4aa734e2b6ca93119462ec2e0cd34b729df51bfd includes the
worker retry/DLQ feature; the branch is rebased without changing that behavior. User explicitly
authorized force-pushing for the conflict; protect the observed remote head with force-with-lease.

All four Augment findings are valid and fixed: ioredis timed-out spelling, logical prefixed
receipt members, fenced same-message newer-generation worker idempotency takeover, and automatic
job/task receipt renewal with actual subprocess cancellation. Explicit operator cancellation
retains its original ACK behavior. Worker fixtures are excluded via worker/test_utils.

Working-tree validation and negative controls are summarized in review-follow-up-validation.json.
The combined final test pass must be green before sign-off. Regenerate MCP corpus canonically
and verify native freshness/assets. Only one final evaluator round remains (round5), in the same
independent evaluator session, against the exact pushed rebased/fixed head. Prior round4 MERGE
is historical and cannot certify these changes. Final verdict belongs in the PR comment and
canonical report to avoid changing the evaluated commit just to record its own hash.

Reply to all four review threads with fixes and evidence; native review-thread gate must pass.
Keep final evaluation unchecked until that verdict, and scaffold-runtime unchecked until the
coordinator arms e2e-cli-gate and runtime CI passes. No local scaffold.runtime, label/milestone
mutation, merge/tag/release. Canonical READY handoff uses excluded atomic final-report file.
