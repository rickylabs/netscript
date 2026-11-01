# CSS validation follow-ups supervisor

- Issue: #2561, direct follow-up to merged #2558 in epic #2412.
- Branch: `fix/fresh-ui-css-budget-followups`; worktree root `.`.
- Baseline main: `6a6a82e15f2de2cd820cef9b879ce263aa7cb06f`.
- Implementation: Codex / OpenAI; feature tier; separate Anthropic read-only evaluator.
- Matrix queried with `deno task agentic:matrix --tier feature --json`:
  implementation sol/xhigh, fallback muse_spark_1_3/xhigh; implementation evaluation
  muse_spark_1_3/xhigh, fallback opus_5/xhigh; maximum five rounds, same evaluator.
- Continuing owner's explicit evaluation override: `claude -p --model claude-opus-5-5
  --effort high`, read-only. Separate session/family; two terminal failures stop the leaf.
- Authorized writes: `packages/fresh-ui/tests/publish-size.test.ts`, package budget
  documentation, `.llm/tools/css/`, `tools/fresh-ui-browser/` replay integration,
  root `deno.json`, Fresh UI workflow/classifier and their regression tests, and this run.
- Private operational logs and evaluator metadata remain in project runs outside Git.
  Public artifacts use repository-relative paths and omit session identifiers.
- One cohesive PR for the three related validation cells; no duplicate #2561 PR exists.
- Normal pushes only; no rebase/force-push. Continue owner preference of no labels;
  Cockpit owns merge. #2412 remains an umbrella reference only.
