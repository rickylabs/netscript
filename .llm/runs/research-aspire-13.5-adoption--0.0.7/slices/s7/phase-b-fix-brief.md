use harness

## SKILL

Read `AGENTS.md`, `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/netscript-tools/SKILL.md`,
`.agents/skills/aspire/SKILL.md`. You are the S7 implementer (thread `01a053ef-4c27-7f31-ac43-e78a00dff7c6`,
worktree `/home/agent/projects/netscript/worktrees/007-aspire-s7`, branch
`fix/aspire-13-5-s7-teardown-leak-check` @ `8633972fd`). **Static fix cycle — no runtime lease, no
AppHost, no containers, no evaluators, no `evaluate*.md`.** Explicit-refspec push.

## Finding (your own Phase-B receipts, honest and correct)

`phase-b-04-leak-check.json`: after the validated CLI SIGKILL, the re-parented (PPID 1)
`aspire-managed`/DCP descendants were **observed but classified `unproven`** because their live
`ProcessEvidence` arrays were empty; #1429 criterion 1 ("leak-check reports the leak and teardown
--apply removes only owned resources") is therefore unmet by the reporter, and `--apply` exited 4
("no running owned AppHost remained") instead of terminating the owned orphans. The Phase-A
contract (brief §3, review-tier-a) claims descendant tracking by DCP labels / `--apphost` argv /
socket path — the live run shows that evidence is not being collected or not being matched.

## Required change (bounded)

1. RED first: a test that feeds the **real** captured snapshots
   (`receipts/phase-b-02-baseline-process-tree.json`, `phase-b-03-cli-terminated.json` — copy the
   relevant process rows into a fixture, redact paths only if they carry secrets) into the
   classifier and asserts the re-parented descendants are `owned` for the leased run's exact
   apphost path / socket / DCP labels, and `foreign` for the control AppHost rows.
2. Fix the evidence collection/matching in `.llm/tools/agentic/teardown/**` so that a PPID-1
   descendant whose argv/cwd/socket/label proves the leased apphost is `owned` (containment
   proof, never name heuristics); keep foreign/unknown → never mutated. `--apply` must then plan
   the targeted orphan termination for owned descendants (bounded confirmation, no `--all`).
3. Gates: teardown unit suite (both 13.4.6/13.5.3 fixtures + the new real-snapshot fixture),
   `run-deno-check.ts`/`lint`/`fmt --ext ts,tsx` on `.llm/tools/agentic/teardown`, `arch:check`,
   `quality:scan`. Commit trail citing receipts 04/06; push; PR #1744 comment
   `## [PHASE: IMPL] S7 phase B — reporter fix`; end with the head SHA. The lease-backed rerun of
   `phase-b-handoff.md` is scheduled by the supervisor after your push — do not start it.
