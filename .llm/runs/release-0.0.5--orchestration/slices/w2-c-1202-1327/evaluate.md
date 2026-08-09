# IMPL-EVAL — W2-C, PR #1393 (#1327 + #1202)

**Verdict: FAIL_FIX** — implementation and gates are sound and independently re-verified; the single blocking defect is #1202 row-2 evidence: the "identified persisting mechanism" claim (eager `getEndpoint("tcp")` materialization) is contradicted by source history at the reproduction baseline, so the close-gate evidence for `Closes #1202` is untrue as currently worded. Required fix is evidence correction plus an owner ruling on row 2 — no code change, no new runtime pass.

- Evaluator: Claude · Fable 5 · medium — separate session from the generator (Codex · GPT-5.6 Sol · low), native opposite-family route (`formal_impl_evaluation`, evaluates=openai).
- Evaluated head: `60bff55cd` (fetched `origin/fix/cli-db-live-endpoint-and-migrate-artifact`), diffed against `origin/main` (`c383b2e84` merge-base; main includes sibling `da5cb2887`).
- All 16 PR comments, both live issue bodies, the #1202 orchestrator-correction comment, and the full run dir (plan/worklog/drift) were read. Independent re-verification ran in a detached scratch worktree at `60bff55cd`; the live worktrees `ns005-w2c`/`w2a`/`w2b` were not touched.

## Findings (by severity)

### F1 — blocking: #1202 row 2's mechanism-identification claim is contradicted by source history

Row 2 (live issue body): "Whatever caches/persists the stale endpoint (appsettings write-back, run-manifest, generated env) is identified and the stale-write path has a RED-first test."

The PR body and worklog ("#1202 row 2 — persisting mechanism") assert the mechanism **is** eager `getEndpoint("tcp")` materialization serializing one allocation into generated `DATABASE_URL`. Source verification falsifies that as an identification of the observed defect:

- At the third-reproduction baseline (`3ff18a8ad`, pristine main, cleaned machine), `generate-register-services.ts:121-131` **already** emitted lazy binding: `resource.withEnvironment('DATABASE_URL', infrastructure.primaryDatabase)` + `.withReference(...)` + `.waitFor(...)`. Same on merge-base main (`generate-register-services.ts:124`).
- `git grep "getEndpoint('tcp')" 3ff18a8ad -- packages/cli/src` → only cache resources (Garnet/Redis, `generate-register-infrastructure.ts:361,401`); never the database wiring path. `git log -S "getEndpoint('tcp')"` over the register templates shows no commit ever putting it in the services DB path.
- No appsettings endpoint write-back or run-manifest endpoint persistence exists at `3ff18a8ad` either (the appsettings surface is port-pin-guarded by the #952 scanner; no `DATABASE_URL` write-back found).

So the mechanism named as "identified" was not present when the defect reproduced three times; it cannot be what persisted the stale endpoint. What W2-C actually delivered for row 2 is: (a) proof that **no** persisting path exists in the current generator, guarded RED-first (`pristine-scaffold-ports_test.ts` #1202 case: asserts lazy binding present, `getEndpoint('tcp')` and allocation literals absent — runs green, and fails if the generator regresses), and (b) runtime proof the defect no longer reproduces across two allocations. That is an invariant + regression guard, not a root-cause identification; the actual mechanism behind the 2026-08-04 reproductions (constant: the unhealthy instance always sat on fixed port 3001, a surface since removed by #1211) was never located.

**Required fix:** correct the row-2 claim in the PR body/worklog (and whatever evidence the close-gate mirrors into #1202) to state what is proven — no persisting path exists at head, guard is RED-first, original mechanism absent from the current generator and not identified — and have the issue owner either accept that as satisfying row 2 as written or split a follow-up. The orchestrator's issue-thread correction (2026-08-08) already ratified the RED-tests mapping, but it did so under the same eager-materialization narrative; the record must not close #1202 asserting a mechanism the source disproves.

### F2 — note (non-blocking): capture gates are record-only

`runtime.capture-db-allocation-first/-second` only run `aspire describe` and write topology JSON; every deciding assertion (distinct allocations, port identity, health, telemetry) lives in `behavior.live-db-endpoint` (`verify-live-db-endpoint.ts:617-642`). Their individual green results must not be read as independent proof. Acceptable as designed; recorded so future readers don't.

### F3 — note (non-blocking): mysql/mssql database overrides silently drop `behavior.service-health`

`capability-suites.ts` `runtimeGateIds` now returns `database === 'postgres'` for the whole `POSTGRES_ONLY_RUNTIME_GATES` set, which includes pre-existing `BEHAVIOR_SERVICE_HEALTH`. Before this diff a `scaffold.runtime` run overridden to mysql/mssql included that gate; now it is filtered out. The registered postgres and sqlite suites are unchanged in intent, so no registered suite weakened, but the narrowing on override paths is undocumented.

### F4 — note (non-blocking): consumer-visible semantics change outside the tested surface

`runMigrationWithArtifacts` returns code 1 for a zero-artifact success (migrate.ts: `created.length === 0` → `code: 1`). Deliberate per locked decisions 2–3 and E2E-proven headless; but interactively, an unchanged-schema `db migrate` (and a re-run `db:init`, whose generated task is `migrate.ts --name=init`) now exits 1 where main's deploy-alias exited 0. Not an acceptance row; should be named in release notes.

### F5 — nit: pointless readonly-strip cast

`packages/database/tests/migrate-artifacts_test.ts`: `const invocations: readonly string[][] = []; const calls = invocations as string[][];` — a plain `as` widening removal, not in the review-blocking class. Grep of all added lines in `packages/**` found **zero** `deno-lint-ignore`, `@ts-ignore`, `@ts-expect-error`, `as unknown as`, or `any` (command: `git diff origin/main...<head> -- packages plugins | grep -E '^\+.*(...)'` → no match). The lint repair was genuinely deletion, not suppression.

## Independent verification evidence

**Q1 — each decisive gate can still fail.** Empirically: five of six serialized passes failed *inside these gates* on five distinct defects (PR comments, passes 1–5), so none is an always-pass. At head, every claimed negative exists and rejects:

- `database.migration-artifacts` (`verify-db-migration-artifacts.ts`): no-change control demands non-zero exit **and** the `created no migration artifact` diagnostic; deploy-only control demands zero artifact delta; headless/TTY cases demand exactly one new `migration.sql` plus `Created migrations:`/`Applied migrations:` lines (default `verbose = true`, so not verbose-gated). Unit: "headless migrate never aliases deploy" pins a single `migrate dev` invocation.
- `verify-live-db-endpoint.ts`: mismatched-port, unparseable-side, unhealthy-database-fixture (aggregate stays healthy, check `healthy:false`), and non-correlated-telemetry tests all present (`verify-live-db-endpoint_test.ts`) — ran green: focused runs at head, my execution: **5 passed (database) + 42 passed (CLI/e2e/registry/pristine-ports), 0 failed**.
- Adversarial probes (mine, 11 cases): empty checks, duplicate database checks, aggregate-unhealthy, `healthy:"true"` string, non-JSON body, wrong check name, empty telemetry, logs without traceId, port digits inside db name, port 0, both-unparseable — **all rejected** (`probe-exit=0`). The gate cannot pass on empty telemetry or degenerate payloads.

**Q2 — Flow-B not weakened.** The OTLP span normalizer moved verbatim (the code removed from `validate-flow-b-traces.ts` is byte-equivalent to the span half of `aspire-dashboard-telemetry.ts`). Behavior deltas are strictly stricter: missing `dashboardUrl` now **throws** (`aspire-dashboard-telemetry.ts:21-23`) where the old code silently fell back to `https://localhost:18888`; only `/traces` and `/logs` paths are normalized, and `AspireTelemetryQuery` fetches exactly `/api/telemetry/traces` and `/api/telemetry/logs` (`aspire-telemetry-query.ts:146,73,110`), so the trace path #1329/PR #1395 depends on is bit-identical. No envelope the original rejected is now accepted.

**Q3 — #1202 rows.** Row 1: **proven** with a nuance — first-allocation port identity is proven structurally from captured topology (`assertDatabaseAuthority(first)`); the direct health probe runs after the second start (`behavior.service-health` + live gate), which is the strictly harder re-allocation case. Row 2: **not proven as worded** — F1. Row 3: **proven** — `first.postgresUrl !== second.postgresUrl` enforced, second-allocation port identity + health green in pass 6. Row 4: **proven** — receipt contains health JSON plus a trace ID required to appear in both non-empty users structured logs and OTEL traces (poll 20×500 ms; cannot converge on empty sets); exit codes alone cannot satisfy it.

**Q4 — #1327 rows: all six proven.**
1. Artifact semantics — `runMigrationWithArtifacts` requires a new `migration.sql` inventory delta plus applied-state verification; child exit code alone insufficient.
2. Schema change → verified artifact — headless and TTY E2E with filesystem diff and `prisma migrate status` (which reads `_prisma_migrations`; note the applied set is inferred from status exit 0 over the created set — indirect but real DB-state verification).
3. Headless inability → non-zero with exact next command (`headlessMigrationGuidance`; unit-asserted message `netscript db migrate --name add-profile`; E2E no-change control requires non-zero + diagnostic).
4. Deploy-only unambiguous — `db deploy` remains the sole deploy verb; migrate never spawns deploy (unit-pinned single invocation; E2E deploy control leaves artifacts unchanged).
5. Created/applied reported separately — `reportMigrationSets`, asserted verbatim in E2E output.
6. TTY genuinely exercised — `script -qec … /dev/null` allocates a real PTY (Linux-guarded, fail-closed on other OSes); the CLI's `Deno.stdin.isTerminal()` identity crosses the AppHost boundary via `NETSCRIPT_MIGRATION_INTERACTIVE` in the request env. Not simulated.

**Q5 — env-var rename is root cause, no survivor.** On main, `buildDbCliEnv` wrote `NETSCRIPT_PRISMA_NAME` (`operation-runner-helpers.ts:45@main`) but the resident-AppHost db-operation runner passes the request dict as env directly to `deno task db:migrate:*` (`generate-db-cli-mode-1.ts.template`, `env: request`) and `migrate.ts` reads only `PRISMA_MIGRATION_NAME` (`migrate.ts:284@main`) — the name never crossed the boundary, so `--name` was silently lost and old `runMigration` fell into the deploy alias under `DATABASE_URL`/CI. The rename is therefore #1327's forwarding root cause, not adjacent scope. At head, `git grep NETSCRIPT_PRISMA_NAME` finds only a 0.0.4 run-log copy (`.llm/runs/release-0.0.4--…/steer-2.log`, historical artifact), worklog prose, and the negative test asserting absence. No template, embedded asset, or product consumer survives.

**Q6 — hygiene, run by me at `60bff55cd`:** `deno task quality:gate` → exit 0 (pre-existing warnings only); `deno task arch:check` → exit 0 (pre-existing warnings only); `deno task doc:lint --root packages/database --pretty` → exit 0. Zero suppressions/`any`/casts added (F5 grep). Publish surfaces are leak-safe: `packages/cli/deno.json` publish excludes `e2e/` and `**/*_test.ts` (all new gate scripts and fixtures live there); `packages/database` excludes `tests/**` while `scripts/**/*.ts` (migrate.ts) is intentionally published — `doc:lint` clean, `publish:dry-run` exit 0 recorded in worklog. Runtime receipts write only into the scaffolded project's `.netscript/e2e/`, which the suite cleans.

**Q7 — scope:** diff confined to `packages/cli` (e2e suite + db operation seam + one guard test), `packages/database` (`scripts/migrate.ts`, `scripts/mod.ts`, tests), and the run dir. No dependency changes. The added `interactive` request field and helper parameter do not deepen the accepted maintainer/public-mixing or permission-docs debts; no new permission surface in product code (`--unsafely-ignore-certificate-errors=localhost` appears only in the e2e gate command).

## Acceptance-row statement

- **#1327:** rows 1–6 all proven (evidence above). Eligible for `Closes #1327` once the issue's checkboxes are ticked with linked evidence at the close-gate (they are currently all unchecked on the live issue).
- **#1202:** rows 1, 3, 4 proven; **row 2 not proven as worded** (F1). `Closes #1202` must not merge until the row-2 evidence is corrected and the owner rules that the no-persisting-path invariant + RED-first guard satisfies the row, or row 2 is split out.

## Process checks

- PLAN-EVAL: justified `inherited PASS` recorded before implementation — satisfied.
- Commit trail: every slice committed, pushed, and PR-commented; six serialized runtime passes each with pre/post leak-check artifacts (no W2-C-owned or unknown survivor; foreign `redis-jfgcbtaf` untouched), no blind retries, token released on every failure — satisfied.
- Review threads: 0 threads / 0 unanswered at last run — satisfied.
- Sixth pass: raw exit 0, `passed=80 failed=0` (76 prior gates + the 4 W2-C gates), all four decisive gates executed and passing in the same run — consistent with the repaired allowlist (`suite-registry_test.ts` asserts postgres inclusion and sqlite exclusion of all four IDs).

## Fix loop

One item: F1 evidence correction + owner ruling on #1202 row 2. No implementation change, no re-run of `scaffold.runtime` required; resubmission may be evaluated on the diff of the corrected evidence alone.
