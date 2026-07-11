use harness

# Slice brief — #603: multi-turn Codex slice runner (resume-until-done over send-message-v2)

## SKILL

Read: `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/netscript-tools/SKILL.md`,
`.agents/skills/codex-wsl-remote/SKILL.md`, `.agents/skills/rtk/SKILL.md`, and
`.llm/tools/agentic/README.md` (suite map + maintenance rules — volatile values only in
`.llm/tools/agentic/config/`).

## Identity + ground rules

- WSL Codex implementation agent under the beta-7 orchestrator (Claude session `df71d36c`).
  Do NOT open PRs. **PLAN-EVAL waiver** (owner-waived, drift D1) — plan in worklog, then implement.
- Worktree: `/home/codex/repos/ns-wt-603`, branch `feat/603-codex-slice-runner`.
- Push: `git push origin HEAD:refs/heads/feat/603-codex-slice-runner`.
- Worklog at `.llm/runs/feat-603-slice-runner--codex/worklog.md`, committed with the slice.

## Task (issue #603, pilot-eval I2)

`send-message-v2` is single-turn; a real slice needs N supervised resumes. Build a
`run-slice`-style wrapper in `.llm/tools/agentic/codex/` (new `run-codex-slice.ts` or an extension
of `launch-codex-slice.ts`) that:

1. Launches (or attaches to) a thread via the existing launcher plumbing, then loops
   `codex exec resume <thread-id>` until the agent's reply matches a done/blocked contract
   (e.g. final line `DONE`/`BLOCKED: <reason>` — define and document the contract).
2. Quota/capacity-aware backoff: recognize usage-limit and model-capacity error strings
   (see #604 for the classification contract — if #604's signal isn't merged yet, put the regexes
   in `.llm/tools/agentic/config/` so they have one home), parse the reset time when present, and
   sleep/retry accordingly with a max-turns and max-wall-clock budget.
3. Writes a wake-file/heartbeat compatible with `.llm/tools/harness/watch-run.ts` (touch the run
   dir worklog or a dedicated status file each turn) so supervisors wake without polling.
4. Emits structured JSON status (thread id, turns, last state, quota events) and appends per-turn
   entries to the slice's `codex-thread-ids.md` section rather than overwriting.
5. Respect the existing RouteIdentity validation and sender-registry (one sender per worktree).

Add unit tests for the pure parts (error classification, done-contract parsing, backoff schedule)
under `.llm/tools/agentic/**_test.ts` mirroring existing test layout. Guard test rule: no
hardcoded model ids/versions outside `config/`.

## Validation (evidence in worklog)

- Scoped check/lint on `.llm/tools/agentic` (`run-deno-check.ts`/`run-deno-lint.ts`).
- `deno test` for the new tests + the existing agentic suite tests still green.
- A `--dry-run` self-demo transcript in the worklog.

## Done means

Runner + tests landed, committed + pushed, worklog updated. Report "DONE" or "BLOCKED: <why>".
