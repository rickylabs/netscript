## Summary

Adds a skippable CI backstop that automatically asks OpenHands Minimax M3 to accuracy-check every
docs-labeled PR. It keeps the cheap lane useful by conditionally hand-testing only executable claims,
while always requiring full changed-set review, per-file verdicts, low-hallucination prose review,
and blocking findings for hallucinated verbs, flags, or paths.

## Scope

- Archetype / area: repository tooling + docs workflow (`SCOPE-docs.md`)
- Trigger: `pull_request` opened/synchronize/labeled with `type:docs` or `area:docs`
- Skip: `docs-eval:skip` reports who/why in the job summary and posts no trigger
- Route: `openrouter/minimax/minimax-m3`, `output=pr-comment`, small iteration budget

## Slices

- [x] S0 Research, plan, and Design checkpoint
- [ ] S1 Workflow, prompt, audit note, label taxonomy, and generated skill mirror
- [ ] S2 Separate-session implementation evaluation

## Definition of Done

- [ ] Docs-labeled PR events post the exact guarded Minimax M3 trigger.
- [ ] `docs-eval:skip` produces an explicit skipped-on-demand summary.
- [ ] An identical unanswered trigger is not reposted for the same head SHA.
- [ ] The prompt conditionally tests executable claims and always performs the mandatory accuracy review.
- [ ] Label machine/source/mirror taxonomy is synchronized.
- [ ] YAML structure, label schema, prompt contract, and mirror checks pass.
- [ ] Separate-session IMPL-EVAL is recorded; no OpenHands eval is dispatched by this run.

## Validation

- PLAN-EVAL — PASS (`plan-eval.md`; separate local Qwen session)
- YAML parse + structural assertions — pending implementation
- labels.yml schema assertions — pending implementation
- `deno task agentic:sync-claude:check` — pending implementation
- OpenHands live dispatch — intentionally not run (owner instruction)

## Harness

- Run dir: `.llm/runs/ci-docs-openhands-gate--docs-accuracy/`
- Phase: implement; PLAN-EVAL passed. Do not merge until the final evaluator pass is complete.

## Drift / Debt

- No architecture debt. The audit note uses the requested fallback path because `doc-audit.md` is
  not present on the branch; consolidation remains pending when that canonical page lands.
