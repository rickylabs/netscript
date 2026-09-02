# Exact three-arrival runtime proof procedure — #1839

Status: **prepared, not executed**. Do not begin until the owner explicitly confirms that the
current Aspire runtime queue has drained and releases this proof. This procedure intentionally
consumes no runtime slot while it is under review.

## What this proves

Three PRs carrying `e2e-cli-gate`, arriving within one minute, must each execute both modified
runtime jobs to real terminal conclusions. The captured job timestamps must show repo-wide
serialization independently for each tier, and each deferred run must reach its slot without any
push to its head branch.

The earlier standalone no-op runs are retained in `simulation-evidence.md` as general scheduler
evidence. They are not inputs to this exact proof.

## 1. Hard stop and drain precondition

1. Wait for an explicit owner release. Silence, elapsed time, or an apparently idle runner is not
   authorization.
2. Immediately before release, query the GitHub Actions API for active `e2e-cli` runs and their
   jobs. Require that no job with either exact name is `requested`, `waiting`, `pending`, `queued`,
   or `in_progress`:
   - `scaffold-runtime (aspire + docker + postgres)`
   - `scaffold-runtime-sqlite (aspire + sqlite + garnet)`
3. Preserve the API response and captured command exit. If either lane is occupied, stop without
   opening or readying proof PRs and ask the owner to re-sequence the proof.

## 2. Freeze the proof base and heads

After this artifact-honesty correction is remote, resolve and record the remote SHA of
`ci/e2e-runtime-concurrency-queue` as `PROOF_BASE_SHA`. Create these three branches at that exact
SHA:

| Arrival | Branch | Unique inert marker |
| ------- | ------ | ------------------- |
| A | `test/e2e-runtime-queue-proof-1839-a` | `apps/e2e-runtime-queue-proof-1839/arrival-a.txt` |
| B | `test/e2e-runtime-queue-proof-1839-b` | `apps/e2e-runtime-queue-proof-1839/arrival-b.txt` |
| C | `test/e2e-runtime-queue-proof-1839-c` | `apps/e2e-runtime-queue-proof-1839/arrival-c.txt` |

Each proof branch contains exactly one unique inert marker commit and is never merged. The temporary
`apps/` path is a classifier input only; it is not an application scaffold and contains no code.
These throwaway proof-only changes are deliberately outside PR #1846's merge scope and do not touch
the prohibited `packages/**` or `plugins/**` trees. Their only purpose is to make the checked-in
classifier select both runtime tiers without selecting the desktop lane.

Before any proof PR is opened, invoke the classifier's pure `decide` function for each marker and
fail closed unless `runStatic`, `runRuntimeSqlite`, `runRuntime`, and `needsDocker` are true while
`needsDesktop` and `docsOnly` are false. The preflight for the A-path produced that vector with
captured exit 0 on 2026-09-01; repeat it for all three final diffs.

Push each proof branch exactly once, before opening its PR, and record immutable head SHAs `H_A`,
`H_B`, and `H_C`. From this point onward, do not commit, push, force-push, update branches, or use an
empty commit on any proof branch.

## 3. Prepare three draft PRs without dispatching the gate

Open three draft PRs with base `ci/e2e-runtime-concurrency-queue`, one per proof branch. Use titles
`test(ci): #1839 runtime queue proof arrival A`, B, and C. Each body must say that the PR is
evidence-only, must never merge, and remains available until the owner ratifies the evidence.

Apply `e2e-cli-gate` plus the normal proof-PR taxonomy (`type:test`, `area:tooling`, `priority:p1`,
exactly one `status:impl`) and `impl-eval:skip` before release. Do not apply `ci:skip-e2e`,
`ci:skip-scaffold`, `ci:full`, or `desktop-native-gate`. Record the PR number, branch, head SHA,
label snapshot, base SHA, and milestone `0.0.7` for each. The evidence-only bodies use `Refs #1839`
and must not carry a closing keyword. Draft PR preparation must not dispatch the configured
ready-for-review gate; if it unexpectedly dispatches any runtime work, stop and notify the owner.

