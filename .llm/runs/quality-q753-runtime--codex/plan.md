# Plan

## Locked decisions

- Preserve public and runtime behavior; refine internal contracts and timer/result types only.
- Replace explicit `any` and avoidable double casts with structural interfaces, generics, and
  `unknown` narrowing.
- Use `quality-allow` only for true upstream invariant/generated boundaries, with concrete reasons.
- Do not change dependencies or `deno.lock`.

## Open decisions

None. Any broader API or architecture redesign is safe to defer and outside issue #753.

## Slice and gates

One slice: eliminate the 31 findings in the ten requested roots. Prove it with the scoped scanner,
scoped check/lint/fmt wrappers, package tests, doc-lint, publish dry-runs, architecture check, and a
separate IMPL-EVAL.

## Risks

- Upstream generic invariance: retain only narrowly reasoned boundary allowances.
- Large validation matrix: run package-local gates and record exact failures without fabricating
  evidence.
- Lock churn: inspect and reject any `deno.lock` modification.

## Debt and deferred scope

No new architecture debt. Existing unrelated doctrine findings and API redesigns are deferred.

