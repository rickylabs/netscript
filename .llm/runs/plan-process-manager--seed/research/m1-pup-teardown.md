# M1 — Market Teardown: hexagon/pup (concept excellent, code imperfect)

Scope: extract the process-manager CONCEPT from hexagon/pup (a Deno-native pup/pm2-alike) and the
concrete code lessons — what to keep, what 2026 Deno 2.9 makes trivially better, and what aged
badly. Feeds the `plan-process-manager--seed` RFC (charter:
`.llm/runs/plan-process-manager--seed/charter.md`).

## 0. Provenance / freshness (verify-first)

- Repo: https://github.com/hexagon/pup — MIT license, TypeScript 99.4%, 195 stars, not archived.
- Latest tag: `1.0.4` (per GitHub tags API, `https://api.github.com/repos/hexagon/pup/tags`),
  released **2024-11-19** per the tip commit ("Merge pull request #65 ... Fix #21, auto start
  services after install on windows", `https://api.github.com/repos/hexagon/pup/commits?per_page=5`,
  commit timestamp `2024-11-19T20:41:41Z`).
- As of the run date (2026-07-06) that is **~19.5 months** since the last commit/release — real,
  but short of the charter's "~2 years" framing (source: same commits API response; no commits
  after 2024-11-19 appear in the last-5 list, and the tags list tops out at `1.0.4`). Treat "~2
  years unmaintained" as approximately right, not exact — cite `~19-20 months` if precision matters
  downstream.
- Release history is a long RC train: `1.0.0-rc.21` through `1.0.0-rc.45`, then `1.0.0`→`1.0.4`
  (`https://api.github.com/repos/hexagon/pup/tags`) — i.e. it went through 25+ release candidates
  before 1.0, suggesting the config schema and CLI churned a lot pre-stability. Our plugin should
  not assume pup's *current* schema is how it always looked.
- Docs site: https://pup.56k.guru (sitemap at `https://pup.56k.guru/sitemap.xml`, 23 URLs). JSR
  page `https://jsr.io/@pup/pup` returned HTTP 403 to automated fetch (bot-gate) — could not
  independently confirm JSR publish metadata; treat any JSR-specific claim below as sourced from
  `deno.json` in the repo, not the JSR page itself.

## 1. Feature surface (what pup covers)

### 1.1 Config: `pup.json` (schema at `docs/pup.schema.json`, 7,436 bytes, and
`https://pup.56k.guru/usage/configuration/`)

Top level:
- `$schema`, `name` (instance id, 1–64 chars, pattern `^[a-z0-9@._\-]+$`)
- `terminateTimeout` (number, min 0, default 30), `terminateGracePeriod` (number, min 0, default 0)
- `api`: `{ hostname, port, revoked }` — REST API bind + token-revocation list
- `logger`: `{ console, stdout, stderr, colors, decorateFiles, decorate, internalLogHours }`
- `watcher`: `{ interval, exts, match, skip }` — global file-watch defaults
- `processes`: required array of process objects (the actual managed units)
- `plugins`: array of `{ url, options }`

Per-process (`docs/pup.schema.json`, mirrored at `/usage/configuration/`):
- `id` (required, same 1–64 char pattern as `name`), `cmd` (shell string), `worker` (string array —
  alternate "run as a Deno Worker instead of a subprocess" mode), `cwd`, `env` (object; `PATH` is
  *appended* to, other vars override), `path` (extra `PATH` entries), `pidFile`
- **Start policy (pick one)**: `autostart` (bool), `cron` (string, 9–256 chars — cron expression),
  `watch` (string array of paths — file-triggered start/restart)
- **Restart policy**: `restart` enum `["always","error"]`, `restartDelayMs` (0–86,400,000ms,
  default 10000), `restartLimit` (min 0, i.e. finite retry budget)
- **Stop policy**: `terminate` (cron string, 9–256 chars — scheduled termination),
  `terminateGracePeriod`/`terminateTimeout` (per-process override of the global defaults)
- `timeout` (min 1 — max runtime in seconds, kills long-running/one-shot tasks)
- `overrun` (bool, default false — allow concurrent instances of the same process instead of
  skipping an overlapping cron/watch trigger)
- `cluster`: `{ instances (0–65535, default 1), commonPort, startPort, strategy: enum
  ["ip-hash","round-robin","least-connections"] default "round-robin" }`
