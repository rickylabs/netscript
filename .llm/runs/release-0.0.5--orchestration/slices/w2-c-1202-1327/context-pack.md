# W2-C context pack

## Current phase

Sixth serialized pass completed green with raw exit 0 and `passed=80 failed=0`. Separate-session
Fable 5 IMPL-EVAL independently confirmed the code and adversarial gate behavior, then returned one
wording-only `FAIL_FIX`: the claimed historical #1202 persisting mechanism was falsified by source
history. The owner amended row 2 to the no-persisting-path invariant this slice actually proves and
split identification to #1396. PR/worklog evidence is corrected without code or a runtime rerun;
PR #1393 is ready for `status:ready-merge` handoff.

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
- #1202 row 2 is the RED-first no-persisting-path invariant plus two-allocation runtime proof. The
  earlier eager-`getEndpoint("tcp")` causal claim was false: the database generator was already lazy
  at the reproduction baseline. Historical mechanism identification is tracked by #1396.
- #1202 row 1's first-start binding is proven structurally; its direct health probe runs after the
  second start, which is the stricter re-allocation case. Rows 3 and 4 are proven by the same sixth
  runtime receipt.
- #1327 applied-state verification uses `prisma migrate status`, which reads
  `_prisma_migrations`, alongside migration-file inventory.
