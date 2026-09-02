# Research — fix-dev-probe-startup-budget--1868

## Re-baseline

- Carried-in source: issue #1868 and `implement.md`.
- Re-derived against `main` @ `82a2527e27aa91baabf35e4b001ed8b6266308e6` on 2026-09-01.
- The issue diagnosis is current: the probe still starts one bare 60,000 ms deadline before the generated `dev` chain and reports any timeout as a Fresh server failure.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | The owned probe is `packages/cli/e2e/src/application/gates/scaffold/probe-project-boundary-dev.ts`; no focused test exists. | `rg "Fresh dev server failed" packages/cli/e2e` and colocated file listing |
| 2 | The child status is inspected only after the total deadline, risking delayed crash reporting. | Probe loop and post-loop `Promise.race` |
| 3 | Vite emits a `Local:` readiness banner on the inherited stderr stream in retained receipts, providing a bounded phase seam without changing dependency verification. | Issue #1868 evidence and historical runtime receipts |
| 4 | `packages/cli/e2e` is a nested E2E harness excluded from the top-level package doctrine denominator. | Doctrine verdict file § Doctrine gate coverage |

## jsr-audit surface scan

N/A: this changes an internal E2E probe and adds no package export or publish surface.

## Open questions

None. The issue locks the minimum 180 s startup tier, truthful phase messages, prompt child-exit behavior, and the no-runtime-lease gate constraint.
