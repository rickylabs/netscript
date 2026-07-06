# M2 — PM2 Market Teardown: the 2026 feature bar and its critiques

Scope: map pm2's actual shipped feature surface (docs + `Unitech/pm2` GitHub, current as of
2026-07-06), collect verified critiques, then derive the feature-parity matrix and anti-feature
list a 2026 NetScript process-manager plugin should target. Every claim below is cited to a scraped
doc page, GitHub source/issue, or repo file+line in the `wt-process-manager` worktree.

## 1. What pm2 actually is (top-level facts)

- pm2 is "a production process manager for Node.js/Bun applications with a built-in load balancer,"
  installable via npm/Bun, working on Linux/macOS/Windows, supporting Node.js 18+ and Bun 1+
  (https://github.com/Unitech/pm2, README, fetched 2026-07-06).
- Current release at fetch time: **v7.0.3** (last week as of fetch), 43.2k GitHub stars, 2.7k forks,
  286 contributors, used by 157k dependents (https://github.com/Unitech/pm2, repo sidebar).
- License: **GNU AGPL-3.0** — "PM2 is made available under the terms of the GNU Affero General
  Public License 3.0 (AGPL 3.0). For other licenses contact us." (https://github.com/Unitech/pm2,
  License section; license files `GNU-AGPL-3.0.txt` / `LICENSE` in repo root).
- Quick-start describes pm2 explicitly as "a daemon process manager that will help you manage and
  keep your application online" (https://pm2.keymetrics.io/docs/usage/quick-start/).

## 2. Daemon / RPC architecture ("God process" + axon)

- The daemon is internally called the **God process/daemon**: GitHub issue titles and `pm2 report`
  output both show the daemon literally labeled `PM2 vX.Y.Z: God Daemon (/root/.pm2)`
  (https://github.com/Unitech/pm2/issues/5145, `pm2 report`/`ps aux` output in the issue body,
  fetched 2026-07-06).
- The daemon binary entry point is `lib/Daemon.js`, run as a background node process spawned by the
  first `pm2` CLI invocation, communicating over local sockets — CLI-to-daemon and daemon-to-worker
  RPC uses **pm2-axon**, "a message-oriented socket library for node.js heavily inspired by zeromq,"
  supporting push/pull, pub/sub, req/rep, and pub-emitter/sub-emitter patterns over TCP or **unix
  domain sockets**, using the lightweight AMP wire protocol (no external native deps)
  (https://www.npmjs.com/package/pm2-axon, README, fetched 2026-07-06; package cites
  https://github.com/visionmedia/axon-rpc as the RPC layer built atop the socket).
- Known daemon-fragility failure modes documented directly in the issue tracker:
  - "PM2 spawns a new God daemon with nearly every command" — "each machine spawns a God
    daemon, it overwrites the sockets in $HOME/.pm2 for the daemons on the other machines, leaving
    all the other [processes orphaned]" (https://github.com/Unitech/pm2/issues/3108, title +
    description, found via search, fetched 2026-07-06).
  - "pm2 Multiple God Daemons and node process Spawning" — operator report of 10 pm2 processes
    where "there should be only one God Daemon" (https://serverfault.com/questions/1075030/, found
    via search, fetched 2026-07-06) — i.e. the single-daemon-per-`$HOME/.pm2` invariant is fragile
    under multi-machine/multi-user setups and not self-healing.
  - Unbounded daemon memory growth ("God Daemon taking up huge amounts of memory") — reproduced
    across pm2 4.x/5.x/5.2.x: 230MB/50% RAM on a 512MB box (v5.1.0, 2021); 2.6GB RSS vs. tens-of-MB
    for the actual managed app (v5.2.0, "has lasted for more than 2 days"); up to 150GB+ RSS on a
    256GB box managing ~50 processes. Root cause per the issue's own investigation: glibc malloc
    fragmentation interacting with the `pidusage` metrics-polling library, not application load;
    workaround is forcing the daemon to run under `jemalloc` via `LD_PRELOAD`
    (https://github.com/Unitech/pm2/issues/5145, full activity thread, fetched 2026-07-06). This is
    a structural cost of a single shared always-on metrics-polling daemon process, not a fixable
    one-line bug — it recurred across at least three major versions over roughly 1.5 years in the
    same thread.
  - Independent corroboration: a 2026 Reddit report of the pm2 daemon (not the managed app) being
    OOM-killed on a 1.5GB host every 30-60 minutes
    (https://www.reddit.com/r/node/comments/1ocoqxd/, found via search, fetched 2026-07-06).

## 3. Cluster mode

- Wraps Node's built-in `cluster` module: "networked Node.js applications... scaled across all CPUs
  available, without any code modification," sharing server ports via the OS
  (https://pm2.keymetrics.io/docs/usage/cluster-mode/, fetched 2026-07-06).
- `-i max|N|-1` controls instance count; `exec_mode: cluster` is implied by setting `instances`,
  but recommended explicitly for clarity (same source).
- `pm2 reload` gives 0-downtime reload for cluster-mode apps vs. `pm2 restart` which kills-then-
  starts; reload falls back to restart if the app does not ack in time (same source).
- Explicit statelessness requirement: "no local data is stored in the process, for example
  sessions/websocket connections, session-memory" — must externalize to Redis/Mongo/etc, citing the
  Twelve-Factor manifesto (same source). This is a real architectural constraint pm2 pushes onto
  the app author, not something the process manager solves.
- Deno-equivalence gap for NetScript: cluster mode's zero-code-change port-sharing depends
  specifically on Node's `cluster` module semantics (SO_REUSEPORT-style fd-passing to forked
  workers). Deno has no equivalent built-in module; a Deno-native process manager cannot "just wrap
  cluster" — it needs its own worker-pool + port-sharing story (`Deno.serve` + `reusePort`, or an
  L4/L7 front proxy) — this is a design gap to resolve in the deep-dive, not something this teardown
  can close by citation alone (open question, not a finding).

## 4. Restart strategies

Full strategy set, all independently toggleable (https://pm2.keymetrics.io/docs/usage/restart-strategies/,
fetched 2026-07-06):

| Strategy | CLI flag | Config field | Notes |
|---|---|---|---|
| Cron restart | `--cron-restart` | `cron_restart` | disable via `--cron-restart 0` |
| Watch/file-change restart | `--watch` | `watch`, `watch_delay`, `ignore_watch` | stopping an app started with `--watch` does not disable watch; needs `pm2 stop app --watch` |
| Memory-threshold restart | `--max-memory-restart 300M` | `max_memory_restart` | internal worker polls every 30s — bounded detection latency, not real-time |
| Restart delay | `--restart-delay=3000` | `restart_delay` | fixed delay between auto-restarts |
| Disable autorestart | `--no-autorestart` | `autorestart: false` | for one-shot scripts |
| Skip-restart exit codes | `--stop-exit-codes 0` | `stop_exit_codes` | restart on non-zero exit only |
| Exponential backoff restart | `--exp-backoff-restart-delay=100` | `exp_backoff_restart_delay` | starts at the given ms, doubles-ish up to a hard cap of 15000ms, resets to 0ms after 30s of stable uptime; surfaces a `waiting restart` status and logs the increasing delay |

## 5. Watch mode

- `--watch` restarts on file change in cwd + subfolders; `watch` array scopes folders,
  `ignore_watch` excludes, `watch_delay` debounces
  (https://pm2.keymetrics.io/docs/usage/restart-strategies/ and
  https://pm2.keymetrics.io/docs/usage/quick-start/, fetched 2026-07-06).
- A separate `pm2-dev` binary substitutes for `pm2-runtime` inside containers specifically to
  "enable the watch and restart features" for a consistent dev/prod parity story
  (https://pm2.keymetrics.io/docs/usage/docker-pm2-nodejs/, "Development environment" section,
  fetched 2026-07-06).

## 6. Log management

(https://pm2.keymetrics.io/docs/usage/log-management/, fetched 2026-07-06)

- Default log location `$HOME/.pm2/logs`; per-process default naming
  `<app>-{error,out}-<pid>.log`.
- `pm2 logs` streams (all or by app/namespace/id), with `--json`, `--format`, `--raw`, `--err`,
  `--out`, `--lines <n>`, `--timestamp`, `--nostream`, `--highlight`.
- Structured log record shape (JSON mode): fields `message`, `timestamp`, `type` (`out`/`err`/`PM2`),
  `process_id`, `app_name`.
- Log rotation is not built in — it ships as a separate installable module,
  `pm2 install pm2-logrotate` (https://github.com/keymetrics/pm2-logrotate referenced from the same
  doc page). A native OS logrotate integration also exists: `sudo pm2 logrotate -u user` writes
  a real `/etc/logrotate.d/pm2-<user>` file with rotate 12 / weekly / compress / delaycompress /
  copytruncate — i.e. pm2 explicitly bridges into the host's own logrotate rather than only
  reinventing it.
- `merge_logs`/`--merge-logs` avoids per-instance log-file fan-out in cluster mode;
  `out_file`/`error_file` can be set to `/dev/null` to fully disable disk logging.

## 7. Monitoring

(https://pm2.keymetrics.io/docs/usage/monitoring/ and quick-start, fetched 2026-07-06)

- Free, local: `pm2 monit` — realtime terminal CPU/memory dashboard, no network calls.
- Paid, SaaS, closed-source: PM2.io / PM2 Plus (formerly Keymetrics) — "makes monitoring and
  managing applications across servers easier than ever," gated behind `pm2 plus`/`pm2 monitor`
  CLI commands that push metrics to `app.pm2.io`. Confirmed no free plan: "PM2 Plus does not
  offer any free plan. However PM2 Runtime itself remains free as it is open source"
  (https://pm2.io/pricing, found via search, fetched 2026-07-06).
- The actual metrics/exception-reporting/remote-actions client library is `@pm2/io`
  (`keymetrics/pm2-io-apm` on GitHub) — "the PM2 library responsible for gathering the metrics,
  reporting exceptions, exposing remote actions..." (https://github.com/keymetrics/pm2-io-apm,
  found via search, fetched 2026-07-06) — this is the seam that phones home to the paid SaaS.
- `pm2-runtime` container mode exposes `--deep-monitoring` (v8 GC stats + event-loop-inspector +
  transaction trace) and `--public`/`--secret` keys (or `PM2_PUBLIC_KEY`/`PM2_SECRET_KEY` env vars)
  purely to wire into PM2.io — i.e. the container-native monitoring path is also SaaS-shaped by
  default (https://pm2.keymetrics.io/docs/usage/docker-pm2-nodejs/, "Using PM2.io" section).
- No first-party OTEL/Prometheus exporter surfaced in the docs corpus scraped here — third-party
  community bridges exist but are not part of core pm2 (open question below, not confirmed by a
  citation in this pass).

## 8. Container mode (`pm2-runtime`)

(https://pm2.keymetrics.io/docs/usage/docker-pm2-nodejs/, fetched 2026-07-06)

- `pm2-runtime` is a drop-in replacement for the `node` binary (`CMD ["pm2-runtime", "app.js"]`)
  purpose-built to solve container-specific reliability problems: process fallback, flow control,
  automatic monitoring, source-map resolution.
- Full CLI surface includes `-i/--instances`, `--node-args`, `--web [port]` (process web API,
  default port 9615), `--only <app>` (split one process per container from a shared ecosystem
  file), `--no-auto-exit`, `--env [name]` (inject `env_<name>` block), graceful shutdown via
  `kill_timeout` (default wait before SIGKILL: 1600ms).
- Graceful shutdown contract: pm2 forwards the container's shutdown signal (SIGINT) to the app;
  app-side code must listen and drain connections before `process.exit()`.

## 9. Startup script generation (init-system integration)

(https://pm2.keymetrics.io/docs/usage/startup/, fetched 2026-07-06)

- `pm2 startup` auto-detects the host init system and prints the exact privileged command
  needed to install it — the user copy-pastes rather than pm2 silently escalating privileges.
- Supported init systems mapped by OS: systemd (Ubuntu >=16, CentOS >=7, Arch, Debian >=7),
  upstart (Ubuntu <=14), launchd (macOS), openrc (Gentoo/Arch), rcd (FreeBSD),
  systemv (CentOS 6, Amazon Linux) — six init systems from one command.
  Repo README additionally lists rcd-openbsd and smf as supported
  (https://github.com/Unitech/pm2, "Startup Scripts Generation" section).
- `pm2 save` freezes the current process list to be replayed by `pm2 resurrect` (manual) or
  automatically on next boot via the installed startup unit; `pm2 unstartup` removes it.
- `--service-name <name>` customizes the generated systemd unit name.
- No native Windows startup-script generator — docs explicitly defer to a third-party project:
  "To generate a Windows compatible startup script have a look to the excellent pm2-installer"
  (same page, "Windows startup script" section, project at github.com/jessety/pm2-installer). This
  is a real, citable gap: pm2's own docs concede Windows service-registration is not first-party.

## 10. Deployment system (`pm2 deploy`)

(https://pm2.keymetrics.io/docs/usage/deployment/, fetched 2026-07-06)

- Git-pull-based multi-host provisioning defined in the `deploy` block of the same
  `ecosystem.config.js`: per-environment `user`/`host` (array for multi-host)/`ref`/`repo`/`path`/
  `post-deploy`, plus lifecycle hooks `pre-setup`, `post-setup`, `pre-deploy`, `post-deploy`,
  `pre-deploy-local`.
- Commands: `setup` (provision), `update` (deploy latest), `revert [n]` (rollback to nth-last
  release), `curr[ent]`/`prev[ious]` (inspect commit), `exec|run <cmd>` (run arbitrary command on
  all hosts), `list` (deploy history).
- This is explicitly a bare-metal / SSH+git deployment model with no container or image-based
  path — the critique piece below calls this out directly as scope creep for a process manager.

## 11. Critiques (independently verified, not pm2 marketing)

Primary structured critique: "Think twice before using PM2 — a critical look at the popular
tool" (Pavel Romanov, Node Vibe, 2024-05-11,
https://nodevibe.substack.com/p/think-twice-before-using-pm2-a-critical-look-at-the-popular-tool,
fetched 2026-07-06). Verified claims from that piece, cross-checked against pm2's own docs above:

1. Cluster-mode overselling — the "built-in load balancer" is just Node's `cluster` module;
   the article argues this is often the wrong shape for modern CI/CD and container-native
   deployment (single-process cluster instead of horizontally-scaled containers/pods).
2. Proprietary monitoring / vendor lock-in — "you cannot take the data from what PM2 has
   collected and move it to a third-party monitoring service at least not that easily... to have
   access to it, you have to pay" — confirmed independently by `pm2.io/pricing`'s own
   "no free plan" statement (Section 7 above) and the separate `@pm2/io` closed-loop client library.
3. Memory-threshold restart has a real 30s blind spot — "even if the process goes beyond the
   limit, it might take up to 30 seconds to shut it down" — directly confirmed by pm2's own docs,
   which state the internal worker "starts every 30 seconds"
   (https://pm2.keymetrics.io/docs/usage/monitoring/ and restart-strategies page, both state the
   same 30s figure).
4. Startup-script Windows gap and Node-version coupling — "you have to hassle around and
   update systemd daemon service whenever you want to change the Node.js version" — confirmed:
   the generated systemd command line hardcodes the active Node binary path (an nvm-versioned
   PATH entry, Section 9 above), so a Node upgrade requires `pm2 unstartup` + `pm2 startup` again
   exactly as the critique states.
5. Deployment feature is scope creep for a process manager — "Doesnt it sound odd that the
   process manager is somehow involved in the deployment process? This limits you to a bare metal
   deployment, which means no containers" — directly matches Section 10's git+SSH-only deploy
   model.
6. AGPL-3.0 licensing risk — verified directly against the pm2 GitHub repo's own License
   section (Section 1 above); the critique's specific concern (network-use triggers source-
   disclosure obligations, AGPL incompatibility with some other OSS licenses, Google's blanket
   AGPL usage ban citing opensource.google/documentation/reference/using/agpl-policy) is a real,
   often underappreciated constraint for anyone embedding pm2 as a library rather than invoking
   the CLI.
7. Redundant with container orchestrators — Docker/Kubernetes-native restart policies, resource
   limits, and rolling deploys are argued to be strictly more reliable than pm2's equivalents once
   you are already containerized; the critique concludes pm2's core value is simplicity for
   non-containerized bare-metal Node deployments, which is precisely NetScript's own bare-metal
   target scenario (relevant, not disqualifying).

Independent daemon-fragility/memory evidence not from the critique article, sourced directly from
the issue tracker, is in Section 2 above (issues #5145, #3108, serverfault thread, r/node 2026
report) — these are primary-source, not opinion, and corroborate the "daemon fragility" and
"memory overhead" charter concerns directly.

## 12. Feature-parity matrix — what a 2026 NetScript process-manager plugin should hit

| pm2 capability | NetScript target verdict | Rationale |
|---|---|---|
| Daemon-managed process lifecycle (start/stop/restart/reload/delete) | MATCH | Table stakes; core mechanism of the plugin. |
| Zero-downtime reload for networked apps | MATCH, Deno-native design needed | `cluster` module has no Deno equivalent (Section 3) — needs its own worker-pool/port-sharing design, not a straight port. |
| Ecosystem/process-declaration file | MATCH, typed | pm2 uses untyped `ecosystem.config.js`; NetScript should ship a typed config contract (doctrine: contract-first, wrap don't reinvent) instead of a JS object bag. |
| Restart strategies (cron, watch, max-memory, delay, exp-backoff, skip-exit-codes) | MATCH, full set | All seven strategies in Section 4 are independently valuable and cheap to implement; exponential backoff with a hard cap + stable-uptime reset (Section 4) is worth copying verbatim as an algorithm. |
| Graceful shutdown / signal forwarding | MATCH | Simple, valuable, low-risk; `kill_timeout` pattern (Section 8) is a good default. |
| Structured log capture + rotation | MATCH, native OTEL-first | Replace pm2's bespoke JSON log record (Section 6) with NetScript's existing OTEL logging convention (per AGENTS.md, OTEL for free) instead of inventing a new schema; still support native OS logrotate bridging (pm2's `pm2 logrotate -u user` pattern, Section 6, is worth copying — bridges to systemd/host tooling instead of reinventing). |
| Local terminal monitoring (`pm2 monit` equivalent) | MATCH | Free, local, no SaaS. CLI dashboard + Desktop admin console (charter surface A) both consume the same underlying metrics port. |
| Fleet/remote monitoring & alerting | MATCH, but OTEL-native, no proprietary SaaS | Ship OTEL export as the only remote-observability path (Section 7's `@pm2/io` closed-loop is the anti-feature — see Section 13) — avoids the "vendor lock-in" critique entirely by construction. |
| Startup/init-system integration (systemd, launchd, Windows) | MATCH, and better than pm2 on Windows | NetScript already ships `SystemdAdapter` + a Windows Servy adapter behind `OsServicePort` (`packages/cli/src/public/ports/os-service-port.ts:36-45`, operations install/start/stop/status/uninstall; concrete adapters at `packages/cli/src/public/adapters/systemd-os-service.ts` and `packages/cli/src/public/adapters/servy-os-service.ts`) — this closes pm2's own documented Windows gap (Section 9) for free by reusing the existing bare-metal deploy lane instead of deferring to a third-party tool the way pm2 does. |
| Container/runtime mode (`pm2-runtime` equivalent) | PARTIAL MATCH | Useful for the "dev-process fallback" nice-to-have (charter "dev-process fallback"), but not the main goal — bare metal is the target surface per charter "Final objective". |
| Git-pull SSH deployment system (`pm2 deploy`) | DO NOT COPY | See Section 13 — this is exactly the "attempts to solve too many problems" critique (11.5); NetScript's deploy epic #327 already owns provisioning/rollout as a separate concern from process supervision. |
| Multi-instance CPU-spread cluster mode | MATCH, redesigned | Valuable concept (spread across cores), but the mechanism must be Deno-native (worker threads / `Deno.serve` port-reuse / front-proxying), not a cluster-module port. |
| oRPC/API-driven remote control surface | NEW, pm2 has no equivalent | pm2's RPC (axon, Section 2) is a private internal wire protocol with no typed contract; NetScript should expose the same lifecycle operations via its own oRPC surface (per charter "leverage... API/oRPC") as a first-class typed API, not an internal-only socket protocol pm2 never opened up. |

## 13. Anti-features — deliberately do NOT copy, with rationale

1. The single shared "God daemon" as a silent, unbounded, always-on background process.
   Directly implicated in three separate documented memory-blowup episodes across major versions
   (Section 2, issue #5145) and in daemon-duplication/orphaning failures across machines
   (Section 2, issues #3108, serverfault). If NetScript needs a supervisor process at all, it
   should be scoped, restart-safe, and resource-bounded by design (e.g. cgroup/rlimit-aware,
   OTEL-observable RSS from day one) rather than relying on ad hoc jemalloc/LD_PRELOAD workarounds
   discovered by the community years after the bug was filed.
2. Proprietary/paid remote monitoring as the "real" fleet-observability story (PM2.io / `@pm2/io`).
   Confirmed no-free-plan (Section 7, 11.2). NetScript already ships OTEL conventions
   (AGENTS.md / #402 / #403 telemetry work per repo history) — the plugin should export to that
   surface exclusively; do not build a second, closed, hosted metrics product.
3. Git-pull SSH deployment system baked into the process manager (`pm2 deploy`).
   The charter's own framing places bare-metal deployment under epic #327 with an already-shipped
   `deploy.targets.*`/`OsServicePort`/`SystemdAdapter`/`deno compile` artifact lane (#337-#341,
   confirmed present in-repo at `packages/cli/src/public/ports/os-service-port.ts` and sibling
   adapters). A process-manager plugin re-implementing SSH+git deploy would duplicate that lane
   and repeat pm2's own "scope creep" critique (11.5) — the plugin should consume the deploy
   lane's artifact/rollout output, not re-invent provisioning.
4. Untyped JS object "ecosystem" config as the primary contract.
   pm2's `ecosystem.config.js` is a bag of loosely-typed fields (`instances`, `exec_mode`,
   `cron_restart`, ...) validated only at runtime. Per AGENTS.md "contract first: define the
   schema/type contract, then implementation" — NetScript's process-declaration surface should be
   a typed schema (Standard Schema / Zod-equivalent per the Prisma-Next DB-layer precedent) with
   compile-time validation, not a copied untyped JS config shape.
5. AGPL-3.0-style viral licensing exposure for an embeddable core package.
   Not a pm2 defect per se, but a real constraint (11.6) worth naming explicitly in the plan so the
   NetScript core+adapters package is licensed compatibly with the rest of the framework from day
   one, rather than retrofitting a license change later.
6. Node-`cluster`-module-shaped "cluster mode" copied verbatim.
   Deno has no drop-in equivalent of Node's `cluster` fd-passing model (Section 3); shipping a
   "fake" cluster mode that silently degrades to something else on Deno would be worse than not
   shipping it, or than designing a genuinely Deno-native worker/port-sharing primitive from first
   principles (open question, flagged for deep-dive, not resolved here).

## Relevance to the NetScript process-manager plugin (synthesis)

The charter asks for a core + adapters plugin at the quality bar of `auth`/`workers`, covering
both a Deno Desktop admin console and a pure CLI over one shared core, feeding into deploy epic
#327's bare-metal target. This teardown's load-bearing conclusions for that design:

- The daemon-fragility findings (Section 2, 13.1) are the single most important pm2 lesson:
  pm2's worst, longest-lived, cross-version bug class is exactly the "god process" pattern the
  charter is implicitly proposing to emulate (it cites pup/pm2 as concept inspiration). Any
  NetScript core package that runs a persistent supervisor process must budget for RSS growth
  from its own metrics-polling loop and make daemon identity/liveness observable via OTEL from
  day one — this should become an explicit non-functional requirement in the plan, not an
  afterthought.
- NetScript already owns half of pm2's init-system-integration story via `OsServicePort` +
  `SystemdAdapter` + the Servy Windows adapter (`packages/cli/src/public/ports/os-service-port.ts`
  and sibling files, confirmed present in-repo) — the plugin's "keep alive across reboot" surface
  should compose these existing ports, not reimplement `pm2 startup`'s init-detection logic from
  scratch. This directly answers the charter's "re-use/refactor seams already built" research
  directive.
- Monitoring and deploy are the two areas pm2 gets criticized for conflating with its core job
  (11.2, 11.5) — the plugin should keep supervision (this plugin) and deployment/provisioning
  (epic #327's separate deploy lane) as distinct layered concerns, with the process-manager plugin
  as a consumer of deploy artifacts rather than a re-implementation of `pm2 deploy`.
- The oRPC/typed-API gap (Section 12, last row) is a genuine 2026 differentiation opportunity:
  pm2's axon-based RPC (Section 2) has never been a public, typed, external contract in 15+ years
  of the project — exposing the same lifecycle operations (install/start/stop/status/uninstall/
  restart/reload) as a first-class oRPC surface, consumed by both the CLI and the Desktop admin
  console, is the "not a dumb copy" 2026-state-of-the-art angle the charter explicitly asks for.

## Sources

- https://github.com/Unitech/pm2 (README, license, release info) — fetched 2026-07-06
- https://pm2.keymetrics.io/docs/usage/quick-start/ — fetched 2026-07-06
- https://pm2.keymetrics.io/docs/usage/cluster-mode/ — fetched 2026-07-06
- https://pm2.keymetrics.io/docs/usage/restart-strategies/ — fetched 2026-07-06
- https://pm2.keymetrics.io/docs/usage/log-management/ — fetched 2026-07-06
- https://pm2.keymetrics.io/docs/usage/monitoring/ — fetched 2026-07-06
- https://pm2.keymetrics.io/docs/usage/deployment/ — fetched 2026-07-06
- https://pm2.keymetrics.io/docs/usage/docker-pm2-nodejs/ — fetched 2026-07-06
- https://pm2.keymetrics.io/docs/usage/startup/ — fetched 2026-07-06
- https://www.npmjs.com/package/pm2-axon — fetched 2026-07-06
- https://github.com/Unitech/pm2/issues/5145 — fetched 2026-07-06
- https://github.com/Unitech/pm2/issues/3108 (via search) — fetched 2026-07-06
- https://serverfault.com/questions/1075030/pm2-multiple-god-daemons-and-node-process-spawning (via search) — fetched 2026-07-06
- https://www.reddit.com/r/node/comments/1ocoqxd/ (via search) — fetched 2026-07-06
- https://nodevibe.substack.com/p/think-twice-before-using-pm2-a-critical-look-at-the-popular-tool — fetched 2026-07-06
- https://pm2.io/pricing (via search) — fetched 2026-07-06
- https://github.com/keymetrics/pm2-io-apm (via search) — fetched 2026-07-06
- packages/cli/src/public/ports/os-service-port.ts:1-45 (repo, wt-process-manager worktree)
- packages/cli/src/public/adapters/systemd-os-service.ts, servy-os-service.ts, os-service-factory.ts (repo, existence confirmed by grep, wt-process-manager worktree)

## Open questions (for Stage C synthesis / deep-dive)

- What is the Deno-native equivalent design for pm2's zero-code cluster mode — worker-thread pool
  with `Deno.serve` reusePort, or an L4 front-proxy the core package owns? Needs a dedicated
  deep-dive; not resolved by this teardown.
- Does any first-party/community pm2 OTEL or Prometheus exporter exist that should be evaluated as
  prior art, or is `@pm2/io`'s SaaS-only posture total (i.e. zero standards-based export path)?
  This teardown found no citable OTEL/Prometheus bridge in the scraped pm2 docs corpus — needs a
  targeted follow-up search before the plan asserts pm2 has no standards-based telemetry path.
- Exact shape of the "daemon" in the NetScript design — charter's `--no-aspire` dev-fallback
  framing implies the supervisor might not need to be a persistent god-process at all in dev
  mode; whether the same core mechanism should run daemon-less in dev and daemon-full in prod is
  an open design question for the deep-dive/plan stage, not something this market teardown
  resolves.
