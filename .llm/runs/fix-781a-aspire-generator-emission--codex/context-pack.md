# Context Pack — fix #791 Aspire/CLI generator emission

## Current state

Research, re-baseline, plan, and Design checkpoint are complete on base `7d353be`. The supervisor
recorded plan commit `79ccd9bb` and PR #795, then explicitly authorized implementation of the locked
plan as a written Plan-Gate override. C1 implementation and focused gates are complete.

## Scope

- In: #791 findings 1–6 and 8, grouped into executable emission, environment projection, and
  bounded Garnet restore clusters.
- Out: #781 finding 7 (already fixed), finding 9 (#792), and broader lifecycle/topology work.

## Locked implementation decisions

- Omit unsupported browser logs from generic executables.
- Remove dependency-age only from `deno task` argv.
- Add corrected request-signal flag to plugin HTTP resource argv.
- Normalize Vite full-key segments rather than removing the full alias.
- Project both DB provider aliases from `PrimaryDatabase`.
- Use `pathToFileURL` over the absolute workspace database path.
- Keep current DB task/tool relative paths where the workdir makes them correct.
- Bound Garnet restore to 10 seconds.

## Validation required

Focused tests, asset parity, scoped check/lint/fmt wrappers over both touched packages,
`quality:scan`, `arch:check`, full-export doc lint, package publish dry-runs, and the one-pass full
`scaffold.runtime --cleanup --format pretty` verdict.

## Git / GitHub requirements

- Commit and comment by finding cluster.
- Push `HEAD:refs/heads/fix/781a-aspire-generator-emission` explicitly.
- Draft PR targets `feat/beta10-integration`, carries `Closes #791`, references #781 without a
  closing keyword, applies the requested labels, and uses milestone `0.0.1-beta.10`.
- Do not merge and do not dispatch evaluator sessions from this implementation lane.

## Next action

Commit, push, and comment C1 on PR #795, then implement C2 environment projection.
