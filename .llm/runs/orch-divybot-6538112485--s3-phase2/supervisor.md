# S3 phase 2 supervisor

- Baseline: `204a71b1ef0133faa07ce5c191e4170b5cb76171`.
- Branch: `orch/divybot-6538112485`; feature tier, supplied leaf profile.
- Implementer: Codex, OpenAI family. Separate read-only Anthropic evaluator required.
- Routing inspected with `deno task agentic:matrix --tier feature --json`.
- Owner evaluator override: `claude -p --model claude-opus-5-5 --effort high` for PLAN-EVAL and IMPL-EVAL.
- Authorized write surface: this run directory; `packages/fresh-ui/` contracts,
  component sources/templates, styles, registry and tests; corresponding CLI generated
  embeds, migration data and publication carriers; public Fresh UI reference/docs;
  focused browser validation tools and generated prose/corpus carriers.
- Existing token values, lock files, unrelated runtime code and other run directories
  are outside the write surface. The handoff branch is read-only input.
- Assignment and final-report handoff files are never committed. Public evidence
  contains no private host identity or session identifiers.

Scoped evidence extension: record the unchanged full-export documentation and
JSON-data audit baseline in `.llm/harness/debt/arch-debt.md`, linked to follow-up
#2531. This adds ownership/closing gates only; it authorizes no scanner waiver,
publication assertion, unrelated runtime refactor or dependency change.
