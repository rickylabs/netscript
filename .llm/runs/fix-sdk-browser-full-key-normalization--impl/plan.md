# Plan: browser full-key discovery normalization (#1824)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-sdk-browser-full-key-normalization--impl` |
| Branch | `fix/sdk-browser-full-key-normalization` |
| Phase | `plan` |
| Target | `packages/sdk` and `packages/aspire` contract test |
| Archetype | `2 — Integration` |
| Scope overlays | `frontend` (browser environment discovery only) |

## Archetype

Both affected packages are assigned Archetype 2 by doctrine. This slice repairs their browser-side
integration contract without changing ports, adapters, exports, dependencies, or runtime lifecycle.

## Current Doctrine Verdict

- `packages/sdk`: **Keep** — preserve discovery/client/cache adapter boundaries.
- `packages/aspire`: **Keep** — keep SDK-independent contribution ports.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1 | The environment-key contract is pinned in tests before implementation. |
| A2 | The existing internal builder remains the single SDK call site. |
| A6 | The private normalizer encodes the Aspire/Vite identifier policy and is justified by the cross-package contract. |
| A8 | The change stays in the existing browser discovery file and existing focused test files. |
| A14 | RED, focused tests, structured static gates, quality scan, and architecture checks preserve the contract. |

## Goal

Make SDK browser full keys normalize resource-name identifier characters exactly as Aspire does,
while preserving shorthand keys and all server-side keys.

## Scope

- Add SDK contract tests for hyphenated, unchanged simple, and other invalid-character resource names.
- Add shorthand and server-side regression guards.
- Add a cross-package assertion that the SDK browser full key equals Aspire's `full` name.
- Normalize only the SDK browser full-key resource segment.

## Non-Scope

- No change to `createBrowserServiceShortEnvKey()`.
- No change to `createServerServiceEnvKey()`.
- No production dependency between SDK and Aspire and no new shared package.
- No public export, package metadata, README, endpoint-protocol, or index behavior changes.
- No Aspire, Docker, Playwright, or other runtime validation due to the host-wide parked-runtime constraint.

## Hidden Scope

- The cross-package test is required because two private implementations remain on opposite sides
  of an intentionally dependency-free boundary.
- Gate evidence must use the structured check/test/lint/fmt wrappers even where the requested gate
  is described as raw Deno CLI syntax.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Keep the normalization helper private in `packages/sdk/src/discovery/browser-env.ts`. | The builder is internal and no public surface is needed. |
| D2 | Use Aspire's exact `/[^a-zA-Z0-9_]/g` rule and cite `build-vite-env-var-name.ts` as its contract source. | Exact parity covers hyphens and every other invalid identifier character. |
| D3 | Put the cross-package agreement assertion in SDK's discovery test and import Aspire's public application subpath. | Test-only SDK→Aspire contract access avoids pulling SDK internals under Aspire's stricter config; production dependency directions remain unchanged. |
| D4 | Record `PLAN-EVAL: N/A`. | #1824 supplies a complete mechanical contract, non-scope, regression guards, and gate set; no material decision remains open. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Shared production helper location | resolved now | Neither package may depend on the other; a third package is disproportionate. |
| Public export for normalization | safe to defer | No consumer contract requires it; adding one would widen semver/JSR scope. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Browser and Aspire rules drift later | Cross-package agreement test uses the same input on both implementations. |
| Server discovery is accidentally normalized | Exact server-key regression guard. |
| Shorthand semantics expand from hyphen-only replacement | Exact shorthand regression guard and no edit to its function. |
| Browser overlay implies unavailable runtime gate | Contract is pure string construction; use focused semantic tests and record runtime N/A per owner constraint. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-2 | risk | The helper encodes a NetScript/Aspire policy; it does not rename a platform primitive. |
| AP-9 | risk | Do not create a generic cross-package abstraction or configurable helper. |
| AP-25 | clear target | Keep the normalizer pure and side-effect free. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-2 | yes | Manual review plus `quality:scan`; helper is policy-bearing. |
| F-3 | yes | `arch:check`; no new package dependency. |
| F-5/F-6/F-7 | no new surface | Export maps and public symbols remain unchanged; JSR scan recorded in research. |
| F-10 | yes | Focused SDK/Aspire tests through the structured test wrapper. |
| F-11/F-12/F-14/F-15/F-16/F-17/F-18 | yes | `arch:check` and scoped lint. |
| F-19 | yes | Structured scoped check/lint/fmt/test wrappers. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `.llm/harness/debt/arch-debt.md` | none | No new, deepened, or closed doctrine debt. Existing Aspire debts are unrelated. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | RED contract | structured test wrapper on the changed SDK discovery test | non-zero before SDK fix |
| 2 | Focused tests | structured test wrapper for `packages/sdk/tests` and `packages/aspire/tests` | exit 0 |
| 3 | Changed-file check | `run-deno-check.ts` with repeated `--file` and default `--unstable-kv` | exit 0 |
| 4 | Changed-file lint | `run-deno-lint.ts` with repeated `--file` | exit 0 |
| 5 | Changed-file fmt | `run-deno-fmt.ts` with repeated `--file` | exit 0 |
| 6 | Repository check | `deno task check` structured root task | exit 0 and `failedBatches: 0` |
| 7 | Code quality | `deno task quality:scan` | exit 0 |
| 8 | Architecture | `deno task arch:check` | exit 0 |
| 9 | IMPL-EVAL | fresh native Claude/Fable session independently reviews and gates | `PASS` |

## Risks

- The repository-wide check may expose unrelated baseline failure; record exact evidence without
  modifying unrelated code.

## Dependencies

- No new runtime or package dependency. The SDK test imports Aspire's workspace-linked public application subpath.

## Drift Watch

- Any need to edit server discovery, shorthand behavior, public exports, package manifests, or lock files.
