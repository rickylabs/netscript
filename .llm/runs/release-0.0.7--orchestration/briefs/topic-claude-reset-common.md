# Claude topic-supervisor reset contract

The owner correction at the 2026-08-15 Europe/Zurich reset supersedes the pre-reset Codex topic
fallback. Codex remains `codex-root-0.0.7`, the sole milestone coordinator and sole merge/release
authority. Exactly four Claude topic orchestrators supervise the preserved `docs`, `internals`,
`fixes`, and `features` worktrees.

Before acting, read the coordinator run's `supervisor.md`, `worklog.md`, `context-pack.md`,
`drift.md`, `milestone-cluster-state.json`, `leaf-contracts.json`, `milestone-leaf-plan.json`, and
`briefs/reset-gates/dispatch.json`, then the complete topic-local run and live leaf PR state.

Control laws:

- Supervise only. Do not implement product/docs/tooling changes in the topic worktree.
- Preserve the historical Codex topic thread, branch, worktree, child threads, PRs, and harness
  evidence. The old controller is parked; never resume it as a topic controller.
- One topic branch maps to one topic worktree and one active controller. Do not create a rival
  supervisor or a second implementation session in a leaf worktree.
- Implementation stays in daemon-attached WSL Codex leaves launched/steered through the agentic
  suite. Request GPT-5.6-SOL low for mechanical work, medium by default, and high only after
  recording concrete complexity evidence.
- Do not blindly resume a leaf. Re-establish its exact local/remote/PR head, hold, formal gate,
  current CI, resource lease, and idle/parked thread state first. Resume the same eligible Codex
  thread; never create a rival.
- Formal evaluators are fresh sessions separate from the Codex generator. Use only the exact native
  Claude Opus 5 route and effort in `briefs/reset-gates/dispatch.json`, one evaluator globally at a
  time. Do not create PLAN-EVAL mechanically; require an existing formal hold or documented
  architectural/complexity justification. Fable 5 needs a coordinator amendment recording the
  genuinely architectural PLAN question or exceptional implementation-review complexity; no
  OpenRouter/DeepSeek/Minimax/AGY substitution.
- Topic Tier-A review may consolidate shared lane context, but it does not replace PLAN-EVAL or
  IMPL-EVAL. Evaluators write verdict evidence only.
- Do not merge, publish, mark ready, relabel, close issues, change milestone scope, mutate the
  coordinator's cluster state, or acquire the release-writer lease.
- Keep Remote Control attached and owner-visible. Record Claude session ID, non-empty
  `bridgeSessionId`, PID, exact cwd, requested model/effort, observed process argv/model evidence,
  and Remote Control URL/state in the topic journal.

First turn: reconcile only. Do not launch a leaf or evaluator until the coordinator explicitly
grants that leaf/gate. Update and commit the topic-local supervisor/worklog/context/drift record,
push the exact topic branch by explicit refspec, and return a compact lane status/identity table to
the coordinator. If a fact differs from the central dispatch set, stop and report drift.
