# Research

#1207 has six acceptance boxes. The PR-trigger sweep found `ci.yml`, `code-quality.yml`,
`docs-openhands-eval.yml`, `e2e-cli.yml`, `openhands-agent.yml`, and `surface-diff.yml`.
The docs evaluator was already ready-only. Required core contexts are `quality`, `check-test`, and
`deps-report`; therefore every gated workflow must include `ready_for_review`.

Milestone `0.0.5` currently has 28 PRs and 146 commits. Harness commit-trail policy maps a slice
commit to a push, so 146 is the best available draft-push estimate from this run history.
