# Worklog — `epic-aspire-17-upgrade--2278`

## Owner Review-Chain Override (Verbatim)

> - **Workload Tier:** `feature` (owner-capped standard tier; PLAN-EVAL max 2 cycles, IMPL-EVAL max 5 cycles).
> - **First-pass PLAN-EVAL & IMPL-EVAL:** **GPT-6.2 Astra (`xhigh`)** via T3 `delegate_task` (`target: { providerInstanceId: "codex", model: "gpt-6.2-astra", options: { reasoningEffort: "xhigh" } }`).
> - **Second-pass fallback (only if needed):** **Gemini 4 Hydrogen (`xhigh`)** via T3 `delegate_task` (`target: { providerInstanceId: "antigravity", model: "gemini-4-hydrogen", options: { thought_level: "xhigh" } }`).
> - Evaluator session/family independence invariant remains strictly enforced (`Antigravity/Gemini` generator vs `Codex/GPT-6.2 Astra` evaluator).

## Design

- **Primary Goal:** Upgrade NetScript from Aspire `13.5.3` to Aspire `17.0.0`, adopting native Deno TypeScript AppHosts (`#319`), first-party `AddDenoApp` (`#320`/`#295`), `EndpointProperty.BrowserOrigins`, container DB `.withRepl()`, retiring D-7 `_aspire-compat.mts` duplication (with F-1 splits below 500 LOC), and wrapping `#2174`, `#2202`, `#2259`, `#2184` atomic MSSQL password hardening, observed-state exit-16 consumer-refresh hardening, `deno task aspire:bump`, CI caching, and `17.0.0`-only fixtures + `0.0.9 → 0.0.10` upgrade guide.
- **Core Architectural Boundaries:**
  1. Generated workspace root `deno.json` owns `"./aspire"` workspace membership and `"sloppy-imports"` in `unstable` when `!noAspire`; `aspire/deno.json` owns AppHost-scoped `"imports"` across all 3 scaffold modes. Shared `assertNativeDenoAppHost` fails closed BEFORE the first file mutation/deletion in every public mutation command (`db add`, `db remove --purge`, `service add`/`remove`/`generate`, plugin flows) and mutators when legacy `aspire/package.json` exists.
  2. `@netscript/aspire` stays API-stable (zero new public exports; `DB_CLI_MODE_EXCLUDE_FROM_MCP = true` stays template-local; `resolve-paths.ts` 2-level contract untouched). `_aspire-compat.ts.template` splits into `<350`-LOC `_apphost-readiness.ts.template` and `<350`-LOC `_aspire-compat.ts.template`; `generate-register-infrastructure.ts` extracts `register-infrastructure-cache.ts` (<260 LOC).
  3. All Deno services, plugins, background processors, and apps register via `builder.addDenoApp(...)` (using non-empty app-relative `'main.ts'` `scriptPath` for task-mode apps + `.withDenoTask(...)`), explicit `render-http-endpoint.ts`, `applyDenoPermissions`, and Aspire's optional endpoint-conditional OTLP exporter (no forced `withOtlpExporter`!) + `withEnvironmentCallback` appending `service.version` while preserving `service.instance.id`.
  4. `#2202` surfaces directly on the generated AppHost health path (`_apphost-readiness.mts`, container-backed + loopback + `10_000 ms` threshold) plus secondary CLI timeout enrichment (`DenoProcess`).
  5. NetScript owns all project-level Aspire agent wiring natively on Aspire `17.0.0` (retiring obsolete automatic `aspire agent init` call & 4 retired workflow skills while preserving legacy Claude mirror cleanup).
  6. `#2259` raw-snapshot secret scan runs at `verify-credential-rejection.ts:59` before JSON parse, gated on non-skipped hosted Postgres `scaffold-runtime` + explicit Prisma Studio & dashboard masking verification.
  7. `refresh-generated-client-consumers.ts` runs at most 1 observed-state-polling recovery strictly on exit 16 + `/failed to stop resource/i` under the original signal/deadline (explicit `Stopped`/`Finished`/`Exited`/`FailedToStop` startable set; `null`/unknown fails closed).

