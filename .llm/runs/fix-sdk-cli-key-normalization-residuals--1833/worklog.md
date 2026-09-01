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
| 2026-08-31 | 1 | RED | Structured focused wrapper exited 1: 95 failed / 14 passed; 92 unique SDK corpus failures plus the CLI injection-map mismatch. |
| 2026-08-31 | 1 | implement | SDK shorthand now reuses its existing normalizer; CLI injection now consumes Aspire's key builder. `service-url.ts` remained untouched. |
| 2026-08-31 | 1 | GREEN | Identical focused command passed 109/109; package-focused suites and all requested gates passed. |
| 2026-08-31 | 1 | reconcile | Issue #1833 remains open at `status:impl`, milestone `0.0.7`; draft PR #1835 has `Closes #1833`, the requested taxonomy, and no lifecycle-label transition. No new reviewer comments were present before handoff. |

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
| Root lint/fmt config excludes all CLI files, requiring the established run-local quality config | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| RED | structured focused tests | FAIL (expected), exit 1 | `red-tests.json`: 95 failed, 14 passed, 92 unique SDK mismatch failures plus CLI mismatch. |
| Focused GREEN | identical structured focused command | PASS, exit 0 | `green-focused-tests.json`: 109 passed. |
| SDK tests | structured test wrapper over `packages/sdk/tests` | PASS, exit 0 | `sdk-tests.json`: 183 passed. |
| Aspire tests | structured test wrapper over `packages/aspire/tests` | PASS, exit 0 | `aspire-tests.json`: 91 passed. |
| CLI deploy-build tests | structured test wrapper over deploy build feature | PASS, exit 0 | `cli-deploy-build-tests.json`: 9 passed. |
| Scoped check | structured check wrapper over four changed TypeScript files (`--unstable-kv`) | PASS, exit 0 | `scoped-check.json`: 0 occurrences. |
| SDK lint / fmt | structured wrappers over two changed SDK files | PASS, exit 0 / 0 | `sdk-lint.json`, `sdk-fmt.json`. |
| CLI lint / fmt | structured wrappers over two changed CLI files | PASS, exit 0 / 0 | `cli-lint.json`, `cli-fmt.json`; run-local config opts owned CLI files into root-equivalent rules. |
| Repo check | `deno task check` | PASS, exit 0 | 2,976 files, 25 batches, `failedBatches: 0`. |

Non-verdict setup attempts: the first three scoped wrapper calls exited 1 because `--output` was
used without `--allow-write`; mixed-root lint/fmt and the first package-config CLI retries exited 2
on coverage refusal because the root Deno config excludes `packages/cli/`. No source diagnostic was
reported in those attempts. Corrected commands above are the verdict evidence.

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `quality:scan` | PASS, exit 0 | repository scan: no findings | Required framework gate. |
| `arch:check` | PASS, exit 0 | all roots: `FAIL=0`; pre-existing warnings only | Required doctrine gate. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Aspire/Docker runtime | N/A | owner directive | Must not start runtime. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| SDK/Aspire browser key agreement | PASS, exit 0 | 109-case focused result plus 183-test SDK suite | Both full and shorthand pinned. |
| CLI deploy prebuild injection | PASS, exit 0 | 9-test deploy-build suite | Full and shorthand injected; disabled plugin excluded. |

## Handoff Notes

- IMPL-EVAL must inspect shorthand normalization, exact full-key preservation, CLI enabled-plugin
  filtering, fallback order, and the untouched raw server-key implementation.
- This generator records automated evidence only; substantive supervisor review and separate-session
  IMPL-EVAL remain pending, so the PR stays draft at `status:impl`.
