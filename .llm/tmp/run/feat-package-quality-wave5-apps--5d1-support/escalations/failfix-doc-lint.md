# Escalation — 5d1 broad package doc-lint residue

Date: 2026-06-13T23:20:00+02:00  
Run: `feat-package-quality-wave5-apps--5d1-support`  
Branch: `feat/package-quality-wave5-apps-5d1-support`  
PR: #34

## Trigger

IMPL-EVAL-5D1 returned `FAIL_FIX` because the approved package gate
`deno task doc-lint` from `packages/fresh` failed with 242 documentation lint
errors. During FAIL_FIX, the required JSR publishability slow-type errors were
fixed; the same broad doc-lint gate now fails with 244 documentation lint
errors because the minimal return-type annotations expose two additional Preact
JSX private-type diagnostics.

## Classification

Category: **Public-surface closeout debt / cross-slice gate escalation**.

This is not a new 5d1 design decision. The failing diagnostics are concentrated
in later 5d-owned surfaces:

- `builders/` public builder types and Zod type exposure, owned by 5d2.
- `defer/` JSX/component and policy documentation, owned by 5d4.
- `form/` component and enhancement documentation, owned by 5d5.
- `streams/` direct upstream re-exports from TanStack React DB and
  durable-streams state, owned by 5d4.
- `query/` direct upstream re-exports from TanStack Preact Query / Query Core
  and query hydration public types, owned by 5d6.

The 5d umbrella plan explicitly assigns full package doc-lint 0 and final
surface cleanup to 5d6 closeout. Implementing those surfaces in this 5d1
FAIL_FIX loop would violate slice ownership and collapse later approved work.

## Resolution Request

Accept this 5d1 exception:

- 5d1 must keep focused support-spine doc-lint green for `mod.ts`,
  `interactive.ts`, `error/mod.ts`, `utils/mod.ts`, `config/vite.ts`, and
  `testing.ts`.
- 5d1 may fix gate-forced explicit return types in later files when required by
  `deno task dry-run`.
- Full package `deno task doc-lint` remains blocking debt for the 5d2-5d6 chain,
  with 5d6 responsible for proving package-wide zero.

## Evidence

- PASS after FAIL_FIX: `deno task dry-run` from `packages/fresh`.
- PASS after FAIL_FIX: `deno task check` from `packages/fresh`.
- PASS after FAIL_FIX: `deno task fmt:check` from `packages/fresh`.
- FAIL after FAIL_FIX: `deno task doc-lint` from `packages/fresh`, 244 errors.

## Follow-up Gate

Close when `deno task doc-lint` passes from `packages/fresh` after the 5d2-5d6
public-surface slices land, or when the supervisor explicitly changes the
approved gate shape.