---

## Execution Log

### 2026-11-26 / 2026-11-27 — Phase 1 Research, Owner Alignment, S0 Spike & PLAN-EVAL Pass 1
- Linked all 9 issues, verified live NuGet `17.0.0` matrix, ran live S0 spike (`Aspire.Cli@17.0.0+2d325b13`), opened Draft PR #2693, updated `#2278`.
- PLAN-EVAL Pass 1 (Codex `01a21a21-b73c-7be0-8b45-d7389b80cda9`, `gpt-6.2-astra` `xhigh`) returned `FAIL_PLAN` (B1–B8). Merged `origin/main` `6d7f10338` (`9c899ea10`), revised plan (`1c5356caf`), and dispatched Pass 2.

### 2026-11-27 — PLAN-EVAL Pass 2 (`FAIL_PLAN`, Cycle 2 of 2) & Owner Escalation
- Independent PLAN-EVAL Pass 2 (Codex `01a21a2f-f8f6-7d11-a12f-772667fc5b22`, `gpt-6.2-astra` `xhigh`) evaluated `1c5356caf`: **B5 resolved**, 7 targeted corrections identified in `plan-eval.md` (lines 24–36).
- Applied all 7 corrections cleanly to `plan.md` & `context-pack.md`:
  1. **B1 (`L0`):** Locked exact 7-file/field write allowlist for `aspire:bump --apply` + missing-pin/wrong-patch/cache-suffix parity controls.
  2. **B2 (`L5`):** Removed forced `.withOtlpExporter(...)` and unconditional `OTEL_DENO=true` so Aspire 17's optional endpoint-conditional OTLP exporter works cleanly in dashboard-free startups; added 3-case S3 telemetry proof.
  3. **B3 (`L2`):** Moved shared `assertNativeDenoAppHost` preflight to the FIRST mutation boundary of every public command (`add-db.ts` before line 50, `remove-db-command.ts` before line 38/50, `service add`/`remove`/`generate`, plugin flows) + command-entry before/after workspace equality tests.
  4. **B4 (`L7`):** Upgraded `ensureDatabasePassword` to atomic temp-file + `linkSync` publication (`installation-secret.ts.template:65` pattern) + pre-upgrade MSSQL volume `NETSCRIPT_DB_PASSWORD_<KEY>` / `.password` handoff.
  5. **B6 (`L9`/`L12`):** Upgraded exit-16 recovery to observed-state polling (`Stopped` included, `null`/unknown fail-closed, `stop` failure handled) and added explicit S6 Prisma Studio-to-Postgres & dashboard masking observation for `#2259`.
  6. **B7 (`S5a-1`/`S5a-2`):** Split S5a into S5a-1 (16 files) and S5a-2 (20 files), putting `verify-live-db-endpoint_test.ts`, `aspire-structured-evidence_test.ts`, `leak-check_test.ts`, and `phase-b-live-snapshot_test.ts` with their fixtures; added `aspire-mcp-smoke_test.ts` to S4 proof and exact S2 file breakdown.
  7. **B8 (§6):** Corrected gate attributions (static typecheck vs F-2, `quality:cli` + `.llm/tools/quality/cli-quality.deno.json`, `deps:check`, `docs:links`, `audit-jsr-package.ts --root <pkg>`, compiling consumer subpath import test, F-CLI-24) and removed IMPL-EVAL verdict restrictions.
- Because `feature`-tier Cycle 2 of 2 is exhausted (Pass 2 dispatch was restricted to `plan-eval.md` only rather than cycle-2 in-place plan repair), escalating cleanly to the owner for disposition (Pass 3 confirmation vs direct owner plan approval) before committing any product code.
