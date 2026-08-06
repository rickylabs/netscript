use harness

## SKILL

Read and follow root `AGENTS.md`, `netscript-harness`, `netscript-tools`, `netscript-pr`, `rtk`, and
the run's complete research/plan/PLAN-EVAL/S1/review evidence before acting.

Resume existing Codex GPT-5.6 Sol low supervisor thread
`019fd897-cf69-75d3-9e46-bb87cc62c226` for **S2 implementation/static gates only** on issue #1338 /
draft PR #1339. S1 is independently reviewed PASS. Do not redo S1 or start S3.

Implement the locked S2 bounded provider-canary evidence contract in the smallest coherent slice:

- record requested versus observed provider/model/effort identity and fail closed on absent or
  mismatched observations;
- record bypass/permission mode, session id, start/end/timeout, exit/terminal outcome, bounded raw
  and normalized artifact paths/hashes, reasoning/tool event behavior, and provider cost/usage;
- when currency cost is not surfaced, record the literal `unavailable`, never zero or an inference;
- keep credential values out of committed evidence and logs;
- update only provider-canary runtime/adapter/CLI code, focused tests/current fixtures, and owned run
  artifacts required by S2. Do not alter S1 contracts except where the canary must consume the new
  preset; do not touch docs/skills/generated surfaces reserved for S3.

Preflight exact local/authoritative-remote/PR head equality and verify `deno.lock` exact HEAD blob
`ef28b1b056705b456a66601ceeb46eede9def7b0`. Never stage it or intentionally write it. Every test
must be explicitly lockless, including spawned child commands (`--deno-arg --no-lock` where
applicable). If a command changes the lock, stop immediately without restoring it and report the
trigger; the milestone orchestrator will attribute and repair only proven run-owned state.

Run the focused S2 tests from the plan, the credential-blind static provider-canary verdict, and the
full `.llm/tools/agentic/` test suite with `--no-lock`. Avoid plain `deno task` when task resolution
would rewrite the lock; use the checked-in direct equivalent or a supported frozen task invocation
and record the exact divergence. Update `worklog.md`, `context-pack.md`, `supervisor.md`, and
`drift.md` with commands/results/schema and lock identity. Commit with explicit pathspecs excluding
`deno.lock`, push the exact branch refspec, and stop `DONE`.

Do **not** launch the live DeepSeek canary, ordinary review, formal IMPL-EVAL, GitHub Actions, merge,
release publication, canary cut, issue closure, or lifecycle change. The milestone orchestrator
exclusively owns the live `deepseek/deepseek-v4-flash-0731` max turn after static gates and separate
review.
