# Research — #1908 runtime concurrency-key isolation

## Re-baseline

- Implementation baseline: `d5c5810db`.
- PR head before co-author acceptance: `541eb914b`.
- The product change is confined to the two job-level concurrency group literals and the Queue
  policy header in `.github/workflows/e2e-cli.yml`.
- `origin/main` advanced after implementation, but no intervening commit changed
  `.github/workflows/e2e-cli.yml` or `.github/scripts/ci-classify-changes.test.ts`; the focused
  acceptance surface is unchanged.

## Findings

1. GitHub evaluates the arriving job's concurrency configuration. A pre-#1846 job on the v1 key can
   therefore apply the old single-pending/cancellation behavior to every job sharing that literal.
2. A cancelled job with zero steps is queue-admission evidence, not a runtime-test conclusion.
3. The fixed v2 keys isolate both hosted runtime tiers without changing `cancel-in-progress: false`
   or `queue: max`.
4. The existing workflow regression test checked each v1 key only as a substring. Because every v2
   key begins with its v1 spelling, the test passed without proving key versioning.
5. Exact assertions for both v2 keys, plus explicit absence checks for the newline-terminated v1
   literals, close that static regression hole.

## Acceptance strategy

Use one real fixed-v2 PR run and one real stale-v1 arrival. Start the fixed runtime jobs first, then
admit the stale jobs while the fixed jobs are running. The decisive result is that the fixed jobs
reach terminal non-cancelled conclusions on their immutable head even though the stale-v1 jobs
became eligible during their execution. This exercises the real workflow and GitHub scheduler while
avoiding redundant local scaffold runtime execution.

## Open questions

None. Exact run and job IDs are recorded after the hosted exercise completes.
