# Worklog: fix public plugin registry generation (#1010)

## Run Metadata

| Field          | Value                                        |
| -------------- | -------------------------------------------- |
| Run ID         | `fix-1010-plugin-registry-generation--codex` |
| Branch         | `fix/1010-plugin-registry-generation`        |
| Archetype      | `6 - CLI / Tooling`                          |
| Scope overlays | `none`                                       |

## Design

### Public Surface

- `netscript generate plugins` — authoritative registry generation command.
- `netscript plugin sync` — compatibility command delegating to authoritative generation.
- No new `@netscript/cli` library export.

### Domain Vocabulary

- `InstalledPluginRuntime` — installed package identity/version and its runtime manifest source.
- `RuntimeRegistryManifest` / `RuntimeRegistryTarget` — existing `scaffold.runtime.json` contract
  subset.
- `RegistryGenerationResult` — per-plugin declared/written registry evidence.
- `EmptyPluginRegistryError` — named failure when an installed runtime has no registrable output.

### Ports

- Existing `ProcessPort` — execute plugin-owned generator in a project-rooted child Deno process.
- Existing `FileSystemPort` — read project metadata and validate emitted files.
- Existing JSR HTTP/file-fetch seam where published manifest bytes are required; no new generic SDK
  port.

### Constants

- No plugin identity constants. Manifest field names and Deno flags remain finite command vocabulary
  local to the adapter.

### Commit Slices

| # | Slice                                              | Gate                                 | Files                                                  |
| - | -------------------------------------------------- | ------------------------------------ | ------------------------------------------------------ |
| 1 | Manifest-driven generation and zero-result failure | focused generate tests/check         | generate feature + composition + tests + run artifacts |
| 2 | Sync delegation/docs and clean-install integration | targeted plugin/generate integration | plugin host/docs/integration + run artifacts           |
| 3 | Final gates/evaluator remediation                  | required validation and IMPL-EVAL    | owned fixes + run artifacts                            |

### Deferred Scope

- Installed-plugin ownership ledger — issue #167 uninstall follow-up owns it.
- Non-runtime plugins — legitimately produce no runtime registry and do not fail.

### Contributor Path

Add a runtime generator by publishing `scaffold.runtime.json` with `runtimeRegistryGenerator` and
`runtimeRegistries`; the public CLI discovers and executes that contract without editing a host-side
plugin-name registry.

## Progress Log

| Time       | Slice     | Step           | Notes                                                                                                                                                                                                                      |
| ---------- | --------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-01 | bootstrap | reproduced     | Published 0.0.2 clean-room output saved at `.llm/tmp/issue-1010-clean-room-repro.log`.                                                                                                                                     |
| 2026-08-01 | plan      | root cause     | Confirmed generic generation defect; narrowed sync defect to parent-process manifest import after project-rooted config load.                                                                                              |
| 2026-08-01 | plan-eval | blocked launch | Canonical OpenRouter evaluator canary reported missing credential; no evaluation occurred.                                                                                                                                 |
| 2026-08-01 | plan-eval | PASS           | Separate Claude Code + OpenRouter Qwen session completed PLAN-EVAL. All 8 Plan-Gate items checked. D3/D4 spot-checked against source — both confirmed. Verdict written to `plan-eval.md`. Implementation hard stop lifted. |
| 2026-08-01 | slice 1   | implemented    | Added manifest-driven generation, project-configured subprocess execution, canonical target reporting, dry-run behavior, and named empty-runtime failure. |

## Decisions

| Decision                                   | Reason                                                          | Source                        |
| ------------------------------------------ | --------------------------------------------------------------- | ----------------------------- |
| Generate is authoritative; sync delegates. | One command must own registry state and project context.        | issue acceptance + plan D1/D2 |
| Plugin manifests own paths/shapes.         | Runtime loaders and plugin generators are existing authorities. | plan D5                       |

## Drift

| Drift                                                                                                              | Severity | Logged in drift.md |
| ------------------------------------------------------------------------------------------------------------------ | -------- | ------------------ |
| Sync root cause is later than suspected: project config loading is already correct; parent resolver import is not. | minor    | yes                |

## Gate Results

### Static Gates

| Gate         | Command or check                    | Result                   | Notes                                 |
| ------------ | ----------------------------------- | ------------------------ | ------------------------------------- |
| Reproduction | published 0.0.2 clean-room sequence | FAIL (expected baseline) | generate exit 0/zero; sync exit 1/zod |
| Slice 1 focused tests | `deno test -A packages/cli/src/public/features/generate/plugins/*_test.ts` | PASS (exit 0) | 2 files, 4 steps passed |
| Slice 1 targeted check | targeted `deno check --unstable-kv` | PASS (exit 0) | Generator, command, and composition type-check. |

### Fitness Gates

| Gate      | Result  | Evidence                                                              | Notes                                                      |
| --------- | ------- | --------------------------------------------------------------------- | ---------------------------------------------------------- |
| Plan-Gate | PASS | Separate Qwen evaluator `plan-eval.md` | Hard stop lifted before source implementation. |

### Runtime Gates

| Gate               | Result  | Evidence                          | Notes                   |
| ------------------ | ------- | --------------------------------- | ----------------------- |
| `scaffold.runtime` | NOT_RUN | planned once after implementation | Required one-pass gate. |

### Consumer Gates

| Consumer                               | Result  | Evidence                          | Notes                               |
| -------------------------------------- | ------- | --------------------------------- | ----------------------------------- |
| workers/sagas/triggers runtime loaders | NOT_RUN | planned clean-install integration | Must see non-empty canonical files. |

## Handoff Notes

- PLAN-EVAL should inspect D3/D4 carefully: generic installed-package discovery and project-rooted
  subprocess execution are the load-bearing decisions.
