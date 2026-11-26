# Worklog — `epic-aspire-17-upgrade--2278`

## Owner Review-Chain Override (Verbatim)

> - **Workload Tier:** `feature` (owner-capped standard tier; PLAN-EVAL max 2 cycles, IMPL-EVAL max 5 cycles).
> - **First-pass PLAN-EVAL & IMPL-EVAL:** **GPT-6.2 Astra (`xhigh`)** via T3 `delegate_task` (`target: { providerInstanceId: "codex", model: "gpt-6.2-astra", options: { reasoningEffort: "xhigh" } }`).
> - **Second-pass fallback (only if needed):** **Gemini 4 Hydrogen (`xhigh`)** via T3 `delegate_task` (`target: { providerInstanceId: "antigravity", model: "gemini-4-hydrogen", options: { thought_level: "xhigh" } }`).
> - Evaluator session/family independence invariant remains strictly enforced (`Antigravity/Gemini` generator vs `Codex/GPT-6.2 Astra` evaluator).

## Design

- **Primary Goal:** Upgrade NetScript from Aspire `13.5.3` to Aspire `17.0.0`, adopting native Deno TypeScript AppHosts (`#319`), first-party `AddDenoApp` (`#320`/`#295`), `EndpointProperty.BrowserOrigins`, container DB `.withRepl()`, retiring D-7 `_aspire-compat.mts` duplication (with F-1 decomposition below 500 LOC), and wrapping `#2174`, `#2202`, `#2259`, `#2184` MSSQL password hardening, exit-16 consumer-refresh hardening, `deno task aspire:bump`, CI caching, and `17.0.0`-only fixtures + `0.0.9 → 0.0.10` upgrade guide.
- **Core Architectural Boundaries:**
  1. Generated workspace root `deno.json` owns `"./aspire"` workspace membership and `"sloppy-imports"` in `unstable` when `!noAspire`; `aspire/deno.json` owns AppHost-scoped `"imports"` across all 3 scaffold modes (local workspace members, external local source, JSR), eliminating the `aspire/package.json` npm island (`scaffold-aspire-npm-island-no-lock`). Legacy `0.0.9` Node AppHosts fail closed before any write on helper/config regeneration with actionable upgrade instructions.
  2. `@netscript/aspire` stays API-stable (zero new public exports; `DB_CLI_MODE_EXCLUDE_FROM_MCP = true` stays template-local; `resolve-paths.ts` 2-level contract untouched). `_aspire-compat.ts.template` (1,104 LOC) splits into `<350`-LOC `_apphost-readiness.ts.template` and `<350`-LOC `_aspire-compat.ts.template`, retiring all D-7 duplication; `generate-register-infrastructure.ts` (670 LOC) extracts cache wiring into `register-infrastructure-cache.ts` (<260 LOC).
  3. All Deno services, plugins, background processors, and apps register via `builder.addDenoApp(...)` (using non-empty app-relative `'main.ts'` `scriptPath` for task-mode apps + `.withDenoTask(...)`), explicit `render-http-endpoint.ts`, `applyDenoPermissions`, and locked OTEL policy preserving `service.instance.id` + `service.version` + disabled-background opt-out.
  4. `#2202` surfaces directly on the generated AppHost health path (`_apphost-readiness.mts`, container-backed + loopback + concrete elapsed threshold) plus secondary CLI timeout enrichment in `DbOperationRunner.waitForDatabase`.
  5. NetScript owns all project-level Aspire agent wiring natively on Aspire `17.0.0` (retiring obsolete automatic `aspire agent init` call & 4 retired workflow skills while preserving legacy Claude mirror cleanup).
  6. `#2259` whole-snapshot secret scan runs at the raw `aspire describe` stdout boundary (`verify-credential-rejection.ts:59`) before parsing, gated on non-skipped hosted Postgres `scaffold-runtime` proof before closing `#2259`.
  7. `refresh-generated-client-consumers.ts` applies at most 1 bounded recovery attempt strictly on exit 16 + `/failed to stop resource/i` under the original signal/deadline.

---

## Execution Log

