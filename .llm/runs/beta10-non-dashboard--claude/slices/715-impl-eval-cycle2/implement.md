use harness

# IMPL-EVAL cycle 2 — PR #715 (`feat/netscript-mcp-skills`)

**You are the EVALUATOR. Return a verdict. Do not fix anything.**

A bug you quietly patch is a bug the verdict never records. Write findings, emit a verdict, stop.

## Read first

- `.llm/harness/evaluator/protocol.md` and `.llm/harness/evaluator/verdict-definitions.md`
- `.llm/runs/beta10-non-dashboard--claude/evaluate.md` — **cycle 1's verdict: `FAIL_FIX`, 8 findings**
- `.llm/runs/beta10-non-dashboard--claude/` — `worklog.md`, `drift.md`, `context-pack.md`
- `AGENTS.md`

## Why you exist

Cycle 1 (a separate opposite-family session) returned **`FAIL_FIX`** with 8 findings. **All 8 were
real.** The generator then fixed them — *and the generator is the same session that wrote the code you
are now checking.* Your entire job is to be the independent check on that self-remediation. A
`FAIL_FIX` does not clear itself.

Assume the fixes are wrong until you have reproduced them.

## Your primary task: verify each cycle-1 finding is ACTUALLY fixed

| # | Finding | Claimed fix |
| --- | --- | --- |
| **F1** | The `deno fmt` wrapper could **false-green**: crash-vs-finding was classified *globally*, so a crashed batch hid behind another batch's finding — and when the only findings were line-ending ones filtered by `--ignore-line-endings`, the gate exited **0** with a crashed batch. | `crashedBatches()` in `.llm/tools/run-deno-fmt.ts` now classifies **per batch**. New tests cover the mixed case and the filtered false-green. |
| **F2** | `packages/cli/README.md` told users to run `netscript plugin add workers` — **which does not exist** (exit 2). Also `deno dx` (real: `deno x -A`). | README now says `plugin install`; `FRAMEWORK_VERBS` list corrected. |
| **F3** | `packages/mcp/README.md` promised `p99` (only p50/p95 exist) and a "correlation id" chain (`get_last_job_result` returns an execution `id`; `netscript.correlation.id` appears nowhere in the package). | Recipes rewritten to match the contracts. |
| **F4** | `netscript agent init` wrote an **unversioned** `jsr:@netscript/cli` into `.mcp.json`; `DEFAULT_CLI_COMMAND` likewise. Semver `*` cannot select a pre-release, so the generated config **does not start**. | Delegated; escalated to release blocker **#769**. Both specifiers pinned + a **repo-wide, CI-blocking** version-drift guard. |
| **F5** | The tagline gate tool, its `deno.json` task, and a `deno.lock` delta were swept into #715 by `git add -A`, contradicting the worklog. | Removed from #715; `deno.lock` restored to PR-base. |
| **F7** | Fixture exclusion broader than the failure source. | Narrowed to `packages/mcp/tests/fixtures/doctor/`. |
| **F8** | The new mcp reference page claimed to be `deno doc`-generated; it is hand-authored. | Corrected. |
| **F6** | No Plan-Gate / Design checkpoint for this stream's new scope. | **NOT fixed — deliberately.** Recorded as drift D5; lessons promoted to `.llm/harness/lessons/`. A retroactive `plan.md` was **not** manufactured, on the grounds that faking evidence to clear a gate is worse than the gap. **Judge whether that disposition is acceptable.** |

For each: **reproduce it**. Confirm the fix is real, and that it did not introduce a new defect.

### Verify F1 by making the gate FAIL

Do not just run `deno task fmt:check` and see exit 0 — a green gate is not evidence a gate works.
Cycle 1's whole lesson was that green gates and passing tests were both consistent with a *broken*
gate. **Construct the mixed case** (one batch with a real formatting finding + one batch that crashes)
and prove the crash is reported and the run fails. Then construct the filtered case (the only finding
is a line-ending one, plus a crash) and prove it still fails. If you cannot make it fail when it
should, that is a finding.

Apply the same skepticism to F4's guard: **does it actually catch a version-less `jsr:@netscript/*`
specifier?** Add one somewhere temporarily and confirm the guard fires (then revert). A guard that
has never been seen to fail is not a guard.

## Also check for NEW defects

The remediation touched the fmt wrapper, root `deno.json`, both public READMEs, the mcp reference
page, `deno.lock`, and (via the delegated slice) `init-agent.ts`, `spawn-command-executor.ts`,
scaffold templates, and CI. Regressions are likely at those seams. In particular:

- `packages/mcp` must **not** import `packages/cli` (that would invert the layering). Check
  `arch:check`.
- The README claims were wrong once already. **Spot-check them against source again** — assume more
  remain.

## Gates the generator claims (treat as claims — re-run them)

| Gate | Claimed |
| --- | --- |
| wrapper regression tests | 10 passed, 0 failed |
| `deno task lint` | exit 0 |
| `deno task fmt:check` | exit 0, 0 failed batches |
| `deno task check` / `test` | green |
| `arch:check` | green |

## Boundaries

- **Do not modify any source, test, config, or doc file.** The only file you write is your verdict.
- Do not push, do not open a PR, do not merge, do not comment on GitHub.
- Do not delete lock files; do not run `deno cache --reload`.

## Deliverable

Write `.llm/runs/beta10-non-dashboard--claude/evaluate-cycle2.md`:

- per cycle-1 finding: **fixed / not fixed / fixed but introduced X**, with the evidence you ran;
- any new findings, with file, line, severity, and why it matters;
- an explicit judgement on the **F6 disposition** (drift + lessons instead of a retroactive plan);
- any claim in `worklog.md` you could not reproduce;
- a verdict token alone on its own line: `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT`.

Note: this is the **second** eval cycle. The harness escalates after two failures — so if you fail
this, say precisely what a third attempt must do.
