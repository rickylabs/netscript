# Context pack — feat-1169-one-pass-publish--design

**State (2026-08-03): design phase complete; awaiting PLAN-EVAL. No implementation started.**

- Branch `feat/1169-one-pass-publish` @ baseline `442f1f7b8`. Epic #1169, milestone 0.0.5.
- Slicing proposal posted: https://github.com/rickylabs/netscript/issues/1169#issuecomment-5170421107
- Sub-issue map: F1→#1168, F2→#1170, F3→#1171, F4→#1172, F5→#1173, F6→#1174+#1142, F7→closed by
  #1165/#1167 (evidence at next cut).
- Root causes: RC-A verdict provenance (F2/F3/F6), RC-B retry semantics (F1), RC-C contention (F4),
  RC-D tooling honesty (F5). See plan.md for locked decisions + slice table S1–S7.
- **S1 first** (closes #1168): command-gate retry (timeout/cancel class only), `GateResult.attempts[]`,
  report/log surfacing, negative test, aspire-restore instrumentation. Design in worklog.md.
- Key surfaces: `packages/cli/e2e/src/application/gates/command-gate.ts` (one-shot execute),
  `gate-factory.ts:45`, `domain/gate-definition.ts` (GateResult), `domain/report.ts`;
  `.llm/tools/validation/check-close-gate.ts` (Report lacks provenance);
  `.github/workflows/e2e-cli.yml:66-68,107-110`; `openhands-agent.yml:115-130`;
  `.llm/tools/agentic/runtime/sender-ownership.ts` (lease pattern).
- Correction found in research: `duplicate_sender_risk` exits 4 today (tested) — #1173 verifies the
  observed exit-0 against transcripts rather than assuming.
- Constraints: do not touch PR #1159, `.llm/tools/release/`, canary surface, `e2e-cli-prod*.yml`.
  Delete BRIEF.md before opening any PR.
- Next steps: (1) PLAN-EVAL, separate session, open-model Qwen preset over Claude+OpenRouter;
  (2) on PASS, implement S1; S2/S4 delegable to Codex Sol·low app-server-attached
  (`deno task agentic:launch-codex-slice`, `--dry-run` first).
