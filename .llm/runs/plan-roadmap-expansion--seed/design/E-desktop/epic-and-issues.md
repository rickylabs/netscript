# Topic E — #327 rescope + sub-issues (DRAFT TEXT ONLY — no GitHub mutations)

All bodies below are **drafts for owner ratification**. No issue/PR/label/milestone mutation until
ratified (mission Hard Boundaries). Label spellings follow `.github/labels.yml` + netscript-pr; a few
(`epic:deployment`, `wave:*`) are applied dynamically in-repo per the netscript-pr narrative — verify
exact spelling against the live repo at ratification.

**Milestone caveat (owner fork, parallels the beta.6/beta.7 gap):** the **`0.0.1-beta.8` GitHub
milestone does not yet exist**. Per AGENTS.md milestone obligation, it must be created before
issue-filing. Owner creates `0.0.1-beta.8` at ratification (same action as the beta.6/beta.7 forks in
Stage-C §Owner-facing forks).

---

## A. #327 rescope — the 4th tier (draft delta, not a full rewrite)

`#327` stays the **epic** (`type:umbrella`, `epic:deployment`, `area:deploy`) — **no closing keyword
ever on an epic**. The rescope adds a **Tier-4** and reclassifies desktop out of WATCH.

**Draft insertion into #327 body (after the existing STABLE tier-2 block):**

> ### TIER-4 — Desktop / single-process / offline-first (NEW — milestone `0.0.1-beta.8` core,
> `0.0.1-stable` hardening; low priority; **ships FULLY as one tier — no single-process-early /
> desktop-later split**)
>
> NetScript apps shippable to end-user devices as a 1-click, offline-first desktop package, running
> the backend **in-process** (true single-process) rather than as separate loopback processes.
> Grounded in the completed eis-chat `deno desktop` spike (`docs/DESKTOP-SHELL.md`, option (b)
> shipped in prod → option (c) true single-process target).
>
> **Precursor (must land before beta.8):**
> - [ ] **#E1 `@netscript/sdk` in-process link-mode adapter** (`createInProcessClientLink` +
>   `ServiceClientTransport` switch + in-process registry). Unblocks true single-process; the
>   server-side `ServiceApp.fetch()` mount seam already ships. *(Strikes the mis-referenced "172a-2
>   service-base-seam" dependency — PR #172 is merged CLI type-soundness, unrelated. See drift E1.)*
>
> **beta.8 core (ship together):**
> - [ ] **#E2 desktop app-type in the Aspire generator** (folds **#375**, promoted from
>   Backlog/Triage p3) — option (b) desktop shell as a first-class generator primitive.
> - [ ] **#E3 tursodb single-writer relocation + in-process composition root** — per-user data dir,
>   `build()` in the desktop process, sole lock holder. Avoids the native-addon-in-VFS spike.
> - [ ] **#E4 true single-process mode** — dashboard wired through the link-mode adapter in the
>   packaged binary (option (c)). Deps #E1 + #E3.
> - [ ] **#E5 offline-first** — Turso Sync (`pull`/`push`, last-push-wins + `transform`) in the
>   single-process host.
> - [ ] **#E6 1-click packaging + release/update server** — `deno desktop` cross-compile, `latest.json`
>   + bsdiff + Ed25519-signed manifests, Windows stages-not-applies manual-apply fallback.
>
> **stable (hardening + gate):**
> - [ ] **#E7 desktop/single-process deploy-e2e** — extends #394's bare-metal-first deploy-e2e harness
>   to the desktop target. Foundation: **#393** (compose target registration), **#394** (deploy-e2e).
> - [ ] **#E8 signing automation** — macOS Developer-ID + `notarytool`; Windows `signtool` (D4:
>   manual/documented for v1, automate at stable).
>
> **Naming hygiene:** **#349** (RFC-14 tier-3 serverless + Nitro `deno_server`) remains a **WATCH
> sibling** here — it is a *different* "unified" sense (serverless bundling), **not** merged into the
> desktop single-process scope. See #371/#372 for the KV-layer "unified" sense (already solved).

