use harness

## SKILL

- `netscript-harness` — IMPL-EVAL protocol, verdict format, evidence rules.
- `netscript-doctrine` — package boundaries for `packages/cli/e2e`.
- `netscript-tools` — validation wrappers and gate evidence.

## ROLE

INDEPENDENT IMPL-EVAL agent. Verdict only; do not edit files.

Repo: /home/agent/projects/netscript/worktrees/007-eval-slot (read-only, detached at the head below)
PR #1760 (S10), branch `test/aspire-13-5-s10-e2e-gate-upgrades`, head `4cce17266`, base `main`.

**Current-head evaluation, bounded to this slice's own work.** Do NOT run the hosted runtime tiers —
both are already SUCCESS at this exact head and those receipts are reused. Static work only:
`deno check --unstable-kv`, targeted `deno test`, lint/fmt on changed paths.

### Scope

Evaluate `git diff 0622dc432..4cce17266 -- packages plugins` — **26 files, +1863/−264**. That is
S10's own product footprint against `main`. The raw diff since the slice's last PASS (`c61b1626`) is
316 files, but that is overwhelmingly `main`'s own movement absorbed through merges; do not evaluate
upstream commits. A prior IMPL-EVAL cycle-2 returned PASS at `c61b1626`.

### What the slice claims to do

S10 replaces polling-and-hoping in the e2e runtime gates with parsed Aspire 13.5 evidence:

- deletes `wait-for-workers-runtime.ts` (−92) and its test (−40), replacing the polling helper with
  structured `aspire describe --follow` parsing;
- adds four evidence modules — `evidence/describe-follow.ts` (+435), `evidence/cleanup.ts` (+250),
  `evidence/resource-command.ts` (+136), `evidence/doctor.ts` (+103);
- reworks `runtime-gates.ts` (214 changed lines);
- adds fixtures captured from 13.5.3 and tests for structured evidence, cleanup evidence and the
  resource-command gate.

### Judge exactly this

1. **Do the tests assert real behaviour, or their own fixtures' shape?** This is the highest-risk
   question for this slice: it is mostly test-and-fixture code, and a fixture-shaped assertion proves
   nothing. Check specifically that `describe-follow` parsing is exercised against the captured
   13.5.3 ndjson fixtures including the nullable-state one, and that a malformed/invalid `ResourceJson`
   is actually rejected rather than silently coerced.
2. **Fail-closed semantics.** `doctor.ts` must fail closed on an explicit failed check while
   preserving warnings; `cleanup.ts` must only add `--force` after an exact-AppHost graceful stop, and
   its ownership containment must be path-boundary safe. Verify these are asserted, not assumed.
3. **Deletion safety.** Is anything lost with `wait-for-workers-runtime.ts` that no new module covers?
4. **Skip receipts.** `resource-command.ts` claims an explicit absent-start skip receipt — confirm a
   silently skipped probe is recorded rather than passing by omission.
5. Anything that would invalidate a finding the `c61b1626` PASS relied on.

### Validation to run

- `deno check --unstable-kv` over the changed `packages/cli/e2e` paths
- `deno test --allow-all packages/cli/e2e/tests/` (report passed/failed counts)

Output STRICT JSONL, last line the verdict:
{"area":"<name>","ok":true|false,"evidence":"..."}
{"verdict":"PASS|FAIL_IMPL","summary":"..."}
Ground every claim in a command you actually ran, with its output.
