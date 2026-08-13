# Plan: distinguish canary verification infrastructure failures

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1634-verify-canary-pair-deno-permission--w9` |
| Branch | `fix/1634-verify-canary-pair-deno-permission` |
| Phase | `plan` |
| Target | release tooling and trusted publish workflow |
| Archetype | `6 - CLI / Tooling` |
| Scope overlays | none |

## Goal and Scope

- Grant exactly `git,deno` to `release:verify-canary-pair`.
- Keep `publish.yml` consuming that named task as the single permission source.
- Preserve permission/infrastructure errors while retaining the genuine content-drift verdict.
- Add discriminating contract tests and capture RED/GREEN evidence.

## Non-Scope

- No publish, release cut, tag/release mutation, package code, or broader run permission.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Define the executable grant once in `deno.json`; workflow invokes the task. | Prevents duplicated permission lists from drifting. |
| D2 | Classify Deno permission denial before the content-verdict rewrite. | Execution failure is infrastructure, not content. |
| D3 | Test exact executable equality, not substring presence. | Detects future narrowing and widening. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Permission source | resolved now | Named task is canonical. |
| Error boundary | resolved now | Permission denial gets an infrastructure prefix. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Real drift becomes accepted | Test genuine drift still returns the content-blocked error. |
| Trusted permissions broaden | Parse and compare the exact executable set. |
| Workflow/task drift | Assert the workflow invokes the canonical task. |

## Validation Plan

1. Focused release tests RED then GREEN.
2. `rtk proxy deno task check`, `test`, `lint`, `fmt:check`.
3. Real `deno task release:verify-canary-pair -- --repo rickylabs/netscript` verdict.
4. Lock-file stat assertion.

PLAN-EVAL: N/A — issue #1634 supplies a complete deterministic seam, acceptance contract, and gate set; no architecture or sequencing decision remains.
