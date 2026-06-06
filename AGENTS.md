# AGENTS.md

Use `.llm/harness/` for harnessed work. Use `.agents/skills/netscript-doctrine` for package and
plugin architecture decisions, and follow `.agents/rules/*.mdc` where present.

Before a branch is considered ready to merge, run the full CLI E2E test suite:

```powershell
deno task e2e:cli
```

The bare task runs the `scaffold.runtime` merge-readiness suite with cleanup enabled. For debugging,
use `deno task e2e:cli suites`, `deno task e2e:cli gates scaffold.runtime`, or
`deno task e2e:cli run scaffold.runtime --cleanup --format pretty`.

This gate is expensive. Do not run it for every intermediate implementation loop; run it during the
evaluator/merge-readiness pass or when explicitly requested.
