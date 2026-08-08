# Research — plan-fable5-remediation-roadmap--seed

Stage-B discovery corpus index. The full corpus (per-domain cited findings) lives under
`fable-5-remediation-plan/research/`; this file tracks re-baselining and the corpus map.

## Re-baseline

- Baseline: `origin/main` @ `fac9e339042c` (2026-08-08). Carried-in inputs (Codex pre-plan
  package, wave 1–6 reports) are evidence and starting skeletons, never ground truth; every
  load-bearing claim is re-derived against this baseline or the live GitHub board.

## Corpus map (filled during Stage B)

| # | Surface | Artifact | Status |
| --- | --- | --- | --- |
| B0 | Codex pre-plan package (supervisor-read) | `research/preplan-package.md` | landed |
| B1 | agent-posts waves (archive, 3, 4, 5–6 plans, 6 runs) | `research/prior-waves-early.md`, `research/wave-4.md`, `research/wave-5-6-plans.md`, `research/wave-6-runs.md` | landed |
| B2 | Live GitHub board | `research/github-board-open.md`, `research/github-board-history.md`, `research/github-conventions.md` | landed |
| B3 | Repo + published docs deep audit | `research/repo-audit/{docs-quickstart,mcp-cli,web-layer,services-sdk,auth,runtime-plugins,observability-aspire,scaffold-doctrine}.md` | landed |
| B4 | External comparison | `research/external/{eis-chat,meta-frameworks,orpc}.md` | landed |

All paths relative to `fable-5-remediation-plan/`. Workflows `wf_e2194004-808` (7 agents, 796k
tokens) and `wf_03b88126-e7e` (11 agents, 1.78M tokens), all Opus 5 (`claude-opus-5[1m]`), zero
errors; scripts committed pre-execution under `workflows/`.

## Open questions

Carried into the Stage-C synthesis (`fable-5-remediation-plan/SYNTHESIS.md`).