- Per-process `logger` override with the same shape as the global one.

### 1.2 Start policies

Exactly the three the charter names: `autostart` (boot with the Pup instance), `cron` (croner-based
schedule — dependency `@hexagon/croner`, same author, per `deno.json` imports), `watch`
(file-triggered, see §2.3). These are mutually-exclusive-by-convention start triggers, not composable
in pup's schema (no "autostart AND watch" story is documented).

### 1.3 Restart policy + watchdog

Two-value `restart` enum (`always`/`error`) is coarse compared to pm2's richer policy surface —
no exponential backoff, no max-restarts-per-time-window, just a flat `restartDelayMs` +
`restartLimit` (total count, not "N per minute"). The **watchdog** is a single loop inside the
`Pup` class (`lib/core/pup.ts`) that, per its own doc comment surfaced via fetch, "manages
auto-start, restart, and timeouts" by polling process state each tick and applying the configured
policy transitions — i.e. one central control loop owns every managed process's lifecycle
decisions, not a per-process supervisor task. `Pup` also emits `watchdog` as a lifecycle event
plugins can subscribe to (see §1.6).

### 1.4 Clustering + built-in load balancer (`https://pup.56k.guru/usage/scaling/`, source
`lib/core/cluster.ts` + `lib/core/loadbalancer.ts` + `lib/core/port.ts`)

- `cluster.instances` spawns N copies of the same process config; each instance gets
  `PUP_CLUSTER_INSTANCE` (0-based index) and `PUP_CLUSTER_PORT` (assigned port) as injected env
  vars — the process itself is expected to read `PUP_CLUSTER_PORT` and bind to it.
- `commonPort` is the single port the load balancer listens on; omitting it disables the LB (each
  instance is reachable only on its own `startPort+n`).
- Three strategies: round-robin (sequential), least-connections (routes to the instance with the
  fewest active connections), ip-hash (sticky-by-client-IP, with the documented caveat that
  NAT/proxy scenarios collapse many clients onto one instance, unbalancing it).
- Docs explicitly scope this down: "Pup's load balancer is suitable for small applications and
  development environments" and recommend NGINX or similar in production for SSL termination,
  advanced algorithms, and caching (`https://pup.56k.guru/usage/scaling/`). This is pup being
  honest about the limits of its own convenience feature — worth keeping as a stated boundary for
  our plugin too rather than promising it replaces a real reverse proxy/LB.

### 1.5 Telemetry + IPC (`https://pup.56k.guru/examples/telemetry/readme/`, package
`jsr:@pup/telemetry`)

- Deno-only (README, per the earlier extraction: "Programmatic usage, process telemetry, and IPC are
  currently available only when running Deno client processes" — Node/Python/Ruby-managed
  processes get supervised but not introspected).
- Client side: `import { PupTelemetry } from "jsr:@pup/telemetry"; new PupTelemetry()` — a singleton
  that auto-reports "memory usage" and "current working directory" back to the parent `Pup`
  process, and exposes `telemetry.on("event", cb)` / `telemetry.emit(processId, "event", payload)`
  for cross-process pub/sub.
- The docs fetch could not surface the wire transport (unix socket vs named pipe vs HTTP) — worth a
  follow-up source read of `jsr:@pup/telemetry`'s own source before copying the mechanism; do not
  assume it is anything more than "a slow polling IPC mechanism" (docs' own phrase).
- Surfaced in the CLI via `pup status` (shows memory) and in the REST API via `POST /telemetry`
  (client processes push data) and `GET /state` (aggregate view).

### 1.6 REST API (`https://pup.56k.guru/usage/rest-api/`)

- Auth: JWT, minted via `pup token --consumer <name>` (with expiry), and revocable per-token via
  `api.revoked` in `pup.json`. Requests carry `Authorization: Bearer <jwt>`.
- Endpoints: `GET /processes`, `POST /processes/{id}/start|stop|restart|block|unblock`,
  `GET /state`, `POST /telemetry`, `POST /log`, `GET /logs` (filterable), `POST /terminate`.
- `block`/`unblock` is a distinct verb from stop/start: it flips whether the watchdog is allowed to
  auto-restart a process, independent of its current running state — a policy toggle, not a
  lifecycle transition. Worth keeping as a named concept (NetScript equivalent: pause auto-heal
  without stopping the process).
- Standard HTTP status codes for errors (400/401/403/500) — no documented rate limiting or
  pagination on `/logs`.

### 1.7 Plugin system (`https://pup.56k.guru/examples/plugins/readme/`, packages `@pup/plugin`,
`@pup/api-client`)

