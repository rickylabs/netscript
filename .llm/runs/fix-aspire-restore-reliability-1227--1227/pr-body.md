## Summary

Bound the Aspire restore gate, reuse the exact pinned NuGet packages across CI runs, and classify restore/feed failures as infrastructure rather than product failures.

## Scope

- Archetype / area: E2E harness and release-runtime workflow
- Closes #1227

## Slices

- [x] S0 Issue-first research, locked design, draft surface — `e2c793d19`
- [x] S1 Restore retry budget and infrastructure classification — `84c430cec`
- [x] S2 Pinned NuGet cache and workflow regressions — `6c1140437`
- [x] S3 Targeted validation and ready handoff — `c3d0321bf`

## Validation

- E2E unit surface + cache policy: 108 passed
- Focused changed-surface regressions: 24 passed
- Scoped check: 122 files, 0 findings
- Scoped lint: 122 files, 0 findings
- Scoped fmt: 126 files, 0 findings
- Workflow YAML parse: 3 passed
- Quality scan: pass; architecture gate: pass with baseline warnings only

## Harness

- Run dir: `.llm/runs/fix-aspire-restore-reliability-1227--1227/`
- Route: openai / gpt-5.6-sol / medium
- D6: composed evaluation; no local PLAN-EVAL
- Phase: implementation evaluation / orchestrator pre-merge gate

## Drift / Debt

- `actionlint` is not installed on this machine; workflow YAML parsing plus the exact cache-policy
  regression provide the local workflow verdict. CI remains the authoritative Actions semantic check.
- Inherited lockfile churn remains excluded.

```acceptance-evidence
issue: 1227
entries:
  - box-index: 1
    evidence: "84c430cec: runtime.aspire-restore uses three 180-second attempts (540 seconds maximum) instead of two suite-wide 900-second attempts; regression asserts the exact per-attempt timeout and ceiling."
  - box-index: 2
    evidence: "6c1140437: both PR runtime jobs and both canary workflows persist ~/.nuget/packages under an OS + exact Aspire 13.4.6 key; the workflow policy test asserts all four cache sites."
  - box-index: 3
    evidence: "84c430cec: restore owns failureClass infrastructure, all three attempts retain it, and the pretty suite summary renders failure class: infrastructure beside attempt durations."
```
