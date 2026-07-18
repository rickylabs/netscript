# Fact Sheet — Aspire Orchestration + Telemetry, Deploy Targets (incl. Native Desktop)

LANE-3 (Claude · Opus 4.8). Read-only against `/home/codex/repos/wt-g14-816` @ main
(`0b04eb2b`). VERIFIED CLAIMS ONLY — every bullet cites a source path (`file:line`).

---

## Domain 1 — Aspire orchestration + telemetry

### What it IS
NetScript orchestrates a polyglot workspace with .NET Aspire, but keeps the Aspire SDK behind an
adapter at the edge: `@netscript/aspire` turns plain `appsettings.json` data into validated resource
graphs so plugins, tests, and diagnostics never inherit a .NET dependency. Telemetry is a separate
first-party concern (`@netscript/telemetry`): OpenTelemetry spans stitched across scheduler → queue
→ worker → RPC → SSE into one distributed trace, exported to the Aspire dashboard's OTLP collector.

### Flagship capabilities (cited)
- **SDK-neutral by contract** — no Aspire SDK type appears in any public signature; config is parsed
  and validated with Zod and composition runs under an in-memory builder. `packages/aspire/README.md:6-24`
- **Validated config → resource graph** — `parseAppSettings` reads `appsettings.json`, validates
  against Zod schemas, resolves key-dependent defaults, and reports cross-reference issues as
  warnings not crashes. `packages/aspire/README.md:25-27`
- **AppHost composition ports** — `composeAppHost`, `ContributionRegistry`, deterministic port
  allocation, and resolvers turn config entries into Aspire resources; plugins contribute resources
  through the same registry. `packages/aspire/README.md:28-30,113`
- **Pluggable builder adapter** — `AspireTypeScriptBuilder` emits a real AppHost;
  `MemoryAspireBuilder` runs composition tests with no .NET toolchain. `packages/aspire/README.md:31-37`
- **Flexible shared cache provisioning** — one shared cache entry provisions Redis, Garnet, or Deno
  KV, across Container / Executable / External / Local / Auto modes; `Auto` probes for Docker at
  AppHost start and falls back to the Garnet dotnet-tool. `packages/aspire/README.md:38-104`
- **Telemetry: one trace across subsystems** — domain tracers (`getJobTracer`, `getQueueTracer`,
  `getWorkerTracer`, `getSchedulerTracer`, `getSagaTracer`, `getSSETracer`, `getKVTracer`), W3C
  propagation across message headers and `Deno.Command` boundaries, and fan-in span links.
  `packages/telemetry/README.md:7-33`
- **Zero-SDK default exporter** — `createTelemetryProvider` selects Deno's built-in OTLP exporter by
  default (works with no OpenTelemetry JS SDK dependency); an opt-in SDK adapter unlocks
  attribute-preserving span links. `packages/telemetry/README.md:52-58`
- **Query read model** — `./query` publishes `TelemetryQueryPort` and the Aspire-backed reader
  `createAspireTelemetryQuery`, so tools read traces/logs/metrics back out. `packages/telemetry/README.md:34-36`

### Honest maturity line
Shipping and testable, but with an explicit runtime boundary: `@netscript/aspire` carries no .NET
dependency of its own — running the composed AppHost still requires the .NET SDK and the Aspire CLI,
and the Deno KV cache arms require `--unstable-kv` on the consuming process.
`packages/aspire/README.md:133-137`

### Quotable verified numbers
- Default OTLP endpoint `http://localhost:4318`, protocol `http/protobuf`, sampler `always_on`.
  `packages/aspire/constants.ts:41-47`
- Development telemetry export interval: **1000 ms** (BSP / BLRP / metrics). `packages/aspire/constants.ts:48-49`
- Two differing cache defaults: schema default `Engine: Garnet, Mode: Container` vs. `netscript init`
  scaffold `Engine: Redis, Mode: Container` (redis:7 / Garnet both on tcp:6379). `packages/aspire/README.md:95-101`

---

## Domain 2 — Deploy targets (incl. native desktop lane)

### What it IS
`netscript deploy <target> <op>` is a thin router over target adapters implementing a canonical
lifecycle operation set; a target never advertises a verb it cannot honour, declaring unsupported
ops by omission rather than a silent no-op. Cloud auth/RBAC stay operator-owned — NetScript mints no
credentials and hand-authors no Helm/Bicep/k8s manifests. `packages/cli/README.md:131-145`

### Flagship capabilities (cited)
- **Canonical op contract** — the uniform operation set is `plan`, `emit`, `up`, `down`, `status`,
  `logs`, `rollback`, `secrets`; legacy verbs map on (`build`→`plan`/`emit`, `install`→`up`,
  `uninstall`→`down`). `packages/cli/src/kernel/domain/deploy/deploy-target-port.ts:2-32`
- **Bare metal** — `deno compile` → single binary managed as an OS service: Servy on Windows,
  systemd on Linux. `packages/cli/README.md:137`
- **Deno Deploy** — `deno deploy [--prod]` with a preflight guard that refuses a `--prod` push when
  the project uses APIs Deno Deploy rejects. `packages/cli/README.md:138`
- **Aspire clouds** — `kubernetes`, `azure-aca`, `azure-app-service`, `azure-aks` validate the
  generated AppHost declares the matching hosting integration, then delegate to `aspire publish`/
  `deploy`. `packages/cli/README.md:139`
- **Cloud Run** — Docker-image lane: `docker build` → `docker push` → `gcloud run deploy`.
  `packages/cli/README.md:140`
- **Native desktop packaging (new lane)** — `deploy desktop package` builds native Deno Desktop
  installers per OS (`.app`/`.dmg`, `.AppImage`/`.deb`/`.rpm`, `.msi`); NetScript appends native Deno
  flags to the app's own package task. `packages/cli/README.md:141,147-175`
- **Ed25519 signed release server** — `deploy desktop release prepare` signs native update manifests
  with a PKCS#8 Ed25519 key (key never leaves the authoring process), writes immutable bsdiff
  patches, and keeps private strictly-monotonic per-channel/target sequence state; `release serve`
  hosts the prepared tree with a GET/HEAD allowlist (no dot paths, traversal, or symlink escapes).
  `packages/cli/README.md:189-219`
- **SDK auto-update seam** — `startAutoUpdate` from `@netscript/sdk/auto-update` resolves
  `/<base>/<channel>/<os>-<arch>/latest.json` and surfaces update-ready events.
  `packages/cli/README.md:207-241`

### Honest maturity line (state exactly as the README states it)
Native installers and compiled binaries are **unsigned** at this stage — platform signing
(Authenticode / Developer ID + notarization / deb-rpm policy) is a deliberate external CI step; the
CLI accepts no certificate credentials and never invokes those tools. And the honest upstream gap:
**Windows native apply remains unsupported upstream**, so applications must handle the SDK seam's
`applyMode: "manual"` update-ready event and present its trusted `manualUpdateUrl` — this server may
host the installer but does not claim automatic Windows replacement.
`packages/cli/README.md:177-187,221-223`

### Quotable verified numbers
- A full postgres + service workspace dry-run reports **183 files, 44 directories** written.
  `packages/cli/README.md:26,91`
- Default desktop runtime compression is **`xz`** (`--compression none|lzma|zstd`; `zstd` needs the
  external `zstd` executable). `packages/cli/README.md:172-174`
- The default release listener example binds `127.0.0.1:8787` with base path `/application`, and a
  failed final manifest replacement **burns that sequence number** (retry with a higher one).
  `packages/cli/README.md:203-213,204`

---

_All claims verified against source in this worktree; no external/uncited assertions included._
