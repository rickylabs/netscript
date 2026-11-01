# Utility follow-ups supervisor

- Assignment: #2524; feature tier; dispatcher-supplied leaf profile.
- Baseline: `6a1d84a6e04c0d39df3926528e0380e267316aee`.
- Branch/worktree: `orch/divybot-6555139912`, repository root `.`.
- Implementation: Codex, OpenAI family, owner-requested high effort.
- Routing read through `deno task agentic:matrix --tier feature --json`:
  implementation sol/xhigh → muse_spark_1_3/xhigh; plan evaluation
  glm_5_3/provider_default → fable_5_1/low; implementation evaluation
  muse_spark_1_3/xhigh → opus_5/xhigh. Feature limits: five implementation rounds,
  notify after three; dispatcher leaf ends after two consecutive terminal failures.
- Owner override: `IMPL-EVAL: claude -p --model claude-opus-5-5 --effort high`, read-only.
  Separate Anthropic evaluator reviews the implementation and slice before sign-off.
- Authorized write surface: `packages/fresh-ui/`, fresh-ui-related generation and
  query-result fixtures under `packages/cli/`, `.llm/tools/` size-budget and carrier
  validation tooling, `deno.json`, relevant `.github/workflows/` budget wiring,
  and `.llm/runs/orch-divybot-6555139912--2524/`.
- Private operational output: project runs outside the repository; public artifacts
  use repository-relative paths and exclude session identifiers.
- Delivery: normal pushes only; draft PR; no labels; no merge. Assignment file excluded.
