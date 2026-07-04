# Plan — Agentic Workflow Doctrine V3

Status: SEED (locked plan lands after G1 research; PLAN-EVAL required before any impl slice).

- Surface: `.llm/harness/**`, `.agents/skills/**` (+ `.claude/skills` mirror), `.llm/tools/**`,
  `AGENTS.md`/`CLAUDE.md`, `.github/labels.yml` — infra/docs scope (`SCOPE-docs` + tooling), no
  `packages/`/`plugins/` source.
- Adopts: #306 work items · Enforces: #387 · Coordinates with: #305 (no overlap on
  `docs/architecture/doctrine/` content beyond references).
- Gates: `validate-claude-surface`, `sync-claude-skills --check`, scoped fmt/lint/check wrappers on
  touched TS, docs link integrity where applicable. No runtime/e2e gates expected (no framework src).
