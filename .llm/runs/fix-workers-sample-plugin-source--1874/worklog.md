# Worklog: official workers sample plugin source (#1874)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-workers-sample-plugin-source--1874` |
| Branch | `fix/workers-sample-plugin-source` |
| Archetype | `5 - Plugin Package` |
| Scope overlays | none |

## Design

### Public Surface

- No exported API changes. The user-visible surface is the authored `config/official-plugins/mod.ts`
  data consumed by workers registry regeneration.

### Domain Vocabulary

- `JobConfig.source` — existing core-owned `local | plugin` ownership discriminator.
- `create-user-settings` — existing plugin-owned sample handler id.

### Ports

- None introduced. The test uses the existing filesystem writer and registry generator seams.

### Constants

- No new finite vocabulary. Reuse the core-owned literal `plugin`.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Prove the official sample remains valid through config-aware regeneration. | focused structured test + check/lint/fmt + quality gate | `official-sample-configuration.ts`, `runtime-registry-generator_test.ts`, run artifacts |

### Deferred Scope

- Hosted `scaffold.runtime` D6 proof remains with PR #1872's hosted lane by owner direction.
- Existing workers doctrine/public-surface debt remains independently tracked.

### Contributor Path

Add official jobs in `official-sample-configuration.ts`; any entrypoint outside `workers.jobsDir`
must declare its real `source`, then extend the config-aware regeneration fixture.

## Plan Gate

- `PLAN-EVAL: N/A` — #1874 supplies the exact defect, invariant, two-file product scope,
  acceptance cycle, and gate restrictions. No material architecture, sequence, or trade-off
  decision remains open.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-09-01 | 1 | research | Re-baselined at `898d3aada`; D6 is correct. |
| 2026-09-01 | 1 | sample scan | Exactly one authored plugin-path entrypoint lacks explicit plugin source. |
| 2026-09-01 | 1 | red proof | Normalized authored config failed with the exact D6 `local` versus `plugin` diagnostic. |
| 2026-09-01 | 1 | implementation | Added the explicit plugin source and a real writer-to-regenerator test. |
| 2026-09-01 | 1 | reconcile | #1874 is open with no comments/acceptance checkboxes and milestone 27; #1872 head remains `898d3aada` on `feat/workers-config-aware-registry`. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Fix producer, not matcher | D6 correctly rejects config/discovery disagreement. | issue #1874 and generator code |
| Use real authored config in test | Text-only assertion would not prove regeneration. | acceptance requirement |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Local runtime/consumer gates omitted by explicit owner restriction. | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| focused test | structured test wrapper on `runtime-registry-generator_test.ts` | PASS | 7 passed, 0 failed. Pre-fix red proved the exact D6 source disagreement. |
| focused check | structured check wrapper on both product files | PASS | 2 files, 0 diagnostics. |
| focused lint | structured lint wrapper on both product files | PASS | 2 files, 0 findings. |
| focused fmt | structured fmt wrapper on both product files | PASS | 2 files, 0 findings. |
| lock hygiene | `git diff -- deno.lock` | PASS | No output; lockfile unchanged. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| code quality / architecture | PASS | `deno task quality:gate`, exit 0 | Quality scan found 0 findings; doctrine reported baseline warnings with `FAIL=0`. |
| JSR surface | PASS | research surface scan | No export, type, doc, dependency, or publish-shape change; #1655 unchanged. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| local runtime/Aspire/Docker/E2E | N/A | owner directive | Hosted lane owns D6 proof. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| scaffold runtime | NOT_RUN | hosted PR #1872 lane | Explicitly prohibited locally. |

## Handoff Notes

- Inspect that D6 remains byte-unchanged and the test drives the real official sample writer.
- The product diff is exactly one production line plus one test; no other sample mismatch was found.
