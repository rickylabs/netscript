## Summary

Make `db migrate` prove the migration it creates and applies, and prove scaffolded users services
bind the live Postgres allocation across consecutive AppHost starts. The endpoint work is a partial
code/evidence slice for #1202; owner-machine collision observation remains separate.

## Scope

- Archetype / area: Archetype 6 CLI/tooling · CLI/database/Aspire scaffold
- Closes #1327
- Refs #1202 — remaining: identify the colliding Windows service/port with it present and capture
  three consecutive clean full `scaffold.runtime` passes on the owner's machine.

## Slices

- [x] S1 lock research, design, RED contracts, and issue boundary
- [ ] S2 implement migration artifact and applied-state semantics
- [ ] S3 add TTY/non-TTY generated-project migration E2E controls
- [ ] S4 prove two-allocation live Postgres/users health and telemetry identity
- [ ] S5 complete gates and separate-session IMPL-EVAL handoff

## Validation

- Baseline Git and live issue re-verification — exit 0
- Focused/scoped/runtime gates — pending implementation
- `scaffold.runtime` — not requested; serialized token protocol applies

## Harness

- Run dir: `.llm/runs/release-0.0.5--orchestration/slices/w2-c-1202-1327/`
- Phase: plan → implementation
- Do not merge until required gates, Tier-A review, and separate-session IMPL-EVAL PASS are complete.

## Drift / Debt

- Shared-contract file absent from `origin/main`; the inlined launch contract is authoritative.
- Existing CLI maintainer/public-mixing and permission-doc debt is accepted and must not deepen.

## Definition of Done

- [ ] `db migrate` success names and verifies created migration files and applied database state.
- [ ] Headless inability to create a migration fails non-zero with an actionable next command.
- [ ] `db deploy` is the only deploy-only verb and output separates created/applied sets.
- [ ] TTY and non-TTY schema-change E2E proves files and database state, with deploy/no-change controls.
- [ ] Two consecutive starts prove users receives the live Postgres allocation via health, logs, and OTEL.
- [ ] Required static, quality, doctrine, publish, resource-health, and serialized runtime gates pass.
- [ ] Separate-session IMPL-EVAL passes.