- A plugin extends `PluginImplementation` from `@pup/plugin`; the constructor receives
  configuration, the API base URL, and a token. Plugins talk back to Pup exclusively through
  `PupRestClient` (`@pup/api-client`) — i.e. plugins are out-of-process REST clients, not
  in-process function hooks. This is a meaningfully decoupled plugin model: a plugin cannot corrupt
  Pup's own process state directly, it can only call the same REST surface a third party would.
- Plugin manifest exposes `meta` (name/version/API-version/repo) for compatibility checking, and
  `refreshApiToken()` for the token-rotation lifecycle the watchdog drives.
- Event surface plugins subscribe to via `.on()`: `log`, `init`, `watchdog`,
  `process_status_changed`, `process_scheduled`, `process_watch`, `terminating`, `ipc`. This is the
  same set the `Pup` class's own `EventEmitter` (`lib/core/pup.ts`) emits — the plugin API is a
  thin remote mirror of Pup's internal event bus.
- Loaded via `pup.json`'s `plugins: [{ url: "jsr:@scope/pkg" | "file:///abs/path.ts", options }]` —
  officially published plugins live on JSR, but any `file://` absolute-path module works, so local
  dev plugins are first-class. The flagship official plugin is the Web Interface
  (`https://github.com/Hexagon/pup-plugin-web-interface`) — i.e. pup's own "admin console" is *not*
  in core, it is a plugin consuming the REST API, same as any third party would build.

### 1.8 CLI verbs (`lib/cli/main.ts`, dispatch table extracted directly from source)

`setup`, `upgrade`, `update`, `version`, `help`, `run`, `init`, `token`, `append`, `remove`,
`enable-service`, `disable-service`, `monitor`, `logs`, `status`, `restart`, `start`, `stop`,
`block`, `unblock`, `terminate`.

- `init` scaffolds a new `pup.json` instance; `append` adds a process entry to an existing one;
  `run` executes a foreground/one-shot process without persisting it to the config (documented in
  the earlier README extraction as "Execute foreground or temporary processes").
- `monitor` streams live logs (tail -f equivalent); `logs` queries historical logs (matches the
  REST `GET /logs` filtering).
- `token` mints REST API JWTs (CLI-side counterpart of §1.6's auth).
- `block`/`unblock` and `start`/`stop`/`restart` are separate CLI verbs mirroring the REST
  distinction in §1.6 exactly — CLI is a thin wrapper over the same REST API plugins use (same
  architectural pattern as §1.7: there is exactly one control surface, everything else is a client
  of it).

### 1.9 Service installers (`https://pup.56k.guru/usage/service/`)

- `pup enable-service` (+ `disable-service`) targets **systemd, sysvinit, upstart** (Linux),
  **launchd** (macOS), and native **Windows Service Manager**, plus a Docker deployment mode.
- Two install modes: **user mode** (systemd-user or launchd only, no root, requires
  `loginctl enable-linger` for systemd-user) vs **system mode** (all init systems, requires
  sudo/admin, writes to system locations — `/etc/systemd/system/` vs `~/.config/systemd/user/` for
  systemd; `~/Library/LaunchAgents/com.mycompany.pup.plist` for launchd).
- Flags: `--config`, `--name`, `--dry-run` (preview without writing), `--system`, `--env`.
- The most recent commit in the whole repo (2024-11-19, the tip of `main`) was exactly this surface:
  "Fix #21, auto start services after install on windows" — i.e. pup's very last fix before going
  dormant was a Windows-service-install bug. This is directly relevant: NetScript already ships a
  **Servy** adapter for the Windows bare-metal lane (prior corpus:
  `research/deployment-aggregation` branch, `servy-assessment.md`, verdict MODERNIZE) — pup's own
  Windows service path was evidently still shaking out bugs at end-of-life, which is a soft signal
  that hand-rolling Windows service registration is a known-hard corner worth leaning on
  Servy/NSSM conventions for rather than re-deriving.

## 2. Architecture (source read: `lib/core/*.ts`, `lib/cli/*.ts` — GitHub Contents API tree +
targeted raw fetches)

