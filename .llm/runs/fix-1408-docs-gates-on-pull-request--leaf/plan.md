# Plan: PR-reachable docs-site gates

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1408-docs-gates-on-pull-request--leaf` |
| Branch | `fix/1408-docs-gates-on-pull-request` |
| Phase | `plan` |
| Target | CI workflows for `docs/site` |
| Archetype | N/A — infrastructure workflow only |
| Scope overlays | docs |

## Goal and Scope

Make the existing source-format gate blocking in the PR quality lane and make the existing full docs-site build/render/link/caveat gates run only for docs-site PRs. Do not alter gate implementations.

## Non-Scope

- `diagrams:check` stays local because it invokes networked `npx`.
- No package/plugin, checker, classifier, lockfile, deployment semantics, or gate relaxation changes.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D8.1 | Add `check:source-format` and its focused unit test to `ci.yml` quality. | Cheap blocking coverage plus checker regression coverage. |
| D8.2 | Extend `pages.yml` with path-scoped PR triggering. | Reuses the only existing full docs build pipeline instead of duplicating it. |
| D8.3 | Guard Pages configure/upload/deploy and key concurrency per ref. | PR validation cannot deploy or cancel main deployment. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| New workflow vs Pages extension | resolved now | Pages extension is smaller and keeps gate sequencing single-sourced. |

## Commit Slices

| # | Proof | Gate | Files |
| --- | --- | --- | --- |
| 3.1 | Activated harness run and review surface | artifact inspection | run dir |
| 3.2 | Source-format blocks in docs quality lane | local source checker | `ci.yml`, run dir |
| 3.3 | Full docs validation is PR-reachable without deploy | local full build + workflow review | `pages.yml`, run dir |
| 3.4 | Deliberate Vento defect produces CI RED | failing Actions URL/output | docs fixture, run dir |
| 3.5 | Revert produces CI GREEN | passing Actions URL + grep/log | docs fixture, run dir |
| 3.6 | Acceptance mapping and lock equality complete | PR checks + two lock gates | run dir, PR body |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| PR run deploys or interferes with main | Event guards and `${{ github.ref }}` concurrency key. |
| Draft PR skips `ci.yml` jobs | Pages PR workflow independently exercises the same source gate through `build`; quality becomes blocking when PR leaves draft under supervisor control. |
| Validation changes locks | Tasks use existing wiring; prove diff exit 0 and exact blob hashes. |

## Validation Plan

Run `check:source-format`, `test:source-format`, and full `build` from `docs/site`; capture RED/GREEN Actions URLs; verify all PR checks; prove both lock diffs and expected hashes.

## Drift Watch

Record any mismatch in triggers, gate behavior, CI availability, identity, or lock hashes. PLAN-EVAL is N/A because the live issue supplies the complete mechanical contract, D8 resolves the only design decision, and no architecture decision remains.