## 4. Create the three arrivals

After the owner release and the drain assertion in section 1, mark all three proof PRs ready through
one API batch if supported, otherwise by three immediate API calls. This ready transition is the
only arrival action: make no label or branch change.

Capture each ready-transition timestamp and the resulting `e2e-cli` workflow run ID. Assert:

- `max(run.created_at) - min(run.created_at) <= 60 seconds`;
- each run was triggered for the expected proof PR and `head_sha === H_A`, `H_B`, or `H_C`;
- no second run or redispatch is substituted for an evicted/cancelled first run.

If any assertion fails, preserve the runs and stop for owner direction. Do not push or manually
rerun as a recovery mechanism.

## 5. Require both runtime tiers to reach real conclusions

For each of the three run IDs, fetch the complete job and step payload. Require both exact runtime
job names from section 1 to complete with a genuine terminal conclusion. `cancelled`, `skipped`,
`neutral`, `startup_failure`, or a missing job is not a real gate conclusion.

Also require the tier's actual one-pass runtime step to have started and completed:

- Docker tier: `Full scaffold runtime E2E (one pass, with cleanup)`
- SQLite tier: `SQLite scaffold runtime E2E (one pass, with cleanup)`

Record for all six jobs: workflow run ID, job ID, job name, status, conclusion, `started_at`,
`completed_at`, and the named runtime step's status/conclusion. A real test failure is distinguishable
evidence that the gate ran; it is not a pass for merge readiness and must be reported plainly.

## 6. Assert serialization from timestamps

Use API job timestamps, not workflow configuration. Evaluate the tiers independently:

1. Sort the three Docker-tier jobs by `started_at` and require each previous `completed_at` to be
   less than or equal to the next `started_at`.
2. Repeat for the three SQLite-tier jobs.
3. Report `overlap_count: 0` separately for Docker and SQLite.

Overlap between one Docker job and one SQLite job is allowed because the tiers intentionally have
different concurrency groups. Only same-tier overlap violates serialization.

## 7. Assert head immutability after deferral

After all six runtime jobs complete:

1. Require each workflow run's `head_sha` still equals its recorded `H_A`, `H_B`, or `H_C`.
2. Fetch each PR's current head SHA and require the same equality.
3. Run raw `git ls-remote` for each proof branch and require the remote ref still equals the frozen
   head SHA.
4. Inspect the PR event timeline for any `synchronize` event after the ready transition. Record none
   expected; investigate any occurrence even if the final SHA happens to match.

These checks prove that admission of a deferred run did not depend on a head-moving push. Do not
delete proof branches or close proof PRs until the owner ratifies the evidence.

## 8. Mirror all five acceptance boxes

Write a durable exact-proof artifact containing the three run IDs, six job IDs/conclusions, both
per-tier interval tables, frozen/final head comparisons, arrival span, and captured assertion exits.
Then update PR #1846 with this exact mapping:

1. Three `e2e-cli-gate` PRs arrived within one minute and each executed both runtime tiers to real
   conclusions — three run IDs plus six job/step records.
2. At most one job per runtime tier executed repo-wide — two timestamp tables, each with zero
   overlap.
3. Deferred admission required no head movement — run, PR, and remote-ref SHA equality for A/B/C,
   plus no post-ready synchronize event.
4. The `e2e-cli.yml` header documents the bounded native queue and why default concurrency is
   insufficient — workflow diff evidence.
5. Deferred/failed/cancelled states are distinguishable — all run IDs and per-job/step conclusions
   are named explicitly; any cancellation is treated as missing gate coverage, never as a test
   failure.

Only after all five boxes have exact evidence should the PR record claim acceptance. The owner will
drive PR #1846's ready transition and exact CI. This implementation session must not run an
IMPL-EVAL or change PR #1846's labels/readiness.
