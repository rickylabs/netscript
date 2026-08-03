use harness

## SKILL

Read `.agents/skills/netscript-tools/SKILL.md` and `.agents/skills/netscript-cli/SKILL.md`. You are
the implementation lane (Codex · GPT-5.6 Sol · low) for slice **S5** of epic #1169, closing #1172
(read it in full: `gh issue view 1172 --repo rickylabs/netscript`). Supervisor reviews before
sign-off; commit but do NOT push; no PRs.

Worktree `/home/codex/repos/ns004-s5-lease`, branch `fix/1172-suite-mutex`.
Scope: `.github/workflows/e2e-cli.yml` (scaffold-runtime job concurrency ONLY), a new local suite
lease under `packages/cli/e2e/src/` wired into the suite runner, tests, run-dir worklog.
Do NOT touch `e2e-cli-prod*.yml`, `ci.yml`, or `.llm/tools/release/`.

### Design contract (LOCKED)

**A. CI half — cross-ref queueing for the expensive job only**

In `e2e-cli.yml`, give the `scaffold-runtime` job its own job-level `concurrency` group that is
NOT ref-scoped (e.g. `e2e-scaffold-runtime-global`) with `cancel-in-progress: false`, so two PRs
queue instead of colliding on shared Docker/Aspire resources. The workflow-level per-ref group
stays as-is (cancel superseded runs of the same PR). Leave every other job untouched.

**B. Local half — suite lease that names contention**

1. New `packages/cli/e2e/src/application/runner/suite-lease.ts` (pattern reference:
   `.llm/tools/agentic/runtime/sender-ownership.ts`, but self-contained in the e2e package):
   acquire an exclusive lease file before an expensive suite starts, containing
   `{pid, startedAt, suiteId, worktree}`. Lease path under the OS temp dir keyed by a constant
   (e.g. `netscript-e2e-scaffold-runtime.lease`), NOT under the repo.
2. On contention (lease exists and its pid is alive): refuse to start, exit non-zero, and the
   message names the holder pid, its worktree, its startedAt, and the lease path — the refusal is
   a contention verdict, never a product failure. If the holder pid is dead, break the stale lease
   with a logged notice and proceed.
3. Wire into the suite runner ONLY for the expensive suites (`scaffold.runtime` — check
   `domain/cli-surface.ts` for the suite id constant; do not lease cheap suites). Release the
   lease on completion including failure paths (try/finally).
4. Named constants for lease filename, stale-check semantics; no `any`, no lint-ignores.

### Tests (negative cases are the point) — fake filesystem/pid checker via ports where sensible

- second acquire while holder alive → refusal whose message contains holder pid + lease path
- holder dead → stale lease broken with notice, acquire succeeds
- release on suite failure path (finally) → next acquire succeeds
- cheap suite → no lease interaction

### Gates to run and record in `.llm/runs/fix-1172-suite-mutex--s5/worklog.md`

```
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli/e2e --ext ts
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli/e2e --ext ts
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli/e2e --ext ts
deno task --cwd packages/cli/e2e test
deno eval YAML-parse of .github/workflows/e2e-cli.yml
```

Plus one REAL negative-case demonstration: simulate a live holder (write a lease with your own
shell's pid), invoke the lease acquire path (a tiny deno eval or the suite entry with a flag), and
paste the refusal text into the worklog. Do NOT run the actual scaffold.runtime suite.

### Done means

Gates green + real refusal transcript in worklog; single commit on `fix/1172-suite-mutex`:
`fix(e2e): expensive suites queue in CI and refuse locally with a named contention verdict (#1172)`.
Commit, do not push.
