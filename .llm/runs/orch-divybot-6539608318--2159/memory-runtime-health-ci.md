# Generated saga health investigation

Core CI is green at da931b7, including the repaired test-5/test-6 shards and aggregate check-test.
Both full runtime tiers fail only behavior.plugins-health: sagas API healthy, child Running/unhealthy.
An unchanged SQLite retry repeats 105 passed / 1 failed. Earlier background-children-health passed
for all three children; no startup failure is established. Latest main workflow comparison has green
runtime tiers, but predates the current main changes; do not call this a baseline-proven regression.

The generated runtime glue boots a non-empty registry on the real default KV store and produces a
ready payload accepted by the doctor's strict parser. Preserve that focused process regression.
Capture bounded, redacted child endpoint evidence on doctor failure before suite cleanup. This
diagnostic wrapper must preserve the doctor's exit code and must not retry or relax readiness.
Six focused generated-process, diagnostic/redaction and existing gate tests pass.

CI checks the PR merge ref, which includes newer main queue/registry changes absent from the branch.
Align with main by a normal merge before final review, never rebase or force-push.

Normal main merge and diagnostic push are 4824597. An isolated native Redis process also boots the
generated runner and retains a valid ready payload. Latest merged PRs #2496 and #2497 each have green
Postgres/SQLite runtime checks, a more recent comparison than the older main-branch workflow run.

Adding an Aspire-related diagnostic or test changes the tracked surface inventory. Regenerate with
aspire-surface-manifest.ts and run check:aspire-version-parity; the two added paths are the entire
generated diff. Local repaired parity is fresh, 994 paths checked, zero failures. No version bump.
