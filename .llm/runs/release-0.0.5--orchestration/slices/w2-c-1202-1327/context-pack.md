# W2-C context pack

## Current phase

Fourth serialized pass completed with raw exit 1 and `passed=61 failed=1`. Migration artifacts and
both allocation captures passed in the same run. Structural endpoint comparison also advanced, but
`behavior.live-db-endpoint` rejected the actual healthy check shape (`healthy: true`) because it
expects `status: "healthy"`; it stopped before structured-log/OTEL correlation. Pre/post leak
artifacts show no W2-C-owned or unknown survivor, and review threads pass with zero unanswered.
There was no retry or repair. The token is released failing and #1202 acceptance remains unticked.

## Identity

- Worktree: `/home/codex/repos/ns005-w2c`
- Branch: `fix/cli-db-live-endpoint-and-migrate-artifact`
- Base: `origin/main@c383b2e84`
- Draft PR: #1393
- Evaluator: orchestrator-launched separate Claude/Fable session per current supervisor prompt

## Locked boundary

- Close #1327 only when artifact acceptance is fully evidenced.
- The orchestrator withdrew the inherited owner-machine boundary for #1202 after re-reading its four
  actual acceptance rows and measuring the machine. PR #1393 may close #1202 when the four mapped
  runtime gates provide truthful evidence.
- Never run the serialized `scaffold.runtime` gate without a grant.

## Key facts

- Fixed `3001` default was already removed by PR #1211; this slice proves fresh live DB endpoint
  injection across two allocations.
- `runMigration` currently switches to `migrate deploy` whenever a database URI exists, producing
  #1327's false green despite a separate `db deploy` verb.
- The 2026-08-09 pre/post leak reports contain no W2-C-owned survivor. The sole reported container
  belongs to `/home/codex/repos/w6-review-desk` and was deliberately left untouched.
- The `--name` environment-key repair is required by #1327's named-artifact acceptance, not adjacent
  scope.
- #1202 contains four code/runtime rows only. The stale-write RED tests map row 2; the two
  allocation receipts plus live-endpoint health/structured-log/OTEL receipt must prove rows 1, 3,
  and 4.
