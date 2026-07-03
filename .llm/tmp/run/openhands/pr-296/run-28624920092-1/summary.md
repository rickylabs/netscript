# Documentation Validation Report: PR #296

## Gates

### Docs-only check: PASS
```
git diff --name-only origin/main...HEAD
docs/site/capabilities/telemetry.md
docs/site/explanation/aspire.md  
docs/site/observability/index.md
docs/site/orchestration-runtime/index.md
```
All changes confined to `docs/site/` — no source churn.

### Build: PASS
```
deno task build
🍾 Site built into _site
  308 files generated in 6.45 seconds
```

### Links: PASS
```
deno task check:links
18740 internal links across 131 pages — all resolve
```

### Caveats: PASS (Linux)
```
deno task check:caveats
30 caveat markers across 23 pages — all references resolve
```
Confirmed passes on Linux CI (exit code 0, not the Windows path-sep bug exit 2).

## Per-page verification

### docs/site/explanation/aspire.md — PASS

#### Reference-fields table (lines 200-230)
Claim: Service can declare `pluginReferences` + `dependsOn`

**Source evidence:**
- `packages/config/src/domain/schemas/service-schema.ts:17` — `dependsOn: z.array(z.string()).optional()`
- `packages/config/src/domain/schemas/service-schema.ts:19` — `pluginReferences: z.array(z.string()).optional()`
- `packages/config/tests/schema/service_schema_test.ts:8-9` — test assertions for both fields

**Lowering claim verification:**
- `packages/cli/src/kernel/adapters/config/deploy-config-resolvers.ts:133` — `dependsOn: appSvc?.ServiceReferences ?? nsSvc.dependsOn`
- `packages/cli/src/kernel/adapters/config/deploy-config-background.ts:118` — `pluginReferences: raw?.PluginReferences ?? []`

Docs say `dependsOn` lowers to `ServiceReferences` (AppSettings) and `pluginReferences` lowers to `PluginReferences` — **confirmed accurate**.

#### HTTP/2 opt-in (lines 100-165)
Claim: `ServiceTlsOptions` + `ServeOptions.tls` + `NETSCRIPT_TLS_CERT_FILE`/`NETSCRIPT_TLS_KEY_FILE` exist

**Source evidence:**
- `packages/service/src/types.ts:143` — `export interface ServiceTlsOptions { cert: string; key: string; }`
- `packages/service/src/types.ts:186` — `tls?: ServiceTlsOptions;` in `ServeOptions`
- `packages/service/src/types.ts:183` — JSDoc: "or set the `NETSCRIPT_TLS_CERT_FILE` / `NETSCRIPT_TLS_KEY_FILE` env pair"
- `packages/service/src/builder/service-listener.ts:37-40` — constants `TLS_CERT_FILE_ENV` and `TLS_KEY_FILE_ENV`

**Default behavior claim:**
- `packages/service/src/types.ts:180-182` — "By default, services serve **plaintext HTTP/1.1**"
- aspire.md line 112: "plaintext HTTP/1.1 by default" — **confirmed accurate, not claiming HTTP/2 default**

#### --allow-ffi (line 185)
Claim: Appears in `plugins/workers/src/aspire/workers-contribution.ts`

**Source evidence:**
- `plugins/workers/src/aspire/workers-contribution.ts:29` — `'--allow-ffi'` in `WORKERS_BACKGROUND_PERMISSIONS`

**Confirmed accurate.**

#### browser-logs (line 185)
Claim: `withBrowserLogs()` is emitted by generate-register-apps.ts

**Source evidence:**
- `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-apps.ts:83` — `lines.push(`    await ${id}.withBrowserLogs();`);`

**Confirmed accurate.**

### docs/site/capabilities/telemetry.md — PASS

#### Footguns section (lines 380-395)
Claim: Good/bad conversion preserves `arch-debt:workers-scaffold-job-tools-noop` caveat marker

**Source evidence:**
- `docs/site/capabilities/telemetry.md:392` — "Those are no-op stubs today (debt `workers-scaffold-job-tools-noop`)."
- `docs/site/capabilities/telemetry.md:324` — `<!-- caveat: arch-debt:workers-scaffold-job-tools-noop -->`

**Confirmed: caveat marker preserved in both the callout and the good/bad table.**

### docs/site/observability/index.md — PASS (navigation addition)

**Change:** Added "Turn on tracing" card linking to `/capabilities/telemetry/` and "Where to go next" section with conceptual navigation.

**Validation:** Links resolve (check:links PASS), no source claims to verify.

### docs/site/orchestration-runtime/index.md — PASS (navigation addition)

**Change:** Added "Where to go next" section mentioning `pluginReferences`/`dependsOn` in the context of two-pass reference resolution.

**Validation:** Links resolve (check:links PASS), no new source claims beyond those already verified in aspire.md.

## Code samples verification

All TypeScript/bash code samples in the docs match shipped source reality:

1. **ServiceTlsOptions usage** (aspire.md lines 135-145) — matches `packages/service/src/types.ts:143-147` interface shape
2. **createService().withHealth().serve()** chain — matches `packages/service/src/presets/define-service.ts:94` fluent API
3. **Environment variables** (`NETSCRIPT_TLS_CERT_FILE`, `NETSCRIPT_TLS_KEY_FILE`) — matches source constants
4. **pluginReferences/dependsOn schema** — matches service-schema.ts field definitions

No API shape mismatches found.

## Verdict

**All gates PASS.** Documentation accurately reflects shipped source on branch `docs/pr-b-aspire-telemetry`. No commits to `deno.lock` or source churn. Lock hygiene preserved.

### Source evidence summary

| Claim | File:Line | Status |
|-------|-----------|--------|
| `pluginReferences` in service schema | `packages/config/src/domain/schemas/service-schema.ts:19` | ✓ Confirmed |
| `dependsOn` in service schema | `packages/config/src/domain/schemas/service-schema.ts:17` | ✓ Confirmed |
| `dependsOn` → `ServiceReferences` lowering | `packages/cli/src/kernel/adapters/config/deploy-config-resolvers.ts:133` | ✓ Confirmed |
| `pluginReferences` → `PluginReferences` lowering | `packages/cli/src/kernel/adapters/config/deploy-config-background.ts:118` | ✓ Confirmed |
| `ServiceTlsOptions` interface | `packages/service/src/types.ts:143` | ✓ Confirmed |
| `ServeOptions.tls` field | `packages/service/src/types.ts:186` | ✓ Confirmed |
| `NETSCRIPT_TLS_CERT_FILE` env | `packages/service/src/builder/service-listener.ts:37` | ✓ Confirmed |
| `NETSCRIPT_TLS_KEY_FILE` env | `packages/service/src/builder/service-listener.ts:40` | ✓ Confirmed |
| HTTP/1.1 default (not HTTP/2) | `packages/service/src/types.ts:180-182` | ✓ Confirmed |
| `--allow-ffi` in workers contribution | `plugins/workers/src/aspire/workers-contribution.ts:29` | ✓ Confirmed |
| `withBrowserLogs()` emission | `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-apps.ts:83` | ✓ Confirmed |
| Caveat marker `arch-debt:workers-scaffold-job-tools-noop` | `docs/site/capabilities/telemetry.md:324` | ✓ Preserved |

All documentation claims verified against actual source. PR is ready to merge.

