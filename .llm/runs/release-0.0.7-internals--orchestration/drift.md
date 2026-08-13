# Drift — 0.0.7 internals topic

Live `origin/main` still equals the approved baseline and every Wave 0 issue remains open in
milestone 0.0.7. The leaf boundaries, routes, and authority match the approved coordination
artifacts.

| Time (UTC) | Drift | Disposition |
| --- | --- | --- |
| 2026-08-13T20:16:58Z | `leaf-contracts.json` requires `harness-evidence-and-verdict-tooling` to update `netscript-pr` per the approved locked #1621 decision, but omits `.agents/skills/netscript-pr/SKILL.md` and the issue-required test peers from `fileSurfaces`. The quality leaf likewise requires RED-first scanner tests but declares only the scanner implementation file. | Do not mutate central cluster state. Launch both leaves within WIP, permit research/plan/bootstrap, and require the leaf to pause before any undeclared edit while the topic orchestrator reports the exact contract clarification to the coordinator. |
| 2026-08-13T20:33:20Z | Coordinator authorized five evidence-leaf implementation/test peers and explicitly kept `.agents/skills/netscript-pr/SKILL.md` read-only. | Resume the existing evidence thread only; record the decision in leaf drift/worklog and make no further scope growth. |
| 2026-08-13T20:42:11Z | Canonical native Fable 5 medium PLAN-EVAL route returned `model_not_found` before inference. | Record session `4427e1d6-ab15-4f80-8840-2281744b1214` and zero-token/cost failure; escalate the same evaluator slot to the lane-policy Minimax M3 high fallback. |
| 2026-08-13T20:45:40Z | The fallback evaluator read the JSONL file being used to tee its own stream, causing self-referential output growth. | Interrupt the transport, retain the partial JSONL as failed runner evidence, resume the same evaluator session without a tee, and do not treat the partial stream as a verdict. |
| 2026-08-13T20:48:14Z | Quality PLAN-EVAL returned `FAIL_PLAN`: #1545 cannot close while owning open-issue allowances; required RED-first/generated peers are outside the contract; workers JSR audit has 20 unowned pre-existing diagnostics; #1545 prose still says 8 instead of measured 7. | Keep implementation stopped. Coordinator must resolve the three authority decisions and editorial issue reconciliation before a fresh bounded PLAN-EVAL. |
