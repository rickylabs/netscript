# Context Pack — docs-plugin-sagas-core exports heading

- Run: `docs-plugin-sagas-core-exports-heading--1815`
- Branch: `docs/plugin-sagas-core-exports-heading`
- Phase: gate
- Profile: Archetype 3 subject + docs overlay
- Current state: scoped implementation and derived corpus regeneration are complete.
- Decision: `symbolCoverage.mode` is `entrypoints-only`; sixteen subpaths have real omissions after
  page-wide symbol matching.
- Files: one reference heading, one drift-check mapping, four generated corpus assets, and run
  evidence.
- Next: commit, rerun all required gates at committed head, push, open the draft PR at
  `status:impl`, then hand off to the separate IMPL-EVAL session.
- Drift/debt: none.
