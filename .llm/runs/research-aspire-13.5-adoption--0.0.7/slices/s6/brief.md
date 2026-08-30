use harness

## SKILL

- netscript-harness — run lifecycle, slice review gate, evaluator separation (you never self-certify).
- netscript-doctrine — `packages/cli` is framework code; `quality:scan` + `arch:check` per slice; no `any`/casts/lint-ignores; A7/A11: IO in the runtime edge (the emitted helper), never in the generator.
- netscript-tools — scoped wrappers, receipts, `gen:assets-barrel`/`check:assets-barrel`, configured `deno task lint`.
- netscript-cli — scaffold/E2E surface (`scaffold.plugins`; `scaffold.runtime` on CI).
- netscript-pr — draft PR, labels, `Closes`, commit-trail comments.
- aspire — Aspire 13.5 facts (`addHealthCheck`, `withHealthCheck`, `HealthCheckResult`, `HealthStatus`, `EndpointProperty`); **no AppHost start, no host CLI change** (no runtime lease in this phase).

## Context

You are the GPT-5.6 Sol implementation agent for **S6 of the Aspire 13.5 epic** (#1712):
**#1718 — [aspire-13-5 S6] Listener-readiness health checks for backing services via TS `addHealthCheck`/`withHealthCheck`**. Will close #1280. Supervisor: the Fable 5 session.

### Your worktree / branch — STACKED ON S5
- Worktree: `/home/codex/repos/netscript-aspire-13-5-s6` (native ext4; work ONLY here)
- Branch: `feat/aspire-13-5-s6-health-checks`, based on **S5's head `0bd8ba832`** (`fix/aspire-13-5-s5-literal-ports`, IMPL-EVAL PASS, ready-merge) because health checks attach to resources whose ports S5 made dynamic. No upstream — push only with `git push origin HEAD:refs/heads/feat/aspire-13-5-s6-health-checks`. Open the draft PR with **base `fix/aspire-13-5-s5-literal-ports`**; the supervisor retargets to `main` after S5 merges. Never touch S5's commits.
- Run dir you own: `.llm/runs/feat-aspire-13-5-s6-health-checks--impl/` (`supervisor.md` from `.llm/harness/templates/supervisor.md`, `worklog.md` with `## Design`, `context-pack.md`, `drift.md`).

### Required reading (in order)
1. Issue #1718 — the **locked readiness contract table** (per kind: TCP connect / RESP `PING`; `HealthCheckResult` mapping; secrets never cross the boundary; one socket, `setTimeout(2000)`, no retry loop; endpoint resolution at check time via `getEndpoint('tcp').property(EndpointProperty.Host|Port)`), deferred scope (S6b credential readiness → 0.0.8 draft), and acceptance.
2. `git show origin/research/aspire-13.5-0.0.7:.llm/runs/research-aspire-13.5-adoption--0.0.7/research.md` — C-rows on health checks; `…/sources/aspiredev-reference_api_typescript_aspire.hosting.md` (`addHealthCheck`, `withHealthCheck`, `HealthCheckResult`, `HealthStatus`, `EndpointProperty`, `withHttpHealthCheck` options form) and `…/sources/` What's New 13.5 "Custom health checks". Cite the exact API page per emitted member (S4's `member-table.md` on `origin/chore/aspire-13-5-s4-generator-revalidation` shows the format).
3. `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-infrastructure.ts` (+ tests), `packages/cli/src/kernel/assets/aspire/helpers/_aspire-compat.ts.template`, the snapshot `packages/cli/src/kernel/assets/generated/aspire/helpers/generate-register-infrastructure-1.ts.template`, `packages/cli/e2e/src/application/gates/scaffold/runtime-gates.ts` (wait gates; S5's `probe-plugin-resource.ts` shows describe-derived assertions).
4. S2 receipts on `origin/test/aspire-13-5-s2-runtime-verification` (`03-v10-doctor*.json`, `02-v5-aspire-describe-final.json` — note `healthReports` / `healthStatus` keys as emitted by 13.5.3).

### Phase split (no lease in this dispatch)
- **Phase A (now):** helpers + generator emission + snapshot regen + helper unit tests against local `net.createServer` / fake RESP server + wait-gate assertions in `runtime-gates.ts` (they run on CI `scaffold.runtime` after ready) + credential grep test.
- **Phase B (lease-backed, same PR):** the `runtime.health.listener-unreachable` E2E fixture (`aspire resource postgres stop` → Unhealthy / `aspire wait … --status healthy` exit 18 → start → Healthy) and the `healthReports` receipts on both tiers. Write the fixture code in phase A behind the existing E2E gate registry, but do not run it; the supervisor resumes you with the lease.

## Slices (commit in order; RED-first where a gate exists)
1. **Helper contract + tests RED→green.** `createListenerReadinessCheck({ kind, host, port })` and `createRespPingCheck({ host, port })` in `_aspire-compat.ts.template` (Node `net` only, no new dependency), returning the exact `HealthCheckResult` mapping from #1718 (`Healthy`/`Unhealthy` with `data: { code, host, port, elapsedMs }`, `Degraded` only for `-NOAUTH`). Unit tests: local `net.createServer` (Healthy), closed port (ECONNREFUSED), black-hole address with 2000 ms timeout (ETIMEDOUT), fake RESP `+PONG` / `-NOAUTH` / garbage. Test the template by importing it through the existing template test harness (see how `_aspire-compat` is exercised today; if it is not, add a minimal extraction test that evaluates the helper source with `node:net`).
2. **Generator emission.** `generate-register-infrastructure.ts`: per kind — Postgres/MySQL/SQL Server TCP, Redis/Garnet RESP, Deno KV unchanged (`withHttpHealthCheck`), SQLite/none nothing — emit `builder.addHealthCheck('<resource>_listener' | '<resource>_resp', …)` + `.withHealthCheck(key)` with host/port resolved at check time from the resource endpoint. Generator tests assert exact emission per kind and that the password/user parameter names never appear in the probe.
3. **Snapshot + barrel regen.** `generate-register-infrastructure-1.ts.template` regenerated; `gen:assets-barrel`, `check:assets-barrel`.
4. **E2E wait gates (CI-run) + phase-B fixture code.** `runtime-gates.ts`: assert `healthReports['<resource>_listener'|'_resp']` present and `Healthy` for every backing service (describe-derived); add `runtime.health.listener-unreachable` gate code (not executed locally). `scaffold.plugins` green locally.
5. **Gates + drafts.** Configured `deno task lint`, scoped wrappers (+ raw fmt/lint on config-excluded `packages/cli`), `quality:scan`, `arch:check`, `check:assets-barrel`, generator/helper tests, `scaffold.plugins`. Draft the S6b 0.0.8 issue text and the #1366 / #863 comment texts in the run dir (supervisor posts them).

## Boundaries
- No resource commands / `excludeFromMcp()` (S8), no pins, no `packages/aspire` public-surface change (jsr-audit N/A — state it), no `packages/fresh`, no skills/docs (S11 owns the docs line), no archival rows, no runtime start, no S5 commit edits.

## Draft PR and receipts
- After commit 1: draft PR (base `fix/aspire-13-5-s5-literal-ports`), title `feat(aspire): listener-readiness health checks for backing services (S6)`; body per `.github/pull_request_template.md`, `## Scope` = `Closes #1718`, `Closes #1280`, `Part of #1712`; labels `type:feat`, `epic:aspire-13-5`, `area:cli`, `area:aspire`, `priority:p1`, `status:impl`; milestone `0.0.7`. State the S5 stacking and the phase-B lease dependency explicitly.
- Push with the explicit refspec after every commit; per-commit PR comment with scope, SHA, gate evidence; push lines in `worklog.md`.

## Stop conditions
- Final non-empty line exactly `DONE` (plain text, no table, nothing after) when slices 1–5 are pushed, the draft PR carries the commit trail, gates green locally, run-dir artifacts committed. You do not mark ready and do not self-certify.
- Otherwise final non-empty line exactly `BLOCKED: <exact reason and evidence path>` (plain text).
