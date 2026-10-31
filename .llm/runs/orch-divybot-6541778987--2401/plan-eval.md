**PLAN-EVAL round 2: issue #2401, Aspire watch lifecycle (blockers only)**

Both round 1 blockers are now closed in `plan.md`, and `worklog.md` and `drift.md` agree with it.

**Blocker 1: start/follow ordering. Resolved.**
- **Order:** the locked design starts the resource-scoped follower and reads its first matching record before running `resource start`. All of this sits under one operation deadline.
- **Old state ignored:** that first record is only a baseline, so a terminal state left over from a previous run cannot count as this run's result.
- **Completion rule:** after `resource start`, the runner accepts a terminal record with a numeric exit code only after it has seen a new nonterminal record.
- **Fast runs:** the follower is already connected while `start` runs, so a quick start-then-finish sequence is captured in order.
- **Failure mode:** a stream that only ever shows a terminal state is ambiguous. It now fails at the deadline instead of reporting an old success.
- **Fixtures:** both regression fixtures I asked for are named: a stale earlier terminal record followed by a new run, and a fast run that finishes right after the first record.
- **Records:** the deferred-scope section no longer leaves this decision open, and `drift.md` records it as a tightening of existing behaviour that stays within scope.

**Blocker 2: negative control and reaping proof. Resolved.**
- **Negative control:** restoring the old polling code must fail one named runner test, `one follow stream spans simulated minutes without snapshot polls`. That test requires exactly one follow stream and zero snapshot `describe` calls. The old loop makes repeated snapshot calls and opens no stream, so it would fail. A runner test was one of the two options I offered, so leaving the polling guard as "only if needed" is acceptable.
- **Reaping:** fake CLI children cover early return, quiet timeout, cancellation by the caller, and malformed input. Each case asserts the child was killed and its exit status awaited, and that stderr was drained.
- **Escalation:** a child that ignores SIGTERM is force-killed after a named, bounded grace period.

**Unchanged from round 1:**
- The caller inventory covers the full scope.
- The plan keeps exact resource and type matching, exit-code validation, the deadline, signal handling, resource stop, request-file removal, and resident-versus-standalone ownership.
- No new exports, dependencies or upgrades are added.
- No `scaffold.runtime` runs locally; the coordinator-owned CI run is required.

PASS
