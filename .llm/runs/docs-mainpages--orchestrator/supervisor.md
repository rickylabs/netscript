# Supervisor identity — docs-mainpages--orchestrator

- **Model:** Claude · Anthropic · Fable 5
- **Effort:** **LOW — confirmed at startup per owner instruction** (two prior launches came up
  high against instruction; this run states it explicitly and operates at low).
- **Session:** Claude Code background job 763d39f5 (self-managed docs orchestrator,
  owner-commissioned 2026-08-04, independent of the 0.0.5 milestone orchestrator)
- **Host:** WSL, /home/codex/repos/ns-docs-orch
- **Branch:** orchestrator/docs-mainpages (run-artifact branch); work branches per charter
- **Baseline:** main @ f7558aa1c
- **Charters:** A = main-pages revamp (homepage / why / quickstart / core concepts);
  B = inherited docs-leverage program (#1208 P1 → PR #1209 first, then #1208 P2, #1210 P3)

## Lane table (owner-routed; overrides recorded in drift.md)

| Role | Route |
| --- | --- |
| Orchestrator | Claude · Fable 5 · **low** (this session) |
| Charter A generator pair (mutually adversarial) | Codex · GPT-5.6 Sol · low (via `agentic:launch-codex-slice`) ⇄ agy · gemini-3.6-flash · effort high (headless `--print`) |
| Charter A final evaluator + polish | OpenCode · Grok 4.5 max (owner-directed override of docs_polish lane) |
| #1209 finishing lane | **Claude workflow — CLAUDE.md documentation-authoring exception** (lane change from agy, recorded in drift.md D-1) |
| Validation of Claude-authored docs | opposite-family: Codex · GPT-5.6 Sol · medium (`docs_audit`) — generator never self-certifies |

Earned rules inherited: judge artifacts never exit codes/status fields; HTML-entity closing-keyword
trap; tick DoD truthfully before ready; every `gh` carries `--repo rickylabs/netscript`; no
expensive gates without checking the shared slot.