---

## B. Sub-issue drafts

Convention: each resolving PR carries a closing keyword (`Closes #En`) in its **body**; the epic
#327 is referenced without a keyword. Exactly one `status:`; assign milestone.

### #E1 — feat(sdk): in-process link-mode adapter for single-process service mounting

- **Milestone:** `0.0.1-beta.8` (precursor — land early in the window). **Labels:** `type:feat`,
  `area:sdk`, `priority:p2`, `epic:deployment`, `status:research`. Parent: #327.
- **Scope:** add `createInProcessClientLink` (`packages/sdk/src/client/in-process-client-link.ts`),
  the in-process registry (`packages/sdk/src/client/in-process-registry.ts`:
  `registerInProcessService`/`resolveInProcessService`/`clearInProcessServices`), the
  `ServiceClientTransport` discriminated union + `transport` option on `CreateServiceClientOptions`,
  the branch in `createServiceClient`, and the `createInProcessServiceClient` convenience. Export all
  on `@netscript/sdk` mod + JSR export map.
- **Acceptance criteria:**
  1. `createInProcessClientLink` reuses oRPC `RPCLink` with `fetch: (req,init) => app.fetch(new
     Request(req,init))` and the **identical** `apiPath/apiVersion/pathSegment` pathname as the HTTP
     link — no bespoke RPC codec.
  2. An in-process client and an HTTP client for the **same** built service return **byte-identical**
     results for a representative contract (round-trip parity test — the anti-divergence guarantee).
  3. W3C trace propagation preserved in-process (traceparent/tracestate reach the mounted app).
  4. `transport` defaults to `http`; every existing `createServiceClient` caller is unchanged
     (back-compat proven by existing sdk tests staying green).
  5. Registry: unknown serviceName throws a clear error; `clearInProcessServices()` isolates tests.
  6. `deno doc --lint` clean on new public surface (A1); no `any`, no upstream oRPC/Hono types
     leaked into the public signature beyond the existing structural mirrors (A7).
  7. Decide sdk↔service dependency direction for `ServiceApp` type (O-1): import `type {ServiceApp}`
     from `@netscript/service`, **or** mirror its 2-method structural shape locally in sdk. Record
     the choice + rationale.
- **Depends on:** nothing (server seam ships). **Blocks:** #E4.

### #E2 — feat(aspire): first-party `deno desktop` app type in the generator (folds #375)

- **Milestone:** `0.0.1-beta.8`. **Labels:** `type:feat`, `area:aspire`, `area:cli`, `priority:p2`,
  `epic:deployment`, `status:research`. Parent: #327. **Body:** `Closes #375`.
- **Scope:** 4th branch (`desktop`) in
  `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-apps.ts` beside
  `app`/`tauri`/`task`; extend the `AppEntry` type (`@netscript/aspire/types`) with `Type:"desktop"`.
- **Acceptance criteria (each maps to a #375-evidenced POC finding):**
  1. **Build-order gate baked in** — desktop registration `waitFor`/`predev` the Fresh build so
     `_fresh/` exists before packaging (no hand-edit).
  2. **`--backend cef` emitted** (WebView2 default broken on Windows bare-metal; `desktop.backend`
     config silently ignored). CEF, not config.
  3. **Service-discovery injection, no HTTP endpoint** — same `services__<name>__http__0` wiring as
     `app`, but **no** `withHttpEndpoint` (window binds its own internal `Deno.serve` port).
  4. **Opt-in gating** (`Enabled:false` default) so headless/CI `aspire start` is unaffected; random
     internal `127.0.0.1` port (no collision with a co-running web dashboard).
  5. Generator unit tests mirror the existing `generators-*_test.ts` pattern; `scaffold.plugins`/
     `scaffold.runtime` unaffected for non-desktop configs.
- **Depends on:** nothing (option (b), zero SDK/tursodb change). **Blocks:** #E4 (shell to host the
  single-process wiring).

