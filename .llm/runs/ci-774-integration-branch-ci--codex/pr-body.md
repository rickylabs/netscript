## Summary

Fixes the false-green gap for stacked-wave PRs by scheduling core and scaffold CI on integration
branch families and making each workflow report which lanes actually ran versus policy-skipped.

Do not merge until the Plan-Gate and final separate-session evaluator pass are complete.

## Scope

- Archetype / area: repository tooling / GitHub Actions
- Closes #774

## Definition of Done

- [x] Core `check-test`, `quality`, `deps-report`, and `close-gate` schedule for PRs into `main`, `feat/**`, and `epic/**`.
- [x] Scaffold applicability covers the same base families without weakening path/label policy.
- [x] Always-on summaries distinguish lanes that ran from lanes skipped by policy.
- [x] `main` protection/rulesets audited read-only and required checks recorded below.
- [x] Workflow YAML validation passes.
- [ ] Separate-session PLAN-EVAL and IMPL-EVAL pass.

## Slices

- [x] S0 research, design, and ruleset audit — bootstrap commit
- [x] S1 trigger and lane-visibility implementation — see the live commit list and IMPL phase comment
- [ ] S2 opposite-family implementation evaluation and handoff

## Validation

- Workflow YAML parse + structural assertions — PASS (10 workflows)
- Classifier tests — PASS (30 passed, 0 failed)
- `actionlint` — unavailable on this host; focused diff and structural assertions used
- TypeScript check — N/A unless TypeScript or Deno task wiring changes

### Expected lane behavior

| Scenario | Core CI | Scaffold CI |
| --- | --- | --- |
| PR → `main` | `close-gate`, `check-test`, `quality`, and `deps-report` run. | `classify` runs; static/runtime execute or short-circuit according to existing path/label policy. |
| PR → `feat/beta10-integration` | Same core lanes run after the widened trigger. | Same classifier and static/runtime policy as `main`; the base no longer causes an applicability skip. |
| Docs-only PR + `ci:skip-e2e` | Core lanes still run because `ci.yml` has no path skip. | `classify` succeeds with static/runtime false; both scaffold jobs start, short-circuit successfully, and the summary reports “skipped by policy.” |

### Branch-protection audit (read-only)

The legacy branch-protection endpoint returns `404 Branch not protected`, but the repository uses an
active ruleset instead. Ruleset `main-branch-protection` (`18459345`) targets the default branch and
requires `quality`, `check-test`, and `deps-report`. Therefore both `quality` and `check-test` are
required checks for `main` today. Plainly: a “blocking” gate inside a non-required job blocks
nothing; in the current ruleset these two jobs are required, but that must remain true for their
internal failures to block merges.

No settings were changed.

## Harness

- Run dir: `.llm/runs/ci-774-integration-branch-ci--codex/`
- Phase: impl-eval — see phase comments below.

## Drift / Debt

- Minor: desired-state runtime identity absent; managed remote-control daemon, exact rollout thread,
  and worktree attachment are independently verified.
- Debt: none.
