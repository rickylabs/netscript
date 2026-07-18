# Drift Log — plan-frontend-contrib--seed

Append-only. Severity: `minor` | `significant` | `architectural`.

| # | Date | Severity | Drift | Disposition |
| --- | --- | --- | --- | --- |
| 1 | 2026-07-18 | minor | Kickoff stop-lines forbid opening the seed-run draft PR that `workflow/seed-run.md` stage A prescribes. Commit trail is direct commits on `plan/frontend-contrib` (explicit refspec push); PR opening is deferred to the supervisor. | Recorded in `supervisor.md` § overrides; run proceeds PR-less. |
| 2 | 2026-07-18 | minor | Kickoff replaces seed-run stages F/G/H with a custom pipeline (Codex GPT-5.6 Sol high adversarial → Kimi K3 docs pass), all supervisor-dispatched. This session stops at `STAGE-COMPLETE: generator`; no self-arranged evals. | Recorded in `supervisor.md`; conforms to lane-policy invariants (generator ≠ evaluator). |
| 3 | 2026-07-18 | minor | Stage-B discovery ran on Claude Opus 4.8 Explore sub-agents (4-way fan-out) instead of Tier-C committed workflows. Rationale: `subagent-model-routing` standing rule (Fable prohibited for swarm use; Opus is the swarm lane) and CLAUDE.md's "workflows are an expensive supervisor accelerator" caveat. Findings are integrated and re-cited in `research.md`; load-bearing claims were spot-verified by the supervisor session (Fresh 2.3.3 `App.mountApp`/`Builder.registerIsland` verified directly via `deno doc`/jsr source). | Recorded here; citations in `research.md` are the audit trail. |
