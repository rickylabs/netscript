# Worklog: browser full-key discovery normalization (#1824)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-sdk-browser-full-key-normalization--impl` |
| Branch | `fix/sdk-browser-full-key-normalization` |
| Archetype | `2 — Integration` |
| Scope overlays | `frontend` (pure browser environment-key contract) |

## Design

### Public Surface

- No exported package surface changes. Existing internal
  `createBrowserServiceEnvKey(serviceName, protocol, index)` changes semantics for invalid resource-name characters.
- Existing Aspire `buildViteEnvVarName(resourceName, endpointName).full` is the contract authority.

### Domain Vocabulary

- Browser full key — `VITE_services__<normalized-resource>__<protocol>__<index>`.
- Browser shorthand key — existing `VITE_<HYPHEN_NORMALIZED_UPPER_NAME>_URL`, unchanged.
- Server key — existing `services__<resource-as-is>__<protocol>__<index>`, unchanged.

### Ports

- None. This is pure key construction and adds no external seam.

### Constants

- None. The finite protocol union and default index already exist; the regex is the Aspire contract rule, not a finite-value set.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Pin browser/Aspire agreement and unchanged-key regressions; capture RED. | focused structured test wrapper exits non-zero for the intended mismatches | SDK discovery test and run artifacts |
| 2 | Apply Aspire-compatible SDK browser normalization and prove the required gate set. | focused tests, scoped wrappers, root check, quality scan, arch check, separate reviews | `browser-env.ts` and run artifacts |

### Deferred Scope

- Shared cross-package normalizer package — disproportionate and unnecessary while dependency directions are intentionally isolated.
- Runtime/browser launch — prohibited by the owner-provided parked-runtime constraint and unnecessary for pure string semantics.
- Shorthand normalization beyond hyphens — intentionally unchanged by #1824 even though Aspire's shorthand normalizes all invalid identifier characters.

### Contributor Path

Update Aspire's contract source in `packages/aspire/src/application/build-vite-env-var-name.ts`,
then update the SDK's cited private rule; the cross-package step in
`packages/sdk/tests/discovery/env-ordering_test.ts` will fail if their full-key output diverges.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-31T04:30:20Z | bootstrap | activated | Re-baselined clean worktree at `origin/main`; branch already existed at the exact baseline. |
| 2026-08-31T04:30:20Z | plan | PLAN-EVAL | N/A — small mechanical issue with owner-locked contract, scope, regression guards, and gates. |
| 2026-08-31T04:32:00Z | S1 | initial RED attempt | A checked multi-package invocation stopped on SDK indexed-access typing under Aspire config; independent review correctly classified this as test-direction design fallout, not valid RED. |
| 2026-08-31T04:37:00Z | S1 | slice review | Native Claude Opus 5 session `f63a7890-19a6-4d6f-bde5-39319dcfa08b` requested changes: invert the cross-package test direction to avoid Aspire-config type failure. |
| 2026-08-31T04:38:00Z | S1 | review remediation | Moved agreement test to SDK and imported Aspire's public application subpath; added independent steps so both RED cases execute. |
| 2026-08-31T04:39:00Z | S1 | canonical RED | Checked structured SDK test run exited 1: 5 passed, 6 failed, 4 unique failures; all failures are the intended normalization mismatch. |
| 2026-08-31T04:44:00Z | S1 | slice review cycle 2 | Native Claude Opus 5 session `b888c0a7-3ef2-48f5-84e0-1ff40accf8d8` found code/RED correct and requested four stale run-artifact references be fixed. |
| 2026-08-31T04:49:00Z | S1 | slice review cycle 3 | Native Claude Opus 5 session `31eee6bd-356a-4eaa-879e-52cca31419d9` returned PASS with no findings. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Preserve production dependency isolation | Aspire is SDK-independent and SDK currently has no Aspire dependency. | doctrine file 10; both `deno.json` files |
| Keep SDK helper private | No public consumer uses the builder and `@netscript/sdk/discovery` omits it. | `discovery/mod.ts`; `deno doc` |
| Keep shorthand invalid-character semantics out of scope | Owner explicitly requires shorthand behavior unchanged; only full-key parity is repaired. | issue #1824; user brief |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| `rtk` is documented but absent on this host. | minor | yes |
| Current owner-provided Codex model/effort identity is not exposed. | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| RED contract | `run-deno-test.ts ... -- --allow-all packages/sdk/tests/discovery/env-ordering_test.ts` | FAIL (expected), exit 1 | `red-contract.json`: 5 passed, 6 failed, 4 unique expected normalization failures; type checking completed. |
| Focused package tests | structured test wrapper | NOT_RUN | SDK + Aspire only. |
| Changed-file check/lint/fmt | structured wrappers | NOT_RUN | Run after implementation. |
| Repository check | `deno task check` | NOT_RUN | Must report `failedBatches: 0`. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| F-2/F-3/F-11..F-19 applicable set | NOT_RUN | `quality:scan` + `arch:check` planned | No new dependency or public surface. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Aspire/browser runtime | N/A | Owner directive | Runtime is parked host-wide; pure contract tests prove this change. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| SDK↔Aspire browser full-key contract | NOT_RUN | Cross-package test planned | Test-only dependency. |

## Handoff Notes

- Inspect the exact negative character class, unchanged shorthand/server guards, and absence of any
  SDK↔Aspire production import first.
