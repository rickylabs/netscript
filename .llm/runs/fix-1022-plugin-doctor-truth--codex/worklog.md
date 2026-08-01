# Worklog: plugin doctor runtime truth

## Design

### Public Surface

- `PluginContributions.doctor` and `PluginBuilder.withDoctor()` declare a module contribution.
- `netscript plugin doctor` remains the command surface and throws a kernel exit error after output.

### Domain Vocabulary and Ports

- Existing `DoctorCheck` / `DoctorReport` remain unchanged.
- Host mapping adds remediation-bearing check messages; dynamic import is an injected edge where
  practical.
- No new AppHost client or live-resource port.

### Constants

- Reuse `WORKERS_JOB_REGISTRY_PATH` and the saga generator's canonical registry path.
- Define a stable non-zero doctor exit code in the command feature.

### Commit Slices

See `plan.md`; ordered contract/bridge → plugin checks → exit regression → evidence.

### Deferred Scope

- Acceptance boxes 4 and 6 (live AppHost/resource truth), triggers, and streams.

### Contributor Path

Add a plugin-owned doctor module returning `DoctorReport`, register it with `.withDoctor(path)`,
and keep host execution generic.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-01 | bootstrap | complete | Owner-approved PLAN-EVAL PASS recorded. |
| 2026-08-01 | S1-S3 | implemented | Manifest doctor module, generic host bridge, worker/saga registry checks, and exit propagation landed locally. |
| 2026-08-01 | S3 | regression | Targeted command/contract tests: 7 passed, 0 failed. |

## Gate Results

Initial scoped checks passed for plugin, workers, sagas, and CLI before the final test additions;
the complete requested gate rerun remains pending.
