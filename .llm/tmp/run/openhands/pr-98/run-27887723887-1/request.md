You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max provider=openrouter output=pr-comment iterations=800

use harness

# IMPL-EVAL — PR #98 `fix(database): deterministic db init` (separate-session evaluator)

You are the IMPL-EVAL evaluator for PR #98 on branch `fix/cli-db-init-flake` (base `feat/framework-prime-time`). You are a SEPARATE session from the generator and you do NOT implement — you independently verify and emit a verdict. The generator's claim: the recurring random `db init` failure in the `scaffold.runtime` e2e is a transient Windows Prisma **schema-engine** crash (`ERR_STREAM_PREMATURE_CLOSE` during `can-connect-to-database`), fixed by a bounded retry that fires ONLY on the transient signature and never masks real errors.

## SKILL (activate each before evaluating — read the SKILL.md)
- **`netscript-harness`** — IMPL-EVAL protocol (`.llm/harness/evaluator/protocol.md` + `verdict-definitions.md`); verdict is `PASS` / `FAIL_FIX` / `FAIL_RESCOPE` / `FAIL_DEBT`; generator never self-certifies; you are the separate session.
- **`netscript-doctrine`** — `packages/database` is a framework package; confirm the change respects package boundaries (the spawn site is `@netscript/database/scripts`, consumed by the CLI's scaffolded `migrate.ts.template`).
- **`netscript-deno-toolchain`** — native Deno 2.8 gate commands for check/test on `packages/database`.
- **`netscript-tools`** — scoped validation wrappers (`run-deno-{check,lint,fmt}.ts`), raw git verification, and **lock-hygiene** confirmation (deno.lock must be untouched by the commit).
- **`netscript-cli`** — context for how the scaffolded project's `migrate.ts.template` calls into `@netscript/database/scripts`, so the fix at the spawn site is the correct layer.
- **`rtk`** — prefix read-heavy `git`/`grep` with `rtk` and wrap `deno task` runs in `rtk proxy`.

## What to verify (independently — do not trust the PR description)
1. **Root-cause soundness.** Confirm from the diff that the retry classifier `isRetriableMigrationFailure` matches ONLY the transient schema-engine signature (`ERR_STREAM_PREMATURE_CLOSE` / `Premature close` / `Schema engine exited`) and that ANY other failure (real schema/SQL/connection error) returns immediately without retry. A retry that could swallow a genuine migration error is an automatic `FAIL_FIX`.
2. **Idempotency claim.** Confirm the retried operation is the pre-SQL preflight/`migrate` invocation (safe to re-run), not something that could double-apply a migration.
3. **No masking / honest logs.** stderr must be captured for classification AND surfaced (not swallowed). Interactive runs must keep inherited stderr and must NOT be retried.
4. **Type soundness.** ZERO new casts (`as` / `as unknown as` / `as any` / `@ts-*`). The program-wide zero-cast rule applies.
5. **Lock hygiene.** `git show --stat 4335a939` must NOT include `deno.lock`; no new imports / dependency-graph change.
6. **Tests.** Run `packages/database` tests including `migrate-retry_test.ts`. Confirm the 5 cases genuinely cover: retry-then-succeed on the verbatim captured stderr, bounded stop at maxAttempts, NO-retry on a real error, interactive single-shot, first-attempt success. Run the scoped check/lint/fmt on `packages/database`.
7. **Scope.** Changes confined to `packages/database/scripts/{migrate.ts,mod.ts}` + `packages/database/tests/migrate-retry_test.ts`. Flag any out-of-scope edit.

## Gate commands (run from repo root)
- `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/database --ext ts,tsx --unstable-kv`
- `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/database --ext ts,tsx`
- `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/database --ext ts,tsx`
- `deno task --cwd packages/database test` (or the repo's targeted test task for that package)
- You are NOT required to run the full `scaffold.runtime` e2e (the flake is low-rate; one run proves nothing). If you want a confidence signal, you MAY run it once and report the result, but the determinism verdict rests on the classifier correctness + unit tests, not on a single e2e pass.

## Output
Post your verdict as a PR comment. Begin the verdict line with a clear, NON-bold token the supervisor's tooling can parse, e.g. a line `Verdict: PASS` or `Verdict: FAIL_FIX` (plain text, not markdown-bolded). Then give the evidence: each gate's raw result, the test run summary, the cast scan, the lock-hygiene check, and your reasoning on whether the retry can ever mask a real error. Preserve lock hygiene: do NOT commit `deno.lock` re-resolution or source churn.


Issue/PR title: fix(database): deterministic db init - bounded retry on transient Prisma schema-engine crash

Operational contract:
- Read AGENTS.md first.
- Your iteration budget is limited. Create deliverable files in the repository
  workspace EARLY and grow them incrementally as you learn; never defer all
  writing to the end of the run. Uncommitted workspace files are committed back
  to the branch automatically when the run ends, even if you run out of budget.
- If the task says "use harness", follow .agents/skills/netscript-harness/SKILL.md.
- If the work touches packages/ or plugins/, use .agents/skills/netscript-doctrine/SKILL.md.
- Use rtk for read-heavy git/grep/gh/docker commands when it is available.
- Preserve user changes and avoid destructive git commands.
- Run the smallest validation that proves the change.
- Do not post GitHub issue or PR comments directly. The workflow owns GitHub comments.
- Write /home/runner/work/_temp/openhands/27887723887-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27887723887-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-98/run-27887723887-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 98
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27887723887
