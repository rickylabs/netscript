# W2-C context pack

## Current phase

Implementation handoff with a serialized-suite coverage gap. The granted one-pass runtime command
returned `passed=76 failed=0`, but its explicit allowlist omitted all four newly registered W2-C
acceptance gates. The selector is repaired and focused-green; those four gates still need a fresh
orchestrator-authorized runtime pass before merge readiness.

## Identity

- Worktree: `/home/codex/repos/ns005-w2c`
- Branch: `fix/cli-db-live-endpoint-and-migrate-artifact`
- Base: `origin/main@c383b2e84`
- Draft PR: #1393
- Evaluator: orchestrator-launched separate Claude/Fable session per current supervisor prompt

## Locked boundary

- Close #1327 only when artifact acceptance is fully evidenced.
- Reference #1202 without a closing keyword. Never claim the owner-machine collision identity or
  three consecutive owner-machine runtime passes.
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
