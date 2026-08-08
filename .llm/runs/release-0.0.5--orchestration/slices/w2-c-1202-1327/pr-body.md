## Summary

Make `db migrate` prove the migration it creates and applies, and prove scaffolded users services
bind the live Postgres allocation across consecutive AppHost starts.

## Scope

- Archetype / area: Archetype 6 CLI/tooling · CLI/database/Aspire scaffold
- Closes #1327
- Closes #1202

## Slices

- [x] S1 lock research, design, RED contracts, and issue boundary
- [x] S2 implement migration artifact and applied-state semantics
- [x] S3 add TTY/non-TTY generated-project migration E2E controls
- [x] S4 prove two-allocation live Postgres/users health and telemetry identity
- [ ] S5 complete gates and separate-session IMPL-EVAL handoff

## Validation

- Baseline Git and live issue re-verification — exit 0
- Focused/scoped/quality/doctrine/doc/publish gates — exit 0
- Granted one-pass `scaffold.runtime` — raw exit 0, `passed=76 failed=0`; pre/post leak reports show
  no W2-C-owned survivor and review-thread gate passed with 0 unanswered threads.
- Coverage limitation: that pass exposed an explicit-suite allowlist omission, so it did not execute
  the four new W2-C acceptance gates. The selector repair is focused-green (16/16 registry tests),
  and Tier-A granted a fresh serialized pass.
- Tier-A test restoration: raw exit 0, 3/3 focused helper tests passed, including both restored
  `isNoRunningAppHostOutput` cases.
- Repaired-selector `scaffold.runtime`: raw exit 1, `passed=33 failed=1`.
  `database.migration-artifacts` executed and failed after creating/applying its PTY artifact because
  the spawn adapter accessed inherited (unpiped) stderr. Both allocation gates and
  `behavior.live-db-endpoint` were not reached. Cleanup passed and postflight leak evidence shows no
  W2-C-owned survivor. No retry was attempted.
- PTY spawn repair: behavioral RED raw exit 1 reproduced the inherited-stderr getter TypeError;
  focused green raw exit 0, 5 tests / 10 steps passed. Third serialized pass granted at fixed head.
- Third `scaffold.runtime`: raw exit 1, `passed=61 failed=1`.
  `database.migration-artifacts` and both allocation captures passed. `behavior.live-db-endpoint`
  failed because its validator rejected keyword syntax `Port=45103` while the live URL used the same
  port as `:45103`; it stopped before correlated health/OTEL receipt generation. Cleanup and
  postflight leak verification passed; no retry was attempted.

## Harness

- Run dir: `.llm/runs/release-0.0.5--orchestration/slices/w2-c-1202-1327/`
- Phase: implementation → IMPL-EVAL handoff with disclosed runtime-evidence gap
- Do not merge until required gates, Tier-A review, and separate-session IMPL-EVAL PASS are complete.

## Drift / Debt

- Shared-contract file absent from `origin/main`; the inlined launch contract is authoritative.
- Existing CLI maintainer/public-mixing and permission-doc debt is accepted and must not deepen.

## Definition of Done

- [x] `db migrate` success names and verifies created migration files and applied database state.
- [x] Headless inability to create a migration fails non-zero with an actionable next command.
- [x] `db deploy` is the only deploy-only verb and output separates created/applied sets.
- [ ] TTY and non-TTY schema-change E2E proves files and database state, with deploy/no-change controls.
- [ ] Two consecutive starts prove users receives the live Postgres allocation via health, logs, and OTEL.
- [ ] Required static, quality, doctrine, publish, resource-health, and serialized runtime gates pass.
- [ ] Separate-session IMPL-EVAL passes.
