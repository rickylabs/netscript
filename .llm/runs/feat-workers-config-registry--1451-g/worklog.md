# Worklog: config-aware installed workers registry generation

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-workers-config-registry--1451-g` |
| Branch | `feat/workers-config-aware-registry` |
| Archetype | 5 — Plugin Package, with Archetype-6 generator edge |
| Scope overlays | none |

## Design

### Public Surface

- `generate-runtime-registries.ts` — CLI edge loads the real project config and passes normalized
  workers policy to the generator.
- `GenerateRuntimeRegistriesOptions` — adds an optional, core-owned `WorkersConfigData` input;
  absent data preserves the existing caller contract.
- Generated `jobDefinitions` — keeps the existing runtime-consumed map export while configured
  entries carry project policy.

### Domain Vocabulary

- `WorkersConfigData` / `JobConfig` — imported normalized core contracts; none redefined.
- Canonical entrypoint — normalized project-relative path joining `workers.jobsDir` with a policy
  entrypoint.
- Configured identity — `(canonical entrypoint, id)` plus origin (`grouped` or `flat`).
- Discovered identity — canonical path plus discovery source (`local` or `plugin`) and optional
  plugin id.

### Ports

- None introduced. `loadConfig` is called only at the existing CLI process edge; the generator's
  filesystem behavior remains its existing boundary.

### Constants

- No new policy/default constants. Defaults remain owned by `JobConfigZodSchema`; current generic
  fallback literals remain compatibility behavior for unconfigured discoveries.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| G | Consume normalized project workers policy in installed registry generation | focused structured plugin/CLI tests plus static/doc/JSR/quality/lock gates | six planned product files; no fixture helper unless local integration proves impossible |

### Deferred Scope

- `registry-compiler.ts` policy parity — separate backend and clustered-plan follow-up.
- Hosted `scaffold.runtime` — supervisor-owned merge-readiness lane; explicitly forbidden locally.

### Contributor Path

Add worker policy fields only in `@netscript/plugin-workers-core/config`; the generator consumes the
normalized `JobConfig` object. Add discovery sources in the runtime manifest and matcher discovery
model, then extend semantic generation tests without introducing a second policy schema.

## Progress Log

| Time (UTC) | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-09-01 | G | bootstrap | Read skills, harness workflow, doctrine, locked D5–D7/Slice G, and PLAN-EVAL PASS. |
| 2026-09-01 | G | re-baseline | Confirmed exact base `1e53e731a`, Slice C present, lock blob `ac2ee042…`. |
| 2026-09-01 | G | A/B baseline | Plugin doc lint 20 pre-existing private-type diagnostics; CLI 0; installed integration 9/9. |
| 2026-09-01 | G | implementation | Added entry-edge config loading, typed normalized policy input, canonical matching, D7 precedence, generated policy literals, diagnostics, docs, and installed/startup integration. |
| 2026-09-01 | G | acceptance | Focused structured tests pass 15/15, including real config entry, malformed/absent config, all policy fields, Windows paths, precedence, collision/source/unmatched errors, plugin intrinsic id, generic fallback, and installed runtime consumption without fetch. |
| 2026-09-01 | G | fitness | Focused check/lint/fmt pass in governed scopes; doc-lint A/B unchanged at plugin 20 / CLI 0; publish dry-run, quality gate, and architecture gate pass. |
| 2026-09-01 | G | PR handoff | Pushed implementation commit `236ddcf3a`; opened draft PR #1872 with required labels and milestone 0.0.7. GraphQL confirms `closingIssuesReferences: []`. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Consume only `WorkersConfigData` inward | Prevent validation/default duplication | D5; Archetype-5 thinness law |
| Resolve policy by canonical entrypoint then verify id/source | Avoid wrong-file policy binding | D6 |
| Resolve grouped before flat and shadow only exact identity | Preserve group topic authority | D7 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| RTK binary documented by repo skill is unavailable in this shell | minor | yes |
| Direct config dependency deterministically changes Deno's per-member lock snapshot | significant | yes |
| Existing official sample normalizes a plugin-owned path to local source | significant | yes |
| Root lint/fmt configuration excludes the CLI package | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| baseline installed integration | structured test wrapper | PASS | 9 passed, 0 failed |
| focused semantic tests | structured test wrapper | PASS | 15 passed, 0 failed; receipt `receipts/focused-tests.json` |
| focused check | structured check wrapper | PASS | zero diagnostics; receipt `receipts/focused-check.json` |
| workers lint | structured lint wrapper | PASS | zero diagnostics; receipt `receipts/plugin-lint.json` |
| workers fmt | structured fmt wrapper | PASS | zero findings; receipt `receipts/plugin-fmt.json` |
| CLI lint | direct `deno lint --no-config` | PASS | root policy excludes CLI; structured refusal receipts retained |
| CLI fmt | root policy / direct A/B observation | BASELINE | root policy excludes CLI; config-free check reports established whole-file style |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| doc-lint A/B baseline | PASS | plugin 20; CLI 0 | Post-change count must not increase |
| doc-lint A/B post-change | PASS | plugin 20; CLI 0 | zero new diagnostics; receipts retained |
| plugin publish dry-run | PASS | `deno task --cwd plugins/workers publish:dry-run` | three existing dynamic-import warnings |
| JSR audit | BASELINE | 1 pre-existing fail, 3 warnings | unchanged files/findings; dry-run OK |
| quality gate | PASS | `deno task quality:gate` | scanner clean; architecture subgate pass |
| architecture | PASS | `deno task arch:check` | no new failures; existing warnings only |
| lock verification | PASS | SHA-256 `01ff3a…`; git blob `ac2ee042…` | byte-identical to base after removing transient Deno member-snapshot row |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| local runtime / Aspire / Docker / browser | N/A | owner boundary | Explicitly out of brief; not run |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| installed registry | PASS | 10/10 integration tests | New policy/startup case uses one discovered manifest and zero fetches |

## Handoff Notes

- Draft PR: `https://github.com/rickylabs/netscript/pull/1872` (`status:impl`, exact requested
  taxonomy, milestone 0.0.7, `Refs #1451`, no closing relationship).
- Evaluator should inspect that no generator-owned validation/defaults were introduced and that
  `maxConcurrency: 0` survives normalization and generated-module import.
- Compare post-change doc lint against plugin 20 / CLI 0 and lock blob against `ac2ee042…`.
- Hosted runtime owner should triage the recorded official-sample source mismatch before running the
  merge-readiness smoke; no local runtime/Aspire/Docker/browser gate was run.