### 2026-11-26 / 2026-11-27 — Phase 1 Research, Owner Alignment & S0 Live Spike
- Linked all 9 issues (`#2278`, `#319`, `#320`, `#295`, `#2259`, `#2174`, `#2202`, `#1726`, `#2184`).
- Verified live NuGet `17.0.0` matrix and audited `microsoft/aspire` `v17.0.0` C# source.
- Published `aspire-17-adoption-proposal.md` and locked owner decisions A1–A4.
- Executed live S0 spike (`Aspire.Cli@17.0.0+2d325b13`):
  - Native Deno AppHost (`aspire/deno.json`): `restore` 4,602 ms, `start --isolated` 6,219 ms, `stop` 2,335 ms.
  - `features.appHostServerV2: true` failed at restore (exit 6: refuses managed integration assemblies) → L8 NO-GO.
  - `#2259` local spike proved `api` receives real `DATABASE_URL` & `ConnectionStrings__appdb` secrets while `aspire describe` redacts them to `null` (0 secret bytes).
  - `task-327` proved `addDenoApp` rejects empty `scriptPath` (`INVALID_ARGUMENT`), accepts `'main.ts'` + `.withDenoTask('dev')` (`appArgs: ["task","dev"]`, `OTEL_DENO: true`, `PORT: 18080`), and proved `aspire agent init --skills aspire --mcp=false` writes `.claude/settings.json` + mutates user-level `~/.claude/settings.json` telemetry hooks.
- Opened Draft PR #2693 (`c09ef7c0a`) and updated `#2278`.

### 2026-11-27 — PLAN-EVAL Pass 1 (`FAIL_PLAN`) & Plan Revision (Pass 2 Prep)
- Independent PLAN-EVAL pass 1 (Codex `01a21a21-b73c-7be0-8b45-d7389b80cda9`, `gpt-6.2-astra` `xhigh`) returned **`VERDICT: FAIL_PLAN`** with 8 blocking findings (B1–B8) recorded in `plan-eval.md`.
- Resolved all 8 blocking findings before touching any product code:
  - **B1:** Merged `origin/main` `6d7f10338` into branch (`9c899ea10`), recorded `feature` tier, included `.llm/tools/docs/check-accuracy-and-discoverability.ts:40` (`REDIS` → `JAVASCRIPT`) + site pages in S1, specified Aspire-context-scoped parity + mixed `13`/`17` rejection + `aspire-bump.ts` manifest & tests, and specified per-job NuGet + CLI (miss-only install, unconditional PATH, exact `17.0.0|17.0.0+*` preflight) + Deno caches in `e2e-cli*.yml` & policy test.
  - **B2:** Fixed L4 to pass non-empty `'main.ts'` `scriptPath` for all task-mode apps (including desktop build/run + `--backend cef`), preserved explicit `render-http-endpoint.ts`, and locked OTEL policy using `withEnvironmentCallback` to append `service.version` while preserving `service.instance.id`.
  - **B3:** Specified exact `@netscript/aspire*` resolution across all 3 modes + `--no-aspire`, locked fail-closed pre-write legacy `0.0.9` Node AppHost guard, locked `quality-runner.ts` native command + `kv-only/scaffold.ts:122`, locked `.pipe(z.looseObject(...))` `ProjectConfigSchema` adapter with explicit `Omit<NetScriptConfig, ...> & { ... }`, and locked template-local `DB_CLI_MODE_EXCLUDE_FROM_MCP = true`.
  - **B4:** Locked MSSQL `ensureDatabasePassword(..., { requireComplexity: true })` backward-compatibility + complexity + import predicate + test update, `.withRepl()` on server builder before `addDatabase`, and all 7 real `#2174` empty-helper behavioral contracts.
  - **B5:** Placed `#2202` foreign Docker daemon loopback diagnostic directly on the generated AppHost health path (`_apphost-readiness.mts`, container-backed + loopback + `10_000 ms` threshold + bounded cached probe) plus secondary CLI timeout enrichment (`DenoProcess`).
  - **B6:** Locked `aspire agent init` (`17.0.0`) contract (NetScript owns all project wiring natively; update `guidance.md.template:38`, `dogfood-skills.ts`, `skills.md`), locked `#2259` raw-snapshot scan at `verify-credential-rejection.ts:59` + reversed `credential-readiness_test.ts:224`, and locked single-retry exit-16 state machine scoped to `/failed to stop resource/i`.
  - **B7:** Moved `aspire-sdk-17.0.0.json.gz` to S2, `aspire-17.0.0-mcp-recorded.json` to S4, required `gen:assets-barrel` in S2/S3/S4 before tests, split S5 into S5a (26 files) & S5b (~22 files), and aligned final regeneration to `.llm/tools/docs/generated-carriers.md` canonical order.
  - **B8:** Mapped complete A2/A6 gate matrix including scoped CLI wrappers (`run-deno-{lint,fmt}.ts --root packages/cli`), corrected Doctrine AP codes, added F-1 splits for both monoliths, named all 4 `arch-debt.md` rows, and required non-skipped hosted `e2e-cli` verification without pre-prescribing IMPL-EVAL verdict.
- Next: commit revised plan + `plan-eval.md`, push to Draft PR #2693, post `[PHASE: PLAN-EVAL]` pass-1 summary + pass-2 dispatch, and launch fresh PLAN-EVAL pass 2 (`codex` / `gpt-6.2-astra` / `xhigh`).