### 2.1 Module layout

```
lib/
  core/      api.ts cluster.ts configuration.ts loadbalancer.ts logger.ts plugin.ts port.ts
             process.ts pup.ts rest.ts runner.ts status.ts watcher.ts worker.ts   (14 files)
  cli/       args.ts columns.ts config.ts formatters/ main.ts output.ts status.ts upgrade.ts
  common/    (shared types/utils, contents not enumerated)
  types/     (shared type defs, contents not enumerated)
  workers/   (worker-mode runner support, contents not enumerated)
```

### 2.2 Core orchestrator: `Pup` class (`lib/core/pup.ts`)

Central god-object pattern: `Pup` owns config load, storage paths, logger, status tracker, API
secret/port, and holds arrays of `Process` and `Cluster` instances behind a unified
`allProcesses()` accessor. It runs one watchdog loop (auto-start/restart/timeout enforcement),
drives an hourly log/state purge against configured retention, initializes the `RestApi` (JWT-
secured), loads plugins (token-issued the same way as external API consumers), and emits lifecycle
events (`init`, `terminating`, `watchdog`, `application_state`) via a plain `EventEmitter`. There is
no separate scheduler/supervisor service boundary — `Pup` *is* the supervisor, the REST server, and
the plugin host in one class.

### 2.3 Process execution: `Process` -> `Runner`/`WorkerRunner` (`lib/core/process.ts`,
`lib/core/runner.ts`)

- `Process` is the per-managed-unit state machine (`start`, `stop`, `restart`, `block`, `unblock`,
  `setupCron()`, `setupCronTerminate()`, `setupWatch(paths)`, `getStatus()`) and picks a strategy at
  construction: `new WorkerRunner(pup, config)` if `worker` is set (Deno Worker mode), else
  `new Runner(pup, config)` (subprocess mode).
- **Runner does not call `Deno.Command` directly** — it shells out through `dax-sh` (`dax`, a
  third-party/Deno-ecosystem process-execution wrapper, listed as an npm import in `deno.json`):
  a raw dax command template is built (`$.raw` tagged template on the process's `cmd` string) with
  `.stdout("piped")` / `.stderr("piped")`, then `.spawn()`. Stream draining then goes through
  `@std/io`'s `StringReader` + `readLines` — **`readLines` from `@std/io` is a long-deprecated std
  API** (superseded by `TextDecoderStream` + `ReadableStream.pipeThrough(new TextLineStream())` in
  modern `@std/streams`); pup's runner is built entirely on the pre-`Deno.Command`-native-streams
  idiom. This is the single clearest "code aged badly" finding: it is not that pup avoided native
  APIs out of ignorance (dax itself wraps `Deno.Command`), but that it added an extra abstraction
  layer plus a deprecated line-reading helper where 2026 Deno needs neither.
- Termination is signal-based: `runner.kill(signal: Deno.Signal = "SIGTERM")`, with the
  grace/timeout window enforced by the `Process`/`Pup` layer above it, not the runner itself.

### 2.4 File watching: `Watcher` (`lib/core/watcher.ts`)

Uses native `Deno.watchFs(paths)` (this part is already the "correct" modern API — no legacy
concern here) with a debounce window (default 350ms), extension allow-list (default ts/js/json),
glob `match`/`skip` filters (default skip `.git/`), and an async-generator `iterate()` that batches
events per debounce tick before yielding. This is a clean, small, reusable pattern worth keeping
close to verbatim conceptually.

### 2.5 Dependency footprint (`deno.json`, direct fetch of repo root file)

Contrary to a "zero third-party deps" reading of the charter's framing, pup's own `deno.json`
imports a real dependency graph: **`@cross/*`** (deepmerge, env, fs, jwt, kv, runtime, service,
test, utils — a same-author cross-runtime utility ecosystem, not std), **`@oak/oak`** (third-party
web framework, used for `lib/core/rest.ts`'s REST server), **`@hexagon/croner`** (cron parsing,
same author), **`@std/*`** (assert, async, encoding, io, path, semver), and npm packages
**`dax-sh`, `filesize`, `json5`, `timeago.js`, `zod`, `zod-to-json-schema`**. I could not find the
literal "no third-party deps" phrase in the README extraction, the FAQ, or the docs site nav
(`https://pup.56k.guru/faq/` was fetched and contains no dependency-philosophy statement) — **flag
this as a drift candidate**: either the charter is referencing an older/different pup-adjacent
project's tagline, or a doc page not indexed in the sitemap I could reach. Do not carry "no
third-party deps" forward as a verified pup fact; the verified fact is the opposite (a real,
moderate dependency graph, several of them same-author "cross" packages rather than std).