### #E3 — feat(desktop): tursodb single-writer relocation + in-process composition root

- **Milestone:** `0.0.1-beta.8`. **Labels:** `type:feat`, `area:database`, `area:cli`, `priority:p2`,
  `epic:deployment`, `status:research`. Parent: #327.
- **Scope:** per-user data-dir resolver (`%APPDATA%\<app>` / `~/Library/Application Support/<app>` /
  `$XDG_DATA_HOME/<app>`); single-process host composition root that resolves the data dir, sets
  `DATABASE_URL`, `build()`s the service in-process, and `registerInProcessService(name, app)`;
  lifecycle ownership so no external process opens the same file.
- **Acceptance criteria:**
  1. Exactly one process holds the tursodb file lock in single-process mode (no `os error 33`).
  2. Data-dir resolved from OS conventions, **not** launch cwd; validated on Windows (primary), spec
     for macOS/Linux.
  3. Prisma engine + tursodb driver run against a **real-FS** path (not the VFS) — option (c) does
     **not** require the native-addon-in-VFS spike; document this explicitly.
  4. b→c cutover guard: starting the in-process host verifies no external service holds the data dir.
  5. Bounded validation (O-2): Prisma engine confirmed working inside a `deno desktop`-packaged
     binary against the per-user data dir.
- **Depends on:** nothing hard (composition-root work). **Blocks:** #E4.

### #E4 — feat(desktop): true single-process mode (option c)

- **Milestone:** `0.0.1-beta.8`. **Labels:** `type:feat`, `area:cli`, `area:sdk`, `priority:p2`,
  `epic:deployment`, `status:research`. Parent: #327.
- **Scope:** wire the packaged desktop dashboard's service clients through
  `transport:{mode:'in-process'}` so the backend runs in-process; single generated flag flips
  web↔desktop. Config-driven link-mode default (`NETSCRIPT_LINK_MODE` / generated config).
- **Acceptance criteria:**
  1. Packaged binary serves the dashboard with **zero external service process** and **zero loopback
     RPC** for in-process-mounted services; verified by asserting no listener is opened for them.
  2. Generated dashboard client code is identical web vs desktop except the link-mode flag.
  3. End-to-end: launch packaged binary → dashboard renders → a data-plane operation round-trips
     through the in-process link to the single-writer db and back.
- **Depends on:** **#E1, #E3** (and #E2 for the shell). **Blocks:** #E5, #E7.

### #E5 — feat(desktop): offline-first via Turso Sync in the single-process host

- **Milestone:** `0.0.1-beta.8`. **Labels:** `type:feat`, `area:database`, `priority:p3`,
  `epic:deployment`, `status:research`. Parent: #327.
- **Scope:** Turso Sync `pull()`/`push()` (default last-push-wins; `transform` hook for custom
  merges) in the single-process host; offline-capable operation, opportunistic reconcile on
  connectivity.
- **Acceptance criteria:** app operates fully disconnected; reconciles on reconnect; conflict policy
  documented; offline-first claim is technically true **only** in option (c) (single local writer) —
  do not market it for (a)/(b) (`turso-sync-offline-first.md`).
- **Depends on:** **#E4**.

### #E6 — feat(desktop): 1-click packaging + release/update server

- **Milestone:** `0.0.1-beta.8`. **Labels:** `type:feat`, `area:cli`, `priority:p2`,
  `epic:deployment`, `status:research`. Parent: #327.
- **Scope:** `deno desktop` cross-compile (`--target`/`--all-targets`, no Rust toolchain,
  SHA-256-verified prebuilt targets; `--compress xz|zstd`; `--no-check`; explicit `-o`); release
  server serving `latest.json` + bsdiff deltas + Ed25519-signed manifests; **Windows manual-apply
  fallback** (relaunch-installer indirection — Tauri/Electron pattern) for the stages-not-applies
  gap; local structural type layer over `Deno.BrowserWindow`/`Tray`/`autoUpdate`/`desktopVersion`.
