# Plan: JSR specifier token boundary

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1631-specifier-token-boundary--w8` |
| Branch | `fix/1631-specifier-token-boundary` |
| Phase | `plan` |
| Target | Release-validation tooling |
| Archetype | N/A — repository tooling, not a package/plugin product surface |
| Scope overlays | none |

## Current Doctrine Verdict

N/A: no `packages/**` or `plugins/**` architecture changes are planned.

## Goal

Parse first-party JSR specifiers at a canonical semver/token boundary so prose punctuation is excluded while versionless, stale, and range-pinned specifiers remain release-blocking.

## Scope

- Extract the existing NetScript scoped-name, semver, and terminating-boundary vocabulary into one shared parser/matcher module.
- Reuse it from the scanner, publish-readiness residue scan, and coordinated version rewriter.
- Add scanner and readiness regression tests for punctuation and strict failure modes.
- Record pre-fix RED and full gate evidence.

## Non-Scope

- Generated publish assets, rendered documentation, package corpus, release tags/branches, publication, and release cutting.

## Hidden Scope

- Preserve range-pin rejection at the composed `publish:readiness` gate, not merely in scanner bookkeeping.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | One shared parser/matcher vocabulary serves all three call sites. | Prevents the regex drift that caused #1631. |
| D2 | Sentence punctuation terminates the parsed semver but is never part of it. | Matches prose semantics and the canary failure evidence. |
| D3 | Exact current pins alone pass; bare, stale exact, and operator-prefixed pins fail. | Preserves coordinated release-train policy. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Parser ownership | resolved now | Shared `.llm/tools` library module. |
| Generated asset handling | resolved now | Scan unchanged; never edit or exclude it. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Boundary fix loosens the gate | Versionless, stale, and `^`/`~`/`>=` readiness assertions. |
| Shared matcher changes residue behavior | Existing bump-version and readiness suites plus root gates. |
| Lock churn | Never reload/delete locks; assert both lock diffs are empty before staging. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Pre-fix RED | Focused new tests against baseline | Punctuation assertions fail; strict controls remain demonstrably enforced. |
| 2 | Focused | `deno test` on scanner/readiness/bump-version tests | PASS |
| 3 | Static | `rtk proxy deno task check`, `test`, `lint`, `fmt:check` | PASS |
| 4 | Release readiness | `deno task publish:readiness` | `versionless-specifiers` PASS and overall PASS |

## PLAN-EVAL

N/A — issue #1631 is a small deterministic fix with the seam, precedents, acceptance criteria, negative controls, and gates supplied by the owner.

## Drift Watch

- Any need to modify generated content, package/plugin source, release state, or lock files requires stop/rescope.