## 3. What aged badly vs. what 2026 Deno 2.9 trivializes

| pup 1.0.4 (2024-11) choice | Why it aged / limitation | 2026 Deno 2.9 replacement |
|---|---|---|
| `dax-sh` wrapping `Deno.Command` for spawn | Extra dependency + abstraction for something `Deno.Command` does natively; dax adds its own shell-parsing semantics on top of the process's own `cmd` string | Call `Deno.Command` directly with `stdout:"piped"`, `stderr:"piped"`, `.spawn()`/`.output()` — no shell-templating layer needed for a process manager that already parses its own `cmd` string |
| `@std/io` `StringReader` + `readLines` for stdout/stderr draining | Deprecated std API (pre-Streams-API idiom) | `ReadableStream.pipeThrough(new TextDecoderStream()).pipeThrough(new TextLineStream())` from current `@std/streams`, or async-iterate the stream directly |
| Central `Pup` god-object owns watchdog + REST + plugin host + logger in one class (`lib/core/pup.ts`) | Hard to test/extend in isolation; every new capability (e.g. OTEL) has one more thing bolted onto one class | Compose narrower services (supervisor loop, REST/oRPC layer, telemetry exporter) behind explicit contracts — matches NetScript's core-package-plus-adapters doctrine rather than one class |
| REST-only plugin API (`PupRestClient` round-trip even for in-process plugins) | Every plugin call pays an HTTP round trip to itself; no typed contract, `@pup/api-definitions` is hand-maintained | oRPC/typed-contract IPC in-process where the plugin runs alongside the supervisor, with the same contract reusable remotely — NetScript ships oRPC "for free" per the charter |
| No native telemetry/tracing story — `PupTelemetry` is a bespoke polling IPC pushing raw memory/cwd | No structured traces/metrics/correlation; "slow polling IPC" (docs' own words) | `OTEL_DENO` + Deno 2.9's built-in OpenTelemetry support gives structured, correlated traces/metrics for free instead of a bespoke reporting protocol |
| Windows service install still had bugs at end-of-life (last commit fixed a Windows autostart bug) | Hand-rolled per-OS service registration is a deep, bug-prone surface | Lean on NetScript's already-shipped `OsServicePort`/`SystemdAdapter` (#339) + Servy adapter (already MODERNIZE-verdicted) rather than re-deriving per-OS service logic |
| Flat `restart: always|error` + count-only `restartLimit` | No backoff curve, no time-windowed budget (pm2-style "don't restart more than N times in M seconds") | Straightforward to add a richer restart-policy contract (backoff + windowed budget) without pup's binary constraint |
| No Deno Desktop / GUI in core — admin UI is an external plugin repo (`pup-plugin-web-interface`) that talks over REST | Reasonable decoupling, but means the flagship UI is a second, separately-versioned project | Deno Desktop (new in 2.9.0, per charter) lets NetScript ship surface (A) as a genuinely first-party desktop admin console over the same core contract as the CLI, not a bolt-on plugin repo |

## 4. Concept checklist — what a NetScript process-manager plugin should meet-or-exceed

Derived directly from the feature/architecture inventory above; each line names the pup concept it
generalizes/exceeds:

1. **Declarative process config** equivalent to `pup.json`'s `processes[]` — id, cmd/entrypoint,
   cwd, env, path, pidFile — but as a NetScript-typed contract (Standard Schema / Zod-equivalent),
   not a hand-maintained JSON Schema file (§1.1, §2.5's `zod-to-json-schema` shows pup itself wants
   this and hand-derives it).
2. **Three start-policy primitives** (autostart, cron, watch) as pup has, but explicitly composable
   rather than pick-one-of-three (§1.2), and reusing NetScript's own scheduling primitives if any
   exist rather than a bespoke croner dependency.
3. **Restart policy richer than binary `always|error`**: backoff + time-windowed budget, keeping
   pup's `restartDelayMs`/`restartLimit` fields as the floor, not the ceiling (§1.3, §3 table).
4. **A `block`/`unblock` policy toggle** distinct from start/stop — worth keeping verbatim as a
   named concept (pause auto-heal without touching running state) (§1.6, §1.8).
5. **Clustering + an explicitly-scoped-down built-in load balancer** (round-robin / least-conn /
   ip-hash), documented as a dev/small-app convenience, not a production LB replacement — copy
   pup's own honesty about this boundary (§1.4).
6. **Native OTEL telemetry** (`OTEL_DENO`, Deno 2.9) replacing pup's bespoke `PupTelemetry`
   polling-IPC package outright — structured traces/metrics per managed process, not a custom wire
   protocol (§1.5, §3 table).
7. **A single typed control-plane contract** (oRPC) that the CLI, the Deno Desktop admin console,
   and any plugins all consume identically — generalizing pup's "REST is the only surface, CLI and
   plugins are both just clients of it" architecture (§1.6–§1.8) but with end-to-end types instead
   of a hand-maintained OpenAPI-ish `@pup/api-definitions` package.
8. **A plugin model that is a thin, out-of-process (or in-process-with-typed-contract) client of
   the same control-plane surface** — keep pup's decoupling insight (plugins can't corrupt core
   state directly), upgrade the transport (§1.7, §3 table).
