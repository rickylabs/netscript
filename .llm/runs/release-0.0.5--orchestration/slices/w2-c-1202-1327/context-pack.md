# W2-C context pack

## Current phase

The live health matcher is now derived from `@netscript/service`'s documented `HealthResponse`
producer contract and covered by the verbatim fourth-pass response plus an adversarial unhealthy
database fixture. Focused RED/green, scoped wrappers, `quality:gate`, and `arch:check` pass. Row 2's
persisting mechanism is explicitly recorded as eager `getEndpoint("tcp")` materialization versus
lazy `infrastructure.primaryDatabase` resource binding. W2-B holds the serialized token, so no fifth
runtime pass was attempted. `EXPENSIVE-GATE-REQUEST` is recorded; rows 1, 3, and 4 await the
complete endpoint/health/log/OTEL receipt.

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