- **Acceptance criteria:** reproducible signed binary per target; `Deno.autoUpdate()` stages+applies
  on macOS/Linux and stages+manual-applies on Windows; manifests signature-verified before staging;
  desktop-globals layer is lint-clean and a no-op in the web build.
- **Depends on:** **#E2** (shell) + **#E4** (single-process artifact to package).

### #E7 — test(deploy): desktop/single-process deploy-e2e

- **Milestone:** `0.0.1-stable`. **Labels:** `type:test`, `area:cli`, `gate:e2e`, `priority:p2`,
  `epic:deployment`, `status:research`. Parent: #327.
- **Scope:** extend #394's bare-metal-first deploy-e2e harness with a desktop/single-process target
  (package → launch → data-plane round-trip → update-check). Do not conflate with `scaffold.runtime`.
- **Acceptance criteria:** a green desktop deploy-e2e gate; false-closed-checkbox discipline
  (#393/#394 pattern) — `gate:e2e` box only checked when the gate actually ran green.
- **Depends on:** **#393, #394** (foundation), **#E4, #E6**.

### #E8 — feat(desktop): code-signing automation (macOS notarize / Windows signtool)

- **Milestone:** `0.0.1-stable`. **Labels:** `type:feat`, `area:cli`, `priority:p3`,
  `epic:deployment`, `status:research`. Parent: #327.
- **Scope:** automate macOS Developer-ID + `notarytool` and Windows `signtool` as build steps
  (external credentials/tooling; `deno desktop` does not wrap them). D4: manual for v1, automate at
  stable.
- **Acceptance criteria:** signed+notarized artifacts produced in CI with documented credential
  handling; no secrets in logs.
- **Depends on:** **#E6**.

---

## C. Dependency DAG

```
                 #393 ─┐
                 #394 ─┤ (foundation, beta.3)
                       │
   #E1 (sdk link) ─────┼─────────────┐
                       │              ▼
   #E3 (tursodb reloc) ┼───────────► #E4 (single-process) ──► #E5 (offline-first)
                       │              │
   #E2 (#375 desktop  ─┘              ├──► #E6 (packaging+update) ──► #E8 (signing, stable)
        gen, shell)                   │
                                      └──► (with #E6) ──► #E7 (deploy-e2e, stable) ◄── #393/#394
   #349 (tier-3 serverless) ── WATCH sibling, scope NOT merged
```

- **Critical path to beta.8 "ships fully":** #E1 → #E4, and #E3 → #E4, with #E2 shell + #E6
  packaging; #E5 rides on #E4. All beta.8.
- **stable tail:** #E7 (deps #393/#394 foundation + #E4/#E6), #E8 (deps #E6).
- **Parallelizable now:** #E1 (pure sdk), #E2 (pure generator), #E3 (composition root) have no
  cross-dependency — three independent WSL Codex slices can run concurrently, converging at #E4.

## D. Milestone map

| Issue | Milestone | Priority | Lane |
|---|---|---|---|
| #E1 sdk in-process link | 0.0.1-beta.8 (precursor) | p2 | WSL Codex (sdk) |
| #E2 desktop generator (#375) | 0.0.1-beta.8 | p2 | WSL Codex (cli/aspire) |
| #E3 tursodb relocation | 0.0.1-beta.8 | p2 | WSL Codex (db/cli) |
| #E4 true single-process | 0.0.1-beta.8 | p2 | WSL Codex (cli/sdk) |
| #E5 offline-first | 0.0.1-beta.8 | p3 | WSL Codex (db) |
| #E6 packaging + update server | 0.0.1-beta.8 | p2 | WSL Codex (cli) |
| #E7 deploy-e2e | 0.0.1-stable | p2 | WSL Codex (cli) + OpenHands e2e |
| #E8 signing automation | 0.0.1-stable | p3 | WSL Codex (cli) |
| #375 | folded into #E2 (`Closes #375`) | — | — |
| #349 | WATCH sibling under #327, unchanged | p3 | — |
| #393/#394 | 0.0.1-beta.3 foundation (existing) | p1 | pre-existing |
