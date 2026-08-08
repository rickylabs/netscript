use harness

## SKILL

Continue following every skill, doctrine file, gate document, and run artifact named in the original
T1-B implementation brief.

## Role

Resume the same T1-B implementation supervisor thread for issue #1189 / PR #1316. The previous turn
was interrupted while the milestone orchestrator removed a duplicate root-client writer. This is a
transport interruption, not permission to cross into evaluation or merge. You remain the focused
implementation supervisor; the milestone orchestrator retains evaluator, merge, issue-closure, and
canary authority.

## Exact recovery state

- Worktree: `/home/codex/repos/ns005-cachetiers`
- Branch: `fix/plugin-linking-seam-1189`
- Train merge at current head: `ca8f1c76b`
- Preserve the reviewed generic reconciler repair, fixture-permission repair, and tracked live-proof
  evidence already present in the worktree.
- The interrupted full command reached runtime behavior gates and passed `cleanup.aspire-stop`, but
  its controlling turn was aborted before a raw process exit code or final suite verdict was
  captured. Treat that run as diagnostic evidence only, not a completed mandatory gate.
- The orchestrator removed exactly the positively owned survivor
  `postgres-84ad11ad` / `6b0e09804bee122c2dacbf00443f3ab449642eea74c64ab4e4434c62b4148ab4`
  through `agentic:teardown --apply`; every foreign or unproven resource was left untouched.

## Mission

1. Re-inspect status and the current diff. Preserve unrelated state and restore `deno.lock` to the
   branch baseline before any commit; do not pop or drop stash
   `7eb4ed16d6944c1d1c904895bcb76b4361ad8a57`.
2. Re-run the exact mandatory one-pass gate from the repository root and capture its raw exit code:

   `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`

   Do not split it into gate commands. If it fails, diagnose and fix only T1-B-owned causes, then
   rerun the complete command.
3. Complete every remaining focused, scoped check/lint/fmt, doctrine, JSR, docs, review-thread,
   close-gate, and post-run leak check required by the approved plan and current root instructions.
4. Commit coherent product, fixture, and run-evidence changes. Push only with
   `git push origin HEAD:refs/heads/fix/plugin-linking-seam-1189`.
5. Keep PR #1316 draft. Update its evidence truthfully, but do not label it ready, merge it, close
   #1189, publish, or run formal IMPL-EVAL.
6. Finish the worklog with exact commits, changed paths, command exits, current PR SHA/check state,
   remaining risk, and `READY_FOR_QWEN_IMPL_EVAL` or `BLOCKED: <reason>`.

Your final non-empty response line must be exactly `DONE` or `BLOCKED: <reason>`.
