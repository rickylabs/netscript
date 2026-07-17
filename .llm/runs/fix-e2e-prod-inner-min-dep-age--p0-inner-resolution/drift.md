# Drift

## D-1 — generated-project policy candidate rejected

The initial candidate assumed the generated root `minimumDependencyAge` policy could govern the
inner resolution. Deno 2.9.3 reproduction showed the `deno x` JSR re-run ignores both discovered
and explicit config. The plan therefore uses a direct `deno run` URL so the explicit flag governs
the single resolver. No doctrine drift results.

## D-2 — local formal evaluator credential unavailable

The required `formal_evaluation` canary for `claude-openrouter` / `qwen/qwen3.7-max` returned
`auth_required`: `OPENROUTER_API_KEY` is absent from the child environment. Harness policy forbids
substituting a closed model or self-evaluation, and the OpenHands skill forbids converting this
local run into an automatically dispatched cloud evaluation. Implementation remains stopped at the
Plan-Gate pending evaluator availability or an explicit owner waiver.
