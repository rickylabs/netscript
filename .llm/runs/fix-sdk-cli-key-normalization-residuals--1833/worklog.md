# Worklog: residual Aspire key-normalization mismatches (#1833)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-sdk-cli-key-normalization-residuals--1833` |
| Branch | `fix/sdk-cli-key-normalization-residuals` |
| Archetype | `2 — Integration` (SDK/Aspire); `6 — CLI/Tooling` (CLI) |
| Scope overlays | `frontend` |

## Design

### Public Surface

- No package export changes.
- Existing `createBrowserServiceShortEnvKey()` behavior changes to match the already-pinned Aspire
  contract.
- Internal CLI feature seam: `buildVitePrebuildEnvironment()` returns the exact Vite URL variables
  injected before deploy prebuild tasks.

### Domain Vocabulary

- **Vite identifier segment** — a resource/endpoint segment with each non-ASCII-alphanumeric and
  non-underscore character replaced by `_`.
- **Full key** — `VITE_services__{resource}__{endpoint}__0`.
- **Shorthand key** — `VITE_{RESOURCE}_URL`.
- **Server key** — raw `services__{resource}__{protocol}__{index}`; intentionally not normalized.

### Ports

- None introduced. The existing `Deno.Command` process edge is unchanged; a pure builder supplies
  the test seam.

### Constants

- The character sweep derives ASCII punctuation from code-point ranges; no finite product constant
  is introduced.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 0 | Activate harness and open the draft review surface | artifact review | run directory |
| 1 | Prove SDK/Aspire agreement and normalized CLI prebuild injection while guarding server/order behavior | RED then focused tests + scoped/static/quality/doctrine gates | SDK browser/tests, CLI prebuild/tests, run evidence |

### Deferred Scope

- Runtime Aspire/Docker validation — explicitly excluded by the owner; no runtime behavior is needed
  to prove pure key generation.
- IMPL-EVAL — must be dispatched by the supervisor in a separate session.

### Contributor Path

Change Aspire's `build-vite-env-var-name.ts` contract source only with a matching SDK character-sweep
pin update; CLI deploy prebuild consumes the Aspire key pair rather than maintaining its own rule.

## PLAN-EVAL

`PLAN-EVAL: N/A` — #1833 is a small mechanical correction with empirically verified failures,
locked implementation ownership, explicit non-scope, a complete test corpus, and named gates.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-31 | 0 | bootstrap | Rebased clean branch from #1831 baseline to current `origin/main`; loaded harness/doctrine/PR/tools contracts. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Reuse SDK normalizer for SDK shorthand | Avoids a third browser rule and preserves full-key code. | issue #1833 / D1 |
| Reuse Aspire builder for CLI injection | The Aspire implementation is the contract source. | issue #1833 / D2 |
| Keep server path raw | Matches real Aspire server output. | issue constraint / D3 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Repo-advertised `rtk` binary is unavailable in this shell | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| RED | structured focused tests | NOT_RUN | Tests not written yet. |
| Check/lint/fmt | structured scoped wrappers | NOT_RUN | Pending slice 1. |
| Repo check | `deno task check` | NOT_RUN | Pending slice 1. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `quality:scan` | NOT_RUN | pending | Required framework gate. |
| `arch:check` | NOT_RUN | pending | Required doctrine gate. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Aspire/Docker runtime | N/A | owner directive | Must not start runtime. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| SDK/Aspire browser key agreement | NOT_RUN | pending | Character sweep planned. |
| CLI deploy prebuild injection | NOT_RUN | pending | Pure environment-map test planned. |

## Handoff Notes

- IMPL-EVAL must inspect shorthand normalization, exact full-key preservation, CLI enabled-plugin
  filtering, fallback order, and the untouched raw server-key implementation.

