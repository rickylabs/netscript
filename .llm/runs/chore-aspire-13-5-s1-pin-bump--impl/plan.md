# Plan: Aspire 13.5 S1 pin bump and parity gate

## Scope and design authority

- Issue: #1713; part of epic #1712.
- Archetype: 6 — CLI/tooling. No scope overlay.
- Doctrine verdict: Keep — preserve the Archetype-6 kernel/surface split.
- PLAN-EVAL: N/A. This is a three-commit mechanical change with owner-locked versions, files, semantics, gates, and rollback boundary; no material architecture or product decision remains open.

## Locked decisions

1. Import the research manifest byte-for-byte from `origin/research/aspire-13.5-0.0.7`; do not regenerate or edit its rows.
2. Gate truth is `SCAFFOLD_VERSIONS.ASPIRE_SDK`.
3. Phase 1 classification is exactly D-13; phase 2 exists but CI invokes the default phase 1.
4. All version pins and the CI gate wiring land atomically in commit 2.
5. No local AppHost, Aspire install/update, or runtime E2E is run; CI owns the runtime verdict.

## Open-decision sweep

- No must-resolve decisions remain.
- Stable Browsers availability is safe to defer and is tracked as explicit debt with a closing gate.
- Phase-2 CI activation is safe to defer and owned by S13.

## Commit slices

| # | What it proves | Gate | Files |
| --- | --- | --- | --- |
| 1 | The phase-aware parity contract detects the current 13.4.6 fail set and emits structured JSON | focused validation test; RED phase-1 receipt | parity tool/test, task/catalog entry, immutable manifest, run artifacts/receipt |
| 2 | Every issue-scoped pin is on one 13.5 train and phase-1 CI enforcement is green | named issue gates, scoped wrappers, quality/architecture, GREEN receipt | scaffold constants/tests, toolchain/workflows/policy, CI gate wiring, generated barrel, run artifacts |
| 3 | Accepted Browsers preview debt and complete handoff evidence are durable | artifact inspection and final git/PR evidence | append-only debt registry and run artifacts |

## Risk register

| Risk | Mitigation |
| --- | --- |
| Manifest absent from baseline | Import exact blob from the issue's draft-of-record ref; verify blob hash and record drift |
| Phase 1 accidentally enforces deferred/archival rows | Table-driven unit tests cover fail/deferred/info/skip and owner tags |
| Phase 2 mishandles compatibility fixtures | Test stale compat row with and without a 13.5.3 peer literal |
| Pin bump leaves a mixed train | Atomic commit plus scaffold-version, policy, grep, and parity gates |
| Validation mutates `deno.lock` | Inspect status/diff after each gate; never accept unrelated lock churn |

## Gate set

- Focused parity tests through the structured test wrapper.
- `check:scaffold-versions`, Aspire NuGet cache policy test, assets regeneration/freshness.
- Scoped check/lint/fmt wrappers on `packages/cli`.
- `quality:scan` and `arch:check`.
- Phase-1 parity RED then GREEN receipts via `run-gate.ts`.
- Runtime `scaffold.runtime`: CI only by explicit lease restriction.

## Deferred scope

- Phase-2 CI activation (S13), deferred manifest owners, docs/skills/corpora, fixture recapture, generator emission changes, runtime canary admission, and all host Aspire CLI changes.

## 2026-08-30 convergence correction

Hosted run `33328727942` proved the S1 train except for the pre-13.5 assumption that consecutive
persistent Postgres allocations must differ. Aspire 13.5 intentionally persists deterministic
proxyless endpoint assignments for persistent resources, so this bounded follow-up replaces that
inequality with a fresh second-start topology comparison. The gate still requires both saved
receipt authorities, the live users `DATABASE_URL` authority, users `/health`, generated CRUD, and
users telemetry correlation. A pure comparison test rejects stale/literal receipt endpoints.

Sources: https://github.com/microsoft/aspire/wiki/13.5-Change-log and
https://aspire.dev/app-host/persistent-containers/.
