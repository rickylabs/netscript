use harness

## SKILL

Read and follow the repository root `AGENTS.md`, `netscript-harness`, `netscript-tools`,
`netscript-pr`, `rtk`, and the run's complete `research.md`, `plan.md`, `plan-eval.md`,
`context-pack.md`, `worklog.md`, and `drift.md` before acting.

You are resuming the existing Codex GPT-5.6 Sol low supervisor thread after an independent
Minimax M3 high PLAN-EVAL PASS. Implement **S1 only** from the locked plan on branch
`chore/deepseek-v4-formal-impl-evaluator-1338` and draft PR #1339:

- Make the active formal IMPL-EVAL typed route resolve preset
  `claude-evaluator-deepseek-v4-flash-0731`, model
  `deepseek/deepseek-v4-flash-0731`, effort `max`, evaluation purpose, and the existing
  `claude-openrouter` profile.
- Keep formal PLAN-EVAL exactly `minimax/minimax-m3` at `high`.
- Remove Qwen 3.8 from the active formal evaluator allowlist and add a fail-closed regression that
  a well-formed retired Qwen 3.8 formal IMPL route is rejected. Keep Qwen in the broader generic
  OpenRouter preset-model vocabulary only if current non-formal consumers still require it, and
  record that occurrence-by-occurrence decision in `worklog.md`.
- Update only S1 typed sources and focused tests plus current run artifacts. Do not begin S2 canary
  schema/live proof or S3 prose/generated convergence.

Before edits, verify local HEAD, authoritative remote branch, and PR head are identical and record
the exact commit. Preserve `deno.lock` byte-for-byte at HEAD blob
`ef28b1b056705b456a66601ceeb46eede9def7b0`: never stage it, never intentionally write it, never
restore unrelated lock state, and stop/report immediately if any command changes it. Prefer direct
`deno run --no-lock` focused tests and the scoped check/lint/fmt wrappers over `deno task`.

Run the smallest S1 gates specified by the locked plan, update `worklog.md`, `context-pack.md`, and
`supervisor.md` with exact commands/results and lock identity, commit with explicit pathspecs that
exclude `deno.lock`, push using an explicit refspec, and stop with `DONE` plus commit, test, remote,
lock, and remaining-S2 evidence. Do not launch ordinary review, formal evaluation, GitHub Actions,
merge, release, canary publication, or issue closure. Do not self-certify S1.
