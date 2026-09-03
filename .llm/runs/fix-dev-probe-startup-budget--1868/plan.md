# Plan: dev probe startup budget

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-dev-probe-startup-budget--1868` |
| Branch | `fix/dev-probe-startup-budget` |
| Phase | `plan` |
| Target | CLI E2E tooling |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Archetype and doctrine verdict

Archetype 6 is the smallest fit because this is user-run CLI E2E automation. The top-level `@netscript/cli` verdict is **Keep**; the nested E2E workspace is outside the package doctrine denominator. Preserve the existing CLI architecture and change only the owned probe seam.

## Goal and scope

- Add a fake-scheduler regression for slow preflight, prompt real child exit, and truthful startup timeout output.
- Give startup/preflight and Fresh HTTP readiness separate named budgets.
- Detect transition into the Vite phase from mirrored child output without changing generated dependency commands.

## Non-scope

- Dependency verifier optimization, memoization, dependency-closure changes, generated task changes, `deno.lock`, and the full scaffold runtime lease.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Use `DEV_STARTUP_BUDGET_MS = 180_000` and `FRESH_HTTP_READINESS_BUDGET_MS = 60_000`. | Matches the established host-tolerant tier while preserving a separate HTTP budget. |
| D2 | Export one orchestration function with injected signal/status/fetch/clock/sleep dependencies. | Enables millisecond-scale deterministic tests without a production timeout. |
| D3 | Race child status in both phases. | Real exits retain their actual status and fail promptly. |
| D4 | Pipe, mirror, and scan child output for Vite's `Local:` banner. | Separates phases without touching the generated command chain. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Verifier optimization | safe to defer | Explicitly owned by broader follow-up work. |
| Full NAS Flow-B proof | safe to defer | No runtime lease; hosted CI owns the canonical suite. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Output marker split across chunks | Incrementally decode and retain a bounded scan tail. |
| Longer budget delays crashes | Race the shared child-status promise, never poll it only after timeout. |
| Piped output hides diagnostics | Mirror every byte to the original stdout/stderr sink. |
| Lockfile or unrelated churn | Check `deno.lock` and exact status before every commit. |

## Commit slices and validation

| Order | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | RED: encode three regression cases | Structured focused test wrapper; expect 3 failures | focused test + run dir |
| 2 | GREEN: separate startup/readiness phases and preserve prompt exit | Structured focused test/check/lint/fmt wrappers; expect exit 0 | probe + run dir |

## PLAN-EVAL

N/A: this is a small mechanical repair whose issue supplies measured diagnosis, exact ceiling, locked budgets, acceptance criteria, and gate restrictions. No material architecture or sequencing decision remains open.

## Debt

No doctrine debt created or closed.
