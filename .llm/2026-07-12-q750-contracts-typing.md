# #750 contracts typing re-dispatch

The re-dispatch replaced the rejected 41-allowance suppression pass with native Zod input/output
typing in `@netscript/contracts`. The final scanner result is 0 findings and 0 allowances.

Key outcomes:

- `ContractSchema` now carries Zod output and input generics; projections use `z.output` and
  `z.input` directly.
- Pagination/schema factories and CRUD markers preserve coercion/default/input variance without
  post-hoc double assertions.
- Application `any` and blanket lint ignores were removed.
- Eight package tests, scoped wrappers, raw publish dry-run, doc lint, doctrine checks, and focused
  consumers are green or recorded as required; `deno.lock` is unchanged.
- PLAN-EVAL, both slice reviews, and IMPL-EVAL ran in separate Claude-family sessions and passed.

Run artifacts: `.llm/runs/quality-q750-contracts--codex/`.
