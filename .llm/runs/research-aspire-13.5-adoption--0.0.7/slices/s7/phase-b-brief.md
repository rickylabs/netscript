use harness

## SKILL

Read `AGENTS.md`, `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/aspire/SKILL.md`,
`.agents/skills/netscript-tools/SKILL.md`, and `.agents/skills/netscript-pr/SKILL.md` before acting.
You are the Codex · GPT-5.6 Sol · medium implementation thread for this slice; the supervisor holds
the serialized host runtime lease for this phase only.

# S7 Phase B — #1429 live reproduction + foreign-AppHost re-test (lease-backed)

You are the S7 implementer for #1719 / PR #1744 (worktree
`/home/agent/projects/netscript/worktrees/007-aspire-s7`, branch `fix/aspire-13-5-s7-teardown-leak-check`
@ `2f721bf3`, stacked on S3; push with the explicit refspec
`git push origin HEAD:refs/heads/fix/aspire-13-5-s7-teardown-leak-check`). Execute exactly your own
checked-in procedure `.llm/runs/fix-aspire-13-5-s7-teardown-leak-check--impl/phase-b-handoff.md`
(receipts `phase-b-01` … `phase-b-09`). No evaluators, no `evaluate*.md`, no product source changes,
no `aspire stop --all`, no `aspire agent mcp`.

## Host protocol (supersedes older host paragraphs)

- `netscript-dind` = `10.4.12.22`, Docker 28.5.2, `DOCKER_HOST=tcp://netscript-dind:2375` via
  `/home/agent/.local/bin/mise exec --`; `/home/agent` is bind-mounted identically into the dind.
- The supervisor runs an owner-scoped relay under the lease: containers named `relay-*` and the
  `loopback-relay.ts` process are **supervisor-owned** — never stop/remove/report them as leaks;
  list them as foreign/supervisor-owned. Your leak-check/teardown must classify them as not owned.
- Before `aspire restore`/`aspire start` on any scratch: `deno install` at the generated project
  root (root `node_modules/zod` is required by the AppHost helpers), then
  `aspire restore --apphost <apphost.mts>`, then `aspire start --apphost <apphost.mts> --isolated
  --non-interactive --nologo --format Json`. Scratch config on the 13.5.3 train (`sdk.version`
  13.5.3, PostgreSQL/Redis 13.5.3, Browsers `13.5.3-preview.1.26425.3`).
- Two AppHosts are authorized for this phase and both are **yours**: (1) the leased run AppHost
  from a scratch under this worktree's `.llm/tmp/` (owned root = that scratch); (2) the foreign
  control AppHost from a scratch under
  `/home/agent/projects/netscript/worktrees/007-aspire-s7-eval/.llm/tmp/s7-foreign-control/`
  (a different worktree path, so it is foreign to the run's roots). Start the control first,
  record its identity, and never mutate it; stop it yourself at the very end with its exact
  `--apphost` path.
- Persistent `postgres-*` containers survive `aspire stop`; remove only the ones whose creation
  time is inside your window and whose AppHost you own (both scratches), plus their same-second
  anonymous volumes. Final proof lines (verbatim): `aspire ps` → `[]`; `docker ps -a` → only
  `relay-*` or empty; `docker volume ls` → empty; process table → no `apphost.mts`/`aspire-managed`
  of yours.

## Deliverables

- Receipts `phase-b-01` … `phase-b-09` exactly as named in `phase-b-handoff.md`, committed on the
  branch (redact dashboard URLs/tokens), plus a `receipts/phase-b-10-relay-inventory.txt` listing
  the supervisor's `relay-*` containers you observed and left untouched.
- Worklog rows per step; PR #1744 comment `## [PHASE: IMPL] S7 phase B` with commit SHA, the
  #1429 reproduction summary and the foreign-control non-mutation proof. Do not post the
  `acceptance-evidence` block yet (evaluator-gated). End with the teardown proof line.
- Any host-caused failure: keep the exact error receipt, tear down (yours only), report; no
  workaround, no retry.