9. **Service install on top of already-shipped bare-metal primitives** (`OsServicePort` +
   `SystemdAdapter` #339, Servy adapter) instead of re-deriving systemd/launchd/Windows-service
   logic from scratch — pup's own last bug fix (Windows autostart) shows this is a real hazard to
   avoid re-incurring (§1.9, §3 table).
10. **Both surfaces (CLI + Deno Desktop admin console) as first-party consumers of one core**, not
    an external plugin repo bolted onto a REST API after the fact — matches the charter's Surface
    A/B split and generalizes pup's own admin-UI-as-plugin pattern into something first-party
    (§1.7, §3 table, charter "Delivery surfaces").
11. **`deno compile` artifact** as the distribution unit for the CLI/daemon, consistent with the
    already-shipped bare-metal `deno compile` artifact slice (#340) — pup ships as source/JSR only,
    no compiled-binary distribution story documented anywhere in the corpus above.
12. **CLI verb parity** with pup's set (`init`/`append`/`run`, `start`/`stop`/`restart`,
    `block`/`unblock`, `status`/`logs`/`monitor`, `token`, `enable-service`/`disable-service`,
    `upgrade`) as the floor for feature-parity claims, per the charter's "equivalent feature parity,
    but not a dumb copy" instruction (§1.8).

## 5. Relevance to the NetScript process-manager plugin / open questions

- Re-use seam confirmed relevant per charter: bare-metal `OsServicePort`/`SystemdAdapter` (#339) and
  Servy adapter map directly onto pup's `enable-service` surface (§1.9) — this corpus adds the
  concrete evidence (pup's last-commit bug was exactly here) for why NOT to hand-roll it again.
- `deno compile` artifact (#340) maps onto "how is the process-manager CLI/daemon itself
  distributed" — pup has no equivalent, it is JSR/deno.land/x-source-only; this is a place we can
  clearly exceed pup, not just match it.
- OTEL/oRPC "ships for free" (charter) directly replaces two of pup's weakest/most bespoke pieces
  (telemetry polling-IPC, hand-maintained REST+API-definitions package) — highest-leverage
  differentiation vs. pup, not just modernization.
- Open question for Stage C/D: does NetScript already have a scheduling/cron primitive anywhere in
  the framework that a `cron` start-policy should sit on top of, or does this plugin need to bring
  its own (pup brings `@hexagon/croner`)? Not resolved by this corpus — needs a repo-seam pass.
- Open question: what is `jsr:@pup/telemetry`'s actual wire transport? The docs page did not say,
  and the JSR page 403'd for automated fetch — if the design pack wants to cite pup's IPC transport
  precisely, a follow-up direct source read of that package (not the docs prose) is needed.
- Drift candidate flagged in §2.5: "no third-party deps" could not be verified as a pup claim
  anywhere reachable in this pass; treat it as unverified until a further source pass finds the
  actual phrase, and do not let the RFC assert it as a pup fact.
