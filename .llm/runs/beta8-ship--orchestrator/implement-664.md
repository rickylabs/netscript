use harness

# Slice brief — #664: launch-codex-slice task needs --allow-env; dry-run permission parity

## SKILL

Read: `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/netscript-tools/SKILL.md`.

## Identity + ground rules

- WSL Codex implementation agent under the beta-8 orchestrator (`4d300496`). Do NOT open PRs.
  PLAN-EVAL owner-waived (carried drift D1) — plan in worklog, then implement.
- Worktree: `/home/codex/repos/ns-b8-664`, branch `fix/664-launcher-allow-env`.
- **Every file operation uses absolute paths inside `/home/codex/repos/ns-b8-664`.**
- Base preflight: `git -C /home/codex/repos/ns-b8-664 rev-parse HEAD` must start `955b4abf`.
- Push: `git -C /home/codex/repos/ns-b8-664 push origin HEAD:refs/heads/fix/664-launcher-allow-env`.
- Worklog at `/home/codex/repos/ns-b8-664/.llm/runs/fix-664-launcher-env--codex/worklog.md`.

## Task (issue #664 — read it first; acceptance boxes are the contract)

`deno task agentic:launch-codex-slice` (deno.json task) grants only read/write/run; the non-dry-run
sender-registry path (`~/.config/netscript-agentic/runtime/senders`) needs env access (`HOME`) and
crashes `NotCapable`. `--dry-run` never reaches that code, so rehearsal passes while real launch
fails.

1. Add `--allow-env` to the task definition (root `deno.json`, task `agentic:launch-codex-slice`).
2. Dry-run parity: make `--dry-run` exercise the same permission surface as the real run — e.g. a
   shared preflight that touches the sender-registry path (env resolution + directory access)
   before branching on dry-run, or a guard test asserting the task's permission flags cover every
   permission the script's code paths require.

## Validation (evidence in worklog)

- Scoped check/lint on touched files.
- `deno task agentic:launch-codex-slice --help` and a `--dry-run` invocation (with dummy but
  well-formed args pointing at this worktree) both succeed via the TASK (not direct script run).
- New guard/preflight test red-before/green-after if cheap to show.

## Done means

Fix + parity guard + evidence committed and pushed, worklog committed. Report "DONE" or "BLOCKED: <why>".
