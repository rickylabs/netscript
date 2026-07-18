# Drift — beta11-cli--orchestrator (append-only)

- 2026-07-17 · `minor` · Kickoff mission text named only #840-wave + #826 + #824; live milestone
  13 also carries #818, #816, #815, #814, #804, #802. Per "GitHub is the single source of truth"
  they are folded into the plan as groups G9–G14. No owner action needed (kickoff instructed
  verifying the live milestone).
- 2026-07-17 · `significant` · OWNER DIRECTIVE (in-turn): (1) standing merge authorization for all
  beta-11 work — the supervisor may merge each PR once CI is green AND the opposite-family/eval
  PASS is recorded (harness quality bar unchanged; only the per-merge owner ask is waived).
  Terminal state: all milestone-13 issues closed by merged PRs + the release-cut PR PREPARED and
  ready to merge — HARD STOP remains before merging the release cut / any publish / milestone
  close. (2) No mandatory extra cloud eval: local adversarial/evaluator passes per harness docs
  suffice; an extra OpenHands cloud eval is permitted when the supervisor judges it useful, never
  required; docs PRs are already auto-gated (docs-openhands-eval workflow) — do not duplicate.
- 2026-07-18 · `significant` · Turn-driver coupling: `codex exec resume` children die with their
  supervisor background task (observed 02:52 kills aborting G5/G7 turns mid-slice). Mitigation
  adopted: steer via `.llm/tools/agentic/codex/codex-resume.ts` (suite path). Candidate harness
  lesson if it recurs.
