# Worklog — `epic-aspire-17-upgrade--2278`

## Owner Review-Chain Override (Verbatim)

> - **First-pass PLAN-EVAL & IMPL-EVAL:** **GPT-6.2 Astra (`xhigh`)** via T3 `delegate_task` (`target: { providerInstanceId: "codex", model: "gpt-6.2-astra", options: { reasoningEffort: "xhigh" } }`).
> - **Second-pass fallback (only if needed):** **Gemini 4 Hydrogen (`xhigh`)** via T3 `delegate_task` (`target: { providerInstanceId: "antigravity", model: "gemini-4-hydrogen", options: { thought_level: "xhigh" } }`).
> - Evaluator session/family independence invariant remains strictly enforced.

## Design

- **Primary Goal:** Upgrade NetScript from Aspire `13.5.3` to Aspire `17.0.0`, adopting native Deno TypeScript AppHosts (`#319`), first-party `AddDenoApp` (`#320`/`#295`), `EndpointProperty.BrowserOrigins`, container DB `.withRepl()`, retiring D-7 `_aspire-compat.mts` duplication, and wrapping `#2174`, `#2202`, `#2259`, `#2184` MSSQL password hardening, exit-16 consumer-refresh hardening, `deno task aspire:bump`, CI caching, and `17.0.0`-only fixtures + `0.0.9 → 0.0.10` upgrade guide.
- **Core Architectural Boundaries:**
  1. Generated workspace root `deno.json` owns `"./aspire"` workspace membership and `"sloppy-imports"` in `unstable` (when `!noAspire`); `aspire/deno.json` owns AppHost-scoped `"imports"` (`vscode-jsonrpc`, `zod: "catalog:"`, `@netscript/aspire` when standalone/JSR, `pg` when Postgres configured). Zero `package.json`, zero `tsconfig.apphost.json`, zero `node_modules`.
  2. `@netscript/aspire` is the single authority for config schemas, types, constants, OTEL/Vite/permission/reference helpers, and `parseAppSettings`; `_aspire-compat.mts` drops all D-7 duplicated code and retains only AppHost-local SDK-coupled readiness checks, host-IO edge helpers, and `applyDenoPermissions`.
  3. All Deno services, plugins, background processors, and apps register via `builder.addDenoApp(...)` + typed `withDeno*` fluent methods + `WithDenoDefaults()` OTEL.
  4. `appHostServerV2` stays disabled (`17.0.0` rejects managed integration assemblies).
  5. `#2259` whole-snapshot secret scan is restored in `credential-secret-surfaces.ts` (live S0 proved `17.0.0` redacts composed connection-string secrets to `null`) and verified on hosted Postgres `scaffold-runtime`.

---

## Execution Log

### 2026-11-26 / 2026-11-27 — Phase 1 Research, Owner Alignment & S0 Live Spike
- Linked all 9 issues (`#2278`, `#319`, `#320`, `#295`, `#2259`, `#2174`, `#2202`, `#1726`, `#2184`).
- Verified live NuGet `17.0.0` matrix and audited `microsoft/aspire` `v17.0.0` C# source.
- Published `aspire-17-adoption-proposal.md` and locked owner decisions A1–A4.
- Executed live S0 verification spike on `Aspire.Cli@17.0.0+2d325b13` (scratch `.llm/tmp/aspire-17-spike/`):
  - Native Deno AppHost (`aspire/deno.json`, zero Node/npm): `restore` 4,602 ms, `start --isolated` 6,219 ms, `stop` 2,335 ms.
  - Confirmed `addDenoApp` ATS option-object signatures, `EndpointProperty.BrowserOrigins`, `.withRepl()`, `.withBrowserLogs()`, `resourceType: "Executable"`, `resourceTypeDisplayName: "Deno"`.
  - Confirmed `features.appHostServerV2: true` fails at restore (`AppHost Server v2 requires protocol-v2 provider packages. Managed integration assemblies cannot be loaded into this server.`) → locked NO-GO.
  - Confirmed `#2259` live secret redaction: `api` process receives real `DATABASE_URL` and `ConnectionStrings__appdb` secrets while `aspire describe --format Json` & table redact `DATABASE_URL`, `ConnectionStrings__appdb`, `APPDB_URI`, and `APPDB_PASSWORD` to `null` (0 leaks in full output).
  - Confirmed live Dashboard `/api/telemetry/{resources,spans,traces,logs}` return HTTP 200 with exact OTLP JSON envelopes.
  - Confirmed `aspire agent mcp` returns 15 tools (`wait_for_resources` added) and `aspire agent init` removed `--skill-locations` and old 4 skill IDs.
  - Verified zero-warning Deno workspace resolution with `./aspire` as workspace member and root `unstable: ["raw-imports", "kv", "sloppy-imports"]`.
- Bootstrapped `.llm/runs/epic-aspire-17-upgrade--2278/` artifacts (`supervisor.md`, `research.md`, `plan.md`, `worklog.md`, `context-pack.md`, `drift.md`).
- Next: commit run-dir bootstrap, push `epic/aspire-17-upgrade`, open Draft PR, and dispatch **PLAN-EVAL** (`codex` / `gpt-6.2-astra` / `xhigh`).
