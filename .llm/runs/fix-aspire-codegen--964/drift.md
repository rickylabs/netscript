# Drift — issue #964

## 2026-07-31 — mechanical workflow override

- Severity: procedural.
- The owner classified the slice as mechanical and explicitly required no plan document. The run
  therefore skipped PLAN-EVAL and proceeded directly to implementation.

## 2026-07-31 — root-cause distribution

- Severity: minor.
- The context-pack hypothesis expected one specifier-construction site. Inspection and the semantic
  guard found the same `.mjs` assumption distributed across constants, a formatter, and asset
  templates. The scope remains issue #964; all sites express the same emitted-file/specifier
  invariant and were corrected together.

## 2026-07-31 — evaluator handoff

- Severity: procedural.
- IMPL-EVAL was not launched because the local `claude-openrouter` transport has no
  `OPENROUTER_API_KEY` in this implementation session. The OpenHands skill prohibits an implementer
  from substituting a cloud evaluator for a local run. The draft PR remains at `status:impl-eval`
  for the supervisor to launch the separate formal evaluator.
