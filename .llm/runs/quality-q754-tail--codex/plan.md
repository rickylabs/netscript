# Plan: #754 deeper type-erasure elimination tail

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `quality-q754-tail--codex` |
| Branch | `quality/q754-tail-h` |
| Phase | `plan` |
| Target | seven package roots named in the slice brief |
| Archetype | telemetry/aspire: 2; sdk/fresh-ui: 4; bench: 6; plugin cores: 1 |
| Scope overlays | frontend for `fresh-ui`; none otherwise |

## Archetype

- `telemetry` and `aspire`: Archetype 2 integration boundaries.
- `sdk` and `fresh-ui`: doctrine assigns Archetype 4; this slice preserves their public DSL/client
  shapes while correcting boundary types.
- `bench`: Archetype 6 tooling, though only a reference-file comment is expected to change.
- `plugin-ai-core` and `plugin-auth-core`: contract-focused Archetype 1 for this schema-boundary slice.

## Current Doctrine Verdict

- `telemetry`: historical Refactor verdict, closed after the port/adapter and OTEL subpath work.
- `aspire`, `fresh-ui`, and `sdk`: Keep.
- `bench` and the two newer plugin-core packages are absent from the historical verdict table; use
  their current package roles and active debt registry entries. No existing debt authorizes the
  rejected suppression strategy.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1 | Public and upstream boundary types are corrected before implementation convenience. |
| A2 | Callers receive truthful, narrow types rather than casts or suppressions. |
| A6 | Type guards exist only at real dynamic/upstream seams. |
| A14 | Scanner, scoped wrappers, docs, publish, and tests prove the result. |

## Goal

Reach 0 scanner findings with the lowest possible allowance count (target 0, hard ceiling 4), no
`deno-lint-ignore`, and no `deno.lock` churn.

## Scope

- Reword three prose-only lexical matches.
- Type dynamic telemetry modules and oRPC handler plugins through guards/public upstream types.
- Narrow the SDK contract router before invoking oRPC method inference.
- Align Fresh UI VNode, style, summary props, and event types with Preact's real contracts.
- Normalize shared plugin error definitions into oRPC `ErrorMap` values through a standard-schema
  guard in each core package.
- Add focused regression tests where runtime guards or corrected public element types need proof.
- Maintain all harness artifacts and gate evidence in the run directory.

## Non-Scope

- No PR creation, issue/label changes, dependency/version updates, export-map changes, visual design
  changes, repo-wide formatting, or unrelated doctrine debt remediation.
- No edits to `deno.lock`, generated artifacts, or packages outside the seven named roots unless a
  compile failure proves a directly affected consumer; that would be recorded as drift first.

## Hidden Scope

- Full export-map doc lint and package-local publish dry-run, not root-entrypoint-only checks.
- Independent opposite-family PLAN-EVAL and IMPL-EVAL.
- Final force-with-lease push to the owner-specified branch even though it is currently absent remotely.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| L1 | Target 0 allowances; do not design around the ceiling. | Owner rejected suppression as strategy. |
| L2 | Dynamic imports return `unknown` and are validated by module-specific guards. | Generic return casts do not establish runtime shape. |
| L3 | Telemetry uses public oRPC handler/plugin types. | The upstream surface exists and supplies exact interceptor inference. |
| L4 | SDK retains its small public `ContractLike`, then narrows at the oRPC adapter edge. | Avoids leaking upstream types while removing the cast. |
| L5 | Fresh UI types the element actually rendered (`summary`) and aliases Preact's VNode. | Corrects the source mismatch instead of casting events/results. |
| L6 | Plugin cores validate `unknown` schema fields and build a typed `ErrorMap`. | Expresses the real structural precondition without changing the shared package. |
| L7 | No allowance survives without a failed concrete typing attempt plus evaluator review. | Enforces the owner directive. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Whether an allowance is needed | safe to defer | Default is no; decide only from a demonstrated upstream impossibility. |
| Whether corrected Fresh UI summary props are a breaking consumer change | must resolve now | Compile all package tests/consumers in the named root and preserve behavior; broaden via a typed adapter only if required. |

The second decision is resolved by the locked plan: the implementation must type the rendered
element and validate consumers before landing; it may not preserve a false button type via a cast.

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Public prop narrowing breaks a consumer. | Search consumers, run fresh-ui tests/check, and add a focused summary event test. |
| User-defined guards accept too little or too much. | Check only properties consumed at the boundary and test rejection/acceptance. |
| oRPC generic inference widens error maps. | Use `satisfies ErrorMap` and explicit route aliases; verify contract soundness tests. |
| Validation resolves dependencies into the lock. | Inspect `deno.lock` after every gate and revert any generated-only line immediately. |
| Existing unrelated package debt makes broad tasks red. | Use required scoped wrappers and record package-specific verdicts. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-2 | risk | Guards encode real upstream/dynamic policy; do not rename a primitive. |
| AP-9 | risk | Keep guards local to each genuine boundary; no speculative shared abstraction. |
| AP-14 | risk | Import upstream types internally; do not re-export upstream packages. |
| AP-20 | existing risk | Preserve package lib configuration; scoped check catches regressions. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-5/F-7 | yes | `deno task doc:lint --root <pkg>` per package |
| F-6 | yes for six publishable packages | package-local `deno publish --dry-run --allow-dirty` |
| F-10 | yes | package tests |
| F-19 | yes | scoped check/lint/fmt wrappers per touched package |
| code quality | yes | exact scanner with `--max-allow 4`, target `allowCount: 0` |
| doctrine | yes | `deno task arch:check` plus focused interpretation |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| telemetry historical verdict | none | already closed; do not reopen layering scope |
| AUTH-FITNESS-GATE-OVERFLAG | none | historical closure does not authorize a quality allowance |
| active auth docs warning | none | pre-existing documentation scope, not deepened |
| new/deepened debt | none expected | any discovery must be logged before implementation expands |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | scanner | exact seven-root scanner `--max-allow 4` | `ok:true`, 0 findings, target allowCount 0 |
| 2 | static | scoped check/lint/fmt wrappers for every touched package | exit 0 |
| 3 | tests | each touched package's `deno task test` | exit 0 |
| 4 | docs | `deno task doc:lint --root packages/<pkg> --pretty` | recorded per package |
| 5 | publish | package-local dry-run for six publishable packages; bench N/A | exit 0 or precisely recorded pre-existing sanctioned oRPC diagnostic |
| 6 | doctrine | `rtk proxy deno task arch:check` | exit 0 / no new owned violation |
| 7 | hygiene | raw git diff/status and `git diff --exit-code -- deno.lock` | no lock churn or ignores |

## Dependencies

- Existing workspace oRPC 1.14.6, Preact 10.29.2, Zod 4.4.3, and OpenTelemetry APIs only.

## Drift Watch

- Any required change outside the seven roots, surviving allowance, public export change, lock
  mutation, or package gate whose failure is unrelated to this slice.

