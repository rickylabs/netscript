# Plan

Run id: `feat-e2e-cli-prod-local--prod-suite`

## Profile

- Archetype: CLI / Tooling, applied only to the e2e harness and CI surface.
- Scope: test/CI harness; no `packages/cli/src` runtime implementation changes.
- PLAN-EVAL: waived explicitly by the user for velocity.
- Doctrine/runtime debt: none expected; no public package exports or package runtime architecture are
  changed.

## Locked Decisions

- Prod-local mode is represented as run options, not a new suite:
  `scaffold.runtime --source jsr --cli packages/cli/bin/netscript.ts`.
- `--source jsr` accepts either `jsr:@netscript/cli@...` or the local public bin ending in
  `packages/cli/bin/netscript.ts`.
- `--source jsr` rejects `netscript-dev.ts`, because the contributor bin scaffolds local
  `file://` imports and would not test JSR resolution.
- The existing published-CLI smoke workflow remains unchanged.
- CI prod-local runs on `push` to `main` and `workflow_dispatch`, not every unrelated PR.

## Open-Decision Sweep

- No must-resolve decisions remain.
- Safe to defer: public `init --package-version` override for testing an explicit already-published
  version.

## Commit Slices

1. Prod-local e2e mode.
   - Files: scaffold guard, root task, focused test, README, new GitHub workflow, run artifacts.
   - Gates: scoped check/lint/fmt, focused test, maintainer `scaffold.runtime`, prod-local
     `scaffold.runtime`, workflow review/actionlint if available.

## Risk Register

- Version pinning: prod-local fails on version-bump branches before publish.
  - Mitigation: document expected-pending behavior and future override idea.
- Coverage confusion: prod-local does not exercise HTTPS-loaded CLI assets.
  - Mitigation: document #124 blind spot and keep `e2e-cli-prod.yml` unchanged.
- CI cost: full runtime suite is expensive.
  - Mitigation: trigger on `main` push and manual dispatch only for this slice.

## Gate Set

- Scoped TypeScript check under `packages/cli/e2e`.
- Scoped lint and fmt over touched TypeScript files.
- Focused guard test.
- Existing maintainer full runtime smoke.
- New prod-local full runtime smoke.
- YAML validity review, with `actionlint` if installed.

## Deferred Scope

- No public CLI option for package version override.
- No JSR publish, install, or root lock-file churn.
- No changes to `packages/cli/src`.
